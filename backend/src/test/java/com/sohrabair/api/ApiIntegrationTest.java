package com.sohrabair.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@EnabledIfEnvironmentVariable(named = "INTEGRATION_DB_URL", matches = ".+")
class ApiIntegrationTest {
    @Autowired MockMvc mvc;

    @DynamicPropertySource
    static void config(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> System.getenv("INTEGRATION_DB_URL"));
        registry.add("spring.datasource.username", () -> "sohrab");
        registry.add("spring.datasource.password", () -> "integration-password");
        registry.add("app.owner-login", () -> "owner");
        registry.add("app.owner-password", () -> "integration-secret-password");
        registry.add("app.public-origin", () -> "http://localhost:3000");
        registry.add("app.upload-dir", () -> System.getProperty("java.io.tmpdir") + "/sohrab-test-files");
    }

    @Test
    void publicAndAdminFlow() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ok"));
        mvc.perform(multipart("/api/submissions").header("Origin", "http://localhost:3000")
                .param("type", "ticket").param("name", "Test Passenger")
                .param("phone", "+8801712345678").param("passengers", "2"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.reference").exists());
        String token = mvc.perform(post("/api/admin/login").header("Origin", "http://localhost:3000")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"loginId\":\"owner\",\"password\":\"integration-secret-password\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("sai_admin_session").getValue();
        Cookie cookie = new Cookie("sai_admin_session", token);
        mvc.perform(get("/api/admin/overview").cookie(cookie))
                .andExpect(status().isOk()).andExpect(jsonPath("$.requests[0].name").value("Test Passenger"));
        mvc.perform(post("/api/admin/packages").header("Origin", "http://localhost:3000")
                .cookie(cookie).contentType(MediaType.APPLICATION_JSON)
                .content("{\"category\":\"umrah\",\"nameBn\":\"ওমরাহ\",\"nameEn\":\"Umrah\",\"price\":1000}"))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/packages")).andExpect(status().isOk())
                .andExpect(jsonPath("$.packages[0].nameEn").value("Umrah"));
    }
}
