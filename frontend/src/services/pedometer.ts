import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';

export async function isPedometerAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function requestPedometerPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    // On Android 10+ we need ACTIVITY_RECOGNITION permission
    if (Platform.OS === 'android') {
      const result = await Pedometer.requestPermissionsAsync();
      return result.status === 'granted';
    }
    return true;
  } catch (e) {
    console.warn('Pedometer permission error', e);
    return false;
  }
}

export async function getTodaySteps(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  try {
    const available = await Pedometer.isAvailableAsync();
    if (!available) return 0;

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const result = await Pedometer.getStepCountAsync(start, end);
    return result?.steps || 0;
  } catch (e) {
    console.warn('Failed to get steps', e);
    return 0;
  }
}

export function watchSteps(
  onUpdate: (steps: number) => void
): { remove: () => void } | null {
  if (Platform.OS === 'web') return null;
  try {
    const sub = Pedometer.watchStepCount((res) => {
      onUpdate(res.steps);
    });
    return sub;
  } catch (e) {
    console.warn('Failed to watch steps', e);
    return null;
  }
}
