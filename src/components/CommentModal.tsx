import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment, getComments, addComment, deleteComment } from '../services/socialService';

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  entryId: string;
  user: any;
  isDarkMode?: boolean;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  visible,
  onClose,
  entryId,
  user,
  isDarkMode = false,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = getStyles(isDarkMode);

  useEffect(() => {
    if (visible && entryId) {
      loadComments();
    }
  }, [visible, entryId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const commentsData = await getComments(entryId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      const comment = await addComment(user.id, entryId, newComment);
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(commentId, user.id);
              setComments(prev => prev.filter(comment => comment.id !== commentId));
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return commentDate.toLocaleDateString();
  };

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
          <Text style={styles.title}>Comments</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Comments List */}
        <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.loadingText}>Loading comments...</Text>
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={48} color={isDarkMode ? "#666" : "#999"} />
              <Text style={styles.emptyStateText}>No comments yet</Text>
              <Text style={styles.emptyStateSubtext}>Be the first to leave a comment!</Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <View style={styles.avatarContainer}>
                    <Ionicons name="person-circle" size={32} color={isDarkMode ? "#666" : "#999"} />
                  </View>
                  <View style={styles.commentInfo}>
                    <Text style={styles.commentAuthor}>
                      {comment.user?.display_name || comment.user?.username || 'Unknown User'}
                    </Text>
                    <Text style={styles.commentTime}>
                      {formatTimeAgo(comment.created_at)}
                    </Text>
                  </View>
                  {comment.user_id === user.id && (
                    <TouchableOpacity
                      style={styles.deleteCommentButton}
                      onPress={() => handleDeleteComment(comment.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            ))
          )}
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.commentInput}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Write a comment..."
            placeholderTextColor={isDarkMode ? "#666" : "#999"}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!newComment.trim() || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleAddComment}
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
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
    commentsList: {
      flex: 1,
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 100,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: isDarkMode ? "#888" : "#666",
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 100,
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
    },
    commentCard: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    commentHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    avatarContainer: {
      marginRight: 12,
    },
    commentInfo: {
      flex: 1,
    },
    commentAuthor: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 2,
    },
    commentTime: {
      fontSize: 12,
      color: isDarkMode ? "#888" : "#666",
    },
    deleteCommentButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f8f8f8",
    },
    commentContent: {
      fontSize: 16,
      lineHeight: 22,
      color: isDarkMode ? "#fff" : "#333",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      gap: 12,
    },
    commentInput: {
      flex: 1,
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f8f8f8",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333",
      maxHeight: 100,
      textAlignVertical: "top",
    },
    submitButton: {
      backgroundColor: "#FF6B35",
      borderRadius: 20,
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    submitButtonDisabled: {
      backgroundColor: "#ccc",
      opacity: 0.6,
    },
  });