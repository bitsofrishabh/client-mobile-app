import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-gifted-charts';
import { weightAPI } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { Card } from '../../src/components/Card';
import { GradientButton } from '../../src/components/GradientButton';
import { Colors, Gradients, Spacing, BorderRadius } from '../../src/constants/theme';
import { format } from 'date-fns';

interface WeightEntry {
  date: string;
  weight_kg: number;
  notes?: string;
}

interface WeightsData {
  weights: WeightEntry[];
  current_weight: number;
  initial_weight: number;
  goal_weight: number;
}

export default function ProgressScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<WeightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWeights = async () => {
    try {
      const response = await weightAPI.getHistory();
      setData(response);
    } catch (error) {
      console.error('Error fetching weights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeights();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeights();
  };

  const handleLogWeight = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight value.');
      return;
    }

    setSubmitting(true);
    try {
      await weightAPI.log(weight);
      setNewWeight('');
      fetchWeights();
      Alert.alert('Success', 'Weight logged successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to log weight.');
    } finally {
      setSubmitting(false);
    }
  };

  const getChartData = () => {
    if (!data?.weights || data.weights.length === 0) return [];

    return data.weights
      .slice(-14) // Last 14 entries
      .reverse()
      .map((entry) => ({
        value: entry.weight_kg,
        label: format(new Date(entry.date), 'dd/MM'),
        dataPointText: entry.weight_kg.toString(),
      }));
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

  const chartData = getChartData();
  const currentWeight = data?.current_weight || user?.weight_kg || 0;
  const goalWeight = data?.goal_weight || user?.goal_weight_kg || currentWeight;
  const initialWeight = data?.initial_weight || currentWeight;
  const weightLost = Math.abs(initialWeight - currentWeight);
  const progress = goalWeight !== initialWeight
    ? Math.min(100, Math.max(0, ((initialWeight - currentWeight) / (initialWeight - goalWeight)) * 100))
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Weight Progress</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {/* Stats Overview */}
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Current</Text>
              <Text style={styles.statValue}>{currentWeight.toFixed(1)}</Text>
              <Text style={styles.statUnit}>kg</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Goal</Text>
              <Text style={[styles.statValue, { color: Colors.primary }]}>{goalWeight.toFixed(1)}</Text>
              <Text style={styles.statUnit}>kg</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Lost</Text>
              <Text style={[styles.statValue, { color: Colors.success }]}>{weightLost.toFixed(1)}</Text>
              <Text style={styles.statUnit}>kg</Text>
            </Card>
          </View>

          {/* Progress Bar */}
          <Card style={styles.progressCard}>
            <Text style={styles.progressTitle}>Progress to Goal</Text>
            <View style={styles.progressBarContainer}>
              <LinearGradient
                colors={Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBar, { width: `${Math.max(progress, 5)}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{progress.toFixed(0)}% completed</Text>
          </Card>

          {/* Chart */}
          {chartData.length > 0 ? (
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>Weight History</Text>
              <View style={styles.chartContainer}>
                <LineChart
                  data={chartData}
                  width={280}
                  height={180}
                  spacing={40}
                  color={Colors.primary}
                  thickness={3}
                  dataPointsColor={Colors.primary}
                  dataPointsRadius={5}
                  hideRules
                  yAxisColor={Colors.border}
                  xAxisColor={Colors.border}
                  yAxisTextStyle={styles.chartAxisText}
                  xAxisLabelTextStyle={styles.chartAxisText}
                  curved
                  startFillColor={Colors.primary}
                  endFillColor="white"
                  startOpacity={0.2}
                  endOpacity={0}
                  areaChart
                />
              </View>
            </Card>
          ) : (
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>Weight History</Text>
              <View style={styles.noChartData}>
                <Ionicons name="analytics-outline" size={48} color={Colors.textLight} />
                <Text style={styles.noChartText}>No data yet. Start logging your weight!</Text>
              </View>
            </Card>
          )}

          {/* Log Weight */}
          <Card style={styles.logCard}>
            <Text style={styles.logTitle}>Log Today's Weight</Text>
            <View style={styles.logInputContainer}>
              <TextInput
                style={styles.logInput}
                placeholder="Enter weight"
                placeholderTextColor={Colors.textLight}
                value={newWeight}
                onChangeText={setNewWeight}
                keyboardType="decimal-pad"
              />
              <Text style={styles.logUnit}>kg</Text>
            </View>
            <GradientButton
              title="Log Weight"
              onPress={handleLogWeight}
              loading={submitting}
              style={styles.logButton}
            />
          </Card>

          {/* Recent Entries */}
          {data?.weights && data.weights.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recent Entries</Text>
              {data.weights.slice(0, 5).map((entry, index) => (
                <Card key={index} style={styles.entryCard}>
                  <View style={styles.entryContent}>
                    <View style={styles.entryIcon}>
                      <Ionicons name="scale-outline" size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryWeight}>{entry.weight_kg} kg</Text>
                      <Text style={styles.entryDate}>
                        {format(new Date(entry.date), 'MMMM dd, yyyy')}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  statCard: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMedium,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textDark,
  },
  statUnit: {
    fontSize: 12,
    color: Colors.textMedium,
  },
  progressCard: {
    marginBottom: Spacing.md,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textMedium,
  },
  chartCard: {
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartAxisText: {
    fontSize: 10,
    color: Colors.textMedium,
  },
  noChartData: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noChartText: {
    fontSize: 14,
    color: Colors.textMedium,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  logCard: {
    marginBottom: Spacing.lg,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  logInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  logInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: Colors.textDark,
  },
  logUnit: {
    fontSize: 14,
    color: Colors.textMedium,
  },
  logButton: {
    height: 50,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  entryCard: {
    marginBottom: Spacing.sm,
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryInfo: {
    marginLeft: Spacing.md,
  },
  entryWeight: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  entryDate: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
  },
});
