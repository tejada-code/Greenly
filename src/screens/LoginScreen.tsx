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

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Ingresa tu correo y contraseña.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'No pudimos iniciar sesión.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AuthHeader active="login" navigation={navigation} />

          <View style={styles.form}>
            <Text style={styles.fieldLabel}>Correo electrónico</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              placeholderTextColor="#b5beb7"
              style={styles.input}
              value={email}
            />

            <View style={styles.passwordLabelRow}>
              <Text style={styles.fieldLabel}>Contraseña</Text>
              <Pressable onPress={() => setShowPassword((visible) => !visible)}>
                <Text style={styles.showPassword}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
              </Pressable>
            </View>
            <TextInput
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor="#b5beb7"
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
            />

            <View style={styles.optionsRow}>
              <Pressable onPress={() => setRemember((checked) => !checked)} style={styles.rememberButton}>
                <View style={[styles.checkbox, remember && styles.checkedBox]}>
                  {remember && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.optionText}>Recordar contraseña</Text>
              </Pressable>
              <Pressable>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <Pressable disabled={isSubmitting} onPress={() => void handleSubmit()} style={styles.primaryButton}>
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Login</Text>
              )}
            </Pressable>

            <Text style={styles.socialLabel}>o ingresar con</Text>
            <View style={styles.socialRow}>
              <View style={[styles.socialCircle, { backgroundColor: '#3867a5' }]}><Text style={styles.socialLetter}>f</Text></View>
              <View style={[styles.socialCircle, { backgroundColor: '#b9486d' }]}><Text style={styles.socialLetter}>◎</Text></View>
              <View style={[styles.socialCircle, { backgroundColor: '#be3d4c' }]}><Text style={styles.socialLetter}>p</Text></View>
              <View style={[styles.socialCircle, { backgroundColor: '#2878a9' }]}><Text style={styles.socialLetter}>in</Text></View>
            </View>
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
  input: {
    borderBottomColor: '#cbd5ce',
    borderBottomWidth: 1,
    color: '#284438',
    fontSize: 15,
    marginBottom: 24,
    paddingBottom: 10,
    paddingHorizontal: 0,
  },
  passwordLabelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  showPassword: { color: '#2d7655', fontSize: 12, marginBottom: 7 },
  optionsRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  rememberButton: { alignItems: 'center', flexDirection: 'row' },
  checkbox: { alignItems: 'center', borderColor: '#bcc9bf', borderRadius: 3, borderWidth: 1, height: 17, justifyContent: 'center', marginRight: 7, width: 17 },
  checkedBox: { backgroundColor: '#2d7655', borderColor: '#2d7655' },
  checkmark: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  optionText: { color: '#849188', fontSize: 11 },
  forgotText: { color: '#2d7655', fontSize: 11 },
  errorText: { color: '#b13e3e', fontSize: 12, marginBottom: 12 },
  primaryButton: { alignItems: 'center', backgroundColor: '#4e8a69', borderRadius: 4, height: 48, justifyContent: 'center', marginTop: 2 },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  socialLabel: { color: '#9aa49c', fontSize: 12, marginBottom: 13, marginTop: 22, textAlign: 'center' },
  socialRow: { flexDirection: 'row', gap: 13, justifyContent: 'center' },
  socialCircle: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  socialLetter: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});