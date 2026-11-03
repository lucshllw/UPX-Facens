package com.reuseplus.dto;

import com.reuseplus.domain.AppUser;

public record UserSummary(
        Long id,
        String name,
        String email,
        String neighborhood
) {
    public static UserSummary from(AppUser user) {
        return new UserSummary(user.getId(), user.getName(), user.getEmail(), user.getNeighborhood());
    }
}
