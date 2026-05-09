import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from '../src/context/AuthContext';

function NotificationHandler() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // When a notification is tapped (app foreground OR background)
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      if (data?.type === 'diet_plan_assigned') {
        router.push('/(tabs)/diet-plan');
      } else if (data?.meal) {
        router.push('/meal-logger');
      }
    });

    // When a notification arrives while app is foregrounded \u2014 silently keep the
    // diet plan tab fresh by no-op here; the diet-plan screen reloads on focus anyway.
    const receiveSub = Notifications.addNotificationReceivedListener(() => {});

    return () => {
      responseSub.remove();
      receiveSub.remove();
    };
  }, [router]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <NotificationHandler />
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
        <Stack.Screen name="coach-connect" options={{ presentation: 'card' }} />
      </Stack>
    </AuthProvider>
  );
}
