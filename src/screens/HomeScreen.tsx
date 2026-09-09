import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Hola, {user?.nombre}</Text>
        <Text style={styles.subtitle}>Tu jardín empieza aquí.</Text>
        <Pressable onPress={() => navigation.navigate('IdentifyPlant')} style={styles.identifyButton}>
          <Text style={styles.identifyText}>Identificar una planta</Text>
        </Pressable>
        <Pressable onPress={() => void logout()} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f7faf7', flex: 1 },
  content: { padding: 28 },
  greeting: { color: '#285c43', fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#718178', fontSize: 15, marginTop: 8 },
  logoutButton: { alignSelf: 'flex-start', borderColor: '#4e8a69', borderRadius: 4, borderWidth: 1, marginTop: 28, paddingHorizontal: 18, paddingVertical: 11 },
  logoutText: { color: '#4e8a69', fontWeight: '600' },
  identifyButton: { alignItems: 'center', backgroundColor: '#4e8a69', borderRadius: 4, marginTop: 28, paddingHorizontal: 18, paddingVertical: 13 },
  identifyText: { color: '#ffffff', fontWeight: '600' },
});