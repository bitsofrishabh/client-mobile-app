import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { Card } from '../../src/components/Card';
import { Colors, Gradients, Spacing, BorderRadius, Shadow } from '../../src/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Personal Data', onPress: () => {} },
        { icon: 'trophy-outline', label: 'Achievement', onPress: () => {} },
        { icon: 'time-outline', label: 'Activity History', onPress: () => {} },
        { icon: 'bar-chart-outline', label: 'Workout Progress', onPress: () => router.push('/(tabs)/progress') },
      ],
    },
    {
      title: 'Other',
      items: [
        { icon: 'mail-outline', label: 'Contact Us', onPress: () => {} },
        { icon: 'shield-outline', label: 'Privacy Policy', onPress: () => {} },
        { icon: 'settings-outline', label: 'Settings', onPress: () => {} },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card style={styles.profileCard} variant="elevated">
          <View style={styles.profileContent}>
            <LinearGradient colors={Gradients.primary} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <LinearGradient
                colors={Gradients.primary}
                style={styles.editButtonGradient}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={Colors.primary}
                    />
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.textLight}
                  />
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

        {/* App Version */}
        <Text style={styles.versionText}>DietTracker Pro v1.0.0</Text>
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
  },
  menuItemLabel: {
    fontSize: 14,
    color: Colors.textDark,
    marginLeft: Spacing.md,
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
});
