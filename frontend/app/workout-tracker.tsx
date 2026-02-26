import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { workoutAPI } from '../src/services/api';
import { Card } from '../src/components/Card';
import { GradientButton } from '../src/components/GradientButton';
import { Colors, Gradients, Spacing, BorderRadius } from '../src/constants/theme';

const workoutTypes = [
  { id: 'fullbody', name: 'Fullbody Workout', icon: 'body', color: '#FF9B5A', exercises: 11, duration: 32 },
  { id: 'lowerbody', name: 'Lowerbody Workout', icon: 'walk', color: '#9B8AFB', exercises: 12, duration: 40 },
  { id: 'upperbody', name: 'Upperbody Workout', icon: 'fitness', color: '#5DCCFC', exercises: 10, duration: 35 },
  { id: 'abs', name: 'AB Workout', icon: 'flash', color: '#FF6B6B', exercises: 8, duration: 20 },
  { id: 'cardio', name: 'Cardio Workout', icon: 'heart', color: '#42D742', exercises: 6, duration: 25 },
];

const sampleExercises: { [key: string]: Array<{ name: string; sets: number; reps: number }> } = {
  fullbody: [
    { name: 'Jumping Jacks', sets: 3, reps: 20 },
    { name: 'Push-ups', sets: 3, reps: 15 },
    { name: 'Squats', sets: 3, reps: 20 },
    { name: 'Lunges', sets: 3, reps: 12 },
    { name: 'Plank', sets: 3, reps: 30 },
  ],
  lowerbody: [
    { name: 'Squats', sets: 4, reps: 15 },
    { name: 'Lunges', sets: 3, reps: 12 },
    { name: 'Leg Press', sets: 3, reps: 12 },
    { name: 'Calf Raises', sets: 4, reps: 20 },
    { name: 'Deadlifts', sets: 3, reps: 10 },
  ],
  upperbody: [
    { name: 'Push-ups', sets: 4, reps: 15 },
    { name: 'Dumbbell Rows', sets: 3, reps: 12 },
    { name: 'Shoulder Press', sets: 3, reps: 12 },
    { name: 'Bicep Curls', sets: 3, reps: 15 },
    { name: 'Tricep Dips', sets: 3, reps: 12 },
  ],
  abs: [
    { name: 'Crunches', sets: 3, reps: 20 },
    { name: 'Plank', sets: 3, reps: 45 },
    { name: 'Bicycle Crunches', sets: 3, reps: 20 },
    { name: 'Leg Raises', sets: 3, reps: 15 },
  ],
  cardio: [
    { name: 'Running', sets: 1, reps: 15 },
    { name: 'Jump Rope', sets: 3, reps: 100 },
    { name: 'Burpees', sets: 3, reps: 10 },
    { name: 'Mountain Climbers', sets: 3, reps: 20 },
  ],
};

export default function WorkoutTracker() {
  const router = useRouter();
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await workoutAPI.getHistory();
      setHistory(data.workouts || []);
    } catch (error) {
      console.error('Error fetching workout history:', error);
    }
  };

  const handleLogWorkout = async () => {
    if (!selectedWorkout) {
      Alert.alert('Select Workout', 'Please select a workout type.');
      return;
    }

    const workout = workoutTypes.find((w) => w.id === selectedWorkout);
    const mins = parseInt(duration) || workout?.duration || 30;

    setLoading(true);
    try {
      await workoutAPI.log({
        workout_type: selectedWorkout,
        duration_mins: mins,
        exercises: sampleExercises[selectedWorkout] || [],
      });
      Alert.alert('Success', 'Workout logged successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to log workout.');
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
        <Text style={styles.headerTitle}>Workout Tracker</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Choose Workout</Text>

        {workoutTypes.map((workout) => (
          <TouchableOpacity
            key={workout.id}
            style={[
              styles.workoutOption,
              selectedWorkout === workout.id && styles.workoutOptionSelected,
            ]}
            onPress={() => setSelectedWorkout(workout.id)}
          >
            <LinearGradient
              colors={selectedWorkout === workout.id ? [workout.color, workout.color + '80'] : [Colors.backgroundGray, Colors.backgroundGray]}
              style={styles.workoutIcon}
            >
              <Ionicons
                name={workout.icon as any}
                size={24}
                color={selectedWorkout === workout.id ? 'white' : workout.color}
              />
            </LinearGradient>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutName}>{workout.name}</Text>
              <Text style={styles.workoutDetails}>
                {workout.exercises} Exercises | {workout.duration}mins
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedWorkout === workout.id && { backgroundColor: workout.color, borderColor: workout.color },
              ]}
            >
              {selectedWorkout === workout.id && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
          </TouchableOpacity>
        ))}

        {selectedWorkout && (
          <>
            <Text style={styles.sectionTitle}>Exercises</Text>
            <Card style={styles.exercisesCard}>
              {(sampleExercises[selectedWorkout] || []).map((exercise, index) => (
                <View key={index} style={styles.exerciseItem}>
                  <View style={styles.exerciseDot} />
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseReps}>
                      {exercise.sets} sets x {exercise.reps} reps
                    </Text>
                  </View>
                </View>
              ))}
            </Card>

            <Text style={styles.sectionTitle}>Duration (minutes)</Text>
            <View style={styles.durationInput}>
              <TextInput
                style={styles.input}
                placeholder={`Default: ${workoutTypes.find((w) => w.id === selectedWorkout)?.duration || 30}`}
                placeholderTextColor={Colors.textLight}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />
            </View>
          </>
        )}

        <GradientButton
          title="Log Workout"
          onPress={handleLogWorkout}
          loading={loading}
          disabled={!selectedWorkout}
          style={styles.logButton}
        />

        {history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            {history.slice(0, 5).map((workout, index) => (
              <Card key={index} style={styles.historyCard}>
                <View style={styles.historyContent}>
                  <Ionicons name="barbell-outline" size={24} color={Colors.primary} />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyType}>{workout.type}</Text>
                    <Text style={styles.historyDate}>{workout.date}</Text>
                  </View>
                  <Text style={styles.historyDuration}>{workout.duration_mins}min</Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  workoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  workoutOptionSelected: {
    borderColor: Colors.primary,
  },
  workoutIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  workoutName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  workoutDetails: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exercisesCard: {
    marginBottom: Spacing.md,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  exerciseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: Spacing.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textDark,
  },
  exerciseReps: {
    fontSize: 12,
    color: Colors.textMedium,
  },
  durationInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  input: {
    fontSize: 16,
    color: Colors.textDark,
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
  },
  historyInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  historyType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    textTransform: 'capitalize',
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textMedium,
  },
  historyDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
