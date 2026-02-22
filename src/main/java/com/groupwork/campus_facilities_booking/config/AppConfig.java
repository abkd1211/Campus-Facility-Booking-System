package com.groupwork.campus_facilities_booking.config;

import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AppConfig {

    // ── ModelMapper — converts Entities ↔ DTOs cleanly ───────
    @Bean
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }

    // ── Hibernate6Module — fixes ByteBuddyInterceptor error ───
    // Teaches Jackson how to handle uninitialised LAZY-loaded
    // Hibernate proxy objects. Without this, any response that
    // contains a LAZY relationship that wasn't fetched in the
    // same transaction causes a 500 "Type definition error".
    @Bean
    public Hibernate6Module hibernate6Module() {
        Hibernate6Module module = new Hibernate6Module();
        // Serialize uninitialized lazy proxies as null (safe default)
        // instead of attempting to load them outside the transaction
        module.disable(Hibernate6Module.Feature.USE_TRANSIENT_ANNOTATION);
        return module;
    }

    // ── Global CORS — allow frontend (any origin during dev) ──
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}
