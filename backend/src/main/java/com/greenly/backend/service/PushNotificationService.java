package com.greenly.backend.service;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.greenly.backend.dto.EventoRiego;
import com.greenly.backend.dto.PushNotificationPayload;
import com.greenly.backend.entity.Usuario;

/**
 * Servicio encargado de gestionar y despachar las notificaciones push
 * a los dispositivos de los usuarios.
 *
 * ARQUITECTURA DE INTEGRACIÓN PUSH EN PRODUCCIÓN (FCM / APNs / EXPO):
 * ------------------------------------------------------------------
 * 1. Simulación y Desarrollo (Estado Actual):
 *    - Registra el payload enriquecido de la notificación a través de SLF4J.
 *    - Si el token del usuario es un Expo Push Token ("ExponentPushToken[...]"),
 *      intenta el envío HTTP directo hacia los servidores de Expo (https://exp.host/--/api/v2/push/send).
 *
 * 2. Producción con Firebase Cloud Messaging (FCM v1) para Android nativo:
 *    - Requisitos:
 *      a) Agregar dependencia en pom.xml:
 *         <dependency>
 *             <groupId>com.google.firebase</groupId>
 *             <artifactId>firebase-admin</artifactId>
 *             <version>9.4.0</version>
 *         </dependency>
 *      b) Descargar archivo de credenciales de Google Service Account ('serviceAccountKey.json')
 *         desde la consola de Firebase (Project Settings > Service accounts > Generate new private key).
 *      c) Inicializar FirebaseApp mediante @Configuration:
 *         FirebaseOptions options = FirebaseOptions.builder()
 *             .setCredentials(GoogleCredentials.fromStream(new ClassPathResource("serviceAccountKey.json").getInputStream()))
 *             .build();
 *         FirebaseApp.initializeApp(options);
 *      d) Enviar mensaje con FirebaseMessaging.getInstance().send(Message.builder()...build()).
 *
 * 3. Producción con Apple Push Notification service (APNs) para iOS:
 *    - Generar clave de firma de APNs (.p8) en el portal de desarrolladores de Apple.
 *    - O bien delegar en FCM / Expo Notifications Gateway la entrega a APNs configurando
 *      la clave APNs en el dashboard correspondiente.
 */
@Service
public class PushNotificationService {
	private static final Logger logger = LoggerFactory.getLogger(PushNotificationService.class);
	private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

	private final RestClient restClient;

	public PushNotificationService(RestClient.Builder restClientBuilder) {
		this.restClient = restClientBuilder.build();
	}

	/**
	 * Construye el payload personalizado y despacha la notificación a partir de un EventoRiego.
	 */
	public void sendWateringNotification(Usuario usuario, EventoRiego evento) {
		if (usuario == null || evento == null) {
			logger.warn("[PUSH SERVICE] Intento de envío nulo. Usuario o Evento son null.");
			return;
		}

		String recipientToken = usuario.getPushToken() != null && !usuario.getPushToken().isBlank()
			? usuario.getPushToken()
			: "NO_TOKEN_REGISTERED (Simulación en consola)";

		Map<String, Object> additionalData = new HashMap<>();
		additionalData.put("plantaId", evento.plantaId());
		additionalData.put("tipoEvento", evento.tipoEvento().name());
		additionalData.put("fechaCalculadaRiego", evento.fechaCalculadaRiego().toString());
		additionalData.put("diasRestantes", evento.diasRestantes());

		PushNotificationPayload payload = new PushNotificationPayload(
			recipientToken,
			usuario.getEmail(),
			usuario.getNombre(),
			evento.titulo(),
			evento.mensaje(),
			evento.plantaId(),
			evento.nombrePlanta(),
			evento.tipoEvento(),
			additionalData
		);

		sendPushNotification(payload);
	}

	/**
	 * Despacha la notificación: emite log estructurado y, si existe token de Expo,
	 * realiza la llamada HTTP a la pasarela de Expo.
	 */
	public void sendPushNotification(PushNotificationPayload payload) {
		// Log estructurado de simulación
		logger.info("================================================================================");
		logger.info("📱 [PUSH NOTIFICATION SIMULATION] Notificación Push Preparada para Envío");
		logger.info("   -> Destinatario : {} ({})", payload.recipientName(), payload.recipientEmail());
		logger.info("   -> Push Token   : {}", payload.recipientToken());
		logger.info("   -> Título       : {}", payload.title());
		logger.info("   -> Cuerpo       : {}", payload.body());
		logger.info("   -> Planta       : {} (ID: {})", payload.plantName(), payload.plantId());
		logger.info("   -> Evento       : {}", payload.tipoEvento());
		logger.info("   -> Metadata     : {}", payload.data());
		logger.info("================================================================================");

		// Si el usuario tiene un token válido de Expo ("ExponentPushToken[...]"), intentamos envío HTTP
		if (payload.recipientToken() != null && payload.recipientToken().startsWith("ExponentPushToken")) {
			try {
				Map<String, Object> expoBody = new HashMap<>();
				expoBody.put("to", payload.recipientToken());
				expoBody.put("title", payload.title());
				expoBody.put("body", payload.body());
				expoBody.put("sound", "default");
				expoBody.put("data", payload.data());

				restClient.post()
					.uri(EXPO_PUSH_URL)
					.contentType(MediaType.APPLICATION_JSON)
					.body(expoBody)
					.retrieve()
					.toBodilessEntity();

				logger.info("🚀 [EXPO PUSH SENT] Notificación enviada con éxito a Expo Push Gateway para el token: {}", payload.recipientToken());
			} catch (Exception ex) {
				logger.warn("⚠️ [EXPO PUSH GATEWAY] No se pudo entregar a la pasarela externa de Expo (Normal si es token de prueba): {}", ex.getMessage());
			}
		}
	}
}
