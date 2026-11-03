package com.reuseplus.service;

import com.reuseplus.domain.AppUser;
import com.reuseplus.exception.ApiException;
import com.reuseplus.repository.AppUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {
    private final AppUserRepository userRepository;

    public CurrentUserService(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AppUser get() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Sessao invalida."));
    }
}
