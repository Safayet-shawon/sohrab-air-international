package com.sohrabair.api;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ApiContractTest {
    @Test void packageFieldsMatchFrontendContract() {
        var row = ApiRows.packageRow(Map.of("name_bn", "উমরাহ", "duration_days", 14, "destinations_json", "[]"));
        assertThat(row).containsEntry("nameBn", "উমরাহ").containsEntry("durationDays", 14).containsEntry("destinationsJson", "[]");
    }
    @Test void rejectsDisguisedUploads() {
        assertThat(PublicController.imageExtension("not an image".getBytes())).isNull();
        assertThat(PublicController.imageExtension(new byte[] {(byte)0xff,(byte)0xd8,(byte)0xff,0})).isEqualTo(".jpg");
    }
}
