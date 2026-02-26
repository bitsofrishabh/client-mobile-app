import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { Input } from '../../src/components/Input';
import { GradientButton } from '../../src/components/GradientButton';
import { Colors, Gradients, Spacing, BorderRadius } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

const genderOptions = [
  { value: 'male', label: 'Male', icon: 'male' },
  { value: 'female', label: 'Female', icon: 'female' },
];

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
  { value: 'light', label: 'Light', desc: '1-3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
  { value: 'active', label: 'Active', desc: '6-7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Athlete level' },
];

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Account info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Profile info
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!age) newErrors.age = 'Age is required';
    else if (parseInt(age) < 10 || parseInt(age) > 120) newErrors.age = 'Please enter a valid age';
    if (!gender) newErrors.gender = 'Please select your gender';
    if (!height) newErrors.height = 'Height is required';
    if (!weight) newErrors.weight = 'Weight is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        age: parseInt(age),
        gender,
        height_cm: parseFloat(height),
        weight_kg: parseFloat(weight),
        goal_weight_kg: goalWeight ? parseFloat(goalWeight) : undefined,
        activity_level: activityLevel,
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Registration error:', error);
      const detail = error.response?.data?.detail;
      let message = 'Registration failed. Please try again.';
      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        message = detail[0]?.msg || JSON.stringify(detail[0]);
      }
      Alert.alert('Registration Error', message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hey there,</Text>
        <Text style={styles.title}>Create an Account</Text>
      </View>

      <View style={styles.form}>
        <Input
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          icon="person-outline"
          error={errors.name}
        />

        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
          error={errors.email}
        />

        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          icon="lock-closed-outline"
          error={errors.password}
        />
      </View>

      <View style={styles.footer}>
        <GradientButton title="Next" onPress={handleNext} />

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.greeting}>Let's complete your profile</Text>
        <Text style={styles.title}>It will help us to know more about you!</Text>
      </View>

      <View style={styles.form}>
        {/* Gender Selection */}
        <Text style={styles.label}>Choose Gender</Text>
        <View style={styles.genderContainer}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.genderOption,
                gender === option.value && styles.genderOptionSelected,
              ]}
              onPress={() => setGender(option.value)}
            >
              <Ionicons
                name={option.icon as any}
                size={24}
                color={gender === option.value ? Colors.primary : Colors.textLight}
              />
              <Text
                style={[
                  styles.genderLabel,
                  gender === option.value && styles.genderLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}

        {/* Age */}
        <Input
          placeholder="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          icon="calendar-outline"
          error={errors.age}
        />

        {/* Height and Weight Row */}
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Input
              placeholder="Height (cm)"
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              icon="resize-outline"
              error={errors.height}
            />
          </View>
          <View style={styles.halfInput}>
            <Input
              placeholder="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              icon="barbell-outline"
              error={errors.weight}
            />
          </View>
        </View>

        {/* Goal Weight */}
        <Input
          placeholder="Goal Weight (kg) - Optional"
          value={goalWeight}
          onChangeText={setGoalWeight}
          keyboardType="decimal-pad"
          icon="flag-outline"
        />

        {/* Activity Level */}
        <Text style={styles.label}>Activity Level</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activityScroll}>
          {activityLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.activityOption,
                activityLevel === level.value && styles.activityOptionSelected,
              ]}
              onPress={() => setActivityLevel(level.value)}
            >
              {activityLevel === level.value ? (
                <LinearGradient colors={Gradients.primary} style={styles.activityGradient}>
                  <Text style={styles.activityLabelSelected}>{level.label}</Text>
                  <Text style={styles.activityDescSelected}>{level.desc}</Text>
                </LinearGradient>
              ) : (
                <>
                  <Text style={styles.activityLabel}>{level.label}</Text>
                  <Text style={styles.activityDesc}>{level.desc}</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <GradientButton title="Register" onPress={handleRegister} loading={loading} />

        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textDark} />
          </TouchableOpacity>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
            <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
            <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
          </View>

          {step === 1 ? renderStep1() : renderStep2()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  progressLine: {
    width: 60,
    height: 3,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  progressLineActive: {
    backgroundColor: Colors.primary,
  },
  header: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  genderOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.backgroundGray,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(146, 163, 253, 0.1)',
  },
  genderLabel: {
    fontSize: 14,
    color: Colors.textMedium,
    marginLeft: Spacing.sm,
  },
  genderLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  activityScroll: {
    marginBottom: Spacing.md,
  },
  activityOption: {
    width: 120,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.backgroundGray,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activityOptionSelected: {
    borderColor: Colors.primary,
    padding: 0,
    overflow: 'hidden',
  },
  activityGradient: {
    padding: Spacing.md,
    borderRadius: BorderRadius.medium - 2,
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  activityLabelSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  activityDesc: {
    fontSize: 10,
    color: Colors.textMedium,
    marginTop: 4,
  },
  activityDescSelected: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
  },
  footer: {
    paddingVertical: Spacing.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  loginText: {
    fontSize: 14,
    color: Colors.textDark,
  },
  loginLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  backButtonText: {
    fontSize: 14,
    color: Colors.textMedium,
  },
});
