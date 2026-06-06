import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import NoteScreen from './src/screens/NoteScreen';

export type RootStackParamList = {
  Home: undefined;
  Note: { noteId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: '#FFFFFF' },
              headerTitleStyle: { fontWeight: '700', fontSize: 17, color: '#1E293B' },
              headerTintColor: '#1D4ED8',
              contentStyle: { backgroundColor: '#F8FAFC' },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'ServiceLog' }} />
            <Stack.Screen name="Note" component={NoteScreen} options={{ title: '' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
