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
import { useSelector } from "react-redux";

// This assumes you have user info in Redux. Adjust as needed.
export const SocialFeedScreen = ({ onClose }: { onClose?: () => void }) => {
  const user = useSelector((state: any) => state.auth.user);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, [user?.id]);

  const fetchFeed = async () => {
    if (!user?.id) return;
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
        .select("*")
        .in("user_id", userIds)
        .order("created_at", { ascending: false });
      console.log("entriesData:", entriesData, "error:", error);
      if (error) {
        setEntries([]);
      } else {
        // Attach username to each entry for FeedEntryCard
        const withUsernames = entriesData.map((entry: any) => ({
          ...entry,
          username: entry.profiles?.username || "(unknown)",
        }));
        setEntries(withUsernames);
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
