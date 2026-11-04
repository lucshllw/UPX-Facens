package com.reuseplus;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("dev")
@TestPropertySource(properties = {"spring.datasource.url=jdbc:h2:mem:reuse-ready;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1", "app.upload-directory=./validation/tmp/uploads", "app.cors.allowed-origins=https://reuse.example.test"})
class ProductionReadinessTest extends CommunityFlowContract {
    @Test void healthChecksTheDatabaseWithoutLogin() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
    }
    @Test void deploymentOriginIsConfigurableAndOtherOriginsAreRejected() throws Exception {
        mvc.perform(options("/api/items").header("Origin", "https://reuse.example.test").header("Access-Control-Request-Method", "POST").header("Access-Control-Request-Headers", "authorization,content-type"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "https://reuse.example.test"));
        mvc.perform(options("/api/items").header("Origin", "https://unrelated.example.test").header("Access-Control-Request-Method", "POST"))
            .andExpect(status().isForbidden());
    }
    @Test void malformedRequestsAreClientErrors() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{broken"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
        mvc.perform(get("/api/items").param("categoryId", "invalid"))
            .andExpect(status().isBadRequest());
    }
    @Test void missingSessionReturnsUnauthorizedJson() throws Exception {
        mvc.perform(get("/api/me/favorites")).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.status").value(401));
    }
}
