package com.reuseplus.repository;

import com.reuseplus.domain.AppUser;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByEmail(String email);

    boolean existsByEmail(String email);
}
