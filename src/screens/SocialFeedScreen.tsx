import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { FeedEntryCard } from "../components/FeedEntryCard";
import { supabase } from "../config/supabase";
import { getFollowing } from "../services/followService";

console.log("[SocialFeedScreen] file loaded");

export const SocialFeedScreen = ({
  user,
  onClose,
}: {
  user: any;
  onClose?: () => void;
}) => {
  console.log("[SocialFeedScreen] component function called");
  console.log("[SocialFeedScreen] user prop:", user);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    console.log("[SocialFeedScreen] useEffect running, user:", user);
    fetchFeed();
  }, [user?.id]);

  const fetchFeed = async () => {
    console.log("[SocialFeedScreen] fetchFeed called, user:", user);
    if (!user?.id) {
      console.log("[SocialFeedScreen] fetchFeed: No user.id, aborting");
      return;
    }
    setLoading(true);
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
        .order("created_at", { ascending: false });
      console.log("entriesData:", entriesData, "error:", error);
      if (error) {
        setEntries([]);
      } else {
        // Attach username to each entry for FeedEntryCard
        const withUserInfo = entriesData.map((entry: any) => ({
          ...entry,
          username: entry.user?.username,
          display_name: entry.user?.display_name,
          avatar_url: entry.user?.avatar_url,
          bio: entry.user?.bio,
        }));
        setEntries(withUserInfo);
      }
    } catch (err) {
      console.error("SocialFeedScreen fetchFeed error:", err);
      setEntries([]);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  };

  if (!user) {
    console.log("[SocialFeedScreen] !user guard hit");
    return (
      <View style={styles.container}>
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
      </View>
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
      <View style={styles.container}>
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
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#8BC34A"
            style={{ marginTop: 40 }}
          />
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {entries.length === 0 ? (
              <Text style={styles.empty}>
                No entries yet. Start following friends or add your own!
              </Text>
            ) : (
              entries.map((entry) => (
                <FeedEntryCard key={entry.id} entry={entry} navigation={null} />
              ))
            )}
          </ScrollView>
        )}
      </View>
    );
  } catch (err) {
    console.error("[SocialFeedScreen] ERROR before render:", err);
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
        }}
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
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", paddingTop: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
  },
  header: { fontSize: 24, fontWeight: "bold", color: "#333" },
  closeButton: {
    fontSize: 28,
    color: "#888",
    padding: 8,
    marginLeft: 12,
  },
  closeTouchable: { padding: 4, marginLeft: 8 },
  empty: { textAlign: "center", color: "#888", marginTop: 40, fontSize: 16 },
});
