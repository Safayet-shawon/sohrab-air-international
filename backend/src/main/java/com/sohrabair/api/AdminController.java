package com.sohrabair.api;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AdminController {
    private final JdbcTemplate db;
    private final AdminSecurity security;
    public AdminController(JdbcTemplate db, AdminSecurity security) { this.db = db; this.security = security; }

    @PostMapping("/admin/login")
    public ResponseEntity<Map<String, Boolean>> login(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        security.checkOrigin(request);
        String token = security.login(text(body, "loginId", 80), text(body, "password", 128));
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, security.sessionCookie(token)).body(Map.of("ok", true));
    }
    @PostMapping("/admin/logout")
    public ResponseEntity<Map<String, Boolean>> logout(HttpServletRequest request) {
        security.checkOrigin(request); security.logout(request);
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, security.expiredCookie()).body(Map.of("ok", true));
    }
    @PatchMapping("/admin/credentials")
    public ResponseEntity<Map<String, Boolean>> credentials(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        security.checkOrigin(request);
        AdminSecurity.Actor actor = security.require(request, true);
        String login = text(body, "loginId", 80), password = text(body, "password", 128);
        security.changePassword(actor, login, password);
        String token = security.login(login, password);
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, security.sessionCookie(token)).body(Map.of("ok", true));
    }
    @GetMapping("/admin/overview")
    public Map<String, Object> overview(HttpServletRequest request) {
        AdminSecurity.Actor actor = security.require(request, false);
        var requests = db.queryForList("SELECT * FROM submissions ORDER BY created_at DESC LIMIT 500").stream().map(ApiRows::submission).toList();
        var packages = db.queryForList("SELECT * FROM packages ORDER BY updated_at DESC").stream().map(ApiRows::packageRow).toList();
        var staff = actor.role().equals("owner") ? staffRows() : List.<Map<String, Object>>of();
        return Map.of("actor", actor.publicView(), "requests", requests, "packages", packages, "staff", staff);
    }
    @GetMapping("/submissions")
    public Map<String, Object> submissions(HttpServletRequest request) {
        security.require(request, false);
        return Map.of("submissions", db.queryForList("SELECT * FROM submissions ORDER BY created_at DESC LIMIT 100").stream().map(ApiRows::submission).toList());
    }
    @PatchMapping("/submissions/{id}")
    public Map<String, Boolean> updateSubmission(@PathVariable UUID id, @RequestBody Map<String, Object> body, HttpServletRequest request) {
        security.checkOrigin(request); AdminSecurity.Actor actor = security.require(request, false);
        String status = text(body, "status", 20);
        if (!Set.of("new", "contacted", "confirmed", "closed").contains(status)) bad("Invalid status");
        int count = db.update("UPDATE submissions SET status=?, area=?, travellers_count=?, group_leader_name=?, revenue=?, package_id=?, updated_at=now() WHERE id=?",
                status, text(body, "area", 160), number(body, "travellersCount", 1, 1, 1000),
                nullable(body, "groupLeaderName", 160), number(body, "revenue", 0, 0, 1000000000),
                uuid(body.get("packageId")), id);
        if (count == 0) missing();
        db.update("INSERT INTO audit_events(submission_id,action,actor_id) VALUES (?,?,?)", id, "status:" + status, actor.id());
        return Map.of("ok", true);
    }
    @GetMapping("/admin/packages")
    public Map<String, Object> adminPackages(HttpServletRequest request) {
        security.require(request, false);
        return Map.of("packages", db.queryForList("SELECT * FROM packages ORDER BY updated_at DESC").stream().map(ApiRows::packageRow).toList());
    }
    @PostMapping("/admin/packages")
    public ResponseEntity<Map<String, UUID>> createPackage(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        security.checkOrigin(request); security.require(request, false);
        UUID id = UUID.randomUUID();
        packageValues(id, body, false);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id));
    }
    @PatchMapping("/admin/packages/{id}")
    public Map<String, Boolean> updatePackage(@PathVariable UUID id, @RequestBody Map<String, Object> body, HttpServletRequest request) {
        security.checkOrigin(request); security.require(request, false);
        packageValues(id, body, true); return Map.of("ok", true);
    }
    @DeleteMapping("/admin/packages/{id}")
    public Map<String, Boolean> deletePackage(@PathVariable UUID id, HttpServletRequest request) {
        security.checkOrigin(request); security.require(request, false);
        if (db.update("DELETE FROM packages WHERE id=?", id) == 0) missing();
        return Map.of("ok", true);
    }
    @GetMapping("/admin/staff")
    public Map<String, Object> staff(HttpServletRequest request) {
        security.require(request, true); return Map.of("staff", staffRows());
    }
    @PostMapping("/admin/staff")
    public ResponseEntity<Map<String, UUID>> createStaff(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        security.checkOrigin(request); security.require(request, true);
        String name = text(body, "name", 120), login = loginId(body);
        if (name.isBlank()) bad("Manager name required");
        UUID id = UUID.randomUUID();
        try {
            db.update("INSERT INTO staff_members(id,login_id,password_hash,name,role) VALUES (?,?,?,?,'manager')",
                    id, login, security.hashPassword(text(body, "password", 128)), name);
        } catch (DataIntegrityViolationException error) { conflict(); }
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id));
    }
    @PatchMapping("/admin/staff/{id}")
    public Map<String, Boolean> updateStaff(@PathVariable UUID id, @RequestBody Map<String, Object> body, HttpServletRequest request) {
        security.checkOrigin(request); security.require(request, true);
        var rows = db.queryForList("SELECT login_id,password_hash,name,active FROM staff_members WHERE id=? AND role='manager'", id);
        if (rows.isEmpty()) missing();
        var old = rows.getFirst();
        String login = body.containsKey("loginId") ? loginId(body) : (String) old.get("login_id");
        String name = body.containsKey("name") ? text(body, "name", 120) : (String) old.get("name");
        String password = body.containsKey("password") && !text(body, "password", 128).isBlank()
                ? security.hashPassword(text(body, "password", 128)) : (String) old.get("password_hash");
        boolean active = body.get("active") instanceof Boolean b ? b : (Boolean) old.get("active");
        if (name.isBlank()) bad("Manager name required");
        try { db.update("UPDATE staff_members SET login_id=?, password_hash=?, name=?, active=? WHERE id=? AND role='manager'",
                login, password, name, active, id); }
        catch (DataIntegrityViolationException error) { conflict(); }
        db.update("DELETE FROM admin_sessions WHERE staff_id=?", id);
        return Map.of("ok", true);
    }
    @DeleteMapping("/admin/staff/{id}")
    public Map<String, Boolean> deleteStaff(@PathVariable UUID id, HttpServletRequest request) {
        security.checkOrigin(request); security.require(request, true);
        if (db.update("DELETE FROM staff_members WHERE id=? AND role='manager'", id) == 0) missing();
        return Map.of("ok", true);
    }

    private void packageValues(UUID id, Map<String, Object> body, boolean update) {
        String category = text(body, "category", 20), bn = text(body, "nameBn", 120), en = text(body, "nameEn", 120);
        if (!Set.of("hajj", "umrah").contains(category) || bn.isBlank() || en.isBlank()) bad("Category and both package names are required");
        Object[] fields = {category, bn, en, text(body, "descriptionBn", 1200), text(body, "descriptionEn", 1200),
                number(body, "price", 0, 0, 1000000000), number(body, "durationDays", 0, 0, 365),
                jsonList(body.get("destinations")), jsonList(body.get("inclusions")), !Boolean.FALSE.equals(body.get("active"))};
        if (update) {
            if (db.update("UPDATE packages SET category=?,name_bn=?,name_en=?,description_bn=?,description_en=?,price=?,duration_days=?,destinations_json=?,inclusions_json=?,active=?,updated_at=now() WHERE id=?",
                    fields[0],fields[1],fields[2],fields[3],fields[4],fields[5],fields[6],fields[7],fields[8],fields[9],id) == 0) missing();
        } else db.update("INSERT INTO packages(id,category,name_bn,name_en,description_bn,description_en,price,duration_days,destinations_json,inclusions_json,active) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                id,fields[0],fields[1],fields[2],fields[3],fields[4],fields[5],fields[6],fields[7],fields[8],fields[9]);
    }
    private String jsonList(Object value) {
        List<String> list = value instanceof List<?> a ? a.stream().map(v -> PublicController.clean(String.valueOf(v), 160)).toList()
                : value instanceof String s ? java.util.Arrays.stream(s.split("[,\\n]")).map(v -> PublicController.clean(v, 160)).toList() : List.of();
        try { return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(list.stream().filter(v -> !v.isBlank()).limit(30).toList()); }
        catch (Exception error) { throw new IllegalStateException(error); }
    }
    private List<Map<String, Object>> staffRows() {
        return db.queryForList("SELECT id,login_id,name,role,active,created_at FROM staff_members ORDER BY created_at DESC").stream().map(ApiRows::staff).toList();
    }
    private static String text(Map<String, Object> body, String key, int max) {
        Object value = body.get(key); return value instanceof String s ? PublicController.clean(s, max) : "";
    }
    private static String nullable(Map<String, Object> body, String key, int max) {
        String value = text(body, key, max); return value.isBlank() ? null : value;
    }
    private static int number(Map<String, Object> body, String key, int fallback, int min, int max) {
        Object value = body.get(key); return PublicController.number(value == null ? null : String.valueOf(value), fallback, min, max);
    }
    private static UUID uuid(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        try { return UUID.fromString(String.valueOf(value)); }
        catch (Exception error) { throw new ApiError.Problem(HttpStatus.BAD_REQUEST, "Invalid package ID"); }
    }
    private static String loginId(Map<String, Object> body) {
        String value = text(body, "loginId", 80).toLowerCase();
        if (!value.matches("[a-z0-9._-]{4,80}")) bad("Admin ID must be at least 4 characters");
        return value;
    }
    private static void bad(String message) { throw new ApiError.Problem(HttpStatus.BAD_REQUEST, message); }
    private static void missing() { throw new ApiError.Problem(HttpStatus.NOT_FOUND, "Not found"); }
    private static void conflict() { throw new ApiError.Problem(HttpStatus.CONFLICT, "Admin ID already in use"); }
}
