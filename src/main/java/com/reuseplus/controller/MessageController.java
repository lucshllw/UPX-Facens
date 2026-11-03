package com.reuseplus.controller;

import com.reuseplus.dto.MessageRequest;
import com.reuseplus.dto.MessageResponse;
import com.reuseplus.service.MessageService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/messages")
public class MessageController {
    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/items/{itemId}")
    public List<MessageResponse> listForItem(@PathVariable Long itemId) {
        return messageService.listForItem(itemId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse send(@Valid @RequestBody MessageRequest request) {
        return messageService.send(request);
    }
}
