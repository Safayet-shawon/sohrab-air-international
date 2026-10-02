package com.sohrabair.api;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class PublicController {
    private final JdbcTemplate db;
    private final ObjectMapper json;
    private final AdminSecurity security;
    @Value("${app.upload-dir}") private String uploadDir;
    public PublicController(JdbcTemplate db, ObjectMapper json, AdminSecurity security) {
        this.db = db; this.json = json; this.security = security;
    }

    @GetMapping("/health")
    public Map<String, String> health() { db.queryForObject("SELECT 1", Integer.class); return Map.of("status", "ok"); }

    @GetMapping("/packages")
    public Map<String, Object> packages(@RequestParam(required = false) String category) {
        String sql = "SELECT * FROM packages WHERE active=true" +
                (Set.of("hajj", "umrah").contains(category == null ? "" : category) ? " AND category=?" : "") + " ORDER BY price";
        List<Map<String, Object>> rows = category != null && Set.of("hajj", "umrah").contains(category)
                ? db.queryForList(sql, category) : db.queryForList(sql);
        return Map.of("packages", rows.stream().map(ApiRows::packageRow).toList());
    }

    @PostMapping(path = "/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> submit(HttpServletRequest request,
            @RequestParam Map<String, String> form,
            @RequestParam(required = false) MultipartFile passport) throws IOException {
        security.checkOrigin(request);
        String type = clean(form.get("type"), 20), name = clean(form.get("name"), 120);
        String phone = clean(form.get("phone"), 20), email = clean(form.get("email"), 160);
        if (!Set.of("booking", "ticket", "job", "leader").contains(type) || name.isBlank() || !phone.matches("\\+?[0-9][0-9 ]{8,14}"))
            throw new ApiError.Problem(HttpStatus.BAD_REQUEST, "Name, valid phone and request type are required");
        if (!email.isBlank() && !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"))
            throw new ApiError.Problem(HttpStatus.BAD_REQUEST, "Invalid email");
        if (form.values().stream().mapToInt(String::length).sum() > 12000)
            throw new ApiError.Problem(HttpStatus.BAD_REQUEST, "Request is too long");
        int people = number(form.get(type.equals("ticket") ? "passengers" : "travellers"), 1, 1, 1000);
        UUID id = UUID.randomUUID();
        Map<String, String> payload = new HashMap<>(form);
        payload.keySet().removeAll(Set.of("name", "phone", "email", "type"));
        payload.replaceAll((key, value) -> clean(value, 1000));
        String fileKey = null;
        Path stored = null;
        if (passport != null && !passport.isEmpty()) {
            if (passport.getSize() > 5L * 1024 * 1024) throw new ApiError.Problem(HttpStatus.BAD_REQUEST, "Passport image must be under 5 MB");
            byte[] bytes = passport.getBytes();
            String extension = imageExtension(bytes);
            if (extension == null) throw new ApiError.Problem(HttpStatus.BAD_REQUEST, "Passport image must be JPG, PNG or WebP");
            fileKey = UUID.randomUUID() + extension;
            Path directory = Path.of(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(directory);
            stored = directory.resolve(fileKey);
            Files.write(stored, bytes);
        }
        try {
            db.update("INSERT INTO submissions(id,type,name,phone,email,payload_json,file_key,area,travellers_count,group_leader_name) VALUES (?,?,?,?,?,?,?,?,?,?)",
                    id, type, name, phone, email.isBlank() ? null : email, json.writeValueAsString(payload), fileKey,
                    clean(form.getOrDefault("area", "Unspecified"), 160), people, clean(form.get("group_leader"), 160));
            db.update("INSERT INTO audit_events(submission_id,action) VALUES (?,'created')", id);
        } catch (Exception error) {
            if (stored != null) Files.deleteIfExists(stored);
            throw error;
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id.toString(), "reference", "SAI-" + id.toString().substring(0, 8).toUpperCase()));
    }

    @GetMapping("/files/{key}")
    public ResponseEntity<byte[]> file(@PathVariable String key, HttpServletRequest request) throws IOException {
        security.require(request, false);
        if (!key.matches("[0-9a-f-]{36}\\.(jpg|png|webp)")) throw new ApiError.Problem(HttpStatus.NOT_FOUND, "File not found");
        Integer count = db.queryForObject("SELECT count(*) FROM submissions WHERE file_key=?", Integer.class, key);
        Path file = Path.of(uploadDir).toAbsolutePath().normalize().resolve(key);
        if (count == null || count == 0 || !Files.isRegularFile(file)) throw new ApiError.Problem(HttpStatus.NOT_FOUND, "File not found");
        String mime = key.endsWith(".png") ? "image/png" : key.endsWith(".webp") ? "image/webp" : "image/jpeg";
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .header("X-Content-Type-Options", "nosniff")
                .contentType(MediaType.parseMediaType(mime)).body(Files.readAllBytes(file));
    }

    static String clean(String value, int max) { return value == null ? "" : value.trim().substring(0, Math.min(value.trim().length(), max)); }
    static int number(String value, int fallback, int min, int max) {
        try { return Math.max(min, Math.min(max, Integer.parseInt(value))); }
        catch (Exception error) { return fallback; }
    }
    static String imageExtension(byte[] b) {
        if (b.length >= 8 && b[0] == (byte) 0x89 && b[1] == 0x50 && b[2] == 0x4e && b[3] == 0x47 && b[4] == 0x0d && b[5] == 0x0a) return ".png";
        if (b.length >= 3 && b[0] == (byte) 0xff && b[1] == (byte) 0xd8 && b[2] == (byte) 0xff) return ".jpg";
        if (b.length >= 12 && new String(b, 0, 4).equals("RIFF") && new String(b, 8, 4).equals("WEBP")) return ".webp";
        return null;
    }
}
