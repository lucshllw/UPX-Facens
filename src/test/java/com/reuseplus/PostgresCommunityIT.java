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
        properties.add("app.upload-storage", () -> "database");
        properties.add("app.upload-directory", () -> "./validation/tmp/postgres-uploads");
    }
    private JsonNode newAccount() throws Exception {
        return mapper.readTree(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("name", "SQL Test", "email", UUID.randomUUID()+"@example.test", "password", "SqlTest123!", "neighborhood", "Sorocaba"))))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }
    @Test void photosArePersistedInPostgresWithoutAnEphemeralDisk() throws Exception {
        JsonNode auth = newAccount();
        byte[] png = java.util.Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=");
        var photo = new org.springframework.mock.web.MockMultipartFile("file", "photo.png", "image/png", png);
        JsonNode result = mapper.readTree(mvc.perform(multipart("/api/uploads").file(photo).header("Authorization", "Bearer "+auth.get("token").asText())).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        String url = result.get("url").asText(), name = url.substring("/uploads/".length());
        assertArrayEquals(png, jdbc.queryForObject("SELECT content FROM uploaded_photos WHERE name = ?", byte[].class, name));
        mvc.perform(get(url)).andExpect(status().isOk()).andExpect(content().bytes(png));
        mvc.perform(get("/uploads/not-a-valid-photo.png")).andExpect(status().isNotFound());
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
    @Test void editingCannotOverwriteAReservationCommittedWhileItWaits() throws Exception {
        JsonNode owner = newAccount(), requester = newAccount();
        long category = jdbc.queryForObject("SELECT MIN(id) FROM categories", Long.class);
        var payload = Map.of("categoryId",category,"title","Edicao concorrente SQL","description","Objeto de teste para preservar reserva durante edicao.","type","DONATION","imageUrls",List.of("https://example.test/photo.jpg"));
        String ownerToken = "Bearer "+owner.get("token").asText();
        long id = mapper.readTree(mvc.perform(post("/api/items").header("Authorization",ownerToken).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(payload)))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asLong();
        var pool = Executors.newSingleThreadExecutor();
        try (var reservation = jdbc.getDataSource().getConnection()) {
            reservation.setAutoCommit(false);
            try (var update = reservation.prepareStatement("UPDATE items SET status='RESERVED', reserved_by_id=? WHERE id=?")) {
                update.setLong(1,requester.get("user").get("id").asLong()); update.setLong(2,id); update.executeUpdate();
            }
            try (var history = reservation.prepareStatement("INSERT INTO reservations(item_id,requester_id,owner_id,status) VALUES (?,?,?,'CONFIRMED')")) {
                history.setLong(1,id);history.setLong(2,requester.get("user").get("id").asLong());history.setLong(3,owner.get("user").get("id").asLong());history.executeUpdate();
            }
            var editedPayload = new java.util.HashMap<String,Object>(payload);
            editedPayload.put("title","Edicao concorrente SQL atualizada");
            var edited = pool.submit(() -> mvc.perform(put("/api/items/"+id).header("Authorization",ownerToken).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(editedPayload)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
            boolean blocked = false;
            try {
                long deadline = System.nanoTime()+TimeUnit.SECONDS.toNanos(10);
                while (System.nanoTime()<deadline) {
                    if (jdbc.queryForObject("SELECT COUNT(*) FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid() AND wait_event_type='Lock'",Integer.class)>0) { blocked=true;break; }
                    Thread.sleep(25);
                }
                assertTrue(blocked,"A edicao precisa aguardar a transacao que esta reservando.");
            } finally { reservation.commit(); }
            edited.get(15,TimeUnit.SECONDS);
            mvc.perform(get("/api/items/"+id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESERVED"))
                .andExpect(jsonPath("$.reservedById").value(requester.get("user").get("id").asLong()));
        } finally {
            pool.shutdownNow();
            mvc.perform(delete("/api/items/"+id).header("Authorization",ownerToken)).andExpect(status().isNoContent());
        }
    }

}
