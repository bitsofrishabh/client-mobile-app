import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MEAL_NOTIFICATIONS_KEY = 'meal_notifications_scheduled';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface MealReminder {
  id: string;
  meal: 'breakfast' | 'lunch' | 'dinner';
  hour: number;
  minute: number;
  title: string;
  body: string;
}

export const DEFAULT_MEAL_REMINDERS: MealReminder[] = [
  {
    id: 'breakfast',
    meal: 'breakfast',
    hour: 10,
    minute: 0,
    title: '\uD83C\uDF73 Time for Breakfast!',
    body: 'Log your breakfast to stay on track with your goals.',
  },
  {
    id: 'lunch',
    meal: 'lunch',
    hour: 14,
    minute: 0,
    title: '\uD83C\uDF7D\uFE0F Lunch Time!',
    body: 'Don\u2019t forget to log your lunch.',
  },
  {
    id: 'dinner',
    meal: 'dinner',
    hour: 21,
    minute: 0,
    title: '\uD83C\uDF72 Dinner Reminder',
    body: 'Time to log your dinner before bed!',
  },
];

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    // Notifications scheduling is unsupported on web; return false silently
    return false;
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('meal-reminders', {
          name: 'Meal Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#92A3FD',
        });
      } catch (e) {
        console.warn('Failed to set Android channel', e);
      }
    }

    return finalStatus === 'granted';
  } catch (e) {
    console.warn('Notification permission error', e);
    return false;
  }
}

export async function scheduleMealReminders(
  reminders: MealReminder[] = DEFAULT_MEAL_REMINDERS
): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    // Cancel any existing meal reminders first
    await cancelMealReminders();

    const granted = await requestNotificationPermissions();
    if (!granted) return false;

    const ids: string[] = [];
    for (const r of reminders) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: r.title,
          body: r.body,
          data: { meal: r.meal },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: r.hour,
          minute: r.minute,
        } as any,
      });
      ids.push(id);
    }

    await AsyncStorage.setItem(MEAL_NOTIFICATIONS_KEY, JSON.stringify(ids));
    return true;
  } catch (e) {
    console.warn('Failed to schedule meal reminders', e);
    return false;
  }
}

export async function cancelMealReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const stored = await AsyncStorage.getItem(MEAL_NOTIFICATIONS_KEY);
    if (stored) {
      const ids: string[] = JSON.parse(stored);
      for (const id of ids) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch (e) {
          // ignore
        }
      }
      await AsyncStorage.removeItem(MEAL_NOTIFICATIONS_KEY);
    }
  } catch (e) {
    console.warn('Failed to cancel reminders', e);
  }
}

export async function areMealRemindersScheduled(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const stored = await AsyncStorage.getItem(MEAL_NOTIFICATIONS_KEY);
    return !!stored;
  } catch {
    return false;
  }
}
