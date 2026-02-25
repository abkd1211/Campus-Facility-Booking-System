# ── Stage 1: Build ────────────────────────────────────────────────────────────
# Use Maven + Java 21 to compile and package the JAR
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

# Copy dependency manifests first (layer-cache trick — speeds up rebuilds)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build the JAR (skip tests for faster build)
COPY src ./src
RUN mvn clean package -DskipTests -q

# ── Stage 2: Run ──────────────────────────────────────────────────────────────
# Slim JRE-only image to keep the container small (~200MB vs ~600MB)
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy only the built JAR from Stage 1
COPY --from=build /app/target/facility-booking-0.0.1-SNAPSHOT.jar app.jar

# Render injects PORT env var — Spring Boot reads SERVER_PORT
EXPOSE 8080

# Run the app
ENTRYPOINT ["java", "-jar", "app.jar"]
