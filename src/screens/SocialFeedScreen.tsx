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
} from "react-native";
import { FeedEntryCard } from "../components/FeedEntryCard";
import { supabase } from "../config/supabase";
import { getFollowing } from "../services/followService";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SocialFeedScreenProps {
  user: any;
  onClose?: () => void;
  onNewEntry?: () => void; // Callback to trigger refresh from parent
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
              entries.map((entry, index) => (
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
});