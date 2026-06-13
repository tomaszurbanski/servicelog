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
import CalendarScreen from './src/screens/CalendarScreen';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

export type RootStackParamList = {
  Home: undefined;
  Note: { noteId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function NotesStack() {
  const { colors: C } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.card },
        headerTitleStyle: { fontWeight: '700', fontSize: 17, color: C.text },
        headerTintColor: C.primary,
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'ServiceLog' }} />
      <Stack.Screen name="Note" component={NoteScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

function AppInner() {
  const { colors: C } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={C.statusBar} />
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerStyle: { backgroundColor: C.tabBar, elevation: 0, shadowOpacity: 0 },
              headerTitleStyle: { fontWeight: '700', fontSize: 18, color: C.text },
              tabBarActiveTintColor: C.primary,
              tabBarInactiveTintColor: C.muted,
              tabBarStyle: {
                backgroundColor: C.tabBar,
                borderTopWidth: 1,
                borderTopColor: C.tabBorder,
                paddingBottom: 4,
              },
              tabBarIcon: ({ color, size, focused }) => {
                const icons: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
                  Notes: ['document-text', 'document-text-outline'],
                  Calendar: ['calendar', 'calendar-outline'],
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
              name="Calendar"
              component={CalendarScreen}
              options={{ title: 'Kalendarz', tabBarLabel: 'Kalendarz' }}
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

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
