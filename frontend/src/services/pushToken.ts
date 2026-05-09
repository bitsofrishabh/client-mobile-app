import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { portalPushAPI } from './portalApi';

const PUSH_TOKEN_KEY = 'expo_push_token';
const PUSH_TOKEN_REGISTERED_KEY = 'push_token_registered';

/**
 * Request notification permissions and obtain the Expo push token.
 * Returns null on web/simulator/unsupported devices.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) {
    // Push tokens require a physical device
    return null;
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      final = status;
    }
    if (final !== 'granted') return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId;

    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const value = token?.data || null;
    if (value) {
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, value);
    }
    return value;
  } catch (e) {
    console.warn('Failed to get Expo push token', e);
    return null;
  }
}

/**
 * Register the user's Expo push token with the web portal.
 * Safe to call multiple times; will no-op if portal endpoint isn't ready yet.
 */
export async function registerPushTokenWithPortal(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const already = await AsyncStorage.getItem(PUSH_TOKEN_REGISTERED_KEY);
    if (already === 'true') return true;

    const token = await getExpoPushToken();
    if (!token) return false;

    const result = await portalPushAPI.registerToken(token, {
      platform: Platform.OS,
      device_name: Device.deviceName,
      os_version: Device.osVersion,
      app_version: Constants.expoConfig?.version,
    });

    if (result.ok) {
      await AsyncStorage.setItem(PUSH_TOKEN_REGISTERED_KEY, 'true');
      return true;
    }
    return false;
  } catch (e) {
    console.warn('Push token registration failed', e);
    return false;
  }
}

export async function clearPushTokenRegistration() {
  await AsyncStorage.removeItem(PUSH_TOKEN_REGISTERED_KEY);
}
