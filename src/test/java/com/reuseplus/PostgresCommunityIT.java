package com.reuseplus;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("postgres-test")
class PostgresCommunityIT extends CommunityFlowContract {
    @DynamicPropertySource static void database(DynamicPropertyRegistry properties) {
        String url = System.getenv().getOrDefault("TEST_DB_URL", "jdbc:postgresql://127.0.0.1:55432/reuseplus_test");
        if (!url.matches("jdbc:postgresql://[^/]+/reuseplus_test(\\?.*)?"))
            throw new IllegalStateException("Os testes SQL exigem o banco isolado reuseplus_test.");
        properties.add("spring.datasource.url", () -> url);
        properties.add("spring.datasource.username", () -> System.getenv().getOrDefault("TEST_DB_USER", "postgres"));
        properties.add("spring.datasource.password", () -> System.getenv().getOrDefault("TEST_DB_PASSWORD", "postgres"));
        properties.add("app.jwt.secret", () -> "integration-only-jwt-secret-not-for-production-2026");
        properties.add("app.upload-directory", () -> "./validation/tmp/postgres-uploads");
    }
    private JsonNode newAccount() throws Exception {
        return mapper.readTree(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("name", "SQL Test", "email", UUID.randomUUID()+"@example.test", "password", "SqlTest123!", "neighborhood", "Sorocaba"))))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }
    @Test void usesRealPostgresAndVersionedMigrations() throws Exception {
        try (var connection = jdbc.getDataSource().getConnection()) {
            assertEquals("PostgreSQL", connection.getMetaData().getDatabaseProductName());
        }
        assertTrue(jdbc.queryForObject("SELECT COUNT(*) FROM flyway_schema_history WHERE success = true", Integer.class) >= 3);
        assertEquals(5, jdbc.queryForObject("SELECT COUNT(*) FROM categories", Integer.class));
        mvc.perform(get("/api/items")).andExpect(status().isOk());
        mvc.perform(get("/api/items").param("q", "Sorocaba")).andExpect(status().isOk());
        mvc.perform(get("/api/items").param("type", "DONATION").param("categoryId", "1")).andExpect(status().isOk());
    }
    @Test void concurrentReservationHasExactlyOneWinner() throws Exception {
        JsonNode owner = newAccount(), first = newAccount(), second = newAccount();
        long category = jdbc.queryForObject("SELECT MIN(id) FROM categories", Long.class);
        var payload = Map.of("categoryId",category,"title","Disputa SQL","description","Objeto de teste para disputa simultanea.","type","DONATION","imageUrls",List.of("https://example.test/photo.jpg"));
        long id = mapper.readTree(mvc.perform(post("/api/items").header("Authorization","Bearer "+owner.get("token").asText()).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(payload)))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asLong();
        var pool = Executors.newFixedThreadPool(2);
        var ready = new CountDownLatch(2); var go = new CountDownLatch(1);
        try {
            List<Future<Integer>> results = List.of(first,second).stream().map(account -> pool.submit(() -> {
                ready.countDown(); assertTrue(go.await(5,TimeUnit.SECONDS));
                return mvc.perform(post("/api/items/"+id+"/reservation").header("Authorization","Bearer "+account.get("token").asText())).andReturn().getResponse().getStatus();
            })).toList();
            assertTrue(ready.await(5,TimeUnit.SECONDS)); go.countDown();
            List<Integer> statuses = new java.util.ArrayList<>();
            for (var result:results) statuses.add(result.get(15,TimeUnit.SECONDS));
            statuses.sort(Integer::compareTo); assertEquals(List.of(200,409),statuses);
            assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM reservations WHERE item_id=? AND status='CONFIRMED'",Integer.class,id));
        } finally {
            pool.shutdownNow();
            mvc.perform(delete("/api/items/"+id).header("Authorization","Bearer "+owner.get("token").asText())).andExpect(status().isNoContent());
        }
    }
}
