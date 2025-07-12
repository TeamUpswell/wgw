import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";
import { TopNavigationBar } from "../components/TopNavigationBar";
import * as ImagePicker from "expo-image-picker";
import { resizeImage, AVATAR_OPTIONS } from "../utils/imageUtils";
import { getFollowing, getFollowers } from "../services/followService";
import { NotificationService } from "../services/notificationService";
import { checkAvatarsBucket, testStoragePermissions, testAvatarPermissions } from "../utils/storageTest";

const { width: screenWidth } = Dimensions.get('window');

interface ProfileScreenProps {
  user: any;
  onClose?: () => void;
  isDarkMode?: boolean;
  isOwnProfile?: boolean; // True if viewing own profile, false if viewing someone else's
  onNavigateToHistory?: (entryId?: string) => void; // Navigate to history with optional entry focus
  onNavigateToNotificationManagement?: () => void; // Navigate to notification management
  onLogout?: () => void; // Logout functionality
}

interface ProfileStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  favoriteEntries: number;
  followersCount: number;
  followingCount: number;
  categoriesUsed: string[];
}

interface RecentEntry {
  id: string;
  transcription: string;
  category: string;
  created_at: string;
  favorite: boolean;
  image_url?: string;
}

interface NotificationItem {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  sent_at: string;
  opened_at?: string;
  data?: any;
}

export const EnhancedProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onClose,
  isDarkMode = false,
  isOwnProfile = true,
  onNavigateToHistory,
  onNavigateToNotificationManagement,
  onLogout,
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'notifications' | 'stats'>('overview');
  const [stats, setStats] = useState<ProfileStats>({
    totalEntries: 0,
    currentStreak: 0,
    longestStreak: 0,
    favoriteEntries: 0,
    followersCount: 0,
    followingCount: 0,
    categoriesUsed: [],
  });
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const styles = getStyles(isDarkMode);

  useEffect(() => {
    fetchProfile();
    fetchProfileStats();
    fetchRecentEntries();
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'notifications' && isOwnProfile) {
      fetchNotifications();
    }
  }, [activeTab, user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      setForm(data || {});
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert("Error", "Could not load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileStats = async () => {
    if (!user?.id) return;

    try {
      // Fetch entries stats
      const { data: entriesData } = await supabase
        .from("daily_entries")
        .select("category, favorite, created_at")
        .eq("user_id", user.id);

      // Fetch followers/following counts
      const [followersData, followingData] = await Promise.all([
        getFollowers(user.id),
        getFollowing(user.id),
      ]);

      const totalEntries = entriesData?.length || 0;
      const favoriteEntries = entriesData?.filter(e => e.favorite).length || 0;
      const categoriesUsed = [...new Set(entriesData?.map(e => e.category).filter(Boolean))] || [];
      
      // Calculate streaks (simplified version)
      const currentStreak = calculateStreak(entriesData || []);
      
      setStats({
        totalEntries,
        currentStreak,
        longestStreak: currentStreak, // Simplified for now
        favoriteEntries,
        followersCount: followersData?.data?.length || 0,
        followingCount: followingData?.data?.length || 0,
        categoriesUsed,
      });
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    }
  };

  const fetchRecentEntries = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("daily_entries")
        .select("id, transcription, category, created_at, favorite, image_url")
        .eq("user_id", user.id)
        .eq("is_private", false) // Only show public entries
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setRecentEntries(data || []);
    } catch (error) {
      console.error('Error fetching recent entries:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoadingNotifications(true);
      const notificationHistory = await NotificationService.getNotificationHistory(user.id, 20);
      setNotifications(notificationHistory || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const calculateStreak = (entries: any[]) => {
    // Simplified streak calculation
    if (!entries.length) return 0;
    
    const sortedEntries = entries.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hasEntry = sortedEntries.some(entry => 
        new Date(entry.created_at).toISOString().split('T')[0] === dateStr
      );
      
      if (hasEntry) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update(form)
        .eq("id", user.id);
      
      if (error) throw error;
      
      setEditing(false);
      await fetchProfile();
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert("Error", "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      console.log('🖼️ Starting avatar selection...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (result.canceled) {
        console.log('📷 Avatar selection cancelled');
        return;
      }
      
      if (!result.assets || result.assets.length === 0) {
        console.error('❌ No image selected');
        Alert.alert("Error", "No image was selected");
        return;
      }
      
      console.log('📱 Processing avatar image...');
      const originalUri = result.assets[0].uri;
      console.log('📁 Original image URI:', originalUri);
      
      // Resize and optimize the avatar image
      const resizedImage = await resizeImage(originalUri, AVATAR_OPTIONS);
      console.log('✅ Avatar resized for upload:', resizedImage);
      
      // Upload to Supabase Storage (avatars bucket)
      const fileName = `${user.id}/avatar_${Date.now()}.jpg`;
      console.log('📤 Uploading avatar with filename:', fileName);
      
      const response = await fetch(resizedImage.uri);
      console.log('📥 Fetch response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch resized image: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('📁 Image data size:', arrayBuffer.byteLength, 'bytes');
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Image data is empty');
      }
      
      console.log('☁️ Starting Supabase storage upload to avatars bucket...');
      let { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, arrayBuffer, { 
          upsert: true, 
          contentType: "image/jpeg",
          cacheControl: "3600"
        });
      
      // Fallback to entry-images bucket if avatars bucket doesn't exist
      if (error && error.message?.includes('bucket')) {
        console.log('⚠️ Avatars bucket not found, falling back to entry-images bucket...');
        const fallbackFileName = `avatars/${fileName}`;
        const fallbackResult = await supabase.storage
          .from("entry-images")
          .upload(fallbackFileName, arrayBuffer, { 
            upsert: true, 
            contentType: "image/jpeg",
            cacheControl: "3600"
          });
        data = fallbackResult.data;
        error = fallbackResult.error;
        
        if (!error) {
          // Update fileName for URL generation
          fileName = fallbackFileName;
          console.log('✅ Successfully uploaded to entry-images bucket with fallback path');
        }
      }
      
      if (error) {
        console.error('❌ Supabase upload error:', error);
        
        // Run storage diagnostics
        console.log('🔍 Running storage diagnostics...');
        const bucketCheck = await checkAvatarsBucket();
        const permissionTest = await testAvatarPermissions(user.id);
        
        console.log('📊 Bucket check result:', bucketCheck);
        console.log('📊 Avatar permission test result:', permissionTest);
        
        throw error;
      }
      
      console.log('✅ File uploaded successfully:', data);
      
      // Get public URL from the correct bucket
      const bucketName = fileName.startsWith('avatars/') ? "entry-images" : "avatars";
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
      
      const publicUrl = publicUrlData?.publicUrl;
      console.log('🔗 Public URL generated:', publicUrl);
      
      if (!publicUrl) {
        throw new Error('Failed to generate public URL');
      }
      
      // Update form with the uploaded avatar URL
      setForm({ ...form, avatar_url: publicUrl });
      console.log('✅ Avatar updated in form');
      
      Alert.alert("Success", "Avatar uploaded successfully!");
      
    } catch (error) {
      console.error('💥 Avatar upload error:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to upload avatar. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = "Failed to process the image. Please try a different photo.";
        } else if (error.message.includes('storage')) {
          errorMessage = "Upload failed. Please check your internet connection.";
        } else if (error.message.includes('permissions')) {
          errorMessage = "Permission denied. Please check your account settings.";
        }
      }
      
      Alert.alert("Upload Failed", errorMessage);
    }
  };


  const renderStatCard = (title: string, value: number | string, icon: string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <Ionicons name={icon as any} size={24} color={color} />
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </View>
  );

  const renderRecentEntry = (entry: RecentEntry) => (
    <TouchableOpacity 
      key={entry.id} 
      style={styles.entryCard}
      onPress={() => {
        if (onNavigateToHistory) {
          onNavigateToHistory(entry.id);
        } else {
          // Fallback for when navigation isn't available
          console.log('Navigate to entry:', entry.id);
        }
      }}
      activeOpacity={0.7}
    >
      {entry.image_url && (
        <Image source={{ uri: entry.image_url }} style={styles.entryImage} />
      )}
      <View style={styles.entryContent}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryCategory}>{entry.category}</Text>
          <View style={styles.entryHeaderRight}>
            {entry.favorite && (
              <Ionicons name="heart" size={16} color="#FF6B35" style={styles.favoriteIcon} />
            )}
            <Ionicons name="chevron-forward" size={16} color={isDarkMode ? "#666" : "#999"} />
          </View>
        </View>
        <Text style={styles.entryText} numberOfLines={3}>
          {entry.transcription}
        </Text>
        <Text style={styles.entryDate}>
          {new Date(entry.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {form.avatar_url ? (
            <Image source={{ uri: form.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={isDarkMode ? "#666" : "#999"} />
            </View>
          )}
          {editing && (
            <TouchableOpacity
              onPress={handlePickAvatar}
              style={styles.avatarEditButton}
            >
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.profileInfo}>
          {editing ? (
            <TextInput
              style={styles.nameInput}
              value={form.display_name || form.username || ""}
              onChangeText={(v) => setForm({ ...form, display_name: v })}
              placeholder="Display name"
              placeholderTextColor={isDarkMode ? "#666" : "#999"}
            />
          ) : (
            <Text style={styles.profileName}>
              {profile?.display_name || profile?.username || "Anonymous"}
            </Text>
          )}
          
          <Text style={styles.profileHandle}>@{profile?.username || "user"}</Text>
          
          {editing ? (
            <TextInput
              style={styles.bioInput}
              value={form.bio || ""}
              onChangeText={(v) => setForm({ ...form, bio: v })}
              placeholder="Write something about yourself..."
              placeholderTextColor={isDarkMode ? "#666" : "#999"}
              multiline
              maxLength={150}
            />
          ) : (
            profile?.bio && (
              <Text style={styles.profileBio}>{profile.bio}</Text>
            )
          )}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalEntries}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.followersCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.followingCount}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {/* Notification Management */}
      {isOwnProfile && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notification Templates</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => {
                onNavigateToNotificationManagement?.();
              }}
            >
              <Text style={styles.viewAllText}>Manage</Text>
              <Ionicons name="chevron-forward" size={16} color="#FF6B35" />
            </TouchableOpacity>
          </View>
          <View style={styles.notificationManagementCard}>
            <View style={styles.notificationManagementIcon}>
              <Ionicons name="notifications" size={24} color="#FF6B35" />
            </View>
            <View style={styles.notificationManagementText}>
              <Text style={styles.notificationManagementTitle}>
                Customize Your Notifications
              </Text>
              <Text style={styles.notificationManagementSubtitle}>
                Create, edit, and schedule personalized notification templates
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Account Actions */}
      {isOwnProfile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                "Logout",
                "Are you sure you want to logout?",
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  {
                    text: "Logout",
                    style: "destructive",
                    onPress: () => onLogout?.()
                  }
                ]
              );
            }}
          >
            <View style={styles.logoutIcon}>
              <Ionicons name="log-out" size={24} color="#E74C3C" />
            </View>
            <View style={styles.logoutText}>
              <Text style={styles.logoutTitle}>Logout</Text>
              <Text style={styles.logoutSubtitle}>Sign out of your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderStatsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsGrid}>
        {renderStatCard("Total Entries", stats.totalEntries, "document-text", "#4ECDC4")}
        {renderStatCard("Current Streak", `${stats.currentStreak} days`, "flame", "#FF6B35")}
        {renderStatCard("Favorites", stats.favoriteEntries, "heart", "#E74C3C")}
        {renderStatCard("Categories", stats.categoriesUsed.length, "apps", "#9B59B6")}
      </View>

      {/* Categories Breakdown */}
      {stats.categoriesUsed.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories Used</Text>
          <View style={styles.categoriesContainer}>
            {stats.categoriesUsed.map((category, index) => (
              <View key={index} style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{category}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderNotificationItem = (notification: NotificationItem) => {
    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'friend_entry': return 'people';
        case 'comment': return 'chatbubble';
        case 'like': return 'heart';
        case 'follow_request': return 'person-add';
        case 'daily_reminder': return 'alarm';
        case 'streak_milestone': return 'trophy';
        case 'weekly_summary': return 'calendar';
        case 'monthly_summary': return 'calendar-outline';
        default: return 'notifications';
      }
    };

    const getNotificationColor = (type: string) => {
      switch (type) {
        case 'friend_entry': return '#4ECDC4';
        case 'comment': return '#3498DB';
        case 'like': return '#E74C3C';
        case 'follow_request': return '#9B59B6';
        case 'daily_reminder': return '#FF6B35';
        case 'streak_milestone': return '#F39C12';
        case 'weekly_summary': return '#2ECC71';
        case 'monthly_summary': return '#27AE60';
        default: return '#FF6B35';
      }
    };

    const formatNotificationTime = (dateString: string) => {
      const now = new Date();
      const notificationDate = new Date(dateString);
      const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return notificationDate.toLocaleDateString();
    };

    return (
      <View key={notification.id} style={[styles.notificationCard, !notification.opened_at && styles.unreadNotification]}>
        <View style={[styles.notificationIcon, { backgroundColor: getNotificationColor(notification.notification_type) }]}>
          <Ionicons name={getNotificationIcon(notification.notification_type) as any} size={20} color="#fff" />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationBody}>{notification.body}</Text>
          <Text style={styles.notificationTime}>{formatNotificationTime(notification.sent_at)}</Text>
        </View>
        {!notification.opened_at && (
          <View style={styles.unreadDot} />
        )}
      </View>
    );
  };

  const renderNotificationsTab = () => (
    <View style={styles.tabContent}>
      {loadingNotifications ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length > 0 ? (
        <View style={styles.notificationsList}>
          {notifications.map(renderNotificationItem)}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={48} color={isDarkMode ? "#666" : "#999"} />
          <Text style={styles.emptyStateText}>No notifications yet</Text>
          <Text style={styles.emptyStateSubtext}>
            You'll see your notifications here when friends interact with your entries
          </Text>
        </View>
      )}
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={64} color={isDarkMode ? "#666" : "#999"} />
          <Text style={styles.errorText}>No user found</Text>
          <Text style={styles.errorSubtext}>Please sign in again</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNavigationBar
          user={user}
          title="Profile"
          onProfilePress={() => {}}
          showBackButton={!!onClose}
          onBackPress={onClose}
          isDarkMode={isDarkMode}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopNavigationBar
        user={user}
        title={isOwnProfile ? "Your Profile" : `${profile?.display_name || profile?.username}'s Profile`}
        onProfilePress={() => {}}
        showBackButton={!!onClose}
        onBackPress={onClose}
        isDarkMode={isDarkMode}
      />

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {[
          { key: 'overview', title: 'Overview', icon: 'person' },
          ...(isOwnProfile ? [{ key: 'notifications', title: 'Notifications', icon: 'notifications' }] : []),
          { key: 'stats', title: 'Stats', icon: 'analytics' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
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
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'notifications' && isOwnProfile && renderNotificationsTab()}
        {activeTab === 'stats' && renderStatsTab()}
      </ScrollView>

      {/* Edit/Save Buttons */}
      {isOwnProfile && (
        <View style={styles.actionButtons}>
          {editing ? (
            <View style={styles.editButtonsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setEditing(false);
                  setForm(profile);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.buttonColumn}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => setEditing(true)}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
  },
  
  // Tab Navigation
  tabBar: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: isDarkMode ? '#666' : '#999',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  
  // Content
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  
  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    padding: 20,
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: isDarkMode ? '#3a3a3a' : '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: isDarkMode ? '#666' : '#ddd',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 4,
  },
  profileHandle: {
    fontSize: 16,
    color: isDarkMode ? '#888' : '#666',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 16,
    color: isDarkMode ? '#ccc' : '#555',
    lineHeight: 22,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: '700',
    color: isDarkMode ? '#fff' : '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#FF6B35',
    paddingBottom: 4,
    marginBottom: 8,
  },
  bioInput: {
    fontSize: 16,
    color: isDarkMode ? '#ccc' : '#555',
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  
  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
    fontWeight: '500',
  },
  
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#333',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  
  // Entries Grid
  entriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  entryCard: {
    width: (screenWidth - 56) / 2, // Account for padding and gap
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
    overflow: 'hidden',
  },
  entryImage: {
    width: '100%',
    height: 100,
  },
  entryContent: {
    padding: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    textTransform: 'uppercase',
  },
  entryText: {
    fontSize: 14,
    color: isDarkMode ? '#ccc' : '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 12,
    color: isDarkMode ? '#666' : '#999',
  },
  
  // Stats Grid
  statsGrid: {
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
    fontWeight: '500',
  },
  
  // Categories
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Empty States
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: isDarkMode ? '#666' : '#999',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: isDarkMode ? '#666' : '#999',
    textAlign: 'center',
  },
  
  // Action Buttons
  actionButtons: {
    padding: 16,
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonColumn: {
    gap: 8,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#FF6B35',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: isDarkMode ? '#666' : '#999',
    flex: 1,
  },
  cancelButtonText: {
    color: isDarkMode ? '#888' : '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: isDarkMode ? '#666' : '#ddd',
  },
  testButtonText: {
    color: isDarkMode ? '#666' : '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: isDarkMode ? '#888' : '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: isDarkMode ? '#666' : '#999',
    marginTop: 16,
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 16,
    color: isDarkMode ? '#666' : '#999',
  },
  
  // Entry navigation styles
  entryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  favoriteIcon: {
    marginRight: 4,
  },
  entriesColumn: {
    gap: 12,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
    marginTop: 16,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },

  // Notification Styles
  loadingState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  notificationsList: {
    gap: 8,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
    gap: 12,
  },
  unreadNotification: {
    borderColor: '#FF6B35',
    borderWidth: 2,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: isDarkMode ? '#ccc' : '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: isDarkMode ? '#888' : '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    marginTop: 4,
  },

  // Notification Management Styles
  notificationManagementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  notificationManagementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: isDarkMode ? '#3a3a3a' : '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationManagementText: {
    flex: 1,
  },
  notificationManagementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 4,
  },
  notificationManagementSubtitle: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  logoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: isDarkMode ? '#3a3a3a' : '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoutText: {
    flex: 1,
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E74C3C',
    marginBottom: 4,
  },
  logoutSubtitle: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
    lineHeight: 20,
  },
});