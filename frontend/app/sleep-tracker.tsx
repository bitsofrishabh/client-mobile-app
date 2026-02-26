import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { sleepAPI } from '../src/services/api';
import { Card } from '../src/components/Card';
import { GradientButton } from '../src/components/GradientButton';
import { Colors, Gradients, Spacing, BorderRadius } from '../src/constants/theme';

const hours = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00'];
const wakeHours = ['05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00'];

const qualityOptions = [
  { value: 'poor', label: 'Poor', icon: 'sad-outline', color: '#FF6B6B' },
  { value: 'fair', label: 'Fair', icon: 'happy-outline', color: '#FFB347' },
  { value: 'good', label: 'Good', icon: 'happy', color: '#5DCCFC' },
  { value: 'excellent', label: 'Excellent', icon: 'star', color: '#42D742' },
];

export default function SleepTracker() {
  const router = useRouter();
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [quality, setQuality] = useState('good');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await sleepAPI.getHistory();
      setHistory(data.logs || []);
    } catch (error) {
      console.error('Error fetching sleep history:', error);
    }
  };

  const calculateSleepDuration = () => {
    const [bedH, bedM] = bedtime.split(':').map(Number);
    const [wakeH, wakeM] = wakeTime.split(':').map(Number);
    
    let bedMins = bedH * 60 + bedM;
    let wakeMins = wakeH * 60 + wakeM;
    
    if (wakeMins < bedMins) {
      wakeMins += 24 * 60;
    }
    
    const diffMins = wakeMins - bedMins;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    return `${hours}h ${mins}m`;
  };

  const handleLogSleep = async () => {
    setLoading(true);
    try {
      await sleepAPI.log({
        bedtime,
        wake_time: wakeTime,
        quality,
      });
      Alert.alert('Success', 'Sleep logged successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to log sleep.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sleep Tracker</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sleep Duration Preview */}
        <LinearGradient colors={['#9B8AFB', '#C4B5FD']} style={styles.durationCard}>
          <Ionicons name="moon" size={40} color="white" />
          <Text style={styles.durationLabel}>Sleep Duration</Text>
          <Text style={styles.durationValue}>{calculateSleepDuration()}</Text>
        </LinearGradient>

        {/* Bedtime Selection */}
        <Text style={styles.sectionTitle}>Bedtime</Text>
        <Card style={styles.timeCard}>
          <View style={styles.timeHeader}>
            <Ionicons name="bed-outline" size={24} color={Colors.primary} />
            <Text style={styles.timeLabel}>When did you go to bed?</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
            {hours.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeOption,
                  bedtime === time && styles.timeOptionSelected,
                ]}
                onPress={() => setBedtime(time)}
              >
                {bedtime === time ? (
                  <LinearGradient colors={Gradients.secondary} style={styles.timeGradient}>
                    <Text style={styles.timeTextSelected}>{time}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.timeText}>{time}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>

        {/* Wake Time Selection */}
        <Text style={styles.sectionTitle}>Wake Time</Text>
        <Card style={styles.timeCard}>
          <View style={styles.timeHeader}>
            <Ionicons name="alarm-outline" size={24} color={Colors.primary} />
            <Text style={styles.timeLabel}>When did you wake up?</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
            {wakeHours.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeOption,
                  wakeTime === time && styles.timeOptionSelected,
                ]}
                onPress={() => setWakeTime(time)}
              >
                {wakeTime === time ? (
                  <LinearGradient colors={Gradients.primary} style={styles.timeGradient}>
                    <Text style={styles.timeTextSelected}>{time}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.timeText}>{time}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>

        {/* Sleep Quality */}
        <Text style={styles.sectionTitle}>Sleep Quality</Text>
        <View style={styles.qualityContainer}>
          {qualityOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.qualityOption,
                quality === option.value && { borderColor: option.color },
              ]}
              onPress={() => setQuality(option.value)}
            >
              <Ionicons
                name={option.icon as any}
                size={28}
                color={quality === option.value ? option.color : Colors.textLight}
              />
              <Text
                style={[
                  styles.qualityLabel,
                  quality === option.value && { color: option.color },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <GradientButton
          title="Log Sleep"
          onPress={handleLogSleep}
          loading={loading}
          style={styles.logButton}
          variant="secondary"
        />

        {/* Sleep History */}
        {history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Sleep History</Text>
            {history.map((log, index) => (
              <Card key={index} style={styles.historyCard}>
                <View style={styles.historyContent}>
                  <View style={styles.historyLeft}>
                    <Ionicons name="moon" size={24} color="#9B8AFB" />
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyDate}>{log.date}</Text>
                      <Text style={styles.historyTimes}>
                        {log.bedtime} - {log.wake_time}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyHours}>{log.hours}h</Text>
                    <Text style={styles.historyQuality}>{log.quality}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  durationCard: {
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  durationLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.sm,
  },
  durationValue: {
    fontSize: 36,
    fontWeight: '700',
    color: 'white',
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  timeCard: {
    marginBottom: Spacing.lg,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.textDark,
    marginLeft: Spacing.sm,
  },
  timeScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  timeOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.backgroundGray,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeOptionSelected: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  timeGradient: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
  },
  timeText: {
    fontSize: 14,
    color: Colors.textMedium,
    fontWeight: '500',
  },
  timeTextSelected: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  qualityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  qualityOption: {
    width: '23%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  qualityLabel: {
    fontSize: 10,
    color: Colors.textMedium,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  logButton: {
    marginTop: Spacing.md,
  },
  historyCard: {
    marginBottom: Spacing.sm,
  },
  historyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyInfo: {
    marginLeft: Spacing.md,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  historyTimes: {
    fontSize: 12,
    color: Colors.textMedium,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyHours: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9B8AFB',
  },
  historyQuality: {
    fontSize: 10,
    color: Colors.textMedium,
    textTransform: 'capitalize',
  },
});
