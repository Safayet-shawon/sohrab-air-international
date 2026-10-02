package com.sohrabair.api;

import java.util.LinkedHashMap;
import java.util.Map;

public final class ApiRows {
    private ApiRows() {}
    static Map<String, Object> packageRow(Map<String, Object> row) {
        return rename(row, Map.ofEntries(
                Map.entry("name_bn", "nameBn"), Map.entry("name_en", "nameEn"),
                Map.entry("description_bn", "descriptionBn"), Map.entry("description_en", "descriptionEn"),
                Map.entry("duration_days", "durationDays"), Map.entry("destinations_json", "destinationsJson"),
                Map.entry("inclusions_json", "inclusionsJson"), Map.entry("created_at", "createdAt"), Map.entry("updated_at", "updatedAt")));
    }
    static Map<String, Object> submission(Map<String, Object> row) {
        return rename(row, Map.ofEntries(
                Map.entry("payload_json", "payloadJson"), Map.entry("file_key", "fileKey"),
                Map.entry("travellers_count", "travellersCount"), Map.entry("group_leader_name", "groupLeaderName"),
                Map.entry("package_id", "packageId"), Map.entry("created_at", "createdAt"), Map.entry("updated_at", "updatedAt")));
    }
    static Map<String, Object> staff(Map<String, Object> row) {
        return rename(row, Map.of("login_id", "loginId", "created_at", "createdAt"));
    }
    private static Map<String, Object> rename(Map<String, Object> row, Map<String, String> names) {
        Map<String, Object> result = new LinkedHashMap<>();
        row.forEach((key, value) -> result.put(names.getOrDefault(key, key), value));
        return result;
    }
}
