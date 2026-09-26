package com.greenly.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.greenly.backend.dto.EventoRiego;
import com.greenly.backend.dto.TipoEventoRiego;
import com.greenly.backend.entity.EspecieCatalogo;
import com.greenly.backend.entity.PlantaUsuario;
import com.greenly.backend.entity.Usuario;
import com.greenly.backend.repository.PlantaUsuarioRepository;

class WateringSchedulerServiceTest {

	private PlantaUsuarioRepository plantaUsuarioRepository;
	private WateringSchedulerService schedulerService;
	private Usuario usuarioPrueba;
	private EspecieCatalogo especieSansevieria;

	@BeforeEach
	void setUp() {
		plantaUsuarioRepository = mock(PlantaUsuarioRepository.class);
		schedulerService = new WateringSchedulerService(plantaUsuarioRepository);

		usuarioPrueba = new Usuario("Maria Lopez", "maria@greenly.com", "password123");
		especieSansevieria = new EspecieCatalogo(
			"Dracaena trifasciata",
			"Sansevieria",
			EspecieCatalogo.LuzRecomendada.SEMISOMBRA,
			14, // Frecuencia: 14 días
			"Planta resistente"
		);
	}

	@Test
	@DisplayName("Debe detectar evento 'REVISION_TIERRA' exactamente 2 días antes de la fecha calculada de riego")
	void debeDetectarRevisionDeTierraDosDiasAntes() {
		LocalDate hoy = LocalDate.of(2026, 9, 25);
		// Si la frecuencia es 14 días y hoy faltan 2 días para el riego,
		// significa que el riego será el día 27, por ende fue regada hace 12 días (25 - 12 = 13).
		LocalDateTime fechaUltimoRiego = hoy.minusDays(12).atTime(10, 0);

		PlantaUsuario planta = new PlantaUsuario(usuarioPrueba, especieSansevieria);
		planta.setNombrePersonalizado("Mi Sansevieria del salón");
		planta.setFechaUltimoRiego(fechaUltimoRiego);

		EventoRiego evento = schedulerService.evaluarPlanta(planta, hoy);

		assertNotNull(evento, "El evento de revisión de tierra no debería ser nulo");
		assertEquals(TipoEventoRiego.REVISION_TIERRA, evento.tipoEvento());
		assertEquals(2, evento.diasRestantes());
		assertEquals(hoy.plusDays(2), evento.fechaCalculadaRiego());
		assertTrue(evento.mensaje().contains("revisar la tierra"));
		assertTrue(evento.mensaje().contains("Mi Sansevieria del salón"));
	}

	@Test
	@DisplayName("Debe detectar evento 'RIEGO_EFECTIVO' en el día exacto de riego (0 días restantes)")
	void debeDetectarRiegoEfectivoElMismoDia() {
		LocalDate hoy = LocalDate.of(2026, 9, 25);
		// Regada exactamente hace 14 días -> Hoy toca regar (diasRestantes = 0)
		LocalDateTime fechaUltimoRiego = hoy.minusDays(14).atTime(9, 30);

		PlantaUsuario planta = new PlantaUsuario(usuarioPrueba, especieSansevieria);
		planta.setNombrePersonalizado("Espada de San Jorge");
		planta.setFechaUltimoRiego(fechaUltimoRiego);

		EventoRiego evento = schedulerService.evaluarPlanta(planta, hoy);

		assertNotNull(evento, "El evento de riego efectivo no debería ser nulo");
		assertEquals(TipoEventoRiego.RIEGO_EFECTIVO, evento.tipoEvento());
		assertEquals(0, evento.diasRestantes());
		assertEquals(hoy, evento.fechaCalculadaRiego());
		assertTrue(evento.mensaje().contains("Hoy toca regar"));
		assertTrue(evento.mensaje().contains("Espada de San Jorge"));
	}

	@Test
	@DisplayName("Debe detectar evento 'RIEGO_EFECTIVO' cuando el riego está vencido (días restantes negativos)")
	void debeDetectarRiegoEfectivoVencido() {
		LocalDate hoy = LocalDate.of(2026, 9, 25);
		// Regada hace 16 días con frecuencia de 14 días -> vencido por 2 días
		LocalDateTime fechaUltimoRiego = hoy.minusDays(16).atTime(8, 0);

		PlantaUsuario planta = new PlantaUsuario(usuarioPrueba, especieSansevieria);
		planta.setFechaUltimoRiego(fechaUltimoRiego);

		EventoRiego evento = schedulerService.evaluarPlanta(planta, hoy);

		assertNotNull(evento);
		assertEquals(TipoEventoRiego.RIEGO_EFECTIVO, evento.tipoEvento());
		assertEquals(-2, evento.diasRestantes());
		assertTrue(evento.mensaje().contains("riego pendiente desde hace 2 día(s)"));
	}

	@Test
	@DisplayName("No debe emitir alerta si faltan más de 2 días para el próximo riego")
	void noDebeEmitirAlertaSiFaltanMuchosDias() {
		LocalDate hoy = LocalDate.of(2026, 9, 25);
		// Regada ayer -> faltan 13 días para el próximo riego
		LocalDateTime fechaUltimoRiego = hoy.minusDays(1).atTime(12, 0);

		PlantaUsuario planta = new PlantaUsuario(usuarioPrueba, especieSansevieria);
		planta.setFechaUltimoRiego(fechaUltimoRiego);

		EventoRiego evento = schedulerService.evaluarPlanta(planta, hoy);

		assertNull(evento, "No debe generar evento si faltan 13 días para el riego");
	}
}
