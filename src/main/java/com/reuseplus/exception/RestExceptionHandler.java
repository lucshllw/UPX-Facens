package com.reuseplus.exception;

import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class RestExceptionHandler {
    @ExceptionHandler(ApiException.class)
    ResponseEntity<Map<String, Object>> handleApi(ApiException exception) {
        return ResponseEntity.status(exception.getStatus()).body(error(exception.getStatus(), exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(RestExceptionHandler::formatFieldError)
                .orElse("Dados invalidos.");
        return ResponseEntity.badRequest().body(error(HttpStatus.BAD_REQUEST, message));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, Object>> handleUnexpected(Exception exception) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno inesperado."));
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    ResponseEntity<Map<String, Object>> handleAuthentication(Exception exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos."));
    }

    private static String formatFieldError(FieldError error) {
        return error.getField() + ": " + error.getDefaultMessage();
    }

    private static Map<String, Object> error(HttpStatus status, String message) {
        return Map.of(
                "timestamp", Instant.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message
        );
    }
}
