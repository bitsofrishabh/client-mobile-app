import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { clientAPI } from '../../src/services/api';
import { Card } from '../../src/components/Card';
import { GradientButton } from '../../src/components/GradientButton';
import { Colors, Gradients, Spacing, BorderRadius, Shadow } from '../../src/constants/theme';

interface DashboardData {
  has_profile: boolean;
  client?: {
    name: string;
    current_weight: number;
    goal_weight: number;
    initial_weight: number;
    adherence_rate: number;
  };
  today?: {
    date: string;
    checkin_completed: boolean;
    adherence_score: number;
  };
  diet_plan?: {
    name: string;
    daily_calories: number | null;
    meals_count: number;
  };
  progress?: {
    recent_weights: Array<{ weight_kg: number; recorded_date: string }>;
    streak_days: number;
    weight_change: number;
  };
  unread_messages: number;
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const data = await clientAPI.getDashboard();
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
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

  if (!dashboard?.has_profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noProfileContainer}>
          <Ionicons name="person-add-outline" size={80} color={Colors.textLight} />
          <Text style={styles.noProfileTitle}>No Profile Linked</Text>
          <Text style={styles.noProfileText}>
            Please ask your coach to add you as a client. Make sure you registered with the correct invite code.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const weightProgress = dashboard.client
    ? Math.min(100, Math.max(0, ((dashboard.client.initial_weight - dashboard.client.current_weight) / 
        (dashboard.client.initial_weight - dashboard.client.goal_weight)) * 100))
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{dashboard.client?.name || user?.name}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.textDark} />
            {dashboard.unread_messages > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{dashboard.unread_messages}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Weight Progress Card */}
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.progressCard}
        >
          <View style={styles.progressCardContent}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Weight Progress</Text>
              <Text style={styles.progressValue}>
                {dashboard.client?.current_weight} kg
              </Text>
              <Text style={styles.progressGoal}>
                Goal: {dashboard.client?.goal_weight} kg
              </Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercent}>
                {weightProgress.toFixed(0)}%
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => router.push('/(tabs)/progress')}
          >
            <Text style={styles.viewMoreText}>View More</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Today's Target Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today Target</Text>
          <TouchableOpacity
            style={styles.checkButton}
            onPress={() => router.push('/check-in')}
          >
            <LinearGradient
              colors={Gradients.primary}
              style={styles.checkButtonGradient}
            >
              <Text style={styles.checkButtonText}>Check</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Status Cards */}
        <View style={styles.statusGrid}>
          <Card style={styles.statusCard}>
            <View style={styles.statusIconContainer}>
              <Ionicons name="flame" size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.statusValue}>{dashboard.progress?.streak_days || 0}</Text>
            <Text style={styles.statusLabel}>Day Streak</Text>
          </Card>

          <Card style={styles.statusCard}>
            <View style={styles.statusIconContainer}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            </View>
            <Text style={styles.statusValue}>
              {dashboard.today?.adherence_score || 0}%
            </Text>
            <Text style={styles.statusLabel}>Today's Adherence</Text>
          </Card>

          <Card style={styles.statusCard}>
            <View style={styles.statusIconContainer}>
              <Ionicons name="trending-down" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.statusValue}>
              {Math.abs(dashboard.progress?.weight_change || 0).toFixed(1)} kg
            </Text>
            <Text style={styles.statusLabel}>Weight Lost</Text>
          </Card>

          <Card style={styles.statusCard}>
            <View style={styles.statusIconContainer}>
              <Ionicons name="restaurant" size={24} color={Colors.warning} />
            </View>
            <Text style={styles.statusValue}>
              {dashboard.diet_plan?.meals_count || 0}
            </Text>
            <Text style={styles.statusLabel}>Meals Today</Text>
          </Card>
        </View>

        {/* Check-in Status */}
        <Card style={styles.checkinCard} variant="elevated">
          <View style={styles.checkinContent}>
            <View style={styles.checkinInfo}>
              <Ionicons
                name={dashboard.today?.checkin_completed ? 'checkmark-circle' : 'time'}
                size={40}
                color={dashboard.today?.checkin_completed ? Colors.success : Colors.warning}
              />
              <View style={styles.checkinTextContainer}>
                <Text style={styles.checkinTitle}>
                  {dashboard.today?.checkin_completed ? 'Check-in Complete!' : 'Daily Check-in'}
                </Text>
                <Text style={styles.checkinSubtitle}>
                  {dashboard.today?.checkin_completed
                    ? 'Great job staying on track!'
                    : "Don't forget to log your meals today"}
                </Text>
              </View>
            </View>
            {!dashboard.today?.checkin_completed && (
              <GradientButton
                title="Check In"
                onPress={() => router.push('/check-in')}
                style={styles.checkinButton}
              />
            )}
          </View>
        </Card>

        {/* Diet Plan Preview */}
        {dashboard.diet_plan && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Diet Plan</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/diet-plan')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <Card style={styles.dietCard} variant="elevated">
              <View style={styles.dietContent}>
                <Ionicons name="nutrition" size={32} color={Colors.primary} />
                <View style={styles.dietInfo}>
                  <Text style={styles.dietTitle}>{dashboard.diet_plan.name}</Text>
                  <Text style={styles.dietSubtitle}>
                    {dashboard.diet_plan.meals_count} meals{' '}
                    {dashboard.diet_plan.daily_calories && `• ${dashboard.diet_plan.daily_calories} cal`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.textLight} />
              </View>
            </Card>
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
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.error,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  progressCard: {
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  progressCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  progressGoal: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 20,
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
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statusCard: {
    width: '48%',
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 4,
    textAlign: 'center',
  },
  checkinCard: {
    marginBottom: Spacing.lg,
  },
  checkinContent: {
    alignItems: 'center',
  },
  checkinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  checkinTextContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  checkinTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  checkinSubtitle: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
  },
  checkinButton: {
    width: '100%',
    height: 50,
  },
  dietCard: {
    marginBottom: Spacing.lg,
  },
  dietContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dietInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  dietTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  dietSubtitle: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
  },
  noProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  noProfileTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  noProfileText: {
    fontSize: 14,
    color: Colors.textMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
});
