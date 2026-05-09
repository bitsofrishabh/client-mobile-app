import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { reportsAPI } from '../src/services/api';
import { Card } from '../src/components/Card';
import { Colors, Gradients, Spacing, BorderRadius } from '../src/constants/theme';

interface WeeklyReport {
  period: { start: string; end: string };
  summary: {
    workouts_completed: number;
    total_workout_minutes: number;
    calories_burned: number;
    avg_sleep_hours: number;
    avg_water_glasses: number;
    avg_daily_calories: number;
    weight_change: number;
  };
  daily_breakdown: {
    weights: Array<{ date: string; weight: number }>;
    workouts: Array<{ date: string; type: string; duration: number }>;
    water: Array<{ date: string; glasses: number }>;
  };
  achievements: Array<{ icon: string; title: string; desc: string }>;
}

export default function WeeklyReportScreen() {
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const data = await reportsAPI.getWeekly();
      setReport(data);
    } catch (e) {
      console.error('Failed to load report', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const s = report?.summary;

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const maxWaterDay = report?.daily_breakdown.water.reduce(
    (max, w) => (w.glasses > max ? w.glasses : max),
    0
  ) || 8;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Report</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroLabel}>This Week</Text>
          <Text style={styles.heroDate}>
            {report?.period.start} → {report?.period.end}
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{s?.workouts_completed || 0}</Text>
              <Text style={styles.heroStatLabel}>Workouts</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{s?.calories_burned || 0}</Text>
              <Text style={styles.heroStatLabel}>Cal Burned</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {s?.weight_change && s.weight_change !== 0
                  ? `${s.weight_change > 0 ? '+' : ''}${s.weight_change}kg`
                  : '0kg'}
              </Text>
              <Text style={styles.heroStatLabel}>Weight</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Achievements */}
        {report && report.achievements.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🏆 Achievements</Text>
            <View style={styles.achievements}>
              {report.achievements.map((a, i) => (
                <Card key={i} style={styles.achievementCard}>
                  <View style={styles.achievementIcon}>
                    <Ionicons name={a.icon as any} size={22} color={Colors.primary} />
                  </View>
                  <View style={styles.achievementBody}>
                    <Text style={styles.achievementTitle}>{a.title}</Text>
                    <Text style={styles.achievementDesc}>{a.desc}</Text>
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}

        {/* Summary stats */}
        <Text style={styles.sectionTitle}>📊 Summary</Text>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Ionicons name="time" size={20} color="#FF9B5A" />
            <Text style={styles.statValue}>{s?.total_workout_minutes || 0}</Text>
            <Text style={styles.statLabel}>Workout mins</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="moon" size={20} color="#9B8AFB" />
            <Text style={styles.statValue}>{s?.avg_sleep_hours || 0}h</Text>
            <Text style={styles.statLabel}>Avg sleep</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="water" size={20} color="#5DCCFC" />
            <Text style={styles.statValue}>{s?.avg_water_glasses || 0}</Text>
            <Text style={styles.statLabel}>Avg glasses</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="flame" size={20} color={Colors.error} />
            <Text style={styles.statValue}>{s?.avg_daily_calories || 0}</Text>
            <Text style={styles.statLabel}>Avg cal/day</Text>
          </Card>
        </View>

        {/* Water breakdown bar chart */}
        {report && report.daily_breakdown.water.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>💧 Hydration This Week</Text>
            <Card>
              <View style={styles.chartArea}>
                {report.daily_breakdown.water.map((w, i) => {
                  const h = Math.max(
                    8,
                    (w.glasses / Math.max(8, maxWaterDay)) * 120
                  );
                  return (
                    <View key={i} style={styles.barCol}>
                      <Text style={styles.barValue}>{w.glasses}</Text>
                      <View style={[styles.bar, { height: h }]} />
                      <Text style={styles.barLabel}>{formatDate(w.date)}</Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          </>
        )}

        {/* Workouts list */}
        {report && report.daily_breakdown.workouts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>💪 Workouts</Text>
            <Card>
              {report.daily_breakdown.workouts.map((w, i) => (
                <View
                  key={i}
                  style={[
                    styles.workoutRow,
                    i < report.daily_breakdown.workouts.length - 1 && styles.workoutRowBorder,
                  ]}
                >
                  <View style={styles.workoutIcon}>
                    <Ionicons name="fitness" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutType}>{w.type}</Text>
                    <Text style={styles.workoutDate}>{w.date}</Text>
                  </View>
                  <Text style={styles.workoutMins}>{w.duration} min</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {(!report ||
          (report.daily_breakdown.workouts.length === 0 &&
            report.daily_breakdown.water.length === 0)) && (
          <Card style={styles.emptyCard}>
            <Ionicons name="clipboard-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No data yet this week</Text>
            <Text style={styles.emptySub}>Start logging activities to see your report.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundGray },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  heroCard: {
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  heroDate: { fontSize: 14, color: 'white', fontWeight: '600', marginTop: 4 },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  heroStat: { alignItems: 'center', flex: 1 },
  heroStatValue: { fontSize: 22, fontWeight: '700', color: 'white' },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  achievements: { marginBottom: Spacing.sm },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(146, 163, 253, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementBody: { flex: 1, marginLeft: Spacing.md },
  achievementTitle: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  achievementDesc: { fontSize: 12, color: Colors.textMedium, marginTop: 2 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: Spacing.xs,
  },
  statLabel: { fontSize: 11, color: Colors.textMedium, marginTop: 2 },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingHorizontal: Spacing.xs,
  },
  barCol: { alignItems: 'center', flex: 1 },
  barValue: { fontSize: 10, color: Colors.textMedium, marginBottom: 4 },
  bar: {
    width: 18,
    backgroundColor: '#5DCCFC',
    borderRadius: 6,
  },
  barLabel: { fontSize: 10, color: Colors.textLight, marginTop: 4 },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  workoutRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  workoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(146, 163, 253, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutInfo: { flex: 1, marginLeft: Spacing.md },
  workoutType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    textTransform: 'capitalize',
  },
  workoutDate: { fontSize: 11, color: Colors.textMedium },
  workoutMins: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginTop: Spacing.md,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMedium,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
