package com.reuseplus.service;

import com.reuseplus.domain.AppUser;
import com.reuseplus.dto.AuthRequest;
import com.reuseplus.dto.AuthResponse;
import com.reuseplus.dto.RegisterRequest;
import com.reuseplus.dto.UserSummary;
import com.reuseplus.exception.ApiException;
import com.reuseplus.repository.AppUserRepository;
import com.reuseplus.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(AppUserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "E-mail ja cadastrado.");
        }

        AppUser user = new AppUser(
                request.name().trim(),
                email,
                passwordEncoder.encode(request.password()),
                request.neighborhood()
        );
        AppUser saved = userRepository.save(user);
        return new AuthResponse(jwtService.generateToken(saved.getEmail()), UserSummary.from(saved));
    }

    public AuthResponse login(AuthRequest request) {
        String email = request.email().trim().toLowerCase();
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas."));
        return new AuthResponse(jwtService.generateToken(user.getEmail()), UserSummary.from(user));
    }
}
