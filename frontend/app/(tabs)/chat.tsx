import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { coachAPI } from '../../src/services/api';
import { Input } from '../../src/components/Input';
import { GradientButton } from '../../src/components/GradientButton';
import { Colors, Gradients, Spacing, BorderRadius, Shadow } from '../../src/constants/theme';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'coach';
  timestamp: Date;
}

export default function ChatScreen() {
  const { user, refreshUser } = useAuth();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [coachCode, setCoachCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const hasCoach = !!user?.coach_code;

  useEffect(() => {
    if (hasCoach) {
      // Load demo messages when connected to coach
      setMessages([
        {
          id: '1',
          content: `Welcome! I'm your assigned coach. I've reviewed your profile and I'm here to help you reach your fitness goals. Feel free to ask me anything!`,
          sender: 'coach',
          timestamp: new Date(Date.now() - 86400000),
        },
        {
          id: '2',
          content: `I've created a personalized diet plan based on your BMI and goals. Check it out in the Diet Plan tab!`,
          sender: 'coach',
          timestamp: new Date(Date.now() - 3600000),
        },
      ]);
    }
  }, [hasCoach]);

  const handleConnectCoach = async () => {
    if (!coachCode.trim()) {
      Alert.alert('Error', 'Please enter a coach code.');
      return;
    }

    setConnecting(true);
    try {
      await coachAPI.connect(coachCode.trim());
      await refreshUser();
      setShowConnectModal(false);
      setCoachCode('');
      Alert.alert('Success', 'Connected to coach successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to connect. Please check the code.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Coach',
      'Are you sure you want to disconnect from your coach?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await coachAPI.disconnect();
              await refreshUser();
              setMessages([]);
            } catch (error) {
              console.error('Error disconnecting:', error);
            }
          },
        },
      ]
    );
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Auto-reply (mock)
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        content: "Thanks for your message! I'll review it and get back to you soon. Keep up the great work with your fitness journey!",
        sender: 'coach',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 2000);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageContainer, isUser && styles.messageContainerUser]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <LinearGradient colors={Gradients.secondary} style={styles.avatar}>
              <Ionicons name="person" size={20} color="white" />
            </LinearGradient>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.messageBubbleUser : styles.messageBubbleCoach,
          ]}
        >
          {isUser ? (
            <LinearGradient colors={Gradients.primary} style={styles.userBubbleGradient}>
              <Text style={styles.messageTextUser}>{item.content}</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.messageTextCoach}>{item.content}</Text>
          )}
        </View>
        <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
          {format(item.timestamp, 'h:mm a')}
        </Text>
      </View>
    );
  };

  // Not connected to coach - show connect screen
  if (!hasCoach) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat with Coach</Text>
        </View>

        <View style={styles.connectContainer}>
          <LinearGradient colors={Gradients.secondary} style={styles.connectIcon}>
            <Ionicons name="chatbubbles" size={60} color="white" />
          </LinearGradient>
          <Text style={styles.connectTitle}>Connect with a Coach</Text>
          <Text style={styles.connectDescription}>
            Get personalized guidance from a professional fitness coach. Enter your coach's code to connect.
          </Text>
          <GradientButton
            title="Connect with Coach"
            onPress={() => setShowConnectModal(true)}
            variant="secondary"
            style={styles.connectButton}
          />

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text style={styles.benefitText}>Personalized diet plans</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text style={styles.benefitText}>Custom workout routines</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text style={styles.benefitText}>Direct messaging support</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text style={styles.benefitText}>Progress tracking & feedback</Text>
            </View>
          </View>
        </View>

        {/* Connect Modal */}
        <Modal visible={showConnectModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowConnectModal(false)}
              >
                <Ionicons name="close" size={24} color={Colors.textDark} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Enter Coach Code</Text>
              <Text style={styles.modalDescription}>
                Ask your coach for their unique code to connect
              </Text>
              <Input
                placeholder="Coach Code (e.g., ABC123)"
                value={coachCode}
                onChangeText={(text) => setCoachCode(text.toUpperCase())}
                autoCapitalize="characters"
                icon="ticket-outline"
              />
              <GradientButton
                title="Connect"
                onPress={handleConnectCoach}
                loading={connecting}
                variant="secondary"
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Connected to coach - show chat
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <LinearGradient colors={Gradients.secondary} style={styles.headerAvatar}>
            <Ionicons name="person" size={24} color="white" />
          </LinearGradient>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Your Coach</Text>
            <Text style={styles.headerSubtitle}>Code: {user?.coach_code}</Text>
          </View>
          <TouchableOpacity onPress={handleDisconnect}>
            <Ionicons name="ellipsis-vertical" size={24} color={Colors.textDark} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mock Banner */}
      <View style={styles.mockBanner}>
        <Ionicons name="information-circle" size={16} color={Colors.warning} />
        <Text style={styles.mockBannerText}>Chat feature is in demo mode (MOCKED)</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textLight}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <LinearGradient
              colors={newMessage.trim() ? Gradients.primary : [Colors.textLight, Colors.textLight]}
              style={styles.sendButtonGradient}
            >
              <Ionicons name="send" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  header: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadow.light,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
  },
  connectContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  connectIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  connectTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  connectDescription: {
    fontSize: 14,
    color: Colors.textMedium,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  connectButton: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  benefitsList: {
    width: '100%',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  benefitText: {
    fontSize: 14,
    color: Colors.textDark,
    marginLeft: Spacing.md,
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
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  modalClose: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.textMedium,
    marginBottom: Spacing.lg,
  },
  mockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3CD',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  mockBannerText: {
    fontSize: 12,
    color: Colors.warning,
    marginLeft: Spacing.xs,
  },
  messagesList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  messageContainer: {
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageContainerUser: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  avatarContainer: {
    marginRight: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
  },
  messageBubbleCoach: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderBottomLeftRadius: 4,
  },
  messageBubbleUser: {
    borderBottomRightRadius: 4,
  },
  userBubbleGradient: {
    padding: Spacing.md,
  },
  messageTextCoach: {
    fontSize: 14,
    color: Colors.textDark,
    lineHeight: 20,
  },
  messageTextUser: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 4,
    marginLeft: 40,
  },
  timestampUser: {
    marginLeft: 0,
    marginRight: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: Colors.backgroundGray,
    borderRadius: BorderRadius.large,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: Colors.textDark,
  },
  sendButton: {
    marginLeft: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
