package com.reuseplus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MessageRequest(
        @NotNull Long itemId,
        Long receiverId,
        @NotBlank @jakarta.validation.constraints.Size(max = 2000) String content
) {
}
