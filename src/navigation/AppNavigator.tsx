import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { HomeScreen } from '../screens/HomeScreen';
import { IdentifyPlantScreen } from '../screens/IdentifyPlantScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  IdentifyPlant: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#4e8a69" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen component={HomeScreen} name="Home" />
            <Stack.Screen component={IdentifyPlantScreen} name="IdentifyPlant" />
          </>
        ) : (
          <>
            <Stack.Screen component={LoginScreen} name="Login" />
            <Stack.Screen component={RegisterScreen} name="Register" />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const styles = StyleSheet.create({
  loadingScreen: { alignItems: 'center', backgroundColor: '#ffffff', flex: 1, justifyContent: 'center' },
});