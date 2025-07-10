import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeedEntryCardProps {
  entry: any;
  navigation: any;
  style?: object;
  index?: number;
  currentUserId?: string;
  onPrivacyToggle?: (entryId: string, isPrivate: boolean) => void;
  onDelete?: (entryId: string) => void;
  onAvatarPress?: () => void;
}

export const FeedEntryCard: React.FC<FeedEntryCardProps> = ({ 
  entry, 
  navigation, 
  style = {},
  index = 0,
  currentUserId,
  onPrivacyToggle,
  onDelete,
  onAvatarPress
}) => {
  // Debug logging
  console.log('FeedEntryCard entry:', {
    id: entry.id,
    image_url: entry.image_url,
    transcription: entry.transcription,
    hasImage: !!entry.image_url,
    is_private: entry.is_private,
    favorite: entry.favorite,
    user_id: entry.user_id,
    currentUserId: currentUserId,
    ai_response: entry.ai_response,
    showAICondition: !!(entry.ai_response && currentUserId === entry.user_id)
  });
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const likeAnim = useRef(new Animated.Value(1)).current;
  
  // AI response collapsible state
  const [showAIResponse, setShowAIResponse] = useState(false);
  const aiResponseAnim = useRef(new Animated.Value(0)).current;

  // Animate in on mount
  useEffect(() => {
    const delay = index * 100; // Stagger animation based on index
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, [index]);

  // Animated like button
  const handleLike = () => {
    // Animate the like button
    Animated.sequence([
      Animated.timing(likeAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(likeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    Alert.alert("Like", "You liked this entry!");
    // TODO: Connect to backend
  };

  const handleComment = () => {
    Alert.alert("Comment", "Open comments modal!");
    // TODO: Open comment modal or navigate
  };

  const handleShare = () => {
    Alert.alert("Share", "Share functionality coming soon!");
    // TODO: Implement share logic
  };

  const handlePrivacyToggle = () => {
    if (onPrivacyToggle) {
      const newPrivateState = !entry.is_private;
      onPrivacyToggle(entry.id, newPrivateState);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this entry? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (onDelete) {
              onDelete(entry.id);
            }
          }
        }
      ]
    );
  };

  const toggleAIResponse = () => {
    const toValue = showAIResponse ? 0 : 1;
    console.log('Toggling AI response:', { showAIResponse, toValue, aiResponse: entry.ai_response });
    setShowAIResponse(!showAIResponse);
    
    Animated.timing(aiResponseAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false, // Can't use native driver for layout animations
    }).start();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const entryDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return entryDate.toLocaleDateString();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Header with user info */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <TouchableOpacity 
            onPress={onAvatarPress}
            disabled={!onAvatarPress}
            activeOpacity={0.7}
          >
            {entry.avatar_url ? (
              <Image source={{ uri: entry.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-circle-outline" size={32} color="#bbb" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.userDetails}>
            <Text style={styles.username}>
              {entry.display_name ||
                entry.username ||
                entry.email ||
                "(unknown)"}
            </Text>
            <Text style={styles.timeAgo}>
              {formatTimeAgo(entry.created_at)} • {entry.category || 'General'}
            </Text>
          </View>
        </View>
        
        {/* Header actions - right justified */}
        <View style={styles.headerActions}>
          {/* Favorite button - always visible if entry has favorite property */}
          {entry.favorite !== undefined && (
            <TouchableOpacity 
              style={styles.favoriteButton}
              onPress={() => {
                // TODO: Implement favorite toggle
                console.log('Favorite toggle pressed for entry:', entry.id);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name={entry.favorite ? "star" : "star-outline"} 
                size={18} 
                color={entry.favorite ? "#FFD700" : "#999"} 
              />
            </TouchableOpacity>
          )}
          
          {/* Privacy toggle - only for user's own entries */}
          {currentUserId === entry.user_id && onPrivacyToggle && (
            <TouchableOpacity 
              style={styles.privacyToggleButton}
              onPress={handlePrivacyToggle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name={entry.is_private ? "lock-closed" : "globe-outline"} 
                size={16} 
                color={entry.is_private ? "#e74c3c" : "#27ae60"} 
              />
            </TouchableOpacity>
          )}
          
          {/* Delete button - only for user's own entries */}
          {currentUserId === entry.user_id && onDelete && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={16} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Entry content */}
      <View style={styles.content}>
        {/* Image if present */}
        {entry.image_url && (
          <Animated.View
            style={[
              styles.imageContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image 
              source={{ uri: entry.image_url }} 
              style={styles.entryImage}
              onError={(error) => {
                console.error('Image loading error:', error);
                console.log('Failed image URL:', entry.image_url);
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', entry.image_url);
              }}
            />
          </Animated.View>
        )}

        {/* Text content */}
        {entry.transcription && (
          <Animated.View
            style={[
              styles.textContent,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.transcription}>{entry.transcription}</Text>
          </Animated.View>
        )}

        {/* AI Response - only visible to entry owner */}
        {entry.ai_response && currentUserId === entry.user_id && (
          <View style={styles.aiSection}>
            {/* AI Response Toggle Button */}
            <TouchableOpacity 
              style={styles.aiToggleButton}
              onPress={toggleAIResponse}
            >
              <View style={styles.aiToggleHeader}>
                <Ionicons name="sparkles" size={16} color="#8BC34A" />
                <Text style={styles.aiToggleLabel}>AI Reflection</Text>
                <Ionicons 
                  name={showAIResponse ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#8BC34A" 
                />
              </View>
            </TouchableOpacity>

            {/* Collapsible AI Response Content */}
            {showAIResponse && (
              <Animated.View
                style={[
                  styles.aiResponse,
                  {
                    opacity: aiResponseAnim,
                  },
                ]}
              >
                <Text style={styles.aiText}>{entry.ai_response}</Text>
              </Animated.View>
            )}
          </View>
        )}
      </View>

      {/* Action buttons */}
      <Animated.View
        style={[
          styles.actions,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
            <Ionicons name="heart-outline" size={24} color="#666" />
          </Animated.View>
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
          <Ionicons name="chatbubble-outline" size={24} color="#666" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#666" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // Increased gap to prevent accidental touches
  },
  privacyToggleButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
  },
  favoriteButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    marginRight: 8,
  },
  content: {
    paddingHorizontal: 16,
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  entryImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  textContent: {
    marginBottom: 12,
  },
  transcription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  aiSection: {
    marginBottom: 12,
  },
  aiToggleButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8BC34A',
  },
  aiToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiToggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8BC34A',
    marginLeft: 4,
    textTransform: 'uppercase',
    flex: 1,
  },
  aiResponse: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8BC34A',
    marginTop: 4,
    overflow: 'hidden',
  },
  aiText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  favoriteIndicator: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});