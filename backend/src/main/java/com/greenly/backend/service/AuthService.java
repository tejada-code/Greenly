package com.greenly.backend.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.greenly.backend.dto.AuthRequest;
import com.greenly.backend.dto.AuthResponse;
import com.greenly.backend.dto.RegisterRequest;
import com.greenly.backend.entity.Usuario;
import com.greenly.backend.repository.UsuarioRepository;
import com.greenly.backend.security.JwtService;

@Service
public class AuthService {
	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final UserDetailsService userDetailsService;
	private final JwtService jwtService;

	public AuthService(
		UsuarioRepository usuarioRepository,
		PasswordEncoder passwordEncoder,
		AuthenticationManager authenticationManager,
		UserDetailsService userDetailsService,
		JwtService jwtService
	) {
		this.usuarioRepository = usuarioRepository;
		this.passwordEncoder = passwordEncoder;
		this.authenticationManager = authenticationManager;
		this.userDetailsService = userDetailsService;
		this.jwtService = jwtService;
	}

	public AuthResponse register(RegisterRequest request) {
		String email = normalize(request.email());
		if (email.isBlank() || request.password() == null || request.password().length() < 8
			|| request.nombre() == null || request.nombre().isBlank()) {
			throw new IllegalArgumentException("Email, nombre y una contraseña de al menos 8 caracteres son obligatorios");
		}
		if (usuarioRepository.existsByEmailIgnoreCase(email)) {
			throw new IllegalStateException("El correo ya está registrado");
		}

		Usuario usuario = usuarioRepository.save(new Usuario(
			email,
			passwordEncoder.encode(request.password()),
			request.nombre().trim()
		));
		UserDetails userDetails = userDetailsService.loadUserByUsername(usuario.getEmail());
		return toResponse(usuario, jwtService.generateToken(userDetails));
	}

	public AuthResponse login(AuthRequest request) {
		String email = normalize(request.email());
		authenticationManager.authenticate(
			new UsernamePasswordAuthenticationToken(email, request.password())
		);
		Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email)
			.orElseThrow(() -> new IllegalStateException("Usuario no encontrado"));
		UserDetails userDetails = userDetailsService.loadUserByUsername(email);
		return toResponse(usuario, jwtService.generateToken(userDetails));
	}

	private AuthResponse toResponse(Usuario usuario, String token) {
		return new AuthResponse(token, usuario.getId(), usuario.getEmail(), usuario.getNombre());
	}

	private String normalize(String email) {
		return email == null ? "" : email.trim().toLowerCase();
	}
}