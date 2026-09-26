import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiErrorMessage, useAuth } from '../context/AuthContext';
import api from '../services/api';

type Props = {
  navigation: any;
};

export type Plant = {
  id: number;
  nombreCientifico: string;
  nombreComun: string | null;
  luzRecomendada: string | null;
  frecuenciaRiegoBaseDias: number | null;
  descripcion: string | null;
  nombrePersonalizado: string | null;
  urlFotoUsuario: string | null;
  fechaAdquisicion: string | null;
  fechaRegistro: string;
  fechaUltimoRiego: string | null;
};

export type WateringEvent = {
  plantaId: number;
  nombrePlanta: string;
  tipoEvento: 'REVISION_TIERRA' | 'RIEGO_EFECTIVO';
  diasRestantes: number;
  titulo: string;
  mensaje: string;
};

const DEFAULT_PLANT_IMAGES: Record<string, string> = {
  'aloe vera': 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=800&q=80',
  'aloe barbadensis': 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=800&q=80',
  'sansevieria': 'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?w=800&q=80',
  'dracaena trifasciata': 'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?w=800&q=80',
  'monstera': 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&q=80',
  'monstera deliciosa': 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&q=80',
  'default': 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80',
};

function getPlantImageUrl(plant: Plant): string {
  if (plant.urlFotoUsuario && plant.urlFotoUsuario.trim()) {
    return plant.urlFotoUsuario;
  }
  const scientific = (plant.nombreCientifico || '').toLowerCase();
  const common = (plant.nombreComun || '').toLowerCase();
  const personal = (plant.nombrePersonalizado || '').toLowerCase();

  for (const [key, url] of Object.entries(DEFAULT_PLANT_IMAGES)) {
    if (scientific.includes(key) || common.includes(key) || personal.includes(key)) {
      return url;
    }
  }
  return DEFAULT_PLANT_IMAGES.default;
}

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

function getWateringStatus(fechaUltimoRiego?: string | null): { label: string; isRecent: boolean } {
  if (!fechaUltimoRiego) {
    return { label: 'Sin registrar', isRecent: false };
  }
  const lastDate = new Date(fechaUltimoRiego);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { label: 'Regada hoy', isRecent: true };
  } else if (diffDays === 1) {
    return { label: 'Regada ayer', isRecent: true };
  } else {
    return { label: `Regada hace ${diffDays} días`, isRecent: diffDays <= 2 };
  }
}

export function InventoryScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wateringEvents, setWateringEvents] = useState<WateringEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [wateringId, setWateringId] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  const CARD_WIDTH = Math.min(screenWidth * 0.74, 300);
  const CARD_GAP = 16;
  const FLATLIST_SNAP = CARD_WIDTH + CARD_GAP;

  const loadPlants = useCallback(async () => {
    setIsLoading(true);
    try {
      const [plantsRes, eventsRes] = await Promise.all([
        api.get<Plant[]>('/plantas'),
        api.get<WateringEvent[]>('/plantas/eventos-riego').catch(() => ({ data: [] })),
      ]);
      setPlants(plantsRes.data);
      setWateringEvents(eventsRes.data || []);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'No se pudo cargar tu inventario.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPlants();
    }, [loadPlants])
  );

  const handleWaterPlant = async (plantId: number) => {
    setWateringId(plantId);
    try {
      const response = await api.put<Plant>(`/plantas/${plantId}/regar`);
      const updatedPlant = response.data;
      setPlants((prev) =>
        prev.map((item) => (item.id === plantId ? { ...item, ...updatedPlant } : item))
      );
      setWateringEvents((prev) => prev.filter((e) => e.plantaId !== plantId));
      if (selectedPlant && selectedPlant.id === plantId) {
        setSelectedPlant((prev) => (prev ? { ...prev, ...updatedPlant } : null));
      }
      setFeedbackMessage('¡Planta regada! Se ha reiniciado el contador 🌱💧');
      setTimeout(() => setFeedbackMessage(''), 3500);
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error, 'No se pudo registrar el riego.'));
    } finally {
      setWateringId(null);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollX / FLATLIST_SNAP);
    if (index >= 0 && index < plants.length) {
      setActiveIndex(index);
    }
  };

  const handleDeletePlant = (plant: Plant) => {
    Alert.alert(
      'Eliminar planta',
      `¿Deseas eliminar "${plant.nombrePersonalizado || plant.nombreComun || plant.nombreCientifico}" de tu colección?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/plantas/${plant.id}`);
              setPlants((prev) => prev.filter((p) => p.id !== plant.id));
              if (selectedPlant?.id === plant.id) {
                setSelectedPlant(null);
              }
              setFeedbackMessage('Planta eliminada de tu colección.');
              setTimeout(() => setFeedbackMessage(''), 3500);
            } catch (error) {
              Alert.alert('Error', getApiErrorMessage(error, 'No se pudo eliminar la planta.'));
            }
          },
        },
      ]
    );
  };

  const handleCardOptions = (plant: Plant) => {
    Alert.alert(
      plant.nombrePersonalizado || plant.nombreComun || plant.nombreCientifico,
      'Opciones de planta',
      [
        {
          text: '💧 Marcar como regada',
          onPress: () => void handleWaterPlant(plant.id),
        },
        {
          text: '🔍 Ver detalles',
          onPress: () => setSelectedPlant(plant),
        },
        {
          text: '🗑️ Borrar de mi inventario',
          style: 'destructive',
          onPress: () => handleDeletePlant(plant),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Row with Greenly Brand & Avatar */}
        <View style={styles.topHeader}>
          <View style={styles.logoRow}>
            <Ionicons name="leaf" size={26} color="#184a2c" style={styles.leafIcon} />
            <Text style={styles.brandGreen}>green</Text>
            <Text style={styles.brandLy}>ly</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {(user?.nombre?.[0] || 'G').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Section Title Row: "Mis plantas" + Plus Button */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.mainTitle}>Mis plantas</Text>
            <Text style={styles.subtitle}>Tu colección, siempre contigo</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Añadir nueva planta"
            onPress={() => navigation.navigate('Identificar')}
            style={({ pressed }) => [styles.plusButton, pressed && styles.plusButtonPressed]}
          >
            <Ionicons name="add" size={28} color="#ffffff" />
          </Pressable>
        </View>

        {/* Recordatorios de riego calculados dinámicamente por el motor */}
        {wateringEvents.length > 0 ? (
          <View style={styles.reminderBanner}>
            <View style={styles.reminderHeader}>
              <Ionicons name="notifications" size={17} color="#c25e00" />
              <Text style={styles.reminderHeaderTitle}>
                Recordatorios de hoy ({wateringEvents.length})
              </Text>
            </View>
            {wateringEvents.map((evt, idx) => (
              <View key={idx} style={styles.reminderItem}>
                <View style={styles.reminderTextCol}>
                  <Text style={styles.reminderTitleText}>
                    {evt.tipoEvento === 'REVISION_TIERRA' ? '🌱' : '💧'} {evt.titulo}
                  </Text>
                  <Text style={styles.reminderMessageText}>{evt.mensaje}</Text>
                </View>
                {evt.tipoEvento === 'RIEGO_EFECTIVO' ? (
                  <Pressable
                    disabled={wateringId === evt.plantaId}
                    onPress={() => void handleWaterPlant(evt.plantaId)}
                    style={styles.reminderWaterButton}
                  >
                    <Text style={styles.reminderWaterText}>Regar</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Feedback Alert if watering action just succeeded */}
        {feedbackMessage ? (
          <View style={styles.feedbackBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#2e7d32" />
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        ) : null}

        {/* Loader or Error */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color="#4e8a69" size="large" />
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={() => void loadPlants()} style={styles.retryButton}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Empty State */}
        {!isLoading && !errorMessage && plants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={54} color="#8db89d" />
            <Text style={styles.emptyTitle}>Tu colección está vacía</Text>
            <Text style={styles.emptyText}>
              Empieza identificando tu primera planta para organizar sus cuidados y riegos.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Identificar')}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>Identificar planta</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Horizontal FlatList Cards */}
        {!isLoading && plants.length > 0 ? (
          <View style={styles.carouselContainer}>
            <FlatList
              data={plants}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={FLATLIST_SNAP}
              decelerationRate="fast"
              snapToAlignment="center"
              contentContainerStyle={[
                styles.carouselList,
                { paddingHorizontal: (screenWidth - CARD_WIDTH) / 2 },
              ]}
              keyExtractor={(item) => String(item.id)}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              renderItem={({ item }) => {
                const wateringStatus = getWateringStatus(item.fechaUltimoRiego);
                const isWateringThis = wateringId === item.id;

                return (
                  <View style={[styles.card, { width: CARD_WIDTH }]}>
                    {/* Plant Photo */}
                    <View style={styles.imageWrapper}>
                      <Image
                        source={{ uri: getPlantImageUrl(item) }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                      {/* 3-dots Overflow Menu Button */}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Opciones de planta"
                        onPress={() => handleCardOptions(item)}
                        style={styles.dotsMenuButton}
                        hitSlop={8}
                      >
                        <Ionicons name="ellipsis-vertical" size={18} color="#2b3e4a" />
                      </Pressable>
                    </View>

                    {/* Card Body */}
                    <View style={styles.cardBody}>
                      <Text numberOfLines={1} style={styles.cardCommonName}>
                        {item.nombrePersonalizado || item.nombreComun || item.nombreCientifico}
                      </Text>
                      <Text numberOfLines={1} style={styles.cardScientificName}>
                        {item.nombreCientifico}
                      </Text>

                      {/* Bullet 1: Riego */}
                      <View style={styles.bulletRow}>
                        <Text style={styles.bulletEmoji}>💧</Text>
                        <View style={styles.bulletTextContainer}>
                          <Text style={styles.bulletMainText}>
                            {formatWaterFrequency(item.frecuenciaRiegoBaseDias)}
                          </Text>
                          <Text style={styles.bulletSubText}>
                            {wateringStatus.label}
                          </Text>
                        </View>
                      </View>

                      {/* Bullet 2: Luz */}
                      <View style={styles.bulletRow}>
                        <Text style={styles.bulletEmoji}>☀️</Text>
                        <Text style={styles.bulletText}>
                          {formatLight(item.luzRecomendada)}
                        </Text>
                      </View>

                      {/* Bullet 3: Descripción / Tipo */}
                      <View style={styles.bulletRow}>
                        <Text style={styles.bulletEmoji}>🌿</Text>
                        <Text numberOfLines={2} style={styles.bulletText}>
                          {item.descripcion || 'Planta resistente y de bajo mantenimiento'}
                        </Text>
                      </View>

                      {/* Buttons */}
                      <Pressable
                        onPress={() => setSelectedPlant(item)}
                        style={({ pressed }) => [
                          styles.detailsButton,
                          pressed && styles.detailsButtonPressed,
                        ]}
                      >
                        <Text style={styles.detailsButtonText}>Ver detalles &gt;</Text>
                      </Pressable>

                      {/* Action Button: Marcar como regada */}
                      <Pressable
                        disabled={isWateringThis}
                        onPress={() => void handleWaterPlant(item.id)}
                        style={({ pressed }) => [
                          styles.waterButton,
                          pressed && styles.waterButtonPressed,
                        ]}
                      >
                        {isWateringThis ? (
                          <ActivityIndicator size="small" color="#285c43" />
                        ) : (
                          <View style={styles.waterButtonContent}>
                            <Ionicons name="water" size={15} color="#285c43" />
                            <Text style={styles.waterButtonText}>Marcar como regada</Text>
                          </View>
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              }}
            />

            {/* Pagination Dots Indicator */}
            <View style={styles.dotsRow}>
              {plants.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === activeIndex ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>

            {/* Counter Text */}
            <Text style={styles.countText}>
              {plants.length} {plants.length === 1 ? 'planta registrada' : 'plantas registradas'}
            </Text>
          </View>
        ) : null}

        {/* Bottom Banner Card: "Las plantas hacen la vida más bonita" */}
        <View style={styles.bottomBanner}>
          <View style={styles.bannerIconSquare}>
            <MaterialCommunityIcons name="flower-tulip-outline" size={26} color="#184a2c" />
          </View>
          <Text style={styles.bannerText}>
            Las plantas hacen{'\n'}la vida más bonita
          </Text>
        </View>
      </ScrollView>

      {/* Plant Detail Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={selectedPlant !== null}
        onRequestClose={() => setSelectedPlant(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPlant ? (
              <>
                <View style={styles.modalHeader}>
                  <Text numberOfLines={1} style={styles.modalTitle}>
                    {selectedPlant.nombrePersonalizado ||
                      selectedPlant.nombreComun ||
                      selectedPlant.nombreCientifico}
                  </Text>
                  <View style={styles.modalHeaderActions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Eliminar planta"
                      hitSlop={10}
                      onPress={() => handleDeletePlant(selectedPlant)}
                      style={styles.modalDeleteButton}
                    >
                      <Ionicons name="trash-outline" size={22} color="#dc2626" />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Cerrar modal"
                      hitSlop={10}
                      onPress={() => setSelectedPlant(null)}
                      style={styles.modalCloseButton}
                    >
                      <Ionicons name="close" size={24} color="#111827" />
                    </Pressable>
                  </View>
                </View>

                <Image
                  source={{ uri: getPlantImageUrl(selectedPlant) }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />

                <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                  <Text style={styles.modalScientificName}>
                    {selectedPlant.nombreCientifico}
                  </Text>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>💧 Pautas de Riego</Text>
                    <Text style={styles.modalSectionText}>
                      Frecuencia base: {formatWaterFrequency(selectedPlant.frecuenciaRiegoBaseDias)}.
                    </Text>
                    <Text style={styles.modalSectionSubtext}>
                      Estado actual: {getWateringStatus(selectedPlant.fechaUltimoRiego).label}.
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>☀️ Exposición solar</Text>
                    <Text style={styles.modalSectionText}>
                      {formatLight(selectedPlant.luzRecomendada)}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>🌿 Descripción botánica</Text>
                    <Text style={styles.modalSectionText}>
                      {selectedPlant.descripcion ||
                        'Especie resistente y adaptable, ideal para espacios luminosos interiores y exteriores.'}
                    </Text>
                  </View>
                </ScrollView>

                <Pressable
                  disabled={wateringId === selectedPlant.id}
                  onPress={() => void handleWaterPlant(selectedPlant.id)}
                  style={styles.modalWaterButton}
                >
                  {wateringId === selectedPlant.id ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="water" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.modalWaterButtonText}>Marcar como regada ahora</Text>
                    </>
                  )}
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f5f6f8',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 6,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leafIcon: {
    marginRight: 4,
    transform: [{ rotate: '-10deg' }],
  },
  brandGreen: {
    color: '#184a2c',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandLy: {
    color: '#7cb342',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#528148',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 18,
    marginBottom: 16,
  },
  mainTitle: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '400',
  },
  plusButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#529657',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#529657',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  plusButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  reminderBanner: {
    backgroundColor: '#fff8f0',
    borderColor: '#fed7aa',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 24,
    marginBottom: 14,
    gap: 10,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reminderHeaderTitle: {
    color: '#9a3412',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ffedd5',
    gap: 8,
  },
  reminderTextCol: {
    flex: 1,
  },
  reminderTitleText: {
    color: '#1c1917',
    fontSize: 13,
    fontWeight: '700',
  },
  reminderMessageText: {
    color: '#78350f',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  reminderWaterButton: {
    backgroundColor: '#ea580c',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reminderWaterText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderColor: '#c8e6c9',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 24,
    marginBottom: 14,
    gap: 8,
  },
  feedbackText: {
    color: '#2e7d32',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    color: '#b13e3e',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#4e8a69',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#1a2e22',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 14,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#529657',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 20,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  carouselContainer: {
    marginTop: 6,
  },
  carouselList: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#e5eee7',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  dotsMenuButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  cardBody: {
    padding: 16,
  },
  cardCommonName: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  cardScientificName: {
    color: '#9ca3af',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletEmoji: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 1,
  },
  bulletTextContainer: {
    flex: 1,
  },
  bulletMainText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  bulletSubText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  bulletText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '400',
    flex: 1,
    lineHeight: 17,
  },
  detailsButton: {
    backgroundColor: '#e5eff6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  detailsButtonPressed: {
    backgroundColor: '#d8e7f1',
  },
  detailsButtonText: {
    color: '#1e3a4c',
    fontSize: 13,
    fontWeight: '700',
  },
  waterButton: {
    backgroundColor: '#f1f8f3',
    borderColor: '#cce6d3',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  waterButtonPressed: {
    backgroundColor: '#e1efe5',
  },
  waterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waterButtonText: {
    color: '#285c43',
    fontSize: 12,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  dot: {
    height: 9,
    borderRadius: 4.5,
  },
  activeDot: {
    backgroundColor: '#406c4b',
    width: 22,
  },
  inactiveDot: {
    backgroundColor: '#d1d5db',
    width: 9,
  },
  countText: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  bottomBanner: {
    backgroundColor: '#e5eff6',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 24,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconSquare: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  bannerText: {
    color: '#1a2e22',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    marginLeft: 14,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalDeleteButton: {
    padding: 4,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 14,
  },
  modalScroll: {
    marginBottom: 16,
  },
  modalScientificName: {
    color: '#6b7280',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  modalSection: {
    marginBottom: 14,
  },
  modalSectionTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSectionText: {
    color: '#374151',
    fontSize: 13,
    lineHeight: 19,
  },
  modalSectionSubtext: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  modalWaterButton: {
    backgroundColor: '#4e8a69',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4e8a69',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  modalWaterButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});