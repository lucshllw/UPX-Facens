package com.reuseplus.dto;

import com.reuseplus.domain.ItemStatus;
import com.reuseplus.domain.ItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ItemRequest(
        @NotNull Long categoryId,
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(min = 10, max = 3000) String description,
        @NotNull ItemType type,
        ItemStatus status,
        @Size(max = 60) String conditionLabel,
        @Size(max = 500) String imageUrl,
        @Size(max = 4) java.util.List<@Size(max = 500) String> imageUrls,
        @Size(max = 120) String location
) {
}
