package com.sohrabair.api;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class ApiError {
    public static class Problem extends RuntimeException {
        final HttpStatus status;
        public Problem(HttpStatus status, String message) { super(message); this.status = status; }
    }

    @ExceptionHandler(Problem.class)
    ResponseEntity<Map<String, String>> problem(Problem error) {
        return ResponseEntity.status(error.status).body(Map.of("error", error.getMessage()));
    }

    @ExceptionHandler({IllegalArgumentException.class, MethodArgumentNotValidException.class})
    ResponseEntity<Map<String, String>> badRequest(Exception error) {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid request"));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<Map<String, String>> tooLarge() {
        return ResponseEntity.status(413).body(Map.of("error", "File must be under 5 MB"));
    }
}
