import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import NoteScreen from './src/screens/NoteScreen';
import SettingsScreen from './src/screens/SettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  Note: { noteId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const C = {
  primary: '#1D4ED8', text: '#1E293B', muted: '#94A3B8',
  card: '#FFFFFF', border: '#E2E8F0',
};

function NotesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.card },
        headerTitleStyle: { fontWeight: '700', fontSize: 17, color: C.text },
        headerTintColor: C.primary,
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'ServiceLog' }} />
      <Stack.Screen name="Note" component={NoteScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerStyle: { backgroundColor: C.card, elevation: 0, shadowOpacity: 0 },
              headerTitleStyle: { fontWeight: '700', fontSize: 18, color: C.text },
              tabBarActiveTintColor: C.primary,
              tabBarInactiveTintColor: C.muted,
              tabBarStyle: {
                backgroundColor: C.card,
                borderTopWidth: 1,
                borderTopColor: C.border,
                paddingBottom: 4,
              },
              tabBarIcon: ({ color, size, focused }) => {
                const icons: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
                  Notes: ['document-text', 'document-text-outline'],
                  Settings: ['settings', 'settings-outline'],
                };
                const [filled, outline] = icons[route.name] ?? ['help', 'help-outline'];
                return <Ionicons name={focused ? filled : outline} size={size} color={color} />;
              },
            })}
          >
            <Tab.Screen
              name="Notes"
              component={NotesStack}
              options={{ headerShown: false, tabBarLabel: 'Notatki' }}
            />
            <Tab.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Ustawienia', tabBarLabel: 'Ustawienia' }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
