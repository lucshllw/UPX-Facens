package com.reuseplus;

import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@ActiveProfiles("dev")
@TestPropertySource(properties = {"spring.datasource.url=jdbc:h2:mem:reuse-test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1", "app.upload-directory=./validation/tmp/uploads"})
class CommunityFlowTest extends CommunityFlowContract {}
