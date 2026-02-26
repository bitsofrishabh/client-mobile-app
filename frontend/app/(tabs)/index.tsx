import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { dashboardAPI, waterAPI } from '../../src/services/api';
import { Card } from '../../src/components/Card';
import { Colors, Gradients, Spacing, BorderRadius, Shadow } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

interface DashboardData {
  user: {
    name: string;
    bmi: number | null;
    current_weight: number | null;
    goal_weight: number | null;
    daily_calorie_goal: number | null;
  };
  today: {
    date: string;
    water_glasses: number;
    sleep_hours: number;
    steps: number;
    workout_done: boolean;
    workout_mins: number;
    calories_consumed: number;
    calories_burned: number;
  };
  progress: {
    recent_weights: Array<{ date: string; weight: number }>;
    weekly_workouts: number;
    weight_change: number;
  };
  has_coach: boolean;
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const data = await dashboardAPI.get();
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  const addWater = async () => {
    try {
      await waterAPI.log(1);
      fetchDashboard();
    } catch (error) {
      console.error('Error logging water:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: '#FFB347' };
    if (bmi < 25) return { label: 'Normal', color: Colors.success };
    if (bmi < 30) return { label: 'Overweight', color: '#FFB347' };
    return { label: 'Obese', color: Colors.error };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const bmi = dashboard?.user?.bmi || user?.bmi;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;
  const calorieGoal = dashboard?.user?.daily_calorie_goal || 2000;
  const caloriesConsumed = dashboard?.today?.calories_consumed || 0;
  const caloriesBurned = dashboard?.today?.calories_burned || 0;
  const netCalories = caloriesConsumed - caloriesBurned;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{dashboard?.user?.name || user?.name}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.textDark} />
          </TouchableOpacity>
        </View>

        {/* BMI Card */}
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bmiCard}
        >
          <View style={styles.bmiContent}>
            <View style={styles.bmiInfo}>
              <Text style={styles.bmiLabel}>BMI (Body Mass Index)</Text>
              {bmiCategory && (
                <View style={[styles.bmiBadge, { backgroundColor: bmiCategory.color }]}>
                  <Text style={styles.bmiBadgeText}>{bmiCategory.label}</Text>
                </View>
              )}
            </View>
            <View style={styles.bmiCircle}>
              <Text style={styles.bmiValue}>{bmi?.toFixed(1) || '--'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewMoreButton} onPress={() => router.push('/(tabs)/progress')}>
            <Text style={styles.viewMoreText}>View More</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Today Target */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today Target</Text>
          <TouchableOpacity style={styles.checkButton} onPress={() => router.push('/check-in')}>
            <LinearGradient colors={Gradients.primary} style={styles.checkButtonGradient}>
              <Text style={styles.checkButtonText}>Check</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Activity Status Cards */}
        <View style={styles.activityGrid}>
          {/* Water Intake */}
          <Card style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Ionicons name="water" size={20} color="#5DCCFC" />
              <Text style={styles.activityTitle}>Water Intake</Text>
            </View>
            <Text style={styles.activityValue}>
              <Text style={{ color: '#5DCCFC' }}>{dashboard?.today?.water_glasses || 0}</Text>
              <Text style={styles.activityUnit}>/8 glasses</Text>
            </Text>
            <View style={styles.waterProgress}>
              {[...Array(8)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.waterDot,
                    i < (dashboard?.today?.water_glasses || 0) && styles.waterDotFilled,
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity style={styles.addWaterButton} onPress={addWater}>
              <Ionicons name="add" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </Card>

          {/* Sleep */}
          <Card style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Ionicons name="moon" size={20} color="#9B8AFB" />
              <Text style={styles.activityTitle}>Sleep</Text>
            </View>
            <Text style={styles.activityValue}>
              <Text style={{ color: '#9B8AFB' }}>{dashboard?.today?.sleep_hours || 0}</Text>
              <Text style={styles.activityUnit}> hours</Text>
            </Text>
            <TouchableOpacity
              style={styles.logButton}
              onPress={() => router.push('/sleep-tracker')}
            >
              <Text style={styles.logButtonText}>Log Sleep</Text>
            </TouchableOpacity>
          </Card>

          {/* Calories */}
          <Card style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Ionicons name="flame" size={20} color="#FF9B5A" />
              <Text style={styles.activityTitle}>Calories</Text>
            </View>
            <Text style={styles.activityValue}>
              <Text style={{ color: '#FF9B5A' }}>{netCalories}</Text>
              <Text style={styles.activityUnit}>/{calorieGoal} kCal</Text>
            </Text>
            <View style={styles.calorieDetails}>
              <Text style={styles.calorieText}>Eaten: {caloriesConsumed}</Text>
              <Text style={styles.calorieText}>Burned: {caloriesBurned}</Text>
            </View>
          </Card>

          {/* Steps */}
          <Card style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Ionicons name="footsteps" size={20} color="#42D742" />
              <Text style={styles.activityTitle}>Steps</Text>
            </View>
            <Text style={styles.activityValue}>
              <Text style={{ color: '#42D742' }}>{dashboard?.today?.steps || 0}</Text>
              <Text style={styles.activityUnit}>/10k</Text>
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, ((dashboard?.today?.steps || 0) / 10000) * 100)}%`,
                    backgroundColor: '#42D742',
                  },
                ]}
              />
            </View>
          </Card>
        </View>

        {/* Workout Progress */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Workout Progress</Text>
          <TouchableOpacity onPress={() => router.push('/workout-tracker')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.workoutCard}>
          <View style={styles.workoutContent}>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutTitle}>
                {dashboard?.today?.workout_done ? 'Workout Complete!' : 'No workout today'}
              </Text>
              <Text style={styles.workoutSubtitle}>
                {dashboard?.progress?.weekly_workouts || 0} workouts this week
              </Text>
            </View>
            <View
              style={[
                styles.workoutStatus,
                dashboard?.today?.workout_done && styles.workoutStatusDone,
              ]}
            >
              <Ionicons
                name={dashboard?.today?.workout_done ? 'checkmark' : 'barbell'}
                size={24}
                color={dashboard?.today?.workout_done ? 'white' : Colors.textLight}
              />
            </View>
          </View>
          {!dashboard?.today?.workout_done && (
            <TouchableOpacity
              style={styles.startWorkoutButton}
              onPress={() => router.push('/workout-tracker')}
            >
              <LinearGradient colors={Gradients.secondary} style={styles.startWorkoutGradient}>
                <Ionicons name="play" size={16} color="white" />
                <Text style={styles.startWorkoutText}>Start Workout</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Card>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/workout-tracker')}>
            <LinearGradient colors={['#FF9B5A', '#FFCF87']} style={styles.quickActionGradient}>
              <Ionicons name="barbell-outline" size={28} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Workout</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/sleep-tracker')}>
            <LinearGradient colors={['#9B8AFB', '#C4B5FD']} style={styles.quickActionGradient}>
              <Ionicons name="moon-outline" size={28} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Sleep</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/diet-plan')}>
            <LinearGradient colors={Gradients.primary} style={styles.quickActionGradient}>
              <Ionicons name="restaurant-outline" size={28} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Diet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/progress')}>
            <LinearGradient colors={['#42D742', '#98EE99']} style={styles.quickActionGradient}>
              <Ionicons name="trending-up-outline" size={28} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Progress</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textMedium,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.light,
  },
  bmiCard: {
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  bmiContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bmiInfo: {
    flex: 1,
  },
  bmiLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: Spacing.sm,
  },
  bmiBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  bmiBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  bmiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bmiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  viewMoreButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
  },
  viewMoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  checkButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  checkButtonGradient: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  checkButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 12,
    color: Colors.textMedium,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  activityCard: {
    width: '48%',
    marginBottom: Spacing.md,
    minHeight: 130,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  activityTitle: {
    fontSize: 12,
    color: Colors.textMedium,
    marginLeft: Spacing.xs,
  },
  activityValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
  },
  activityUnit: {
    fontSize: 12,
    color: Colors.textMedium,
    fontWeight: '400',
  },
  waterProgress: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  waterDot: {
    width: 8,
    height: 20,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginRight: 4,
  },
  waterDotFilled: {
    backgroundColor: '#5DCCFC',
  },
  addWaterButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logButton: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.backgroundGray,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.small,
    alignSelf: 'flex-start',
  },
  logButtonText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  calorieDetails: {
    marginTop: Spacing.sm,
  },
  calorieText: {
    fontSize: 10,
    color: Colors.textMedium,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  workoutCard: {
    marginBottom: Spacing.lg,
  },
  workoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  workoutSubtitle: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 4,
  },
  workoutStatus: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutStatusDone: {
    backgroundColor: Colors.success,
  },
  startWorkoutButton: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  startWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  startWorkoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionGradient: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionText: {
    fontSize: 12,
    color: Colors.textMedium,
  },
});
