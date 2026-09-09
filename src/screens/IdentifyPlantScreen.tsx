import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '../context/AuthContext';
import api from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'IdentifyPlant'>;

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

export function IdentifyPlantScreen({ navigation }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [result, setResult] = useState<Identification | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

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
      setErrorMessage(getApiErrorMessage(error, 'No se pudo identificar la especie. Intenta con mejor iluminación.'));
    } finally {
      setIsIdentifying(false);
    }
  };

  if (!permission) return <View style={styles.centered}><ActivityIndicator color="#ffffff" /></View>;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <Text style={styles.permissionTitle}>Activa la cámara</Text>
        <Text style={styles.permissionText}>Necesitamos acceso a tu cámara para reconocer tu planta.</Text>
        <Pressable onPress={() => void requestPermission()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Permitir cámara</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      {result && photoUri ? (
        <SafeAreaView style={styles.resultScreen}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <Text style={styles.resultEyebrow}>PLANTA IDENTIFICADA</Text>
          <Text style={styles.resultTitle}>{result.nombreCientifico}</Text>
          {result.nombreComun ? <Text style={styles.resultCommon}>{result.nombreComun}</Text> : null}
          <Text style={styles.confidence}>Confianza: {Math.round(result.confianza * 100)}%</Text>
          {result.cuidados ? (
            <View style={styles.careRow}>
              <View><Text style={styles.careLabel}>Luz</Text><Text style={styles.careValue}>{result.cuidados.luz ?? 'Pendiente'}</Text></View>
              <View><Text style={styles.careLabel}>Riego</Text><Text style={styles.careValue}>{result.cuidados.riegoCadaDias ? `Cada ${result.cuidados.riegoCadaDias} días` : 'Pendiente'}</Text></View>
            </View>
          ) : <Text style={styles.pendingCare}>Aún no tenemos cuidados para esta especie en el catálogo.</Text>}
          <Pressable onPress={() => { setResult(null); setPhotoUri(null); }} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Tomar otra foto</Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Volver al inicio</Text>
          </Pressable>
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
              <Pressable onPress={() => navigation.goBack()}><Text style={styles.closeButton}>Cerrar</Text></Pressable>
              <Text style={styles.cameraTitle}>Identifica tu planta</Text>
              <View style={styles.topBarSpacer} />
            </View>
            <View style={styles.focusFrame} />
            <View style={styles.bottomPanel}>
              <Text style={styles.cameraHint}>Centra las hojas y busca buena iluminación</Text>
              {errorMessage ? <Text style={styles.cameraError}>{errorMessage}</Text> : null}
              <Pressable disabled={isIdentifying || !isCameraReady} onPress={() => void identify()} style={styles.shutterOuter}>
                {isIdentifying ? <ActivityIndicator color="#2d7655" /> : <View style={styles.shutterInner} />}
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
  topBar: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 14 },
  closeButton: { color: '#ffffff', fontSize: 14 },
  cameraTitle: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  topBarSpacer: { width: 42 },
  focusFrame: { alignSelf: 'center', borderColor: 'rgba(255,255,255,0.9)', borderRadius: 18, borderWidth: 2, height: 250, width: 250 },
  bottomPanel: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.42)', paddingBottom: 25, paddingTop: 16 },
  cameraHint: { color: '#ffffff', fontSize: 13, marginBottom: 14 },
  cameraError: { color: '#ffd1d1', fontSize: 12, marginBottom: 10, textAlign: 'center' },
  shutterOuter: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#b7d7c0', borderRadius: 37, borderWidth: 4, height: 74, justifyContent: 'center', width: 74 },
  shutterInner: { backgroundColor: '#4e8a69', borderRadius: 27, height: 54, width: 54 },
  centered: { alignItems: 'center', backgroundColor: '#16251d', flex: 1, justifyContent: 'center' },
  permissionScreen: { alignItems: 'center', backgroundColor: '#f7faf7', flex: 1, justifyContent: 'center', padding: 32 },
  permissionTitle: { color: '#285c43', fontSize: 26, fontWeight: '700' },
  permissionText: { color: '#718178', fontSize: 15, marginBottom: 24, marginTop: 10, textAlign: 'center' },
  primaryButton: { alignItems: 'center', backgroundColor: '#4e8a69', borderRadius: 4, justifyContent: 'center', marginTop: 22, minHeight: 48, paddingHorizontal: 24, width: '100%' },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  secondaryButton: { alignItems: 'center', marginTop: 14, padding: 10 },
  secondaryButtonText: { color: '#4e8a69', fontSize: 14, fontWeight: '600' },
  resultScreen: { backgroundColor: '#f7faf7', flex: 1, padding: 24 },
  previewImage: { alignSelf: 'center', borderRadius: 12, height: 220, marginBottom: 24, width: '100%' },
  resultEyebrow: { color: '#4e8a69', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  resultTitle: { color: '#285c43', fontSize: 28, fontStyle: 'italic', fontWeight: '700', marginTop: 6 },
  resultCommon: { color: '#718178', fontSize: 15, marginTop: 5 },
  confidence: { color: '#718178', fontSize: 13, marginTop: 14 },
  careRow: { borderTopColor: '#d7e2d9', borderTopWidth: 1, flexDirection: 'row', gap: 45, marginTop: 22, paddingTop: 16 },
  careLabel: { color: '#829188', fontSize: 12 },
  careValue: { color: '#285c43', fontSize: 14, fontWeight: '600', marginTop: 5 },
  pendingCare: { color: '#718178', fontSize: 13, marginTop: 22 },
});