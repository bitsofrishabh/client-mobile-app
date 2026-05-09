import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../src/context/AuthContext';
import { Card } from '../src/components/Card';
import { Input } from '../src/components/Input';
import { GradientButton } from '../src/components/GradientButton';
import { Colors, Gradients, Spacing, BorderRadius } from '../src/constants/theme';

export default function CoachConnectScreen() {
  const router = useRouter();
  const { user, isCoachConnected, connectCoach, disconnectCoach } = useAuth();

  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    const code = inviteCode.trim();
    if (!code) {
      Alert.alert('Missing code', 'Please enter your dietician\u2019s invite code.');
      return;
    }
    if (!password) {
      Alert.alert('Missing password', 'Please enter a password to secure your portal account.');
      return;
    }
    setLoading(true);
    try {
      const res = await connectCoach(code, password);
      Alert.alert(
        'Connected!',
        res.coach_id
          ? 'You\u2019re now linked with your dietician. Your personalized diet plan will appear here once they assign one.'
          : 'Your portal account was created. If your invite code was correct, your dietician should now see you in their portal.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Could not connect', e?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect from coach?',
      'You will stop receiving your personalized diet plan and updates from your dietician.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnectCoach();
            Alert.alert('Disconnected', 'You\u2019ve been unlinked from your dietician.');
          },
        },
      ]
    );
  };

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
          <Text style={styles.headerTitle}>Connect with Coach</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroCard}
          >
            <View style={styles.heroIcon}>
              <Ionicons name="people" size={32} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>
              {isCoachConnected ? 'You\u2019re connected' : 'Get a personalized diet plan'}
            </Text>
            <Text style={styles.heroSub}>
              {isCoachConnected
                ? 'Your dietician will assign your plan and check on your progress.'
                : 'Enter the invite code from your dietician to link your account.'}
            </Text>
          </LinearGradient>

          {isCoachConnected ? (
            <Card style={styles.statusCard}>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: '#42D742' }]} />
                <Text style={styles.statusText}>Linked to your dietician</Text>
              </View>
              <Text style={styles.statusSub}>
                You\u2019ll receive a notification on this device when a new diet plan is assigned.
              </Text>
              <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectBtn}>
                <Ionicons name="unlink" size={18} color={Colors.error} />
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <>
              <Text style={styles.label}>Dietician invite code</Text>
              <Input
                placeholder="e.g. COACH-ABC123"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                icon="key-outline"
              />

              <Text style={styles.label}>Password</Text>
              <Text style={styles.hint}>
                We\u2019ll create a secure portal account using your email ({user?.email}) and the
                password below. You can use this same password to access the portal later.
              </Text>
              <Input
                placeholder="Choose a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon="lock-closed-outline"
              />

              <GradientButton
                title="Connect with Coach"
                onPress={handleConnect}
                loading={loading}
                style={styles.btn}
              />
            </>
          )}

          <View style={styles.benefits}>
            <Text style={styles.benefitsTitle}>Why connect?</Text>
            {[
              {
                icon: 'nutrition-outline',
                text: 'Personalized diet plan tailored to your goals',
              },
              { icon: 'chatbubbles-outline', text: 'Direct chat with your dietician (coming soon)' },
              { icon: 'notifications-outline', text: 'Push notifications when your plan updates' },
              { icon: 'analytics-outline', text: 'Progress tracking shared with your coach' },
            ].map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name={b.icon as any} size={16} color={Colors.primary} />
                </View>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundGray },
  flex: { flex: 1 },
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
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  statusCard: {
    marginBottom: Spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  statusText: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  statusSub: { fontSize: 12, color: Colors.textMedium, marginBottom: Spacing.md },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  disconnectText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  hint: {
    fontSize: 11,
    color: Colors.textMedium,
    marginBottom: Spacing.xs,
    lineHeight: 16,
  },
  btn: { marginTop: Spacing.md },
  benefits: { marginTop: Spacing.xl },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(146, 163, 253, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  benefitText: {
    fontSize: 13,
    color: Colors.textDark,
    flex: 1,
  },
});
