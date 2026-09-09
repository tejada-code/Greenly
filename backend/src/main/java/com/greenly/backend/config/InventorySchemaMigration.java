package com.greenly.backend.config;

import javax.sql.DataSource;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class InventorySchemaMigration {
	@Bean
	public CommandLineRunner removeLegacyPlantScientificName(DataSource dataSource) {
		return args -> {
			try {
				new JdbcTemplate(dataSource).execute(
					"ALTER TABLE plantas_usuario DROP COLUMN IF EXISTS nombre_cientifico"
				);
			} catch (RuntimeException ignored) {
				// The column is absent on a clean database or already migrated schema.
			}
		};
	}
}