package com.reuseplus.service;

import com.reuseplus.domain.AppUser;
import com.reuseplus.domain.Item;
import com.reuseplus.domain.Message;
import com.reuseplus.dto.MessageRequest;
import com.reuseplus.dto.MessageResponse;
import com.reuseplus.exception.ApiException;
import com.reuseplus.repository.AppUserRepository;
import com.reuseplus.repository.MessageRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageService {
    private final MessageRepository messageRepository;
    private final AppUserRepository userRepository;
    private final ItemService itemService;
    private final CurrentUserService currentUserService;

    public MessageService(MessageRepository messageRepository, AppUserRepository userRepository,
                          ItemService itemService, CurrentUserService currentUserService) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.itemService = itemService;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> listForItem(Long itemId) {
        AppUser user = currentUserService.get();
        return messageRepository.findVisibleForItem(itemId, user.getId()).stream()
                .map(MessageResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> inbox() {
        return messageRepository.findInbox(currentUserService.get().getId()).stream().map(MessageResponse::from).toList();
    }

    @Transactional
    public MessageResponse send(MessageRequest request) {
        AppUser sender = currentUserService.get();
        Item item = itemService.findById(request.itemId());
        AppUser receiver = resolveReceiver(sender, item, request.receiverId());

        if (sender.getId().equals(receiver.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nao e possivel enviar mensagem para si mesmo.");
        }

        Message message = new Message(item, sender, receiver, request.content().trim());
        return MessageResponse.from(messageRepository.save(message));
    }

    @Transactional
    public void markRead(Long itemId, Long peerId) {
        AppUser user = currentUserService.get();
        Item item = itemService.findById(itemId);
        if (user.getId().equals(peerId) || (!item.getOwner().getId().equals(user.getId())
                && !item.getOwner().getId().equals(peerId))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "A conversa deve ser entre o anunciante e o interessado.");
        }
        messageRepository.markRead(itemId, user.getId(), peerId, java.time.Instant.now());
    }

    private AppUser resolveReceiver(AppUser sender, Item item, Long requestedReceiverId) {
        boolean senderIsOwner = item.getOwner().getId().equals(sender.getId());
        if (!senderIsOwner) {
            return item.getOwner();
        }
        if (requestedReceiverId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Informe o destinatario da resposta.");
        }
        if (!messageRepository.existsByItemIdAndSenderIdAndReceiverId(item.getId(), requestedReceiverId, sender.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Responda apenas a uma conversa iniciada neste objeto.");
        }
        return userRepository.findById(requestedReceiverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Destinatario nao encontrado."));
    }
}
