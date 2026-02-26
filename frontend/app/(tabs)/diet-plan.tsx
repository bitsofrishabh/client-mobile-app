import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { dietPlanAPI, mealsAPI } from '../../src/services/api';
import { Card } from '../../src/components/Card';
import { Colors, Gradients, Spacing, BorderRadius } from '../../src/constants/theme';

interface DietPlan {
  plan_type: string;
  daily_calories: number;
  meals: Array<{
    type: string;
    time: string;
    target_calories: number;
    suggestions: Array<{
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>;
  }>;
  tips: string[];
}

export default function DietPlanScreen() {
  const router = useRouter();
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayMeals, setTodayMeals] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [planData, mealsData] = await Promise.all([
        dietPlanAPI.getSample(),
        mealsAPI.getToday(),
      ]);
      setDietPlan(planData);
      setTodayMeals(mealsData);
    } catch (error) {
      console.error('Error fetching diet plan:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return 'sunny';
      case 'lunch':
        return 'restaurant';
      case 'dinner':
        return 'moon';
      case 'snack':
        return 'nutrition';
      default:
        return 'fast-food';
    }
  };

  const getMealColor = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return '#FFB347';
      case 'lunch':
        return '#5DCCFC';
      case 'dinner':
        return '#9B8AFB';
      case 'snack':
        return '#42D742';
      default:
        return Colors.primary;
    }
  };

  const getPlanTypeLabel = (type: string) => {
    switch (type) {
      case 'weight_loss':
        return 'Weight Loss Plan';
      case 'weight_gain':
        return 'Weight Gain Plan';
      default:
        return 'Maintenance Plan';
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

  const caloriesConsumed = todayMeals?.total_calories || 0;
  const calorieGoal = dietPlan?.daily_calories || 2000;
  const caloriesRemaining = Math.max(0, calorieGoal - caloriesConsumed);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Diet Plan</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Calorie Overview */}
        <LinearGradient
          colors={Gradients.secondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.overviewCard}
        >
          <View style={styles.overviewContent}>
            <View>
              <Text style={styles.overviewLabel}>{dietPlan ? getPlanTypeLabel(dietPlan.plan_type) : 'Your Plan'}</Text>
              <Text style={styles.overviewCalories}>{calorieGoal} cal/day</Text>
            </View>
            <View style={styles.calorieCircle}>
              <Text style={styles.calorieRemaining}>{caloriesRemaining}</Text>
              <Text style={styles.calorieRemainingLabel}>left</Text>
            </View>
          </View>
          <View style={styles.calorieBar}>
            <View
              style={[
                styles.calorieBarFill,
                { width: `${Math.min(100, (caloriesConsumed / calorieGoal) * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.consumedText}>{caloriesConsumed} cal consumed today</Text>
        </LinearGradient>

        {/* Meal Schedule */}
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        {dietPlan?.meals.map((meal, index) => (
          <Card key={index} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <View style={[styles.mealIconContainer, { backgroundColor: getMealColor(meal.type) + '20' }]}>
                <Ionicons name={getMealIcon(meal.type) as any} size={24} color={getMealColor(meal.type)} />
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealType}>{meal.type}</Text>
                <Text style={styles.mealTime}>{meal.time} • {meal.target_calories} cal target</Text>
              </View>
              <TouchableOpacity style={styles.addMealButton}>
                <Ionicons name="add-circle" size={28} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.suggestionsTitle}>Suggestions</Text>
            {meal.suggestions.map((suggestion, sIndex) => (
              <TouchableOpacity key={sIndex} style={styles.suggestionItem}>
                <View style={styles.suggestionDot} />
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionName}>{suggestion.name}</Text>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionItem}>{suggestion.calories} cal</Text>
                    <Text style={styles.nutritionItem}>P: {suggestion.protein}g</Text>
                    <Text style={styles.nutritionItem}>C: {suggestion.carbs}g</Text>
                    <Text style={styles.nutritionItem}>F: {suggestion.fat}g</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        ))}

        {/* Tips Section */}
        {dietPlan?.tips && dietPlan.tips.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Nutrition Tips</Text>
            <Card style={styles.tipsCard}>
              {dietPlan.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Categories */}
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        <View style={styles.categoriesGrid}>
          {[
            { name: 'Salad', icon: 'leaf', color: '#42D742' },
            { name: 'Protein', icon: 'fish', color: '#FF9B5A' },
            { name: 'Smoothie', icon: 'wine', color: '#9B8AFB' },
            { name: 'Snacks', icon: 'pizza', color: '#5DCCFC' },
          ].map((category, index) => (
            <TouchableOpacity key={index} style={styles.categoryItem}>
              <LinearGradient
                colors={[category.color, category.color + '80']}
                style={styles.categoryIcon}
              >
                <Ionicons name={category.icon as any} size={28} color="white" />
              </LinearGradient>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
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
  overviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  overviewCalories: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 4,
  },
  calorieCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calorieRemaining: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  calorieRemainingLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  calorieBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  calorieBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  consumedText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.sm,
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
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  mealType: {
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
  addMealButton: {
    padding: Spacing.xs,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMedium,
    marginBottom: Spacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  suggestionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textDark,
  },
  nutritionRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  nutritionItem: {
    fontSize: 10,
    color: Colors.textMedium,
    marginRight: Spacing.sm,
  },
  tipsCard: {
    marginBottom: Spacing.lg,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  tipText: {
    fontSize: 14,
    color: Colors.textDark,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  categoryItem: {
    alignItems: 'center',
    width: '22%',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryName: {
    fontSize: 12,
    color: Colors.textMedium,
  },
});
