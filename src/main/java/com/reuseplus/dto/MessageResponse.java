package com.reuseplus.dto;

import com.reuseplus.domain.Message;
import java.time.Instant;

public record MessageResponse(
        Long id,
        Long itemId,
        UserSummary sender,
        UserSummary receiver,
        String content,
        Instant createdAt,
        Instant readAt
) {
    public static MessageResponse from(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getItem().getId(),
                UserSummary.from(message.getSender()),
                UserSummary.from(message.getReceiver()),
                message.getContent(),
                message.getCreatedAt(),
                message.getReadAt()
        );
    }
}
