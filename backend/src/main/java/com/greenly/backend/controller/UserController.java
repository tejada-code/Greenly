package com.greenly.backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.greenly.backend.dto.PushTokenRequest;
import com.greenly.backend.entity.Usuario;
import com.greenly.backend.repository.UsuarioRepository;

@RestController
@RequestMapping("/api/usuarios")
public class UserController {
	private static final Logger logger = LoggerFactory.getLogger(UserController.class);
	private final UsuarioRepository usuarioRepository;

	public UserController(UsuarioRepository usuarioRepository) {
		this.usuarioRepository = usuarioRepository;
	}

	@PutMapping("/push-token")
	public ResponseEntity<Void> updatePushToken(
		Authentication authentication,
		@RequestBody PushTokenRequest request
	) {
		String email = authentication.getName();
		Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email)
			.orElseThrow(() -> new IllegalStateException("Usuario no encontrado con email: " + email));

		usuario.setPushToken(request.pushToken());
		usuarioRepository.save(usuario);

		logger.info("🔑 [PUSH TOKEN REGISTRADO] Token actualizado para el usuario {}: {}", email, request.pushToken());
		return ResponseEntity.noContent().build();
	}
}
