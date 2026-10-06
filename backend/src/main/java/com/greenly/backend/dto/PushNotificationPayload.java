package com.greenly.backend.dto;

import java.util.Map;

/**
 * Representa el payload estructurado para el envío de una notificación push,
 * compatible con Firebase Cloud Messaging (FCM), APNs y Expo Push Service.
 */
public record PushNotificationPayload(
	String recipientToken,
	String recipientEmail,
	String recipientName,
	String title,
	String body,
	Long plantId,
	String plantName,
	TipoEventoRiego tipoEvento,
	Map<String, Object> data
) {}
