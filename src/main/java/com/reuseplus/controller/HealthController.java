package com.reuseplus.controller;

import java.util.Map;
import javax.sql.DataSource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    private final DataSource database;
    public HealthController(DataSource database) { this.database = database; }

    @GetMapping("/api/health")
    public ResponseEntity<Map<String,String>> health() {
        try (var connection = database.getConnection(); var statement = connection.createStatement()) {
            statement.setQueryTimeout(2);
            try (var result = statement.executeQuery("SELECT 1")) {
                if (result.next() && result.getInt(1) == 1) return ResponseEntity.ok(Map.of("status", "UP"));
            }
        } catch (Exception ignored) { /* The response never exposes credentials or database internals. */ }
        return ResponseEntity.status(503).body(Map.of("status", "DOWN"));
    }
}
