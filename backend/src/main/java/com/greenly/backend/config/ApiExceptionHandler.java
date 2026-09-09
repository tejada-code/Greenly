package com.greenly.backend.config;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<Map<String, String>> handleBadCredentials() {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
			.body(Map.of("error", "Credenciales invalidas"));
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<Map<String, String>> handleInvalidRequest(IllegalArgumentException exception) {
		return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
	}

	@ExceptionHandler(IllegalStateException.class)
	public ResponseEntity<Map<String, String>> handleConflict(IllegalStateException exception) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(Map.of("error", exception.getMessage()));
	}
}