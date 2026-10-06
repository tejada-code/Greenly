import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import api from './api';

// Determina si la aplicación se está ejecutando dentro de Expo Go
export const isRunningInExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Configuración global del comportamiento de notificaciones en primer plano (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const REMINDERS_CHANNEL_ID = 'greenly-reminders';

/**
 * Configura los canales de notificación necesarios en Android (Oreo 8.0 o superior).
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL_ID, {
      name: 'Recordatorios de Riego Greenly',
      description: 'Alertas oportunas para la revisión de tierra y riego efectivo de tus plantas',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2D6A4F',
      sound: 'default',
    });
  }
}

/**
 * Solicita permisos al sistema operativo y obtiene el token de notificaciones push.
 * Si estamos en Expo Go en Android (SDK 53+), evita la llamada a getExpoPushTokenAsync
 * para prevenir la excepción del motor nativo, utilizando el modo de alerta local.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  try {
    await setupNotificationChannels();

    // 1. Verificar estado actual de permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 2. Solicitar permiso al usuario si aún no está otorgado
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ [PUSH NOTIFICATIONS] Permiso denegado por el usuario en el sistema operativo.');
      return null;
    }

    // 3. Si se ejecuta en Expo Go en Android, omitir getExpoPushTokenAsync
    // (Desde SDK 53, Expo Go no incluye código nativo de FCM para reducir peso del APK).
    if (isRunningInExpoGo && Platform.OS === 'android') {
      console.log(
        'ℹ️ [EXPO GO ANDROID] Modo Expo Go detectado. Las alertas locales de riego quedan habilitadas al 100% para pruebas en desarrollo.'
      );
      token = 'ExpoGo-LocalMode-Token';
      try {
        await api.put('/usuarios/push-token', { pushToken: token });
      } catch {
        // Ignorar si aún no hay sesión activa
      }
      return token;
    }

    // 4. En Development Build o Standalone APK/iOS: obtener el Push Token remoto
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      const pushTokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      token = pushTokenData.data;
      console.log('📱 [EXPO PUSH TOKEN]', token);

      // Enviar el token al backend (Spring Boot PUT /api/usuarios/push-token)
      await api.put('/usuarios/push-token', { pushToken: token });
      console.log('✅ [BACKEND SYNC] Push token registrado exitosamente en el servidor.');
    } catch (tokenErr) {
      console.log('ℹ️ [PUSH TOKEN INFO] Modo de alertas locales activo:', tokenErr);
    }
  } catch (error) {
    console.error('❌ Error configurando notificaciones push:', error);
  }

  return token;
}

/**
 * Despacha una notificación local inmediata en el dispositivo.
 * Útil para pruebas instantáneas en desarrollo, emuladores y Expo Go sin depender de servicios en la nube.
 */
export async function triggerLocalWateringAlert(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string> {
  await setupNotificationChannels();
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || { source: 'greenly-test' },
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: REMINDERS_CHANNEL_ID } : {}),
    },
    trigger: null, // Envío inmediato
  });
}

/**
 * Suscribe listeners para capturar notificaciones entrantes en foreground y cuando el usuario hace tap en la barra de estado.
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
): () => void {
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('🔔 [NOTIFICACIÓN EN PRIMER PLANO]:', notification.request.content.title);
    onNotificationReceived?.(notification);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('👆 [INTERACCIÓN DEL USUARIO CON NOTIFICACIÓN]:', response.notification.request.content.data);
    onNotificationResponse?.(response);
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
