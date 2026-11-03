package com.reuseplus.dto;

import com.reuseplus.domain.Item;
import com.reuseplus.domain.ItemStatus;
import com.reuseplus.domain.ItemType;
import java.time.Instant;

public record ItemResponse(
        Long id,
        String title,
        String description,
        ItemType type,
        ItemStatus status,
        String conditionLabel,
        String imageUrl,
        CategoryResponse category,
        UserSummary owner,
        Instant createdAt,
        Instant updatedAt,
        java.util.List<String> imageUrls,
        String location,
        Long reservedById
) {
    public static ItemResponse from(Item item) {
        return new ItemResponse(
                item.getId(),
                item.getTitle(),
                item.getDescription(),
                item.getType(),
                item.getStatus(),
                item.getConditionLabel(),
                item.getImageUrl(),
                CategoryResponse.from(item.getCategory()),
                UserSummary.from(item.getOwner()),
                item.getCreatedAt(),
                item.getUpdatedAt(),
                item.getImageUrls(),
                item.getLocation(),
                item.getReservedById()
        );
    }
}
