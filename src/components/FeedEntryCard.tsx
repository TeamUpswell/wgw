import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const FeedEntryCard = ({ entry, navigation }) => {
  // Placeholder handlers
  const handleLike = () => {
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

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {entry.avatar_url ? (
            <Image source={{ uri: entry.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-circle-outline" size={32} color="#bbb" />
            </View>
          )}
          <View>
            <Text style={styles.username}>
              {entry.display_name ||
                entry.username ||
                entry.email ||
                "(unknown)"}
            </Text>
            {entry.bio ? <Text style={styles.bio}>{entry.bio}</Text> : null}
          </View>
        </View>
        <Text style={styles.time}>
          {new Date(entry.created_at).toLocaleString()}
        </Text>
      </View>
      <Text style={styles.category}>{entry.category}</Text>
      <Text style={styles.transcription}>{entry.transcription}</Text>
      <View style={styles.reactions}>
        <TouchableOpacity style={styles.reactionButton} onPress={handleLike}>
          <Ionicons name="heart-outline" size={20} color="#e57373" />
          <Text style={styles.reactionCount}>{entry.reactions?.like || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reactionButton} onPress={handleComment}>
          <Ionicons name="chatbubble-outline" size={20} color="#4FC3F7" />
          <Text style={styles.reactionCount}>{entry.comments_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reactionButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color="#888" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  username: { fontWeight: "bold", color: "#333", fontSize: 15 },
  bio: { color: "#888", fontSize: 12, marginTop: 2 },
  time: { color: "#888", fontSize: 12, marginLeft: 8 },
  category: { color: "#8BC34A", fontWeight: "bold", marginTop: 8 },
  transcription: { marginTop: 8, fontSize: 16 },
  reactions: { flexDirection: "row", marginTop: 12, alignItems: "center" },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 18,
  },
  reactionCount: { marginLeft: 4, color: "#555", fontSize: 14 },
});
