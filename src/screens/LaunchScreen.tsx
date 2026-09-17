import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Launch'>;

export function LaunchScreen({ navigation }: Props) {
  return (
    <ImageBackground
      source={require('../../assets/launch_bg.jpg')}
      resizeMode="cover"
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          {/* Spacer to push content to bottom */}
          <View style={styles.spacer} />

          {/* Bottom Card / Content Section */}
          <View style={styles.bottomContent}>
            <Text style={styles.title}>Bienvenido a Greenly</Text>
            <Text style={styles.subtitle}>
              Identifica, organiza y cuida tus plantas desde un solo lugar.
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Crear una cuenta"
              onPress={() => navigation.navigate('Register')}
              style={({ pressed }) => [styles.createButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.createButtonText}>Crear una cuenta</Text>
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.accountQuestion}>¿Ya tienes una cuenta? </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Iniciar sesión"
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginLink}>Iniciar sesión</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 20, 12, 0.28)',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  spacer: {
    flex: 1,
  },
  bottomContent: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'center',
    maxWidth: '85%',
    marginBottom: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  createButton: {
    width: '100%',
    height: 54,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  createButtonText: {
    color: '#1a2e22',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingVertical: 4,
  },
  accountQuestion: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 14,
    fontWeight: '400',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loginLink: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
