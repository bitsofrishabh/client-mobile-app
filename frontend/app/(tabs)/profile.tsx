import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { packagesAPI } from '../../src/services/api';
import { Card } from '../../src/components/Card';
import { GradientButton } from '../../src/components/GradientButton';
import { Colors, Gradients, Spacing, BorderRadius, Shadow } from '../../src/constants/theme';
import {
  scheduleMealReminders,
  cancelMealReminders,
  areMealRemindersScheduled,
} from '../../src/services/notifications';

interface Package {
  id: string;
  name: string;
  duration_months: number;
  price: number;
  features: string[];
  popular: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [showPackagesModal, setShowPackagesModal] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [subscribing, setSubscribing] = useState(false);
  const [mealRemindersOn, setMealRemindersOn] = useState(false);

  useEffect(() => {
    fetchPackages();
    (async () => {
      const on = await areMealRemindersScheduled();
      setMealRemindersOn(on);
    })();
  }, []);

  const fetchPackages = async () => {
    try {
      const data = await packagesAPI.getAll();
      setPackages(data.packages || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleSubscribe = async (packageId: string) => {
    setSubscribing(true);
    try {
      await packagesAPI.subscribe(packageId);
      await refreshUser();
      setShowPackagesModal(false);
      Alert.alert('Success', 'Subscribed successfully! (Demo)');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to subscribe.');
    } finally {
      setSubscribing(false);
    }
  };

  const toggleMealReminders = async () => {
    if (mealRemindersOn) {
      await cancelMealReminders();
      setMealRemindersOn(false);
      Alert.alert('Reminders Off', 'Meal reminders have been disabled.');
    } else {
      const ok = await scheduleMealReminders();
      if (ok) {
        setMealRemindersOn(true);
        Alert.alert(
          'Reminders On',
          'You will receive meal reminders at 10:00 AM (Breakfast), 2:00 PM (Lunch), and 9:00 PM (Dinner).'
        );
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in settings to receive meal reminders.'
        );
      }
    }
  };

  const currentPackage = packages.find((p) => p.id === user?.package_id);

  const menuItems = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Personal Data', onPress: () => {} },
        { icon: 'flag-outline', label: 'My Goals', onPress: () => router.push('/goal-selection') },
        { icon: 'camera-outline', label: 'Progress Photos', onPress: () => router.push('/progress-photos') },
        { icon: 'bar-chart-outline', label: 'Weekly Report', onPress: () => router.push('/weekly-report') },
        { icon: 'time-outline', label: 'Activity History', onPress: () => router.push('/(tabs)/progress') },
      ],
    },
    {
      title: 'Subscription',
      items: [
        {
          icon: 'card-outline',
          label: currentPackage ? currentPackage.name : 'No Active Package',
          sublabel: currentPackage ? `${currentPackage.duration_months} month(s)` : 'Tap to view packages',
          onPress: () => setShowPackagesModal(true),
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Meal Reminders',
          sublabel: mealRemindersOn ? 'On (10 AM, 2 PM, 9 PM)' : 'Off — Tap to enable',
          onPress: toggleMealReminders,
        },
        { icon: 'shield-outline', label: 'Privacy Policy', onPress: () => {} },
        { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.profileCard} variant="elevated">
          <View style={styles.profileContent}>
            <LinearGradient colors={Gradients.primary} style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <LinearGradient colors={Gradients.primary} style={styles.editButtonGradient}>
                <Text style={styles.editButtonText}>Edit</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.height_cm || '--'}</Text>
              <Text style={styles.statLabel}>Height (cm)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.weight_kg || '--'}</Text>
              <Text style={styles.statLabel}>Weight (kg)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.age || '--'}</Text>
              <Text style={styles.statLabel}>Age</Text>
            </View>
          </View>
        </Card>

        {/* BMI Card */}
        {user?.bmi && (
          <Card style={styles.bmiCard}>
            <View style={styles.bmiContent}>
              <View>
                <Text style={styles.bmiLabel}>Your BMI</Text>
                <Text style={styles.bmiValue}>{user.bmi.toFixed(1)}</Text>
              </View>
              <View style={styles.bmiCalories}>
                <Text style={styles.caloriesLabel}>Daily Calories</Text>
                <Text style={styles.caloriesValue}>{user.daily_calorie_goal || '--'} cal</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.menuCard}>
              {section.items.map((item: any, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                    <View style={styles.menuItemTextContainer}>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                      {item.sublabel && <Text style={styles.menuItemSublabel}>{item.sublabel}</Text>}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.logoutContent}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.versionText}>DietTracker Pro v2.0.0</Text>
      </ScrollView>

      {/* Packages Modal */}
      <Modal visible={showPackagesModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose a Package</Text>
              <TouchableOpacity onPress={() => setShowPackagesModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {packages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={[
                    styles.packageCard,
                    pkg.popular && styles.packageCardPopular,
                    user?.package_id === pkg.id && styles.packageCardActive,
                  ]}
                  onPress={() => handleSubscribe(pkg.id)}
                  disabled={subscribing}
                >
                  {pkg.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>POPULAR</Text>
                    </View>
                  )}
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <Text style={styles.packagePrice}>
                    ${pkg.price}
                    <Text style={styles.packageDuration}> / {pkg.duration_months} month(s)</Text>
                  </Text>
                  <View style={styles.packageFeatures}>
                    {pkg.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                  {user?.package_id === pkg.id ? (
                    <View style={styles.currentPlanBadge}>
                      <Text style={styles.currentPlanText}>Current Plan</Text>
                    </View>
                  ) : (
                    <GradientButton
                      title="Select Plan"
                      onPress={() => handleSubscribe(pkg.id)}
                      loading={subscribing}
                      style={styles.selectButton}
                      variant={pkg.popular ? 'secondary' : 'primary'}
                    />
                  )}
                </TouchableOpacity>
              ))}

              <Text style={styles.demoNote}>
                Note: This is a demo. No actual payment will be processed.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
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
  profileCard: {
    marginBottom: Spacing.lg,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  profileEmail: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
  },
  editButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  editButtonGradient: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMedium,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  bmiCard: {
    marginBottom: Spacing.lg,
  },
  bmiContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bmiLabel: {
    fontSize: 12,
    color: Colors.textMedium,
  },
  bmiValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  bmiCalories: {
    alignItems: 'flex-end',
  },
  caloriesLabel: {
    fontSize: 12,
    color: Colors.textMedium,
  },
  caloriesValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
  },
  menuSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuCard: {
    paddingVertical: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemTextContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 14,
    color: Colors.textDark,
  },
  menuItemSublabel: {
    fontSize: 11,
    color: Colors.textMedium,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.light,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
    marginLeft: Spacing.sm,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
  },
  packageCard: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageCardPopular: {
    borderColor: Colors.secondary,
  },
  packageCardActive: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '10',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.md,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  packageName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.xs,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  packageDuration: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textMedium,
  },
  packageFeatures: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  featureText: {
    fontSize: 13,
    color: Colors.textDark,
    marginLeft: Spacing.sm,
  },
  currentPlanBadge: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  currentPlanText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  selectButton: {
    height: 48,
  },
  demoNote: {
    fontSize: 12,
    color: Colors.textMedium,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
});
