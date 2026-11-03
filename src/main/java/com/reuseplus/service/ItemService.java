package com.reuseplus.service;

import com.reuseplus.domain.AppUser;
import com.reuseplus.domain.Category;
import com.reuseplus.domain.Item;
import com.reuseplus.domain.ItemStatus;
import com.reuseplus.domain.ItemType;
import com.reuseplus.dto.ItemRequest;
import com.reuseplus.dto.ItemResponse;
import com.reuseplus.exception.ApiException;
import com.reuseplus.repository.ItemRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ItemService {
    private final ItemRepository itemRepository;
    private final CategoryService categoryService;
    private final CurrentUserService currentUserService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    public ItemService(ItemRepository itemRepository, CategoryService categoryService,
                       CurrentUserService currentUserService, org.springframework.jdbc.core.JdbcTemplate jdbc) {
        this.itemRepository = itemRepository;
        this.categoryService = categoryService;
        this.currentUserService = currentUserService;
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public List<ItemResponse> search(Long categoryId, ItemType type, String query) {
        String normalizedQuery = StringUtils.hasText(query) ? query.trim() : null;
        return itemRepository.search(categoryId, type, normalizedQuery).stream()
                .map(ItemResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ItemResponse get(Long id) {
        return ItemResponse.from(findById(id));
    }

    @Transactional
    public ItemResponse create(ItemRequest request) {
        validatePhotos(request);
        AppUser owner = currentUserService.get();
        Category category = categoryService.findById(request.categoryId());
        Item item = new Item(
                owner,
                category,
                request.title().trim(),
                request.description().trim(),
                request.type(),
                request.conditionLabel(),
                request.imageUrl()
        );
        item.updateGallery(request.location(), request.imageUrls());
        return ItemResponse.from(itemRepository.save(item));
    }

    @Transactional
    public ItemResponse update(Long id, ItemRequest request) {
        validatePhotos(request);
        Item item = findById(id);
        assertOwner(item);
        Category category = categoryService.findById(request.categoryId());
        // Reservation and completion have their own transaction and permission checks.
        ItemStatus status = item.getStatus();
        item.update(
                category,
                request.title().trim(),
                request.description().trim(),
                request.type(),
                status,
                request.conditionLabel(),
                request.imageUrl()
        );
        item.updateGallery(request.location(), request.imageUrls());
        return ItemResponse.from(item);
    }

    @Transactional
    public void delete(Long id) {
        Item item = itemRepository.findLockedById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Item nao encontrado."));
        assertOwner(item);
        jdbc.update("DELETE FROM messages WHERE item_id = ?", id);
        jdbc.update("DELETE FROM favorites WHERE item_id = ?", id);
        jdbc.update("DELETE FROM reservations WHERE item_id = ?", id);
        itemRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public Item findById(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Item nao encontrado."));
    }

    private void assertOwner(Item item) {
        AppUser user = currentUserService.get();
        if (!item.getOwner().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Somente o anunciante pode alterar este item.");
        }
    }

    private void validatePhotos(ItemRequest request) {
        java.util.List<String> images = request.imageUrls() == null || request.imageUrls().isEmpty()
                ? (request.imageUrl() == null ? java.util.List.of() : java.util.List.of(request.imageUrl()))
                : request.imageUrls();
        if (images.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "Adicione pelo menos uma foto do objeto.");
        for (String image : images) {
            if (image == null || !(image.matches("https?://[^\\s]+")
                    || image.matches("/uploads/[a-z0-9-]+\\.(jpg|png|webp)"))) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Endereco de foto invalido.");
            }
        }
    }
}
