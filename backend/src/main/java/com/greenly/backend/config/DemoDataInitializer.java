package com.greenly.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.greenly.backend.repository.UsuarioRepository;
import com.greenly.backend.service.PlantService;

/**
 * Inicializador de datos de prueba para asegurar que perfiles de desarrollo
 * (en particular alonsotejada728@gmail.com) cuenten con plantas configuradas
 * listas para disparar los recordatorios de riego en Expo Go y en consola.
 */
@Configuration
public class DemoDataInitializer {
	private static final Logger logger = LoggerFactory.getLogger(DemoDataInitializer.class);
	private static final String TARGET_EMAIL = "alonsotejada728@gmail.com";

	@Bean
	public CommandLineRunner seedDemoPlantsOnStartup(
		UsuarioRepository usuarioRepository,
		PlantService plantService
	) {
		return args -> {
			try {
				if (usuarioRepository.existsByEmailIgnoreCase(TARGET_EMAIL)) {
					logger.info("🌱 [DEMO SEEDER] Usuario {} detectado. Sembrando plantas de prueba para recordatorios inmediatos...", TARGET_EMAIL);
					plantService.seedDemoPlants(TARGET_EMAIL);
					logger.info("✅ [DEMO SEEDER] Plantas de prueba inicializadas con éxito.");
				} else {
					logger.info("ℹ️ [DEMO SEEDER] Usuario {} aún no registrado en la base de datos. Las plantas se sembrarán cuando se invoque /api/plantas/demo-seed.", TARGET_EMAIL);
				}
			} catch (Exception e) {
				logger.warn("⚠️ [DEMO SEEDER] Error no bloqueante al inicializar datos de prueba: {}", e.getMessage());
			}
		};
	}
}
