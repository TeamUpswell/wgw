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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  createOrGetUserCode, 
  sendFollowRequest, 
  getFollowRequests,
  acceptFollowRequest,
  declineFollowRequest,
  FollowRequest 
} from '../services/userCodeService';

interface UserCodeModalProps {
  visible: boolean;
  onClose: () => void;
  user: any;
  isDarkMode?: boolean;
}

export const UserCodeModal: React.FC<UserCodeModalProps> = ({
  visible,
  onClose,
  user,
  isDarkMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'connect' | 'requests'>('share');
  const [userCode, setUserCode] = useState<string | null>(null);
  const [enterCode, setEnterCode] = useState('');
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = getStyles(isDarkMode);

  useEffect(() => {
    if (visible && user?.id) {
      loadUserCode();
      loadFollowRequests();
    }
  }, [visible, user?.id]);

  const loadUserCode = async () => {
    try {
      setIsLoading(true);
      const code = await createOrGetUserCode(user.id);
      setUserCode(code);
    } catch (error) {
      console.error('Error loading user code:', error);
      Alert.alert('Error', 'Failed to load your user code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFollowRequests = async () => {
    try {
      const requests = await getFollowRequests(user.id);
      setFollowRequests(requests);
    } catch (error) {
      console.error('Error loading follow requests:', error);
    }
  };

  const handleShareCode = async () => {
    if (!userCode) return;

    try {
      const shareMessage = `Hey! Connect with me on What's Going Well using my code: ${userCode}\n\nWhat's Going Well is an app for practicing daily gratitude and sharing positive moments. Enter my code in the app to follow each other!`;
      
      await Share.share({
        message: shareMessage,
        title: "Connect on What's Going Well",
      });
    } catch (error) {
      console.error('Error sharing code:', error);
      Alert.alert('Error', 'Failed to share code. Please try again.');
    }
  };

  const handleSendRequest = async () => {
    if (!enterCode.trim()) {
      Alert.alert('Error', 'Please enter a user code.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await sendFollowRequest(user.id, enterCode.trim());
      
      if (result.success) {
        Alert.alert('Success!', result.message);
        setEnterCode('');
        setActiveTab('requests'); // Switch to requests tab
        loadFollowRequests(); // Refresh requests
      } else {
        Alert.alert('Unable to Send Request', result.message);
      }
    } catch (error) {
      console.error('Error sending follow request:', error);
      Alert.alert('Error', 'Failed to send follow request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const success = await acceptFollowRequest(requestId);
      if (success) {
        Alert.alert('Success!', 'Follow request accepted!');
        loadFollowRequests(); // Refresh requests
      } else {
        Alert.alert('Error', 'Failed to accept request. Please try again.');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request. Please try again.');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const success = await declineFollowRequest(requestId);
      if (success) {
        loadFollowRequests(); // Refresh requests
      } else {
        Alert.alert('Error', 'Failed to decline request. Please try again.');
      }
    } catch (error) {
      console.error('Error declining request:', error);
      Alert.alert('Error', 'Failed to decline request. Please try again.');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const requestDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return requestDate.toLocaleDateString();
  };

  const renderShareTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Code</Text>
        <Text style={styles.sectionSubtitle}>
          Share this code with friends so they can follow you
        </Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Generating your code...</Text>
          </View>
        ) : (
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{userCode || 'Loading...'}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => {
                if (userCode) {
                  Alert.alert('Copy Code', `Your code is: ${userCode}\n\nLong press to select and copy this code.`);
                }
              }}
            >
              <Ionicons name="copy-outline" size={20} color="#FF6B35" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareCode}
          disabled={!userCode}
        >
          <Ionicons name="share-outline" size={24} color="#fff" />
          <Text style={styles.shareButtonText}>Share Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Ionicons name="information-circle-outline" size={24} color="#FF6B35" />
        <Text style={styles.infoText}>
          When someone enters your code, you'll receive a follow request that you can accept or decline.
        </Text>
      </View>
    </View>
  );

  const renderConnectTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enter Friend's Code</Text>
        <Text style={styles.sectionSubtitle}>
          Enter a code to send them a follow request
        </Text>
        
        <TextInput
          style={styles.codeInput}
          value={enterCode}
          onChangeText={(text) => setEnterCode(text.toUpperCase())}
          placeholder="WGW-ABCD"
          placeholderTextColor={isDarkMode ? "#666" : "#999"}
          autoCapitalize="characters"
          maxLength={8}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.connectButton,
          (!enterCode.trim() || isSubmitting) && styles.connectButtonDisabled
        ]}
        onPress={handleSendRequest}
        disabled={!enterCode.trim() || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="person-add-outline" size={24} color="#fff" />
            <Text style={styles.connectButtonText}>Send Follow Request</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.infoSection}>
        <Ionicons name="information-circle-outline" size={24} color="#FF6B35" />
        <Text style={styles.infoText}>
          Enter a friend's code to send them a follow request. They can choose to accept or decline.
        </Text>
      </View>
    </View>
  );

  const renderRequestsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>
        Follow Requests ({followRequests.length})
      </Text>
      
      {followRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="person-add-outline" size={48} color={isDarkMode ? "#666" : "#999"} />
          <Text style={styles.emptyStateText}>No pending requests</Text>
          <Text style={styles.emptyStateSubtext}>
            Follow requests will appear here when people use your code
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.requestsList} showsVerticalScrollIndicator={false}>
          {followRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.avatarContainer}>
                  <Ionicons name="person-circle" size={40} color={isDarkMode ? "#666" : "#999"} />
                </View>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestName}>
                    {request.requester?.email || 'Unknown User'}
                  </Text>
                  <Text style={styles.requestTime}>
                    {formatTimeAgo(request.created_at)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => handleDeclineRequest(request.id)}
                >
                  <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptRequest(request.id)}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDarkMode ? "#fff" : "#333"} />
          </TouchableOpacity>
          <Text style={styles.title}>Connect with Friends</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          {[
            { key: 'share', title: 'Share Code', icon: 'share-outline' },
            { key: 'connect', title: 'Connect', icon: 'person-add-outline' },
            { key: 'requests', title: 'Requests', icon: 'mail-outline', badge: followRequests.length },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <View style={styles.tabIconContainer}>
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={activeTab === tab.key ? '#FF6B35' : (isDarkMode ? '#666' : '#999')}
                />
                <Text style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText
                ]}>
                  {tab.title}
                </Text>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'share' && renderShareTab()}
          {activeTab === 'connect' && renderConnectTab()}
          {activeTab === 'requests' && renderRequestsTab()}
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
    tabBar: {
      flexDirection: "row",
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: "#FF6B35",
    },
    tabIconContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "500",
      color: isDarkMode ? "#666" : "#999",
    },
    activeTabText: {
      color: "#FF6B35",
      fontWeight: "600",
    },
    badge: {
      backgroundColor: "#FF6B35",
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 4,
    },
    badgeText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
    },
    content: {
      flex: 1,
    },
    tabContent: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 8,
    },
    sectionSubtitle: {
      fontSize: 16,
      color: isDarkMode ? "#888" : "#666",
      marginBottom: 16,
      lineHeight: 22,
    },
    loadingContainer: {
      alignItems: "center",
      paddingVertical: 32,
    },
    loadingText: {
      marginTop: 12,
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
    shareButton: {
      backgroundColor: "#FF6B35",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: 12,
      gap: 8,
    },
    shareButtonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "600",
    },
    codeInput: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 20,
      color: isDarkMode ? "#fff" : "#333",
      borderWidth: 2,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      textAlign: "center",
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontWeight: "bold",
    },
    connectButton: {
      backgroundColor: "#4CAF50",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: 12,
      gap: 8,
      marginTop: 16,
    },
    connectButtonDisabled: {
      backgroundColor: "#ccc",
      opacity: 0.6,
    },
    connectButtonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "600",
    },
    infoSection: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: "#FF6B35",
      gap: 12,
      marginTop: 16,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#666",
      lineHeight: 20,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: "600",
      color: isDarkMode ? "#888" : "#666",
      marginTop: 16,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: isDarkMode ? "#666" : "#999",
      marginTop: 8,
      textAlign: "center",
      paddingHorizontal: 20,
    },
    requestsList: {
      flex: 1,
    },
    requestCard: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    requestHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    avatarContainer: {
      marginRight: 12,
    },
    requestInfo: {
      flex: 1,
    },
    requestName: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 2,
    },
    requestTime: {
      fontSize: 12,
      color: isDarkMode ? "#888" : "#666",
    },
    requestActions: {
      flexDirection: "row",
      gap: 12,
    },
    declineButton: {
      flex: 1,
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: isDarkMode ? "#666" : "#999",
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
    },
    declineButtonText: {
      color: isDarkMode ? "#666" : "#999",
      fontSize: 16,
      fontWeight: "600",
    },
    acceptButton: {
      flex: 1,
      backgroundColor: "#4CAF50",
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
    },
    acceptButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });