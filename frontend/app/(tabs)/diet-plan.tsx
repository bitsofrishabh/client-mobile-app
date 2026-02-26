import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { clientAPI } from '../../src/services/api';
import { Card } from '../../src/components/Card';
import { Colors, Gradients, Spacing, BorderRadius } from '../../src/constants/theme';

interface Meal {
  time: string;
  name: string;
  items: Array<{
    name: string;
    quantity: string;
    calories: number;
  }>;
}

interface DietPlan {
  id: string;
  name: string;
  description: string | null;
  daily_calories: number | null;
  meals: Meal[];
  instructions: string | null;
}

export default function DietPlanScreen() {
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDietPlan = async () => {
    try {
      const data = await clientAPI.getDietPlan();
      setDietPlan(data.diet_plan);
    } catch (error) {
      console.error('Error fetching diet plan:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDietPlan();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDietPlan();
  };

  const getMealIcon = (mealName: string) => {
    const name = mealName.toLowerCase();
    if (name.includes('breakfast')) return 'sunny';
    if (name.includes('lunch')) return 'restaurant';
    if (name.includes('dinner')) return 'moon';
    if (name.includes('snack')) return 'nutrition';
    return 'fast-food';
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
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

  if (!dietPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Diet Plan</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={80} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>No Diet Plan Yet</Text>
          <Text style={styles.emptyText}>
            Your coach hasn't assigned a diet plan yet. Please contact them for your personalized meal plan.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Diet Plan</Text>
      </View>

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
        {/* Plan Overview */}
        <LinearGradient
          colors={Gradients.secondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.overviewCard}
        >
          <View style={styles.overviewContent}>
            <Text style={styles.overviewTitle}>{dietPlan.name}</Text>
            {dietPlan.description && (
              <Text style={styles.overviewDescription}>{dietPlan.description}</Text>
            )}
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatValue}>{dietPlan.meals.length}</Text>
                <Text style={styles.overviewStatLabel}>Meals</Text>
              </View>
              {dietPlan.daily_calories && (
                <View style={styles.overviewStat}>
                  <Text style={styles.overviewStatValue}>{dietPlan.daily_calories}</Text>
                  <Text style={styles.overviewStatLabel}>Daily Cal</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Instructions */}
        {dietPlan.instructions && (
          <Card style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="information-circle" size={24} color={Colors.primary} />
              <Text style={styles.instructionsTitle}>Instructions</Text>
            </View>
            <Text style={styles.instructionsText}>{dietPlan.instructions}</Text>
          </Card>
        )}

        {/* Meals */}
        <Text style={styles.sectionTitle}>Daily Meals</Text>
        {dietPlan.meals.map((meal, index) => (
          <Card key={index} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <View style={styles.mealIconContainer}>
                <Ionicons name={getMealIcon(meal.name) as any} size={24} color={Colors.primary} />
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{meal.name}</Text>
                {meal.time && <Text style={styles.mealTime}>{formatTime(meal.time)}</Text>}
              </View>
            </View>
            {meal.items && meal.items.length > 0 ? (
              <View style={styles.mealItems}>
                {meal.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.mealItem}>
                    <View style={styles.mealItemDot} />
                    <View style={styles.mealItemContent}>
                      <Text style={styles.mealItemName}>{item.name}</Text>
                      <Text style={styles.mealItemDetails}>
                        {item.quantity}{item.calories ? ` • ${item.calories} cal` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noItems}>No items specified</Text>
            )}
          </Card>
        ))}
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
  overviewCard: {
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  overviewContent: {},
  overviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: Spacing.xs,
  },
  overviewDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  overviewStats: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  overviewStat: {
    marginRight: Spacing.xl,
  },
  overviewStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  overviewStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  instructionsCard: {
    marginBottom: Spacing.lg,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginLeft: Spacing.sm,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.textMedium,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  mealCard: {
    marginBottom: Spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  mealIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    textTransform: 'capitalize',
  },
  mealTime: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
  },
  mealItems: {
    marginTop: Spacing.sm,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  mealItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  mealItemContent: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 14,
    color: Colors.textDark,
  },
  mealItemDetails: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
  },
  noItems: {
    fontSize: 14,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
});
