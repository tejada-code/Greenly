import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { getApiErrorMessage } from '../context/AuthContext';
import api from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Inventory'>;

type Plant = {
  id: number;
  nombreCientifico: string;
  nombreComun: string | null;
  luzRecomendada: string | null;
  frecuenciaRiegoBaseDias: number | null;
  nombrePersonalizado: string | null;
};

export function InventoryScreen({ navigation }: Props) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadPlants = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Plant[]>('/plantas');
      setPlants(response.data);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'No se pudo cargar tu inventario.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadPlants(); }, [loadPlants]));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>MI COLECCIÓN</Text>
          <Text style={styles.title}>Mis plantas</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('IdentifyPlant')} style={styles.addButton}>
          <Text style={styles.addText}>+ Añadir</Text>
        </Pressable>
      </View>
      {isLoading ? <ActivityIndicator color="#4e8a69" style={styles.loader} /> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {!isLoading && !errorMessage && plants.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Tu colección está vacía</Text>
          <Text style={styles.emptyText}>Identifica tu primera planta para comenzar.</Text>
        </View>
      ) : null}
      <FlatList
        contentContainerStyle={styles.list}
        data={plants}
        keyExtractor={(plant) => String(plant.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcon}><Text style={styles.leaf}>⌁</Text></View>
            <View style={styles.cardInfo}>
              <Text style={styles.commonName}>{item.nombrePersonalizado || item.nombreComun || item.nombreCientifico}</Text>
              <Text style={styles.scientificName}>{item.nombreCientifico}</Text>
              <Text style={styles.careText}>{item.luzRecomendada ?? 'Luz pendiente'} · {item.frecuenciaRiegoBaseDias ? `Riego cada ${item.frecuenciaRiegoBaseDias} días` : 'Riego pendiente'}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f7faf7', flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 14 },
  eyebrow: { color: '#4e8a69', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: '#285c43', fontSize: 28, fontWeight: '700', marginTop: 5 },
  addButton: { backgroundColor: '#4e8a69', borderRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  addText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  loader: { marginTop: 30 },
  errorText: { color: '#b13e3e', fontSize: 13, padding: 24 },
  emptyState: { alignItems: 'center', paddingHorizontal: 30, paddingTop: 90 },
  emptyTitle: { color: '#285c43', fontSize: 20, fontWeight: '700' },
  emptyText: { color: '#718178', fontSize: 14, marginTop: 8, textAlign: 'center' },
  list: { gap: 12, padding: 24 },
  card: { alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 8, flexDirection: 'row', padding: 16 },
  cardIcon: { alignItems: 'center', backgroundColor: '#e1efe4', borderRadius: 26, height: 52, justifyContent: 'center', width: 52 },
  leaf: { color: '#4e8a69', fontSize: 30 },
  cardInfo: { flex: 1, marginLeft: 14 },
  commonName: { color: '#285c43', fontSize: 16, fontWeight: '700' },
  scientificName: { color: '#718178', fontSize: 13, fontStyle: 'italic', marginTop: 3 },
  careText: { color: '#829188', fontSize: 11, marginTop: 8 },
});