import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function CommunityScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Comunidad</Text>
        <Text style={styles.subtitle}>Conecta con otros amantes de la botánica</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="people-outline" size={48} color="#4e8a69" />
        </View>
        <Text style={styles.heading}>Espacio en construcción</Text>
        <Text style={styles.description}>
          Muy pronto podrás compartir esquejes, resolver dudas sobre plagas y aprender de la comunidad Greenly.
        </Text>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="chatbubbles-outline" size={20} color="#4e8a69" />
            <Text style={styles.featureText}>Foro de consultas botánicas</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="heart-outline" size={20} color="#4e8a69" />
            <Text style={styles.featureText}>Galería y fotos de plantas saludables</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="sparkles-outline" size={20} color="#4e8a69" />
            <Text style={styles.featureText}>Consejos de expertos en jardinería</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f7faf7',
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    color: '#1a2e22',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#718178',
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e1efe4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heading: {
    color: '#285c43',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    color: '#607268',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
  },
  featuresList: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5eee7',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    color: '#34473d',
    fontSize: 14,
    fontWeight: '500',
  },
});
