import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '../context/AuthContext';
import api from '../services/api';

type Props = {
  navigation?: any;
};

type Identification = {
  nombreCientifico: string;
  nombreComun: string | null;
  familia: string | null;
  confianza: number;
  cuidados: {
    luz: string | null;
    riegoCadaDias: number | null;
    descripcion: string | null;
  } | null;
};

function formatLight(luz?: string | null): string {
  if (!luz) return 'Luz brillante indirecta';
  switch (luz.toUpperCase()) {
    case 'SOL_DIRECTO':
      return 'Sol directo';
    case 'SEMISOMBRA':
      return 'Luz indirecta o semisombra';
    case 'INTERIOR_LUMINOSO':
      return 'Luz brillante indirecta';
    case 'SOMBRA':
      return 'Sombra suave';
    default:
      return luz;
  }
}

function formatWaterFrequency(dias?: number | null): string {
  if (!dias) return 'Riego cada 2–3 semanas';
  if (dias === 1) return 'Riego diario';
  if (dias === 7) return 'Riego cada 1 semana';
  if (dias >= 13 && dias <= 22) return 'Riego cada 2–3 semanas';
  if (dias % 7 === 0) return `Riego cada ${dias / 7} semanas`;
  return `Riego cada ${dias} días`;
}

export function IdentifyPlantScreen({ navigation }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [result, setResult] = useState<Identification | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const identify = async () => {
    if (!cameraRef.current || !isCameraReady || isIdentifying) return;

    setErrorMessage('');
    setIsIdentifying(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) throw new Error('No se pudo capturar la imagen.');

      setPhotoUri(photo.uri);
      const formData = new FormData();
      formData.append('imagen', {
        uri: photo.uri,
        name: 'planta.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);

      const response = await api.post<Identification>('/plantas/identificar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      setResult(response.data);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          'No se pudo identificar la especie. Intenta con mejor iluminación.'
        )
      );
    } finally {
      setIsIdentifying(false);
    }
  };

  const savePlant = async () => {
    if (!result || isSaving) return;

    setErrorMessage('');
    setIsSaving(true);
    try {
      await api.post('/plantas', {
        nombreCientifico: result.nombreCientifico,
        nombreComun: result.nombreComun,
        urlFotoUsuario: photoUri,
        luzRecomendada: result.cuidados?.luz,
        frecuenciaRiegoBaseDias: result.cuidados?.riegoCadaDias,
        descripcion: result.cuidados?.descripcion,
      });

      // Limpiar estados de identificación para que la cámara quede lista al volver
      setResult(null);
      setPhotoUri(null);

      // Redirigir de inmediato a la colección en el tab "Mis plantas"
      if (navigation?.navigate) {
        navigation.navigate('Mis plantas');
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'No se pudo guardar la planta en tu inventario.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <Text style={styles.permissionTitle}>Activa la cámara</Text>
        <Text style={styles.permissionText}>
          Necesitamos acceso a tu cámara para reconocer tu planta.
        </Text>
        <Pressable onPress={() => void requestPermission()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Permitir cámara</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      {result && photoUri ? (
        <SafeAreaView style={styles.resultSafe}>
          <ScrollView
            contentContainerStyle={styles.resultScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Foto tomada */}
            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />

            {/* Tarjeta con los datos exactos del inventario */}
            <View style={styles.resultCard}>
              <Text style={styles.resultEyebrow}>PLANTA IDENTIFICADA</Text>
              <Text style={styles.resultTitle}>
                {result.nombreComun || result.nombreCientifico}
              </Text>
              <Text style={styles.resultScientific}>{result.nombreCientifico}</Text>

              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  Confianza: {Math.round(result.confianza * 100)}%
                </Text>
              </View>

              {/* Viñetas idénticas a la colección */}
              <View style={styles.careContainer}>
                {/* 💧 Riego */}
                <View style={styles.careItem}>
                  <Text style={styles.careEmoji}>💧</Text>
                  <Text style={styles.careText}>
                    {formatWaterFrequency(result.cuidados?.riegoCadaDias)}
                  </Text>
                </View>

                {/* ☀️ Luz */}
                <View style={styles.careItem}>
                  <Text style={styles.careEmoji}>☀️</Text>
                  <Text style={styles.careText}>{formatLight(result.cuidados?.luz)}</Text>
                </View>

                {/* 🌿 Cuidados / Descripción */}
                <View style={styles.careItem}>
                  <Text style={styles.careEmoji}>🌿</Text>
                  <Text style={styles.careText}>
                    {result.cuidados?.descripcion ||
                      'Planta resistente y de bajo mantenimiento. Apta para interiores y exteriores.'}
                  </Text>
                </View>
              </View>
            </View>

            {errorMessage ? <Text style={styles.resultError}>{errorMessage}</Text> : null}

            {/* Botones de acción */}
            <Pressable
              disabled={isSaving}
              onPress={() => void savePlant()}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.buttonContentRow}>
                  <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
                  <Text style={styles.primaryButtonText}>Guardar en mi inventario</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setResult(null);
                setPhotoUri(null);
              }}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            >
              <View style={styles.buttonContentRow}>
                <Ionicons name="camera-reverse-outline" size={19} color="#285c43" />
                <Text style={styles.secondaryButtonText}>Tomar otra foto</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                setResult(null);
                setPhotoUri(null);
                navigation?.navigate?.('Mis plantas');
              }}
              style={styles.tertiaryButton}
            >
              <Text style={styles.tertiaryButtonText}>Volver a mis plantas</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      ) : (
        <>
          <CameraView
            ref={cameraRef}
            facing="back"
            onCameraReady={() => setIsCameraReady(true)}
            style={styles.camera}
          />
          <SafeAreaView style={styles.cameraOverlay}>
            <View style={styles.topBar}>
              <Pressable onPress={() => navigation?.goBack?.()}>
                <Text style={styles.closeButton}>Cerrar</Text>
              </Pressable>
              <Text style={styles.cameraTitle}>Identifica tu planta</Text>
              <View style={styles.topBarSpacer} />
            </View>
            <View style={styles.focusFrame} />
            <View style={styles.bottomPanel}>
              <Text style={styles.cameraHint}>Centra las hojas y busca buena iluminación</Text>
              {errorMessage ? <Text style={styles.cameraError}>{errorMessage}</Text> : null}
              <Pressable
                disabled={isIdentifying || !isCameraReady}
                onPress={() => void identify()}
                style={styles.shutterOuter}
              >
                {isIdentifying ? (
                  <ActivityIndicator color="#2d7655" />
                ) : (
                  <View style={styles.shutterInner} />
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#16251d', flex: 1 },
  camera: { flex: 1 },
  cameraOverlay: { ...StyleSheet.absoluteFill, justifyContent: 'space-between' },
  topBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  closeButton: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  cameraTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  topBarSpacer: { width: 42 },
  focusFrame: {
    alignSelf: 'center',
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    borderWidth: 2,
    height: 250,
    width: 250,
  },
  bottomPanel: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    paddingBottom: 25,
    paddingTop: 16,
  },
  cameraHint: { color: '#ffffff', fontSize: 13, marginBottom: 14 },
  cameraError: { color: '#ffd1d1', fontSize: 12, marginBottom: 10, textAlign: 'center' },
  shutterOuter: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#b7d7c0',
    borderRadius: 37,
    borderWidth: 4,
    height: 74,
    justifyContent: 'center',
    width: 74,
  },
  shutterInner: { backgroundColor: '#4e8a69', borderRadius: 27, height: 54, width: 54 },
  centered: { alignItems: 'center', backgroundColor: '#16251d', flex: 1, justifyContent: 'center' },
  permissionScreen: {
    alignItems: 'center',
    backgroundColor: '#f7faf7',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  permissionTitle: { color: '#285c43', fontSize: 26, fontWeight: '700' },
  permissionText: {
    color: '#718178',
    fontSize: 15,
    marginBottom: 24,
    marginTop: 10,
    textAlign: 'center',
  },
  resultSafe: {
    backgroundColor: '#f5f6f8',
    flex: 1,
  },
  resultScroll: {
    padding: 20,
    paddingBottom: 36,
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  resultEyebrow: {
    color: '#4e8a69',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  resultTitle: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '800',
  },
  resultScientific: {
    color: '#6b7280',
    fontSize: 15,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 10,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  confidenceText: {
    color: '#2e7d32',
    fontSize: 12,
    fontWeight: '700',
  },
  careContainer: {
    borderTopColor: '#e5e7eb',
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 12,
  },
  careItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  careEmoji: {
    fontSize: 15,
    marginRight: 10,
    marginTop: 1,
  },
  careText: {
    color: '#374151',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  resultError: {
    color: '#b13e3e',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#4e8a69',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 8,
    height: 52,
    paddingHorizontal: 20,
    width: '100%',
    shadowColor: '#4e8a69',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#e5eee7',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 12,
    height: 48,
    width: '100%',
  },
  secondaryButtonText: {
    color: '#285c43',
    fontSize: 14,
    fontWeight: '700',
  },
  tertiaryButton: {
    alignItems: 'center',
    marginTop: 14,
    padding: 8,
  },
  tertiaryButtonText: {
    color: '#718178',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});