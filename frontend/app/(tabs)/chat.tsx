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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Gradients, Spacing, BorderRadius, Shadow } from '../../src/constants/theme';
import { format } from 'date-fns';

// Mock messages since API doesn't have chat endpoint
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'coach';
  timestamp: Date;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! Welcome to DietTracker Pro. I'm your coach and I'll be helping you achieve your health goals. Feel free to message me anytime!",
      sender: 'coach',
      timestamp: new Date(Date.now() - 86400000),
    },
    {
      id: '2',
      content: "I've reviewed your profile and created a personalized diet plan for you. Make sure to check it in the Diet Plan tab!",
      sender: 'coach',
      timestamp: new Date(Date.now() - 3600000),
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

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
        content: "Thanks for your message! I'll get back to you soon. In the meantime, don't forget to complete your daily check-in!",
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
            <LinearGradient
              colors={Gradients.primary}
              style={styles.userBubbleGradient}
            >
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <LinearGradient colors={Gradients.secondary} style={styles.headerAvatar}>
            <Ionicons name="person" size={24} color="white" />
          </LinearGradient>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Your Coach</Text>
            <Text style={styles.headerSubtitle}>Usually responds within an hour</Text>
          </View>
        </View>
      </View>

      {/* Mock Banner */}
      <View style={styles.mockBanner}>
        <Ionicons name="information-circle" size={16} color={Colors.warning} />
        <Text style={styles.mockBannerText}>
          Chat feature is currently in demo mode (MOCKED)
        </Text>
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
    marginLeft: Spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
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
