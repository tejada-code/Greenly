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

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

import java.util.List;

class WateringSchedulerServiceTest {

	private PlantaUsuarioRepository plantaUsuarioRepository;
	private PushNotificationService pushNotificationService;
	private WateringSchedulerService schedulerService;
	private Usuario usuarioPrueba;
	private EspecieCatalogo especieSansevieria;

	@BeforeEach
	void setUp() {
		plantaUsuarioRepository = mock(PlantaUsuarioRepository.class);
		pushNotificationService = mock(PushNotificationService.class);
		schedulerService = new WateringSchedulerService(plantaUsuarioRepository, pushNotificationService);

		usuarioPrueba = new Usuario("maria@greenly.com", "password123", "Maria Lopez");
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

	@Test
	@DisplayName("Debe disparar el servicio de notificación push cuando se detecta un evento en la verificación")
	void debeDispararNotificacionPushAlDetectarEvento() {
		LocalDate hoy = LocalDate.of(2026, 9, 25);
		LocalDateTime fechaUltimoRiego = hoy.minusDays(14).atTime(9, 0);

		PlantaUsuario planta = new PlantaUsuario(usuarioPrueba, especieSansevieria);
		planta.setFechaUltimoRiego(fechaUltimoRiego);

		when(plantaUsuarioRepository.findAllWithUsuarioAndEspecie()).thenReturn(List.of(planta));

		List<EventoRiego> eventos = schedulerService.ejecutarVerificacionParaFecha(hoy);

		assertEquals(1, eventos.size());
		verify(pushNotificationService, times(1)).sendWateringNotification(eq(usuarioPrueba), any(EventoRiego.class));
	}

	@Test
	@DisplayName("Debe evaluar múltiples eventos para un usuario detectando simultáneamente RIEGO_EFECTIVO y REVISION_TIERRA")
	void debeEvaluarMultiplesPlantasParaUsuario() {
		LocalDate hoy = LocalDate.of(2026, 9, 25);

		// Planta 1: Frecuencia 1 día, regada ayer -> hoy toca regar (RIEGO_EFECTIVO)
		EspecieCatalogo menta = new EspecieCatalogo("Mentha spicata", "Hierbabuena", EspecieCatalogo.LuzRecomendada.SEMISOMBRA, 1, "Aromática");
		PlantaUsuario p1 = new PlantaUsuario(usuarioPrueba, menta);
		p1.setNombrePersonalizado("Hierbabuena Express");
		p1.setFechaUltimoRiego(hoy.minusDays(1).atTime(8, 0));

		// Planta 2: Frecuencia 5 días, regada hace 3 días -> faltan 2 días (REVISION_TIERRA)
		EspecieCatalogo sansevieria5dias = new EspecieCatalogo("Dracaena trifasciata", "Sansevieria Test", EspecieCatalogo.LuzRecomendada.INTERIOR_LUMINOSO, 5, "Resistente");
		PlantaUsuario p2 = new PlantaUsuario(usuarioPrueba, sansevieria5dias);
		p2.setNombrePersonalizado("Sansevieria Test");
		p2.setFechaUltimoRiego(hoy.minusDays(3).atTime(9, 0));

		when(plantaUsuarioRepository.findAllWithUsuarioAndEspecie()).thenReturn(List.of(p1, p2));

		List<EventoRiego> eventos = schedulerService.evaluarEventosParaUsuario("maria@greenly.com", hoy);

		assertEquals(2, eventos.size());
		assertTrue(eventos.stream().anyMatch(e -> e.tipoEvento() == TipoEventoRiego.RIEGO_EFECTIVO));
		assertTrue(eventos.stream().anyMatch(e -> e.tipoEvento() == TipoEventoRiego.REVISION_TIERRA));
	}
}
