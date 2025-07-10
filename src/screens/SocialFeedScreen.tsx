import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  TextInput,
  Modal,
  Image,
} from "react-native";
import { FeedEntryCard } from "../components/FeedEntryCard";
import { supabase } from "../config/supabase";
import { getFollowing } from "../services/followService";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SocialFeedScreenProps {
  user: any;
  onClose?: () => void;
  onNewEntry?: () => void; // Callback to trigger refresh from parent
}

interface UserProfileModalProps {
  visible: boolean;
  user: any;
  currentUserId: string;
  onClose: () => void;
}

export const SocialFeedScreen: React.FC<SocialFeedScreenProps> = ({
  user,
  onClose,
  onNewEntry,
}) => {
  console.log("[SocialFeedScreen] component function called");
  console.log("[SocialFeedScreen] user prop:", user);
  
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newEntryCount, setNewEntryCount] = useState(0);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  
  // User profile modal state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const newEntryAnim = useRef(new Animated.Value(0)).current;

  // Set up real-time subscription for new entries
  useEffect(() => {
    if (!user?.id) return;

    console.log("[SocialFeedScreen] Setting up real-time subscription");
    
    // Subscribe to new entries
    const channel = supabase
      .channel('social_feed_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'daily_entries',
        },
        (payload) => {
          console.log('New entry detected:', payload.new);
          handleNewEntry(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'daily_entries',
        },
        (payload) => {
          console.log('Entry updated:', payload.new);
          handleEntryUpdate(payload.new);
        }
      )
      .subscribe();

    return () => {
      console.log("[SocialFeedScreen] Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    if (!user) return;
    console.log("[SocialFeedScreen] useEffect running, user:", user);
    fetchFeed();
  }, [user?.id]);

  // Animate in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleNewEntry = async (newEntry: any) => {
    // Check if this entry should appear in our feed
    const followingData = await getFollowing(user.id);
    const followingIds = followingData?.data?.map((f: any) => f.followed_id) || [];
    const relevantUserIds = [user.id, ...followingIds];
    
    if (relevantUserIds.includes(newEntry.user_id)) {
      // Fetch the complete entry with user info
      const { data: completeEntry } = await supabase
        .from("daily_entries")
        .select("*, user:users(id, username, display_name, avatar_url, bio)")
        .eq("id", newEntry.id)
        .single();

      if (completeEntry) {
        const entryWithUserInfo = {
          ...completeEntry,
          username: completeEntry.user?.username,
          display_name: completeEntry.user?.display_name,
          avatar_url: completeEntry.user?.avatar_url,
          bio: completeEntry.user?.bio,
        };

        // Add to the top of the list with animation
        setEntries(prev => [entryWithUserInfo, ...prev]);
        setNewEntryCount(prev => prev + 1);
        
        // Animate the new entry indicator
        Animated.sequence([
          Animated.timing(newEntryAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(2000),
          Animated.timing(newEntryAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setNewEntryCount(0);
        });
      }
    }
  };

  const handleEntryUpdate = (updatedEntry: any) => {
    setEntries(prev => prev.map(entry => 
      entry.id === updatedEntry.id 
        ? { ...entry, ...updatedEntry }
        : entry
    ));
  };

  const fetchFeed = async () => {
    console.log("[SocialFeedScreen] fetchFeed called, user:", user);
    if (!user?.id) {
      console.log("[SocialFeedScreen] fetchFeed: No user.id, aborting");
      return;
    }
    
    if (!refreshing) {
      setLoading(true);
    }
    
    try {
      // 1. Get list of user IDs to show (self + following)
      const { data: followingData, error: followingError } = await getFollowing(
        user.id
      );
      console.log("getFollowing:", { followingData, followingError });
      const followingIds = followingData?.map((f: any) => f.followed_id) || [];
      const userIds = [user.id, ...followingIds];
      console.log("userIds for feed:", userIds);
      
      // 2. Fetch entries for these users
      const { data: entriesData, error } = await supabase
        .from("daily_entries")
        .select("*, user:users(id, username, display_name, avatar_url, bio)")
        .in("user_id", userIds)
        .or(`is_private.eq.false,user_id.eq.${user.id}`) // Show public entries OR user's own private entries
        .order("created_at", { ascending: false })
        .limit(50); // Limit for performance
        
      console.log("entriesData:", entriesData, "error:", error);
      
      if (error) {
        setEntries([]);
      } else {
        // Attach username to each entry for FeedEntryCard
        const withUserInfo = entriesData.map((entry: any) => {
          console.log('🔍 SocialFeed entry:', {
            id: entry.id,
            image_url: entry.image_url,
            transcription: entry.transcription?.substring(0, 30) + '...',
            created_at: entry.created_at
          });
          return {
            ...entry,
            username: entry.user?.username,
            display_name: entry.user?.display_name,
            avatar_url: entry.user?.avatar_url,
            bio: entry.user?.bio,
          };
        });
        
        // Animate entries in
        setEntries(withUserInfo);
        animateEntriesIn(withUserInfo.length);
      }
    } catch (err) {
      console.error("SocialFeedScreen fetchFeed error:", err);
      setEntries([]);
    }
    
    setLoading(false);
  };

  const animateEntriesIn = (count: number) => {
    // Stagger animation for entries
    const animations = Array.from({ length: Math.min(count, 5) }, (_, index) =>
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    
    Animated.stagger(100, animations).start();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  };

  // Filter entries based on search, date, and category
  const getFilteredEntries = () => {
    let filtered = [...entries];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.transcription?.toLowerCase().includes(query) ||
        entry.category?.toLowerCase().includes(query) ||
        entry.display_name?.toLowerCase().includes(query) ||
        entry.username?.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(entry => new Date(entry.created_at) >= cutoff);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(entry => 
        (entry.category || 'Uncategorized') === categoryFilter
      );
    }

    return filtered;
  };

  // Get unique categories from all entries
  const getAvailableCategories = () => {
    const categories = new Set<string>();
    entries.forEach(entry => {
      categories.add(entry.category || 'Uncategorized');
    });
    return Array.from(categories).sort();
  };

  // Handle avatar click to show user profile
  const handleAvatarPress = async (entry: any) => {
    if (entry.user_id === user.id) {
      // Don't show modal for current user's own entries
      return;
    }

    try {
      // Fetch user's entries
      const { data: userEntries, error } = await supabase
        .from("daily_entries")
        .select("*, user:users(id, username, display_name, avatar_url, bio)")
        .eq("user_id", entry.user_id)
        .eq("is_private", false) // Only show public entries
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching user entries:", error);
        return;
      }

      const userWithEntries = {
        id: entry.user_id,
        username: entry.username,
        display_name: entry.display_name,
        avatar_url: entry.avatar_url,
        bio: entry.bio,
        entries: userEntries || []
      };

      setSelectedUser(userWithEntries);
      setShowUserProfile(true);
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const handlePrivacyToggle = async (entryId: string, isPrivate: boolean) => {
    try {
      const { error } = await supabase
        .from("daily_entries")
        .update({ is_private: isPrivate })
        .eq("id", entryId);

      if (error) {
        console.error("Error updating privacy:", error);
        return;
      }

      // Update local state
      setEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, is_private: isPrivate }
          : entry
      ));

      console.log(`✅ Entry ${entryId} privacy updated to: ${isPrivate ? 'private' : 'public'}`);
    } catch (error) {
      console.error("Privacy toggle error:", error);
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      console.log(`🗑️ Deleting entry: ${entryId}`);
      
      const { error } = await supabase
        .from("daily_entries")
        .delete()
        .eq("id", entryId);

      if (error) {
        console.error("Error deleting entry:", error);
        Alert.alert("Error", "Failed to delete entry. Please try again.");
        return;
      }

      // Remove from local state
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
      
      console.log(`✅ Entry ${entryId} deleted successfully`);
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert("Error", "Failed to delete entry. Please try again.");
    }
  };

  // Expose refresh function to parent component
  React.useImperativeHandle(onNewEntry, () => ({
    refresh: fetchFeed,
  }), [fetchFeed]);

  if (!user) {
    console.log("[SocialFeedScreen] !user guard hit");
    return (
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.header}>Your Social Feed</Text>
          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeTouchable}
              accessibilityLabel="Close Social Feed"
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <ActivityIndicator
          size="large"
          color="#8BC34A"
          style={{ marginTop: 40 }}
        />
        <Text style={{ textAlign: "center", marginTop: 20, color: "#888" }}>
          Loading user info...
        </Text>
      </Animated.View>
    );
  }

  console.log(
    "[SocialFeedScreen] render, loading:",
    loading,
    "user:",
    user,
    "entries:",
    entries
  );

  try {
    return (
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.header}>Your Social Feed</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              style={styles.filterToggle}
            >
              <Ionicons 
                name={showFilters ? "options" : "options-outline"} 
                size={24} 
                color="#FF6B35" 
              />
            </TouchableOpacity>
            {onClose && (
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeTouchable}
                accessibilityLabel="Close Social Feed"
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filters Section */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            {/* Search */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search entries, users, categories..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterButtonsRow}>
              {/* Date Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {[
                    { key: 'all', label: 'All Time' },
                    { key: '7d', label: 'Last 7 Days' },
                    { key: '30d', label: 'Last 30 Days' },
                    { key: '90d', label: 'Last 90 Days' }
                  ].map(option => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterButton,
                        dateFilter === option.key && styles.activeFilterButton
                      ]}
                      onPress={() => setDateFilter(option.key as any)}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        dateFilter === option.key && styles.activeFilterButtonText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Category Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      categoryFilter === 'all' && styles.activeFilterButton
                    ]}
                    onPress={() => setCategoryFilter('all')}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      categoryFilter === 'all' && styles.activeFilterButtonText
                    ]}>
                      All Categories
                    </Text>
                  </TouchableOpacity>
                  {getAvailableCategories().map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterButton,
                        categoryFilter === category && styles.activeFilterButton
                      ]}
                      onPress={() => setCategoryFilter(category)}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        categoryFilter === category && styles.activeFilterButtonText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        )}

        {/* New Entry Indicator */}
        {newEntryCount > 0 && (
          <Animated.View
            style={[
              styles.newEntryIndicator,
              {
                opacity: newEntryAnim,
                transform: [
                  {
                    translateY: newEntryAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.newEntryText}>
              {newEntryCount} new {newEntryCount === 1 ? 'entry' : 'entries'}!
            </Text>
          </Animated.View>
        )}

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#8BC34A"
            style={{ marginTop: 40 }}
          />
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor="#8BC34A"
                colors={["#8BC34A"]}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {entries.length === 0 ? (
              <Animated.View
                style={[
                  styles.emptyContainer,
                  {
                    opacity: fadeAnim,
                  }
                ]}
              >
                <Text style={styles.empty}>
                  No entries yet. Start following friends or add your own!
                </Text>
              </Animated.View>
            ) : (
              getFilteredEntries().map((entry, index) => (
                <Animated.View
                  key={entry.id}
                  style={{
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <FeedEntryCard 
                    entry={entry} 
                    navigation={null}
                    currentUserId={user.id}
                    onPrivacyToggle={handlePrivacyToggle}
                    onDelete={handleDelete}
                    onAvatarPress={() => handleAvatarPress(entry)}
                    style={{
                      marginHorizontal: 16,
                      marginVertical: 8,
                      borderRadius: 12,
                      backgroundColor: '#fff',
                      shadowColor: '#000',
                      shadowOffset: {
                        width: 0,
                        height: 2,
                      },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  />
                </Animated.View>
              ))
            )}
          </ScrollView>
        )}

        {/* User Profile Modal */}
        {showUserProfile && selectedUser && (
          <Modal
            visible={showUserProfile}
            animationType="slide"
            presentationStyle="pageSheet"
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  onPress={() => setShowUserProfile(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {selectedUser.display_name || selectedUser.username}'s Entries
                </Text>
                <View style={styles.modalHeaderSpacer} />
              </View>

              <View style={styles.modalUserInfo}>
                {selectedUser.avatar_url ? (
                  <Image 
                    source={{ uri: selectedUser.avatar_url }} 
                    style={styles.modalAvatar} 
                  />
                ) : (
                  <View style={styles.modalAvatarPlaceholder}>
                    <Ionicons name="person" size={32} color="#999" />
                  </View>
                )}
                <View style={styles.modalUserDetails}>
                  <Text style={styles.modalUsername}>
                    {selectedUser.display_name || selectedUser.username}
                  </Text>
                  {selectedUser.bio && (
                    <Text style={styles.modalUserBio}>{selectedUser.bio}</Text>
                  )}
                  <Text style={styles.modalEntryCount}>
                    {selectedUser.entries.length} public entries
                  </Text>
                </View>
              </View>

              <ScrollView style={styles.modalEntriesList}>
                {selectedUser.entries.length === 0 ? (
                  <Text style={styles.modalEmptyText}>No public entries yet</Text>
                ) : (
                  selectedUser.entries.map((entry: any) => (
                    <View key={entry.id} style={styles.modalEntryCard}>
                      <View style={styles.modalEntryHeader}>
                        <Text style={styles.modalEntryCategory}>
                          {entry.category || 'General'}
                        </Text>
                        <Text style={styles.modalEntryDate}>
                          {new Date(entry.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      {entry.image_url && (
                        <Image 
                          source={{ uri: entry.image_url }} 
                          style={styles.modalEntryImage} 
                        />
                      )}
                      <Text style={styles.modalEntryText}>
                        {entry.transcription}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </Modal>
        )}
      </Animated.View>
    );
  } catch (err) {
    console.error("[SocialFeedScreen] ERROR before render:", err);
    return (
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: "#fff",
            justifyContent: "center",
            alignItems: "center",
          },
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <Text style={{ fontSize: 20, color: "red" }}>
          Error rendering Social Feed
        </Text>
        <Text selectable style={{ color: "#333", marginTop: 10 }}>
          {String(err)}
        </Text>
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={{
              marginTop: 20,
              padding: 12,
              backgroundColor: "#eee",
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 18, color: "#888" }}>Close</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f5f5f5", 
    paddingTop: 40 
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 16,
  },
  header: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#333" 
  },
  closeButton: {
    fontSize: 28,
    color: "#888",
    padding: 8,
    marginLeft: 12,
  },
  closeTouchable: { 
    padding: 4, 
    marginLeft: 8 
  },
  newEntryIndicator: {
    backgroundColor: "#8BC34A",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  newEntryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  empty: { 
    textAlign: "center", 
    color: "#888", 
    marginTop: 40, 
    fontSize: 16,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  
  // Filter styles
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterToggle: {
    padding: 8,
    marginRight: 12,
  },
  filtersContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
  },
  searchIcon: {
    marginLeft: 8,
  },
  filterButtonsRow: {
    gap: 16,
  },
  filterGroup: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  filterButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeFilterButton: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeFilterButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  modalAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  modalUserDetails: {
    flex: 1,
  },
  modalUsername: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  modalUserBio: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  modalEntryCount: {
    fontSize: 12,
    color: "#999",
  },
  modalEntriesList: {
    flex: 1,
    padding: 16,
  },
  modalEmptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    marginTop: 40,
  },
  modalEntryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalEntryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalEntryCategory: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF6B35",
    backgroundColor: "#fff5f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalEntryDate: {
    fontSize: 12,
    color: "#999",
  },
  modalEntryImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalEntryText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
});