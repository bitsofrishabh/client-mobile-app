import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { clientAPI } from '../src/services/api';
import { Card } from '../src/components/Card';
import { GradientButton } from '../src/components/GradientButton';
import { Colors, Gradients, Spacing, BorderRadius } from '../src/constants/theme';

const defaultMeals = [
  { meal_name: 'Breakfast', completed: false },
  { meal_name: 'Lunch', completed: false },
  { meal_name: 'Dinner', completed: false },
  { meal_name: 'Snacks', completed: false },
];

const moods = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'tired', emoji: '😫', label: 'Tired' },
  { value: 'stressed', emoji: '😰', label: 'Stressed' },
];

const waterGlasses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function CheckInScreen() {
  const router = useRouter();
  const [meals, setMeals] = useState(defaultMeals);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingCheckin, setExistingCheckin] = useState(false);

  useEffect(() => {
    fetchTodayCheckin();
  }, []);

  const fetchTodayCheckin = async () => {
    try {
      const data = await clientAPI.getCheckinToday();
      if (data.checkin) {
        setExistingCheckin(true);
        if (data.checkin.meals && data.checkin.meals.length > 0) {
          setMeals(data.checkin.meals);
        }
        if (data.checkin.mood) {
          setSelectedMood(data.checkin.mood);
        }
        if (data.checkin.water_glasses) {
          setWaterIntake(data.checkin.water_glasses);
        }
        if (data.checkin.notes) {
          setNotes(data.checkin.notes);
        }
      }
    } catch (error) {
      console.log('No existing checkin');
    }
  };

  const toggleMeal = (index: number) => {
    setMeals((prev) =>
      prev.map((meal, i) =>
        i === index ? { ...meal, completed: !meal.completed } : meal
      )
    );
  };

  const handleSubmit = async () => {
    if (!selectedMood) {
      Alert.alert('Missing Information', 'Please select your mood for today.');
      return;
    }

    setLoading(true);
    try {
      await clientAPI.submitCheckin({
        meals,
        water_glasses: waterIntake,
        mood: selectedMood,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Success', 'Check-in submitted successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit check-in.');
    } finally {
      setLoading(false);
    }
  };

  const completedMeals = meals.filter((m) => m.completed).length;
  const adherenceScore = Math.round((completedMeals / meals.length) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Check-in</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Adherence Preview */}
          <Card style={styles.adherenceCard}>
            <View style={styles.adherenceContent}>
              <LinearGradient
                colors={Gradients.primary}
                style={styles.adherenceCircle}
              >
                <Text style={styles.adherenceValue}>{adherenceScore}%</Text>
              </LinearGradient>
              <View style={styles.adherenceInfo}>
                <Text style={styles.adherenceTitle}>Today's Adherence</Text>
                <Text style={styles.adherenceSubtitle}>
                  {completedMeals} of {meals.length} meals completed
                </Text>
              </View>
            </View>
          </Card>

          {/* Meals Section */}
          <Text style={styles.sectionTitle}>Meals Completed</Text>
          <Card style={styles.mealsCard}>
            {meals.map((meal, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.mealItem,
                  index < meals.length - 1 && styles.mealItemBorder,
                ]}
                onPress={() => toggleMeal(index)}
              >
                <View style={styles.mealInfo}>
                  <Ionicons
                    name={getMealIcon(meal.meal_name)}
                    size={24}
                    color={meal.completed ? Colors.success : Colors.textLight}
                  />
                  <Text
                    style={[
                      styles.mealName,
                      meal.completed && styles.mealNameCompleted,
                    ]}
                  >
                    {meal.meal_name}
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    meal.completed && styles.checkboxChecked,
                  ]}
                >
                  {meal.completed && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </Card>

          {/* Water Intake */}
          <Text style={styles.sectionTitle}>Water Intake</Text>
          <Card style={styles.waterCard}>
            <View style={styles.waterHeader}>
              <Ionicons name="water" size={24} color={Colors.primary} />
              <Text style={styles.waterValue}>{waterIntake} glasses</Text>
            </View>
            <View style={styles.waterGlasses}>
              {waterGlasses.map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.waterGlass,
                    waterIntake >= num && styles.waterGlassFilled,
                  ]}
                  onPress={() => setWaterIntake(num)}
                >
                  <Ionicons
                    name="water"
                    size={20}
                    color={waterIntake >= num ? 'white' : Colors.textLight}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Mood Selection */}
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <Card style={styles.moodCard}>
            <View style={styles.moodOptions}>
              {moods.map((mood) => (
                <TouchableOpacity
                  key={mood.value}
                  style={[
                    styles.moodOption,
                    selectedMood === mood.value && styles.moodOptionSelected,
                  ]}
                  onPress={() => setSelectedMood(mood.value)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      selectedMood === mood.value && styles.moodLabelSelected,
                    ]}
                  >
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Notes */}
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <Card style={styles.notesCard}>
            <TextInput
              style={styles.notesInput}
              placeholder="How did your day go? Any challenges?"
              placeholderTextColor={Colors.textLight}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </Card>

          {/* Submit Button */}
          <GradientButton
            title={existingCheckin ? 'Update Check-in' : 'Submit Check-in'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getMealIcon(mealName: string): any {
  const name = mealName.toLowerCase();
  if (name.includes('breakfast')) return 'sunny-outline';
  if (name.includes('lunch')) return 'restaurant-outline';
  if (name.includes('dinner')) return 'moon-outline';
  if (name.includes('snack')) return 'nutrition-outline';
  return 'fast-food-outline';
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
  closeButton: {
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
  adherenceCard: {
    marginBottom: Spacing.lg,
  },
  adherenceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adherenceCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adherenceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  adherenceInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  adherenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  adherenceSubtitle: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  mealsCard: {
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  mealItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealName: {
    fontSize: 14,
    color: Colors.textDark,
    marginLeft: Spacing.md,
  },
  mealNameCompleted: {
    color: Colors.success,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  waterCard: {
    marginBottom: Spacing.lg,
  },
  waterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  waterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginLeft: Spacing.sm,
  },
  waterGlasses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  waterGlass: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  waterGlassFilled: {
    backgroundColor: Colors.primary,
  },
  moodCard: {
    marginBottom: Spacing.lg,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: 'transparent',
    flex: 1,
    marginHorizontal: 2,
  },
  moodOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundGray,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    color: Colors.textMedium,
  },
  moodLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  notesCard: {
    marginBottom: Spacing.lg,
  },
  notesInput: {
    fontSize: 14,
    color: Colors.textDark,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
