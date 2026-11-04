FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY pom.xml ./
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:17-jre-jammy
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --uid 10001 --create-home --shell /usr/sbin/nologin reuse \
    && mkdir -p /app/uploads && chown -R reuse:reuse /app
WORKDIR /app
COPY --from=build --chown=reuse:reuse /workspace/target/reuse-plus-*.jar /app/reuse-plus.jar
ENV PORT=8080 UPLOAD_DIRECTORY=/app/uploads JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65.0"
USER reuse
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=8s --start-period=60s --retries=3 \
    CMD curl --fail --silent http://127.0.0.1:${PORT}/api/health || exit 1
ENTRYPOINT ["java","-jar","/app/reuse-plus.jar"]
