import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { CommunityScreen } from '../screens/CommunityScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { IdentifyPlantScreen } from '../screens/IdentifyPlantScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { LaunchScreen } from '../screens/LaunchScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';

export type MainTabParamList = {
  Inicio: undefined;
  'Mis plantas': undefined;
  Identificar: undefined;
  Comunidad: undefined;
};

export type RootStackParamList = {
  Launch: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Home: undefined;
  IdentifyPlant: undefined;
  Inventory: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Mis plantas"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#386f48',
        tabBarInactiveTintColor: '#1a1a1a',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabel: ({ focused, color }) => (
          <View style={styles.tabLabelContainer}>
            <Text style={[styles.tabLabelText, { color, fontWeight: focused ? '700' : '500' }]}>
              {route.name}
            </Text>
            {focused ? <View style={styles.activeIndicator} /> : <View style={styles.inactiveIndicator} />}
          </View>
        ),
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Mis plantas"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="leaf" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Identificar"
        component={IdentifyPlantScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera-outline" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Comunidad"
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size || 22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

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
            <Stack.Screen component={MainTabNavigator} name="Main" />
            <Stack.Screen component={IdentifyPlantScreen} name="IdentifyPlant" />
            <Stack.Screen component={InventoryScreen} name="Inventory" />
            <Stack.Screen component={HomeScreen} name="Home" />
          </>
        ) : (
          <>
            <Stack.Screen component={LaunchScreen} name="Launch" />
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
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flex: 1,
    justifyContent: 'center',
  },
  tabLabelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  tabLabelText: {
    fontSize: 11,
  },
  activeIndicator: {
    backgroundColor: '#386f48',
    height: 2.5,
    width: 32,
    borderRadius: 2,
    marginTop: 3,
  },
  inactiveIndicator: {
    height: 2.5,
    width: 32,
    marginTop: 3,
    backgroundColor: 'transparent',
  },
});