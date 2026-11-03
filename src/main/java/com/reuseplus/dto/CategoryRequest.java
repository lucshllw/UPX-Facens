package com.reuseplus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Size(max = 90) String slug,
        @Size(max = 255) String description
) {
}
