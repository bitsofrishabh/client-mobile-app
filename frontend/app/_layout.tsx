import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="check-in" options={{ presentation: 'modal' }} />
        <Stack.Screen name="workout-tracker" options={{ presentation: 'card' }} />
        <Stack.Screen name="sleep-tracker" options={{ presentation: 'card' }} />
        <Stack.Screen name="meal-logger" options={{ presentation: 'card' }} />
        <Stack.Screen name="progress-photos" options={{ presentation: 'card' }} />
        <Stack.Screen name="goal-selection" options={{ presentation: 'card' }} />
        <Stack.Screen name="weekly-report" options={{ presentation: 'card' }} />
      </Stack>
    </AuthProvider>
  );
}
