package com.reuseplus.service;

import com.reuseplus.domain.AppUser;
import com.reuseplus.domain.Item;
import com.reuseplus.domain.ItemStatus;
import com.reuseplus.dto.ItemResponse;
import com.reuseplus.exception.ApiException;
import com.reuseplus.repository.ItemRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EngagementService {
    private final JdbcTemplate jdbc;
    private final ItemRepository items;
    private final CurrentUserService currentUser;

    public EngagementService(JdbcTemplate jdbc, ItemRepository items, CurrentUserService currentUser) {
        this.jdbc = jdbc; this.items = items; this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<Long> favorites() {
        return jdbc.queryForList("SELECT item_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC", Long.class, currentUser.get().getId());
    }

    @Transactional
    public void favorite(Long id, boolean save) {
        Item item = lockedItem(id); // Serializes duplicate saves with reservations/deletion.
        Long userId = currentUser.get().getId();
        if (!save) { jdbc.update("DELETE FROM favorites WHERE user_id = ? AND item_id = ?", userId, id); return; }
        Integer exists = jdbc.queryForObject("SELECT COUNT(*) FROM favorites WHERE user_id = ? AND item_id = ?", Integer.class, userId, item.getId());
        if (exists != null && exists == 0) jdbc.update("INSERT INTO favorites(user_id,item_id) VALUES (?,?)", userId, id);
    }

    @Transactional
    public ItemResponse reserve(Long id) {
        Item item = lockedItem(id);
        AppUser user = currentUser.get();
        if (item.getOwner().getId().equals(user.getId())) throw new ApiException(HttpStatus.BAD_REQUEST, "Voce nao pode reservar seu proprio objeto.");
        if (item.getStatus() != ItemStatus.AVAILABLE) throw new ApiException(HttpStatus.CONFLICT, "Este objeto ja esta reservado ou foi reutilizado.");
        jdbc.update("INSERT INTO reservations(item_id,requester_id,owner_id,status) VALUES (?,?,?,'CONFIRMED')", id, user.getId(), item.getOwner().getId());
        item.reserve(user.getId());
        return ItemResponse.from(item);
    }

    @Transactional
    public ItemResponse release(Long id) {
        Item item = lockedItem(id);
        Long userId = currentUser.get().getId();
        if (!item.getOwner().getId().equals(userId) && !userId.equals(item.getReservedById())) throw new ApiException(HttpStatus.FORBIDDEN, "Apenas o anunciante ou quem reservou pode cancelar.");
        if (item.getStatus() != ItemStatus.RESERVED) throw new ApiException(HttpStatus.CONFLICT, "Este objeto nao tem uma reserva ativa.");
        jdbc.update("UPDATE reservations SET status = 'CANCELLED', decided_at = CURRENT_TIMESTAMP WHERE item_id = ? AND status IN ('PENDING','CONFIRMED')", id);
        item.release();
        return ItemResponse.from(item);
    }

    @Transactional
    public ItemResponse complete(Long id) {
        Item item = lockedItem(id);
        if (!item.getOwner().getId().equals(currentUser.get().getId())) throw new ApiException(HttpStatus.FORBIDDEN, "Somente o anunciante pode confirmar a reutilizacao.");
        if (item.getStatus() == ItemStatus.FINISHED) throw new ApiException(HttpStatus.CONFLICT, "A reutilizacao ja foi confirmada.");
        jdbc.update("UPDATE reservations SET status = 'COMPLETED', decided_at = CURRENT_TIMESTAMP WHERE item_id = ? AND status IN ('PENDING','CONFIRMED')", id);
        item.complete();
        return ItemResponse.from(item);
    }

    private Item lockedItem(Long id) {
        return items.findLockedById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Objeto nao encontrado."));
    }
}
