package com.greenly.backend.dto;

public record AuthResponse(String token, Long userId, String email, String nombre) {
}