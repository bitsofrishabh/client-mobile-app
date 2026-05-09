import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { goalsAPI } from '../src/services/api';
import { Card } from '../src/components/Card';
import { Input } from '../src/components/Input';
import { GradientButton } from '../src/components/GradientButton';
import { useAuth } from '../src/context/AuthContext';
import { Colors, Gradients, Spacing, BorderRadius } from '../src/constants/theme';

const goals = [
  {
    id: 'lose_weight',
    title: 'Lose Weight',
    desc: 'Burn fat and slim down',
    icon: 'trending-down',
    gradient: ['#FF9B5A', '#FFCF87'],
  },
  {
    id: 'build_muscle',
    title: 'Build Muscle',
    desc: 'Gain strength and mass',
    icon: 'barbell',
    gradient: ['#92A3FD', '#9DCEFF'],
  },
  {
    id: 'stay_fit',
    title: 'Stay Fit',
    desc: 'Maintain healthy lifestyle',
    icon: 'fitness',
    gradient: ['#42D742', '#98EE99'],
  },
  {
    id: 'improve_health',
    title: 'Improve Health',
    desc: 'Better sleep & energy',
    icon: 'heart',
    gradient: ['#C58BF2', '#EEA4CE'],
  },
];

const workoutFrequency = [
  { value: 2, label: '2 days', desc: 'Light' },
  { value: 3, label: '3 days', desc: 'Moderate' },
  { value: 4, label: '4 days', desc: 'Active' },
  { value: 5, label: '5+ days', desc: 'Intense' },
];

export default function GoalSelection() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const { user, refreshUser } = useAuth();
  const isOnboarding = params.from === 'register';

  const [selectedGoal, setSelectedGoal] = useState<string>(user?.fitness_goal || 'lose_weight');
  const [targetWeight, setTargetWeight] = useState<string>(
    user?.goal_weight_kg ? String(user.goal_weight_kg) : ''
  );
  const [workoutDays, setWorkoutDays] = useState<number>(3);
  const [stepsGoal, setStepsGoal] = useState<string>('10000');
  const [waterGoal, setWaterGoal] = useState<string>('8');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!selectedGoal) {
      Alert.alert('Pick a goal', 'Please select your primary goal.');
      return;
    }
    setLoading(true);
    try {
      await goalsAPI.set({
        primary_goal: selectedGoal,
        target_weight_kg: targetWeight ? parseFloat(targetWeight) : undefined,
        weekly_workout_days: workoutDays,
        daily_steps_goal: parseInt(stepsGoal) || 10000,
        daily_water_goal: parseInt(waterGoal) || 8,
      });
      await refreshUser();
      if (isOnboarding) {
        router.replace('/(tabs)');
      } else {
        router.back();
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save goals.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          {!isOnboarding && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.textDark} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>
            {isOnboarding ? 'Set Your Goals' : 'My Goals'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isOnboarding && (
            <Text style={styles.subtitle}>
              We&apos;ll personalize your experience based on your goals.
            </Text>
          )}

          <Text style={styles.sectionTitle}>What&apos;s your primary goal?</Text>
          <View style={styles.goalsGrid}>
            {goals.map((g) => {
              const selected = selectedGoal === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.goalCard, selected && styles.goalCardSelected]}
                  onPress={() => setSelectedGoal(g.id)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={selected ? (g.gradient as any) : [Colors.backgroundGray, Colors.backgroundGray]}
                    style={styles.goalIconWrap}
                  >
                    <Ionicons
                      name={g.icon as any}
                      size={28}
                      color={selected ? 'white' : Colors.textMedium}
                    />
                  </LinearGradient>
                  <Text style={[styles.goalTitle, selected && styles.goalTitleSelected]}>
                    {g.title}
                  </Text>
                  <Text style={styles.goalDesc}>{g.desc}</Text>
                  {selected && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={14} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Target weight (optional)</Text>
          <Input
            placeholder="Goal weight in kg"
            value={targetWeight}
            onChangeText={setTargetWeight}
            keyboardType="decimal-pad"
            icon="flag-outline"
          />

          <Text style={styles.sectionTitle}>Workout frequency</Text>
          <View style={styles.freqRow}>
            {workoutFrequency.map((f) => {
              const sel = workoutDays === f.value;
              return (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.freqChip, sel && styles.freqChipSelected]}
                  onPress={() => setWorkoutDays(f.value)}
                >
                  <Text style={[styles.freqLabel, sel && styles.freqLabelSelected]}>{f.label}</Text>
                  <Text style={[styles.freqDesc, sel && styles.freqDescSelected]}>{f.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Daily targets</Text>
          <Card style={styles.targetCard}>
            <View style={styles.targetRow}>
              <View style={styles.targetIconWrap}>
                <Ionicons name="footsteps" size={20} color="#42D742" />
              </View>
              <Text style={styles.targetLabel}>Steps</Text>
              <View style={styles.targetInputWrap}>
                <Input
                  placeholder="10000"
                  value={stepsGoal}
                  onChangeText={setStepsGoal}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.targetRow}>
              <View style={styles.targetIconWrap}>
                <Ionicons name="water" size={20} color="#5DCCFC" />
              </View>
              <Text style={styles.targetLabel}>Water (glasses)</Text>
              <View style={styles.targetInputWrap}>
                <Input
                  placeholder="8"
                  value={waterGoal}
                  onChangeText={setWaterGoal}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Card>

          <GradientButton
            title={isOnboarding ? 'Continue to Dashboard' : 'Save Goals'}
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />

          {isOnboarding && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundGray },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark },
  placeholder: { width: 40 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMedium,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  goalCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardSelected: {
    borderColor: Colors.primary,
  },
  goalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
  },
  goalTitleSelected: {
    color: Colors.primary,
  },
  goalDesc: {
    fontSize: 11,
    color: Colors.textMedium,
    marginTop: 2,
  },
  checkBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  freqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  freqChip: {
    width: '23%',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  freqChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(146, 163, 253, 0.08)',
  },
  freqLabel: { fontSize: 13, fontWeight: '600', color: Colors.textDark },
  freqLabelSelected: { color: Colors.primary },
  freqDesc: { fontSize: 10, color: Colors.textMedium, marginTop: 2 },
  freqDescSelected: { color: Colors.primary },
  targetCard: { marginBottom: Spacing.md },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  targetIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textDark,
    marginLeft: Spacing.md,
  },
  targetInputWrap: { width: 110 },
  saveButton: { marginTop: Spacing.lg },
  skipButton: { marginTop: Spacing.md, alignItems: 'center' },
  skipText: { fontSize: 14, color: Colors.textMedium },
});
