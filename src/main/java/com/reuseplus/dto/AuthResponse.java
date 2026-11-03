package com.reuseplus.dto;

public record AuthResponse(
        String token,
        UserSummary user
) {
}
