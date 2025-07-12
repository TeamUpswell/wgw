import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import * as Clipboard from 'expo-clipboard'; // Commented out due to native module issue
import { InviteService } from '../services/inviteService';
import { createOrGetUserCode } from '../services/userCodeService';

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  user: any;
  group?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
}


export const InviteModal: React.FC<InviteModalProps> = ({
  visible,
  onClose,
  isDarkMode,
  user,
  group = null,
}) => {
  const [inviteType, setInviteType] = useState<'email' | 'sms' | 'code'>('code');
  const [emailList, setEmailList] = useState('');
  const [phoneList, setPhoneList] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);

  const defaultMessage = group 
    ? `Hey! I'd love to have you join my "${group.name}" group on "What's Going Well" - it's an amazing app for practicing daily gratitude and tracking positive moments together.

We can share our positive experiences and support each other on this wellness journey. The app has inspiring AI coaching and helps build consistent gratitude habits.

Want to join our group and start this positive journey with us?`
    : `Hey! I've been using this amazing app called "What's Going Well" to practice daily gratitude and track positive moments. It's really helping me stay focused on the good things in life, even during tough times. 

The app has inspiring AI coaching and helps build consistent gratitude habits. I think you'd love it too! 

Want to join me on this positive journey?`;

  useEffect(() => {
    if (visible && user?.id && !userCode) {
      loadUserCode();
    }
  }, [visible, user?.id]);

  const loadUserCode = async () => {
    try {
      setLoadingCode(true);
      const code = await createOrGetUserCode(user.id);
      setUserCode(code);
    } catch (error) {
      console.error('Error loading user code:', error);
      Alert.alert('Error', 'Failed to load your user code. Please try again.');
    } finally {
      setLoadingCode(false);
    }
  };

  const handleShareCode = async () => {
    if (!userCode) {
      Alert.alert('Error', 'User code not available. Please try again.');
      return;
    }

    try {
      const shareMessage = group 
        ? `Hey! Join my "${group.name}" group on What's Going Well using my code: ${userCode}\n\n${personalMessage || defaultMessage}`
        : `Hey! Connect with me on What's Going Well using my code: ${userCode}\n\n${personalMessage || defaultMessage}`;
      
      await Share.share({
        message: shareMessage,
        title: group ? `Join ${group.name} Group` : "Connect on What's Going Well",
      });
    } catch (error) {
      console.error('Error sharing code:', error);
      Alert.alert('Error', 'Failed to share code. Please try again.');
    }
  };

  const handleSendInvites = async () => {
    if (inviteType === 'email' && !emailList.trim()) {
      Alert.alert('Error', 'Please enter at least one email address');
      return;
    }
    
    if (inviteType === 'sms' && !phoneList.trim()) {
      Alert.alert('Error', 'Please enter at least one phone number');
      return;
    }

    if (inviteType === 'code') {
      await handleShareCode();
      return;
    }

    setIsLoading(true);

    try {
      if (inviteType === 'email') {
        await sendEmailInvites();
      } else {
        await sendSMSInvites();
      }
      
      Alert.alert(
        'Success!', 
        `Your invites have been sent! Friends will receive a link to download the app.`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error sending invites:', error);
      Alert.alert('Error', 'Failed to send invites. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailInvites = async () => {
    const emails = InviteService.parseContactList(emailList, 'email');

    if (emails.length === 0) {
      throw new Error('No valid email addresses found');
    }

    // Create invite records in database
    const invitePromises = emails.map(email => 
      InviteService.createInvite(user.id, email, 'email', personalMessage || defaultMessage)
    );
    
    const inviteRecords = await Promise.all(invitePromises);
    const inviteCodes = inviteRecords.map(record => record.id);
    
    // Send emails using InviteService
    await InviteService.sendEmailInvites(emails, user, personalMessage || defaultMessage, inviteCodes);
  };

  const sendSMSInvites = async () => {
    const phones = InviteService.parseContactList(phoneList, 'sms');

    if (phones.length === 0) {
      throw new Error('No valid phone numbers found');
    }

    // Create invite records in database
    const invitePromises = phones.map(phone => 
      InviteService.createInvite(user.id, phone, 'sms', personalMessage || defaultMessage)
    );
    
    const inviteRecords = await Promise.all(invitePromises);
    const inviteCodes = inviteRecords.map(record => record.id);
    
    // Send SMS using InviteService
    await InviteService.sendSMSInvites(phones, user, personalMessage || defaultMessage, inviteCodes);
  };





  const styles = getStyles(isDarkMode);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDarkMode ? "#fff" : "#333"} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {group ? `Invite to ${group.name}` : 'Invite Friends'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {/* Invite Type Toggle - Hidden for now, code only */}
          {/* <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, inviteType === 'email' && styles.toggleButtonActive]}
              onPress={() => setInviteType('email')}
            >
              <Ionicons 
                name="mail" 
                size={20} 
                color={inviteType === 'email' ? "#fff" : (isDarkMode ? "#ccc" : "#666")} 
              />
              <Text style={[
                styles.toggleButtonText, 
                inviteType === 'email' && styles.toggleButtonTextActive
              ]}>
                Email
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.toggleButton, inviteType === 'sms' && styles.toggleButtonActive]}
              onPress={() => setInviteType('sms')}
            >
              <Ionicons 
                name="chatbubble" 
                size={20} 
                color={inviteType === 'sms' ? "#fff" : (isDarkMode ? "#ccc" : "#666")} 
              />
              <Text style={[
                styles.toggleButtonText, 
                inviteType === 'sms' && styles.toggleButtonTextActive
              ]}>
                SMS
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.toggleButton, inviteType === 'code' && styles.toggleButtonActive]}
              onPress={() => setInviteType('code')}
            >
              <Ionicons 
                name="qr-code" 
                size={20} 
                color={inviteType === 'code' ? "#fff" : (isDarkMode ? "#ccc" : "#666")} 
              />
              <Text style={[
                styles.toggleButtonText, 
                inviteType === 'code' && styles.toggleButtonTextActive
              ]}>
                Code
              </Text>
            </TouchableOpacity>
          </View> */}

          {/* User Code Display */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Invite Code</Text>
            <Text style={styles.sectionSubtitle}>
              Share this code with friends so they can find and follow you
            </Text>
            {loadingCode ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Generating your code...</Text>
              </View>
            ) : (
              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>{userCode || 'Loading...'}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={async () => {
                    if (userCode) {
                      try {
                        // Try expo-clipboard first (when available)
                        // await Clipboard.setStringAsync(userCode);
                        
                        // Fallback: Show share sheet which allows copying
                        await Share.share({
                          message: userCode,
                          title: 'Your Invite Code',
                        });
                      } catch (error) {
                        // Final fallback: Show code in alert for manual copying
                        Alert.alert(
                          'Your Invite Code', 
                          userCode,
                          [
                            { text: 'OK' },
                            { 
                              text: 'Share', 
                              onPress: () => Share.share({ message: userCode })
                            }
                          ]
                        );
                      }
                    }
                  }}
                >
                  <Ionicons name="copy-outline" size={20} color="#FF6B35" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Personal Message */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Message (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Add a personal touch to your invitation
            </Text>
            <TextInput
              style={styles.messageInput}
              value={personalMessage}
              onChangeText={setPersonalMessage}
              placeholder={defaultMessage}
              placeholderTextColor={isDarkMode ? "#666" : "#999"}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
            onPress={handleSendInvites}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.sendButtonText}>Sending...</Text>
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.sendButtonText}>
                  Share Code
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 50,
      paddingBottom: 16,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    closeButton: {
      padding: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    toggleContainer: {
      flexDirection: "row",
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
      borderRadius: 8,
      padding: 4,
      marginBottom: 24,
    },
    toggleButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 6,
      gap: 8,
    },
    toggleButtonActive: {
      backgroundColor: "#FF6B35",
    },
    toggleButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#ccc" : "#666",
    },
    toggleButtonTextActive: {
      color: "#fff",
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#666",
      marginBottom: 12,
    },
    contactInput: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333",
      minHeight: 100,
      maxHeight: 150,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    messageInput: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333",
      minHeight: 120,
      maxHeight: 200,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    sendButton: {
      backgroundColor: "#FF6B35",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: 12,
      gap: 8,
      marginTop: 8,
      marginBottom: 32,
    },
    sendButtonDisabled: {
      backgroundColor: "#ccc",
      opacity: 0.6,
    },
    sendButtonText: {
      fontSize: 18,
      fontWeight: "600",
      color: "#fff",
    },
    loadingContainer: {
      alignItems: "center",
      paddingVertical: 20,
    },
    loadingText: {
      fontSize: 16,
      color: isDarkMode ? "#888" : "#666",
    },
    codeContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      padding: 20,
      borderWidth: 2,
      borderColor: "#FF6B35",
      borderStyle: "dashed",
    },
    codeText: {
      flex: 1,
      fontSize: 24,
      fontWeight: "bold",
      color: "#FF6B35",
      textAlign: "center",
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    copyButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f8f8f8",
    },
  });