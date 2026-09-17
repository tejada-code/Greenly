import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type AuthHeaderProps = {
  active: 'login' | 'register';
  navigation: {
    navigate: (screen: any) => void;
    goBack?: () => void;
    canGoBack?: () => boolean;
  };
};

export function AuthHeader({ active, navigation }: AuthHeaderProps) {
  const handleBack = () => {
    if (navigation.canGoBack?.()) {
      navigation.goBack?.();
    } else {
      navigation.navigate('Launch');
    }
  };

  return (
    <>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver al inicio"
          hitSlop={12}
          onPress={handleBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#24734e" />
        </Pressable>
      </View>

      <View style={styles.brandBlock}>
        <Text style={styles.brand}>Greenly</Text>
        <Text style={styles.brandTagline}>cuida lo que te hace bien</Text>
      </View>
      <View style={styles.tabs}>
        <Pressable onPress={() => navigation.navigate('Login')} style={styles.tabButton}>
          <Text style={[styles.tabText, active === 'login' && styles.activeTabText]}>Login</Text>
          {active === 'login' && <View style={styles.activeTabLine} />}
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Register')} style={styles.tabButton}>
          <Text style={[styles.tabText, active === 'register' && styles.activeTabText]}>Registrar</Text>
          {active === 'register' && <View style={styles.activeTabLine} />}
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 6,
  },
  backButton: {
    padding: 6,
    borderRadius: 20,
  },
  brandBlock: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 34,
  },
  brand: {
    color: '#24734e',
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
  },
  brandTagline: {
    color: '#8b9b8f',
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  tabs: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 28,
    marginBottom: 28,
  },
  tabButton: {
    alignItems: 'center',
    minWidth: 74,
  },
  tabText: {
    color: '#9aa49c',
    fontSize: 14,
  },
  activeTabText: {
    color: '#2d7655',
    fontWeight: '600',
  },
  activeTabLine: {
    backgroundColor: '#2d7655',
    height: 2,
    marginTop: 7,
    width: 42,
  },
});