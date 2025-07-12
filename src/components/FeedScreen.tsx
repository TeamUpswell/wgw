import React, { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { fetchFeedEntries } from "../services/feedService"; // You will implement this
import { FeedEntryCard } from "../components/FeedEntryCard"; // You will implement this

interface FeedScreenProps {
  navigation: any;
}

export const FeedScreen = ({ navigation }: FeedScreenProps) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with your actual user ID or auth context
    fetchFeedEntries(/* userId */).then((data: any[]) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FeedEntryCard entry={item} navigation={navigation} />
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
});
