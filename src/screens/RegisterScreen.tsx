import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AuthHeader } from '../components/AuthHeader';
import { getApiErrorMessage, useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!nombre.trim() || !email.trim() || password.length < 8) {
      setErrorMessage('Completa tus datos y usa una contraseña de 8 caracteres o más.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await register({ nombre: nombre.trim(), email: email.trim(), password });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'No pudimos crear tu cuenta.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AuthHeader active="register" navigation={navigation} />
          <View style={styles.form}>
            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput autoCapitalize="words" onChangeText={setNombre} placeholder="Tu nombre" placeholderTextColor="#b5beb7" style={styles.input} value={nombre} />
            <Text style={styles.fieldLabel}>Correo electrónico</Text>
            <TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" onChangeText={setEmail} placeholder="tu@correo.com" placeholderTextColor="#b5beb7" style={styles.input} value={email} />
            <Text style={styles.fieldLabel}>Contraseña</Text>
            <TextInput autoCapitalize="none" onChangeText={setPassword} placeholder="Mínimo 8 caracteres" placeholderTextColor="#b5beb7" secureTextEntry style={styles.input} value={password} />
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            <Pressable disabled={isSubmitting} onPress={() => void handleSubmit()} style={styles.primaryButton}>
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Crear cuenta</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#ffffff', flex: 1 },
  keyboardView: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 32, paddingBottom: 30 },
  form: { width: '100%' },
  fieldLabel: { color: '#829188', fontSize: 12, marginBottom: 7 },
  input: { borderBottomColor: '#cbd5ce', borderBottomWidth: 1, color: '#284438', fontSize: 15, marginBottom: 24, paddingBottom: 10, paddingHorizontal: 0 },
  errorText: { color: '#b13e3e', fontSize: 12, marginBottom: 12 },
  primaryButton: { alignItems: 'center', backgroundColor: '#4e8a69', borderRadius: 4, height: 48, justifyContent: 'center', marginTop: 2 },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});