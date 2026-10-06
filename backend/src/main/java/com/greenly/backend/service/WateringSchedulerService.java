package com.greenly.backend.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.greenly.backend.dto.EventoRiego;
import com.greenly.backend.dto.TipoEventoRiego;
import com.greenly.backend.entity.EspecieCatalogo;
import com.greenly.backend.entity.PlantaUsuario;
import com.greenly.backend.entity.Usuario;
import com.greenly.backend.repository.PlantaUsuarioRepository;

@Service
public class WateringSchedulerService {
	private static final Logger logger = LoggerFactory.getLogger(WateringSchedulerService.class);
	private final PlantaUsuarioRepository plantaUsuarioRepository;
	private final PushNotificationService pushNotificationService;

	public WateringSchedulerService(
		PlantaUsuarioRepository plantaUsuarioRepository,
		PushNotificationService pushNotificationService
	) {
		this.plantaUsuarioRepository = plantaUsuarioRepository;
		this.pushNotificationService = pushNotificationService;
	}

	/**
	 * Tarea programada (Cron Job) que se ejecuta diariamente (por defecto 08:00 AM).
	 * Consulta la base de datos MySQL, calcula las fechas de riego y emite alertas.
	 */
	@Scheduled(cron = "${app.watering.cron:0 0 8 * * *}")
	@Transactional(readOnly = true)
	public void ejecutarVerificacionProgramada() {
		ejecutarVerificacionParaFecha(LocalDate.now());
	}

	/**
	 * Ejecuta la verificación para una fecha dada y despacha las notificaciones push.
	 */
	@Transactional(readOnly = true)
	public List<EventoRiego> ejecutarVerificacionParaFecha(LocalDate fechaReferencia) {
		logger.info("=== [CRON MOTOR DE RIEGOS] Iniciando verificación de riegos para la fecha: {} ===", fechaReferencia);

		List<PlantaUsuario> plantas = plantaUsuarioRepository.findAllWithUsuarioAndEspecie();
		List<EventoRiego> eventos = new ArrayList<>();

		for (PlantaUsuario planta : plantas) {
			EventoRiego evento = evaluarPlanta(planta, fechaReferencia);
			if (evento != null) {
				eventos.add(evento);
				// Despacho de la notificación push personalizada
				pushNotificationService.sendWateringNotification(planta.getUsuario(), evento);
			}
		}

		logger.info("[CRON MOTOR DE RIEGOS] Verificación finalizada. Se detectaron y procesaron {} evento(s) de riego.", eventos.size());
		return eventos;
	}

	/**
	 * Evalúa el inventario completo de plantas registradas contra una fecha de referencia.
	 * Determina los eventos de "Día de revisión de tierra" y "Día de riego efectivo".
	 */
	@Transactional(readOnly = true)
	public List<EventoRiego> evaluarEventosRiego(LocalDate fechaReferencia) {
		List<PlantaUsuario> plantas = plantaUsuarioRepository.findAllWithUsuarioAndEspecie();
		List<EventoRiego> eventosDetectados = new ArrayList<>();

		for (PlantaUsuario planta : plantas) {
			EventoRiego evento = evaluarPlanta(planta, fechaReferencia);
			if (evento != null) {
				eventosDetectados.add(evento);
			}
		}

		return eventosDetectados;
	}

	/**
	 * Evalúa únicamente las plantas de un usuario en particular.
	 */
	@Transactional(readOnly = true)
	public List<EventoRiego> evaluarEventosParaUsuario(String email, LocalDate fechaReferencia) {
		List<PlantaUsuario> plantas = plantaUsuarioRepository.findAllWithUsuarioAndEspecie();
		List<EventoRiego> eventosUsuario = new ArrayList<>();

		for (PlantaUsuario planta : plantas) {
			if (planta.getUsuario().getEmail().equalsIgnoreCase(email)) {
				EventoRiego evento = evaluarPlanta(planta, fechaReferencia);
				if (evento != null) {
					eventosUsuario.add(evento);
				}
			}
		}

		return eventosUsuario;
	}

	/**
	 * Evalúa una planta individual: calcula la fecha del próximo riego
	 * basándose en fecha_ultimo_riego + frecuencia_riego_base_dias.
	 */
	public EventoRiego evaluarPlanta(PlantaUsuario planta, LocalDate fechaReferencia) {
		Usuario usuario = planta.getUsuario();
		EspecieCatalogo especie = planta.getEspecie();

		// 1. Determinar fecha base: fecha_ultimo_riego (actualizada en Bloque 2) o fechaRegistro
		LocalDate fechaBase = planta.getFechaUltimoRiego() != null
			? planta.getFechaUltimoRiego().toLocalDate()
			: (planta.getFechaRegistro() != null ? planta.getFechaRegistro().toLocalDate() : fechaReferencia);

		// 2. Frecuencia de riego en días (del catálogo de especies)
		int frecuenciaDias = (especie != null && especie.getFrecuenciaRiegoBaseDias() != null && especie.getFrecuenciaRiegoBaseDias() > 0)
			? especie.getFrecuenciaRiegoBaseDias()
			: 7;

		// 3. Cálculo de la fecha exacta del próximo riego
		LocalDate proximoRiego = fechaBase.plusDays(frecuenciaDias);

		// 4. Días restantes respecto a la fecha actual/referencia
		long diasRestantes = ChronoUnit.DAYS.between(fechaReferencia, proximoRiego);

		// 5. Nombre amigable de la planta
		String nombrePlanta = planta.getNombrePersonalizado() != null && !planta.getNombrePersonalizado().isBlank()
			? planta.getNombrePersonalizado()
			: (especie != null && especie.getNombreComun() != null && !especie.getNombreComun().isBlank()
				? especie.getNombreComun()
				: (especie != null ? especie.getNombreCientifico() : "tu planta"));

		// 6. Detección de Evento 1: "Día de revisión de tierra" (exactamente 2 días antes)
		if (diasRestantes == 2) {
			return new EventoRiego(
				planta.getId(),
				usuario.getId(),
				usuario.getEmail(),
				usuario.getNombre(),
				nombrePlanta,
				TipoEventoRiego.REVISION_TIERRA,
				proximoRiego,
				diasRestantes,
				"🌱 Revisión de tierra",
				"Es momento de revisar la tierra de tu " + nombrePlanta + ". Comprueba si el sustrato se está secando antes del próximo riego."
			);
		}

		// 7. Detección de Evento 2: "Día de riego efectivo" (hoy o vencido)
		if (diasRestantes <= 0) {
			String mensaje = diasRestantes == 0
				? "¡Hoy toca regar tu " + nombrePlanta + "! Dale el agua que necesita para mantenerse sana y vigorosa."
				: "Tu " + nombrePlanta + " tiene su riego pendiente desde hace " + Math.abs(diasRestantes) + " día(s).";

			return new EventoRiego(
				planta.getId(),
				usuario.getId(),
				usuario.getEmail(),
				usuario.getNombre(),
				nombrePlanta,
				TipoEventoRiego.RIEGO_EFECTIVO,
				proximoRiego,
				diasRestantes,
				"💧 Día de riego",
				mensaje
			);
		}

		// No requiere notificación hoy
		return null;
	}
}
