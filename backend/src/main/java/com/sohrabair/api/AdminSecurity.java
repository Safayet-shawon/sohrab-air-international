package com.sohrabair.api;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AdminSecurity {
    private final JdbcTemplate db;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
    private final SecureRandom random = new SecureRandom();
    @Value("${app.owner-login}") private String ownerLogin;
    @Value("${app.owner-password}") private String ownerPassword;
    @Value("${app.public-origin}") private String publicOrigin;
    public AdminSecurity(JdbcTemplate db) { this.db = db; }

    @PostConstruct
    public void bootstrap() {
        if (ownerLogin.isBlank() || ownerPassword.length() < 12) {
            throw new IllegalStateException("OWNER_LOGIN and OWNER_PASSWORD (12+ characters) are required");
        }
        Integer owners = db.queryForObject("SELECT count(*) FROM staff_members WHERE role='owner'", Integer.class);
        if (owners != null && owners == 0) {
            db.update("INSERT INTO staff_members(id, login_id, password_hash, name, role) VALUES (?, ?, ?, ?, 'owner')",
                    UUID.randomUUID(), ownerLogin.trim().toLowerCase(), encoder.encode(ownerPassword), "Owner");
        }
    }

    public record Actor(UUID id, String name, String loginId, String role) {
        public Map<String, Object> publicView() {
            return Map.of("id", id, "name", name, "loginId", loginId, "role", role, "requiresPasswordSetup", false);
        }
    }

    public Actor require(HttpServletRequest request, boolean ownerOnly) {
        String token = cookie(request);
        if (token == null) throw new ApiError.Problem(HttpStatus.UNAUTHORIZED, "Admin login required");
        var rows = db.queryForList("SELECT s.id, s.name, s.login_id, s.role FROM admin_sessions a JOIN staff_members s ON s.id=a.staff_id WHERE a.token_hash=? AND a.expires_at>now() AND s.active=true",
                sha256(token));
        if (rows.isEmpty()) throw new ApiError.Problem(HttpStatus.UNAUTHORIZED, "Admin session expired");
        var row = rows.getFirst();
        Actor actor = new Actor((UUID) row.get("id"), (String) row.get("name"), (String) row.get("login_id"), (String) row.get("role"));
        if (ownerOnly && !actor.role.equals("owner")) throw new ApiError.Problem(HttpStatus.FORBIDDEN, "Owner access required");
        return actor;
    }

    public String login(String loginId, String password) {
        var rows = db.queryForList("SELECT id, password_hash, failed_attempts, locked_until FROM staff_members WHERE login_id=? AND active=true",
                loginId.trim().toLowerCase());
        if (rows.isEmpty()) throw new ApiError.Problem(HttpStatus.UNAUTHORIZED, "Invalid Admin ID or password");
        var row = rows.getFirst();
        UUID id = (UUID) row.get("id");
        var locked = (java.sql.Timestamp) row.get("locked_until");
        if (locked != null && locked.toInstant().isAfter(Instant.now()))
            throw new ApiError.Problem(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Try again later.");
        if (!encoder.matches(password, (String) row.get("password_hash"))) {
            int attempts = ((Number) row.get("failed_attempts")).intValue() + 1;
            db.update("UPDATE staff_members SET failed_attempts=?, locked_until=? WHERE id=?",
                    attempts >= 5 ? 0 : attempts,
                    attempts >= 5 ? java.sql.Timestamp.from(Instant.now().plus(15, ChronoUnit.MINUTES)) : null, id);
            throw new ApiError.Problem(HttpStatus.UNAUTHORIZED, "Invalid Admin ID or password");
        }
        db.update("UPDATE staff_members SET failed_attempts=0, locked_until=null WHERE id=?", id);
        byte[] bytes = new byte[32]; random.nextBytes(bytes);
        String token = HexFormat.of().formatHex(bytes);
        db.update("INSERT INTO admin_sessions(token_hash, staff_id, expires_at) VALUES (?, ?, ?)",
                sha256(token), id, java.sql.Timestamp.from(Instant.now().plus(7, ChronoUnit.DAYS)));
        return token;
    }

    public void logout(HttpServletRequest request) {
        String token = cookie(request);
        if (token != null) db.update("DELETE FROM admin_sessions WHERE token_hash=?", sha256(token));
    }

    public void changePassword(Actor actor, String loginId, String password) {
        if (!loginId.matches("[a-zA-Z0-9._-]{4,80}") || password.length() < 12 || password.length() > 128)
            throw new ApiError.Problem(HttpStatus.BAD_REQUEST, "Admin ID or password is invalid");
        db.update("UPDATE staff_members SET login_id=?, password_hash=? WHERE id=?",
                loginId.toLowerCase(), encoder.encode(password), actor.id());
        db.update("DELETE FROM admin_sessions WHERE staff_id=?", actor.id());
    }

    public String hashPassword(String password) {
        if (password == null || password.length() < 12 || password.length() > 128)
            throw new ApiError.Problem(HttpStatus.BAD_REQUEST, "Password must be 12–128 characters");
        return encoder.encode(password);
    }

    public void checkOrigin(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.equals(publicOrigin))
            throw new ApiError.Problem(HttpStatus.FORBIDDEN, "Invalid request origin");
    }

    public String sessionCookie(String token) {
        return "sai_admin_session=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800" + (publicOrigin.startsWith("https://") ? "; Secure" : "");
    }
    public String expiredCookie() { return "sai_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" + (publicOrigin.startsWith("https://") ? "; Secure" : ""); }
    public static String cookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) for (Cookie cookie : cookies) if (cookie.getName().equals("sai_admin_session")) return cookie.getValue();
        return null;
    }
    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
    }
}
