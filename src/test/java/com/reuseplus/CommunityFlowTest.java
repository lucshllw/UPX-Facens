package com.reuseplus;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@TestPropertySource(properties = {"spring.datasource.url=jdbc:h2:mem:reuse-test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1", "app.upload-directory=./validation/tmp/uploads"})
class CommunityFlowTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    private JsonNode register(String name) throws Exception {
        String email = UUID.randomUUID() + "@example.test";
        String json = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(Map.of("name", name, "email", email, "password", "ReuseTest123!", "neighborhood", "Centro"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return mapper.readTree(json);
    }
    private String token(JsonNode auth) { return "Bearer " + auth.get("token").asText(); }
    private Map<String, Object> item(String title) throws Exception {
        long category = mapper.readTree(mvc.perform(get("/api/categories")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get(0).get("id").asLong();
        return Map.of("title", title, "description", "Objeto real em bom estado, pronto para continuar sua historia.", "categoryId", category, "type", "DONATION", "conditionLabel", "Bom estado", "location", "Centro, Sorocaba", "imageUrl", "https://example.test/chair.jpg", "imageUrls", java.util.List.of("https://example.test/chair.jpg", "https://example.test/detail.jpg"));
    }
    @Test void circularFlowEnforcesOwnershipAndConversationPrivacy() throws Exception {
        JsonNode owner = register("Anunciante"), guest = register("Interessado"), other = register("Outra pessoa");
        Map<String, Object> payload = item("Cadeira para teste");
        JsonNode created = mapper.readTree(mvc.perform(post("/api/items").header("Authorization", token(owner)).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(payload))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        long id = created.get("id").asLong();
        assertEquals(2, created.get("imageUrls").size());
        assertEquals("Centro, Sorocaba", created.get("location").asText());
        String hash = jdbc.queryForObject("SELECT password_hash FROM app_users WHERE id = ?", String.class, owner.get("user").get("id").asLong());
        assertTrue(hash.startsWith("$2"));
        mvc.perform(get("/assets/favicon.svg")).andExpect(status().isOk());
        mvc.perform(get("/script.js")).andExpect(status().isOk());
        mvc.perform(get("/api/me/favorites")).andExpect(status().isForbidden());
        mvc.perform(put("/api/items/"+id).header("Authorization",token(guest)).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(payload))).andExpect(status().isForbidden());
        payload = new java.util.HashMap<>(payload); payload.put("title", "Cadeira atualizada");
        mvc.perform(put("/api/items/"+id).header("Authorization",token(owner)).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(payload))).andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Cadeira atualizada"));
        for(int i=0;i<2;i++)mvc.perform(put("/api/me/favorites/"+id).header("Authorization",token(guest))).andExpect(status().isNoContent());
        mvc.perform(get("/api/me/favorites").header("Authorization",token(guest))).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/me/favorites").header("Authorization",token(other))).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(post("/api/items/"+id+"/reservation").header("Authorization",token(owner))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/items/"+id+"/reservation").header("Authorization",token(guest))).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("RESERVED"));
        mvc.perform(post("/api/items/"+id+"/reservation").header("Authorization",token(other))).andExpect(status().isConflict());
        mvc.perform(delete("/api/items/"+id+"/reservation").header("Authorization",token(other))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/items/"+id+"/reservation").header("Authorization",token(guest))).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("AVAILABLE"));
        mvc.perform(post("/api/messages").header("Authorization",token(guest)).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(Map.of("itemId",id,"content","Esta disponivel?")))).andExpect(status().isCreated());
        mvc.perform(post("/api/messages").header("Authorization",token(owner)).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(Map.of("itemId",id,"receiverId",guest.get("user").get("id").asLong(),"content","Sim, vamos combinar.")))).andExpect(status().isCreated());
        mvc.perform(get("/api/messages/items/"+id).header("Authorization",token(other))).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/me/messages").header("Authorization",token(guest))).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(post("/api/messages").header("Authorization",token(owner)).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(Map.of("itemId",id,"receiverId",other.get("user").get("id").asLong(),"content","Resposta indevida")))).andExpect(status().isForbidden());
        mvc.perform(post("/api/items/"+id+"/complete").header("Authorization",token(guest))).andExpect(status().isForbidden());
        mvc.perform(post("/api/items/"+id+"/complete").header("Authorization",token(owner))).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("FINISHED"));
        mvc.perform(delete("/api/items/"+id).header("Authorization",token(guest))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/items/"+id).header("Authorization",token(owner))).andExpect(status().isNoContent());
        mvc.perform(get("/api/me/favorites").header("Authorization",token(guest))).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/me/messages").header("Authorization",token(guest))).andExpect(jsonPath("$.length()").value(0));
    }
    @Test void rejectsInvalidFormsAndUploads() throws Exception {
        JsonNode owner = register("Validacao");
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"nobody@example.test\",\"password\":\"incorrect\"}")).andExpect(status().isUnauthorized());
        Map<String,Object> payload=new java.util.HashMap<>(item("Teste foto"));payload.put("imageUrls",java.util.List.of("javascript:alert(1)"));
        mvc.perform(post("/api/items").header("Authorization",token(owner)).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(payload))).andExpect(status().isBadRequest());
        var invalid = new org.springframework.mock.web.MockMultipartFile("file", "bad.svg", "image/svg+xml", "<svg/>".getBytes());
        mvc.perform(multipart("/api/uploads").file(invalid).header("Authorization",token(owner))).andExpect(status().isBadRequest());
        byte[] png = java.util.Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=");
        var valid = new org.springframework.mock.web.MockMultipartFile("file", "photo.png", "image/png", png);
        JsonNode upload = mapper.readTree(mvc.perform(multipart("/api/uploads").file(valid).header("Authorization",token(owner))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        mvc.perform(get(upload.get("url").asText())).andExpect(status().isOk()).andExpect(content().contentType(MediaType.IMAGE_PNG));
    }
}
