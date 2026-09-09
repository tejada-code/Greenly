package com.greenly.backend.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {
	private final SecretKey signingKey;
	private final long expirationMs;

	public JwtService(
		@Value("${app.jwt.secret}") String secret,
		@Value("${app.jwt.expiration-ms}") long expirationMs
	) {
		this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.expirationMs = expirationMs;
	}

	public String generateToken(UserDetails userDetails) {
		return Jwts.builder()
			.setClaims(Map.of("role", "USER"))
			.setSubject(userDetails.getUsername())
			.setIssuedAt(new Date())
			.setExpiration(new Date(System.currentTimeMillis() + expirationMs))
			.signWith(signingKey)
			.compact();
	}

	public String extractUsername(String token) {
		return extractClaim(token, Claims::getSubject);
	}

	public boolean isTokenValid(String token, UserDetails userDetails) {
		String username = extractUsername(token);
		return username.equalsIgnoreCase(userDetails.getUsername()) && !isTokenExpired(token);
	}

	private boolean isTokenExpired(String token) {
		return extractClaim(token, Claims::getExpiration).before(new Date());
	}

	private <T> T extractClaim(String token, Function<Claims, T> resolver) {
		Claims claims = Jwts.parser()
			.verifyWith(signingKey)
			.build()
			.parseSignedClaims(token)
			.getPayload();
		return resolver.apply(claims);
	}
}