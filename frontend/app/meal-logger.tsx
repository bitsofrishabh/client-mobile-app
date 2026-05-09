import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { mealsAPI, foodsAPI } from '../src/services/api';
import { Card } from '../src/components/Card';
import { GradientButton } from '../src/components/GradientButton';
import { Colors, Gradients, Spacing, BorderRadius } from '../src/constants/theme';

const mealTypes = [
  { id: 'breakfast', name: 'Breakfast', icon: 'sunny', color: '#FFB347' },
  { id: 'lunch', name: 'Lunch', icon: 'restaurant', color: '#5DCCFC' },
  { id: 'dinner', name: 'Dinner', icon: 'moon', color: '#9B8AFB' },
  { id: 'snack', name: 'Snack', icon: 'nutrition', color: '#42D742' },
];

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  quantity?: number;
}

export default function MealLogger() {
  const router = useRouter();
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Load initial foods
    searchFoods('');
  }, []);

  const searchFoods = async (query: string) => {
    setSearching(true);
    try {
      const data = await foodsAPI.search(query);
      setSearchResults(data.foods || []);
    } catch (error) {
      console.error('Error searching foods:', error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchFoods(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addFood = (food: FoodItem) => {
    const existing = selectedFoods.find((f) => f.name === food.name);
    if (existing) {
      setSelectedFoods(
        selectedFoods.map((f) =>
          f.name === food.name ? { ...f, quantity: (f.quantity || 1) + 1 } : f
        )
      );
    } else {
      setSelectedFoods([...selectedFoods, { ...food, quantity: 1 }]);
    }
  };

  const removeFood = (foodName: string) => {
    setSelectedFoods(selectedFoods.filter((f) => f.name !== foodName));
  };

  const getTotalCalories = () => {
    return selectedFoods.reduce((sum, food) => sum + food.calories * (food.quantity || 1), 0);
  };

  const getTotalNutrients = () => {
    return selectedFoods.reduce(
      (totals, food) => ({
        protein: totals.protein + food.protein * (food.quantity || 1),
        carbs: totals.carbs + food.carbs * (food.quantity || 1),
        fat: totals.fat + food.fat * (food.quantity || 1),
      }),
      { protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleLogMeal = async () => {
    if (selectedFoods.length === 0) {
      Alert.alert('No Foods Selected', 'Please add at least one food item.');
      return;
    }

    setLoading(true);
    try {
      const totalCalories = getTotalCalories();
      const foodItems = selectedFoods.map((f) => ({
        name: f.name,
        calories: f.calories * (f.quantity || 1),
        protein: f.protein * (f.quantity || 1),
        carbs: f.carbs * (f.quantity || 1),
        fat: f.fat * (f.quantity || 1),
        quantity: f.quantity || 1,
      }));

      await mealsAPI.log({
        meal_type: selectedMealType,
        food_items: foodItems,
        total_calories: totalCalories,
      });

      Alert.alert('Success', 'Meal logged successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to log meal.');
    } finally {
      setLoading(false);
    }
  };

  const totals = getTotalNutrients();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Meal</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Meal Type Selection */}
          <Text style={styles.sectionTitle}>Meal Type</Text>
          <View style={styles.mealTypes}>
            {mealTypes.map((meal) => (
              <TouchableOpacity
                key={meal.id}
                style={[
                  styles.mealTypeOption,
                  selectedMealType === meal.id && { borderColor: meal.color },
                ]}
                onPress={() => setSelectedMealType(meal.id)}
              >
                <LinearGradient
                  colors={
                    selectedMealType === meal.id
                      ? [meal.color, meal.color + '80']
                      : [Colors.backgroundGray, Colors.backgroundGray]
                  }
                  style={styles.mealTypeIcon}
                >
                  <Ionicons
                    name={meal.icon as any}
                    size={20}
                    color={selectedMealType === meal.id ? 'white' : meal.color}
                  />
                </LinearGradient>
                <Text
                  style={[
                    styles.mealTypeName,
                    selectedMealType === meal.id && { color: meal.color },
                  ]}
                >
                  {meal.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected Foods Summary */}
          {selectedFoods.length > 0 && (
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Selected Foods</Text>
              <View style={styles.nutrientsSummary}>
                <View style={styles.nutrientItem}>
                  <Text style={styles.nutrientValue}>{getTotalCalories()}</Text>
                  <Text style={styles.nutrientLabel}>Calories</Text>
                </View>
                <View style={styles.nutrientItem}>
                  <Text style={[styles.nutrientValue, { color: '#FF6B6B' }]}>{totals.protein.toFixed(0)}g</Text>
                  <Text style={styles.nutrientLabel}>Protein</Text>
                </View>
                <View style={styles.nutrientItem}>
                  <Text style={[styles.nutrientValue, { color: '#5DCCFC' }]}>{totals.carbs.toFixed(0)}g</Text>
                  <Text style={styles.nutrientLabel}>Carbs</Text>
                </View>
                <View style={styles.nutrientItem}>
                  <Text style={[styles.nutrientValue, { color: '#FFB347' }]}>{totals.fat.toFixed(0)}g</Text>
                  <Text style={styles.nutrientLabel}>Fat</Text>
                </View>
              </View>
              {selectedFoods.map((food, index) => (
                <View key={index} style={styles.selectedFood}>
                  <View style={styles.selectedFoodInfo}>
                    <Text style={styles.selectedFoodName}>{food.name}</Text>
                    <Text style={styles.selectedFoodCal}>
                      {food.calories * (food.quantity || 1)} cal ({food.quantity}x)
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFood(food.name)}>
                    <Ionicons name="close-circle" size={24} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </Card>
          )}

          {/* Food Search */}
          <Text style={styles.sectionTitle}>Search Foods</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for food..."
              placeholderTextColor={Colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Food Results */}
          <View style={styles.foodResults}>
            {searchResults.map((food, index) => (
              <TouchableOpacity
                key={index}
                style={styles.foodItem}
                onPress={() => addFood(food)}
              >
                <View style={styles.foodItemInfo}>
                  <Text style={styles.foodItemName}>{food.name}</Text>
                  <Text style={styles.foodItemServing}>{food.serving}</Text>
                </View>
                <View style={styles.foodItemRight}>
                  <Text style={styles.foodItemCalories}>{food.calories} cal</Text>
                  <Ionicons name="add-circle" size={24} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Log Button */}
          <GradientButton
            title={`Log ${mealTypes.find((m) => m.id === selectedMealType)?.name}`}
            onPress={handleLogMeal}
            loading={loading}
            disabled={selectedFoods.length === 0}
            style={styles.logButton}
          />
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  mealTypes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  mealTypeOption: {
    alignItems: 'center',
    width: '23%',
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  mealTypeName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  nutrientsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
  },
  nutrientItem: {
    alignItems: 'center',
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  nutrientLabel: {
    fontSize: 10,
    color: Colors.textMedium,
  },
  selectedFood: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedFoodInfo: {
    flex: 1,
  },
  selectedFoodName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textDark,
  },
  selectedFoodCal: {
    fontSize: 12,
    color: Colors.textMedium,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: Colors.textDark,
    marginLeft: Spacing.sm,
  },
  foodResults: {
    marginBottom: Spacing.lg,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  foodItemServing: {
    fontSize: 12,
    color: Colors.textMedium,
  },
  foodItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodItemCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
  logButton: {
    marginTop: Spacing.md,
  },
});
