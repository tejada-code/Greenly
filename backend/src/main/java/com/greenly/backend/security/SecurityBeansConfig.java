package com.greenly.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.greenly.backend.entity.Usuario;
import com.greenly.backend.repository.UsuarioRepository;

@Configuration
@EnableMethodSecurity
public class SecurityBeansConfig {
	@Bean
	public UserDetailsService userDetailsService(UsuarioRepository usuarioRepository) {
		return username -> usuarioRepository.findByEmailIgnoreCase(username)
			.map(usuario -> org.springframework.security.core.userdetails.User
				.withUsername(usuario.getEmail())
				.password(usuario.getPasswordHash())
				.roles("USER")
				.disabled(usuario.getEstadoCuenta() != Usuario.EstadoCuenta.ACTIVO)
				.build())
			.orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public AuthenticationProvider authenticationProvider(
		UserDetailsService userDetailsService,
		PasswordEncoder passwordEncoder
	) {
		DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
		provider.setPasswordEncoder(passwordEncoder);
		return provider;
	}

	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
		return configuration.getAuthenticationManager();
	}
}