import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Share,
  Alert,
  ActionSheetIOS,
  Platform,
  ActivityIndicator,
  TextInput,
  Linking,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";
import { AIService } from "../services/ai";
import ModalSelector from "react-native-modal-selector";
import { ShareTemplateModal } from "../components/ShareTemplateModal";

interface HistoryScreenProps {
  user: any;
  isDarkMode: boolean;
  favoritesOnly?: boolean;
  categoryFilter?: string;
  onBack: () => void;
}
interface DailyEntry {
  id: number;
  created_at: string;
  category: string;
  transcription: string;
  ai_response?: string;
  favorite?: boolean;
  image_url?: string; // Add image URL field
}
export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  user,
  onBack,
  isDarkMode = false,
}) => {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Recap state
  const [recapModalVisible, setRecapModalVisible] = useState(false);
  const [recapType, setRecapType] = useState<"weekly" | "monthly" | null>(null);
  const [recapContent, setRecapContent] = useState<string | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("null");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  // Edit state
  const [editingEntry, setEditingEntry] = useState<DailyEntry | null>(null);
  const [editText, setEditText] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [shareEntry, setShareEntry] = useState<DailyEntry | null>(null);
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  
  // Get unique categories, treating empty/null as "Uncategorized"
  const categories = Array.from(
    new Set(
      entries.map((e) =>
        e.category && e.category.trim() ? e.category : "Uncategorized"
      )
    )
  );
  useEffect(() => {
    if (user?.id) {
      loadEntries();
    }
  }, [user?.id]);
  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("daily_entries")
        .select("id, created_at, category, transcription, ai_response, favorite, image_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setEntries(data || []);
      console.log("Loaded entries:", data);
    } catch (error) {
      console.error("Error loading entries:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleShare = async (entry: DailyEntry) => {
    try {
      const shareMessage = `${entry.category}\n\n"${entry.transcription}"\n\n${
        entry.ai_response || ""
      }\n\nShared from Going Well`;
      await Share.share({
        message: shareMessage,
        title: "Going Well Entry",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };
  const handleOptions = (entry: DailyEntry) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Edit", "Delete"],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleEdit(entry);
          } else if (buttonIndex === 2) {
            handleDelete(entry);
          }
        }
      );
    } else {
      // For Android, use Alert
      Alert.alert(
        "Options",
        "",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Edit", onPress: () => handleEdit(entry) },
          {
            text: "Delete",
            onPress: () => handleDelete(entry),
            style: "destructive",
          },
        ],
        { cancelable: true }
      );
    }
  };
  const handleEdit = (entry: DailyEntry) => {
    setEditingEntry(entry);
    setEditText(entry.transcription);
  };
  const handleDelete = (entry: DailyEntry) => {
    Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("daily_entries")
              .delete()
              .eq("id", entry.id);
            if (error) throw error;
            // Refresh entries
            loadEntries();
          } catch (error) {
            console.error("Error deleting entry:", error);
            Alert.alert("Error", "Failed to delete entry");
          }
        },
      },
    ]);
  };
  const handleToggleFavorite = async (entry: DailyEntry) => {
    try {
      const { error } = await supabase
        .from("daily_entries")
        .update({ favorite: !entry.favorite })
        .eq("id", entry.id);
      if (error) throw error;
      // Refresh entries
      loadEntries();
    } catch (error) {
      Alert.alert("Error", "Could not update favorite status.");
      console.error("Favorite error:", error);
    }
  };
  // Helper to filter entries for the period
  function getEntriesForPeriod(type: "weekly" | "monthly") {
    const now = new Date();
    let start: Date;
    if (type === "weekly") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return entries.filter((e) => new Date(e.created_at) >= start);
  }
  // Mock AI Recap function (replace with real AI call)
  async function getAIRecap(entries: DailyEntry[], type: "weekly" | "monthly") {
    if (!user?.id) return "No user found.";
    // Calculate period
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = now;
    if (type === "weekly") {
      periodStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 6
      );
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    // 1. Check for existing recap in DB
    const { data: existing, error } = await supabase
      .from("recaps")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", type)
      .eq("period_start", periodStart.toISOString().split("T")[0])
      .eq("period_end", periodEnd.toISOString().split("T")[0])
      .single();
    if (existing && existing.content) {
      return existing.content;
    }
    // 2. Generate with AI
    const aiRecap = await AIService.generateRecap(entries, type);
    // 3. Store in DB
    await supabase.from("recaps").insert([
      {
        user_id: user.id,
        type,
        period_start: periodStart.toISOString().split("T")[0],
        period_end: periodEnd.toISOString().split("T")[0],
        content: aiRecap,
        analysis_data: null,
      },
    ]);
    return aiRecap;
  }
  const handleRecap = async (type: "weekly" | "monthly") => {
    setRecapType(type);
    setRecapLoading(true);
    setRecapModalVisible(true);
    const periodEntries = getEntriesForPeriod(type);
    const recap = await getAIRecap(periodEntries, type);
    setRecapContent(recap);
    setRecapLoading(false);
  };
  const handleShareRecap = async () => {
    if (!recapContent) return;
    try {
      await Share.share({
        message: `${
          recapType === "weekly" ? "Weekly" : "Monthly"
        } Recap\n\n${recapContent}\n\nShared from Going Well`,
        title: "Going Well Recap",
      });
    } catch (error) {
      Alert.alert("Error", "Could not share recap.");
    }
  };
  const filteredEntries = entries
    .filter((entry) => !favoritesOnly || entry.favorite)
    .filter((entry) => {
      if (selectedCategory === "null") return true;
      if (selectedCategory === "Uncategorized") {
        return !entry.category || !entry.category.trim();
      }
      return entry.category === selectedCategory;
    })
    .filter((entry) => {
      // Search filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        entry.transcription.toLowerCase().includes(query) ||
        entry.category?.toLowerCase().includes(query) ||
        entry.ai_response?.toLowerCase().includes(query)
      );
    })
    .filter((entry) => {
      // Date filter
      if (dateFilter === 'all') return true;
      const entryDate = new Date(entry.created_at);
      const now = new Date();
      const daysAgo = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case '7d': return daysAgo <= 7;
        case '30d': return daysAgo <= 30;
        case '90d': return daysAgo <= 90;
        default: return true;
      }
    });
    
  // Statistics
  const stats = {
    total: entries.length,
    favorites: entries.filter(e => e.favorite).length,
    withImages: entries.filter(e => e.image_url).length,
    categories: categories.length,
    filtered: filteredEntries.length,
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };
  const styles = getStyles(isDarkMode);
  // Prepare data for ModalSelector
  const categoryOptions = [
    { key: "null", label: "All Categories" },
    ...categories.map((cat) => ({ key: cat, label: cat })),
  ];
  console.log("categories:", categories);
  console.log("categoryOptions:", categoryOptions);
  console.log("selectedCategory:", selectedCategory);
  console.log("selectedCategory:", selectedCategory);
  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onBack}
    >
      <SafeAreaView style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDarkMode ? "#fff" : "#333"}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>History</Text>
          <View style={styles.headerSpacer} />
        </View>
        {/* Recap Buttons */}
        <View style={styles.recapContainer}>
          <TouchableOpacity
            style={styles.recapButton}
            onPress={() => handleRecap("weekly")}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={18} color="#fff" style={styles.recapButtonIcon} />
            <Text style={styles.recapButtonText}>Weekly Recap</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.recapButton}
            onPress={() => handleRecap("monthly")}
            activeOpacity={0.8}
          >
            <Ionicons name="stats-chart-outline" size={18} color="#fff" style={styles.recapButtonIcon} />
            <Text style={styles.recapButtonText}>Monthly Recap</Text>
          </TouchableOpacity>
        </View>
        {/* Filter Section Header */}
        <View style={styles.filterHeaderContainer}>
          <TouchableOpacity 
            style={styles.filterToggleButton}
            onPress={() => setFiltersCollapsed(!filtersCollapsed)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="options-outline" 
              size={20} 
              color={isDarkMode ? "#ccc" : "#666"} 
            />
            <Text style={styles.filterToggleText}>
              {filtersCollapsed ? "Show Filters" : "Hide Filters"}
            </Text>
            <Ionicons 
              name={filtersCollapsed ? "chevron-down" : "chevron-up"} 
              size={16} 
              color={isDarkMode ? "#666" : "#999"} 
            />
          </TouchableOpacity>
          
          {/* Active Filter Indicators */}
          {filtersCollapsed && (
            <View style={styles.activeFiltersContainer}>
              {searchQuery && (
                <View style={styles.activeFilterChip}>
                  <Ionicons name="search" size={12} color="#FF6B35" />
                  <Text style={styles.activeFilterText}>Search</Text>
                </View>
              )}
              {dateFilter !== 'all' && (
                <View style={styles.activeFilterChip}>
                  <Ionicons name="calendar-outline" size={12} color="#FF6B35" />
                  <Text style={styles.activeFilterText}>
                    {dateFilter === '7d' ? '7d' : 
                     dateFilter === '30d' ? '30d' : '90d'}
                  </Text>
                </View>
              )}
              {selectedCategory !== 'null' && (
                <View style={styles.activeFilterChip}>
                  <Ionicons name="apps-outline" size={12} color="#FF6B35" />
                  <Text style={styles.activeFilterText}>Category</Text>
                </View>
              )}
              {favoritesOnly && (
                <View style={styles.activeFilterChip}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.activeFilterText}>Favorites</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Collapsible Filter Bar */}
        {!filtersCollapsed && (
          <View style={styles.filterBarContainer}>
            {/* Search Row */}
            <View style={styles.searchRow}>
              {searchExpanded ? (
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color={isDarkMode ? "#666" : "#999"} style={styles.searchIcon} />
                  <TextInput
                    style={[styles.searchInput, { color: isDarkMode ? "#fff" : "#333" }]}
                    placeholder="Search entries..."
                    placeholderTextColor={isDarkMode ? "#666" : "#999"}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    autoFocus
                  />
                  <TouchableOpacity 
                    onPress={() => {
                      setSearchQuery("");
                      setSearchExpanded(false);
                    }} 
                    style={styles.clearButton}
                  >
                    <Ionicons name="close" size={20} color={isDarkMode ? "#666" : "#999"} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.searchButton}
                  onPress={() => setSearchExpanded(true)}
                >
                  <Ionicons name="search" size={20} color={isDarkMode ? "#ccc" : "#666"} />
                  <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Row */}
            <View style={styles.filterRow}>
              {/* Date Filter Dropdown */}
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={styles.filterButton}
                  onPress={() => {
                    setCategoryDropdownOpen(false);
                    setDateDropdownOpen(!dateDropdownOpen);
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color={isDarkMode ? "#ccc" : "#666"} />
                  <Text style={styles.filterButtonText}>
                    {dateFilter === 'all' ? 'Time' : 
                     dateFilter === '7d' ? '7 Days' : 
                     dateFilter === '30d' ? '30 Days' : '90 Days'}
                  </Text>
                  <Ionicons name={dateDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color={isDarkMode ? "#666" : "#999"} />
                </TouchableOpacity>
              </View>

              {/* Category Filter Dropdown */}
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={styles.filterButton}
                  onPress={() => {
                    setDateDropdownOpen(false);
                    setCategoryDropdownOpen(!categoryDropdownOpen);
                  }}
                >
                  <Ionicons name="apps-outline" size={20} color={isDarkMode ? "#ccc" : "#666"} />
                  <Text style={styles.filterButtonText}>
                    {selectedCategory === 'null' ? 'Category' : 
                     (categoryOptions.find(opt => opt.key === selectedCategory)?.label || "Category")}
                  </Text>
                  <Ionicons name={categoryDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color={isDarkMode ? "#666" : "#999"} />
                </TouchableOpacity>
              </View>

              {/* Favorites Toggle */}
              <TouchableOpacity 
                style={styles.favoritesToggle}
                onPress={() => setFavoritesOnly((fav) => !fav)}
              >
                <Ionicons
                  name={favoritesOnly ? "star" : "star-outline"}
                  size={24}
                  color={favoritesOnly ? "#FFD700" : (isDarkMode ? "#666" : "#999")}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Dropdown Overlays */}
        {dateDropdownOpen && (
          <View style={styles.dropdownOverlay}>
            <TouchableOpacity 
              style={styles.dropdownBackdrop}
              onPress={() => setDateDropdownOpen(false)}
            />
            <View style={styles.dropdownModal}>
              <Text style={styles.dropdownTitle}>Filter by Date</Text>
              {[
                { key: 'all', label: 'All Time' },
                { key: '7d', label: 'Last 7 Days' },
                { key: '30d', label: 'Last 30 Days' },
                { key: '90d', label: 'Last 90 Days' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.dropdownItem,
                    dateFilter === filter.key && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setDateFilter(filter.key as any);
                    setDateDropdownOpen(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    dateFilter === filter.key && styles.dropdownItemTextActive,
                  ]}>
                    {filter.label}
                  </Text>
                  {dateFilter === filter.key && (
                    <Ionicons name="checkmark" size={20} color="#FF6B35" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {categoryDropdownOpen && (
          <View style={styles.dropdownOverlay}>
            <TouchableOpacity 
              style={styles.dropdownBackdrop}
              onPress={() => setCategoryDropdownOpen(false)}
            />
            <View style={styles.dropdownModal}>
              <Text style={styles.dropdownTitle}>Filter by Category</Text>
              {categoryOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.dropdownItem,
                    selectedCategory === option.key && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(option.key);
                    setCategoryDropdownOpen(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedCategory === option.key && styles.dropdownItemTextActive,
                  ]}>
                    {option.label}
                  </Text>
                  {selectedCategory === option.key && (
                    <Ionicons name="checkmark" size={20} color="#FF6B35" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Compact Statistics */}
        <View style={styles.compactStatsContainer}>
          <Text style={styles.compactStatsText}>
            Showing {stats.filtered} of {stats.total} entries
            {stats.favorites > 0 && ` • ${stats.favorites} favorites`}
            {stats.withImages > 0 && ` • ${stats.withImages} with photos`}
          </Text>
        </View>
        {/* Content */}
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FF6B35"]}
              tintColor={"#FF6B35"}
            />
          }
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading entries...</Text>
            </View>
          ) : filteredEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="time-outline"
                size={64}
                color={isDarkMode ? "#666" : "#ccc"}
              />
              {selectedCategory !== "null" ? (
                <>
                  <Text style={styles.emptyText}>
                    No entries in "
                    {categoryOptions.find((opt) => opt.key === selectedCategory)
                      ?.label || selectedCategory}
                    "this category"
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Try selecting another category or add a new entry.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyText}>No entries yet</Text>
                  <Text style={styles.emptySubtext}>
                    Start recording to see your history
                  </Text>
                </>
              )}
            </View>
          ) : (
            filteredEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryHeaderLeft}>
                    <Text style={styles.entryCategory}>{entry.category}</Text>
                    <Text style={styles.entryDate}>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.entryActions}>
                    {/* Edit */}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEdit(entry)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="create-outline"
                        size={22}
                        color="#007AFF"
                      />
                    </TouchableOpacity>
                    {/* Favorite */}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleToggleFavorite(entry)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={entry.favorite ? "star" : "star-outline"}
                        size={22}
                        color={entry.favorite ? "#FFD700" : "#aaa"}
                      />
                    </TouchableOpacity>
                    {/* Share */}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setShareEntry(entry);
                        setShowShareModal(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="share-social" size={22} color="#007AFF" />
                    </TouchableOpacity>
                    {/* More options (if needed) */}
                    {/* <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleOptions(entry)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="ellipsis-horizontal" size={22} color="#aaa" />
                    </TouchableOpacity> */}
                  </View>
                </View>
                {entry.image_url && (
                  <Image 
                    source={{ uri: entry.image_url }} 
                    style={styles.entryImage}
                    resizeMode="cover"
                  />
                )}
                <Text style={styles.entryTranscription}>
                  {entry.transcription}
                </Text>
                {entry.ai_response && (
                  <Text style={styles.entryResponse}>{entry.ai_response}</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>

        {/* Recap Modal */}
        <Modal
          visible={recapModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setRecapModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: isDarkMode ? "#222" : "#fff",
                borderRadius: 20,
                padding: 24,
                width: "85%",
                maxHeight: "80%",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  marginBottom: 12,
                  color: isDarkMode ? "#fff" : "#333",
                }}
              >
                {recapType === "weekly" ? "Weekly Recap" : "Monthly Recap"}
              </Text>
              {recapLoading ? (
                <ActivityIndicator size="large" color="#FF6B35" />
              ) : (
                <View style={{ maxHeight: 300 }}>
                  <ScrollView style={{ maxHeight: 300 }}>
                    <Text
                      style={{
                        color: isDarkMode ? "#fff" : "#333",
                        fontSize: 16,
                      }}
                    >
                      {recapContent}
                    </Text>
                  </ScrollView>
                </View>
              )}
              <View style={{ flexDirection: "row", marginTop: 20 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#FF6B35",
                    borderRadius: 16,
                    paddingHorizontal: 24,
                    paddingVertical: 10,
                    marginRight: 10,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  onPress={handleShareRecap}
                >
                  <Ionicons
                    name="send-outline"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Export
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#888",
                    borderRadius: 16,
                    paddingHorizontal: 24,
                    paddingVertical: 10,
                  }}
                  onPress={() => setRecapModalVisible(false)}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Modal */}
        {editingEntry && (
          <Modal
            visible={true}
            transparent
            animationType="slide"
            onRequestClose={() => setEditingEntry(null)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: isDarkMode ? "#222" : "#fff",
                  borderRadius: 16,
                  padding: 24,
                  width: "85%",
                }}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 18,
                    marginBottom: 12,
                    color: isDarkMode ? "#fff" : "#333",
                  }}
                >
                  Edit Entry
                </Text>
                <TextInput
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  style={{
                    minHeight: 80,
                    color: isDarkMode ? "#fff" : "#333",
                    backgroundColor: isDarkMode ? "#333" : "#f4f4f4",
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: "#ccc",
                  }}
                />
                <View
                  style={{ flexDirection: "row", justifyContent: "flex-end" }}
                >
                  <TouchableOpacity
                    onPress={() => setEditingEntry(null)}
                    style={{ marginRight: 16 }}
                    disabled={editLoading}
                  >
                    <Text style={{ color: "#aaa" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      setEditLoading(true);
                      try {
                        await supabase
                          .from("daily_entries")
                          .update({ transcription: editText })
                          .eq("id", editingEntry.id);
                        setEditingEntry(null);
                        setEditText("");
                        loadEntries();
                      } catch (e) {
                        Alert.alert("Error", "Could not save changes.");
                      } finally {
                        setEditLoading(false);
                      }
                    }}
                    disabled={editLoading}
                  >
                    <Text style={{ color: "#007AFF", fontWeight: "bold" }}>
                      {editLoading ? "Saving..." : "Save"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Share Modal */}
        {showShareModal && shareEntry && (
          <ShareTemplateModal
            visible={showShareModal}
            onClose={() => setShowShareModal(false)}
            onShare={async () => {
              await shareMessage("share", selectedTemplate, shareEntry);
              setShowShareModal(false);
            }}
            templates={shareTemplates}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            entry={shareEntry}
            isDarkMode={isDarkMode}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDarkMode ? "#fff" : "#333",
    },
    headerSpacer: {
      width: 40,
    },
    
    // Recap buttons
    recapContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 20,
    },
    recapButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FF6B35",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      flex: 1,
      justifyContent: "center",
      shadowColor: "#FF6B35",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    recapButtonIcon: {
      marginRight: 8,
    },
    recapButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    content: {
      flex: 1,
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 100,
    },
    loadingText: {
      fontSize: 16,
      color: isDarkMode ? "#aaa" : "#666",
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 100,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      color: isDarkMode ? "#aaa" : "#666",
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: isDarkMode ? "#888" : "#999",
      marginTop: 8,
    },
    entryCard: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    entryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    entryHeaderLeft: {
      flex: 1,
    },
    entryActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
    },
    entryCategory: {
      fontSize: 14,
      fontWeight: "600",
      color: "#8BC34A",
      backgroundColor: isDarkMode ? "#1a3a1a" : "#f0fff0",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: "flex-start",
      marginBottom: 4,
    },
    entryDate: {
      fontSize: 12,
      color: isDarkMode ? "#888" : "#666",
    },
    entryImage: {
      width: "100%",
      height: 200,
      borderRadius: 12,
      marginBottom: 12,
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
    },
    entryTranscription: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333",
      lineHeight: 22,
      marginBottom: 8,
    },
    entryResponse: {
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#555",
      lineHeight: 20,
      fontStyle: "italic",
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    
    // Filter header
    filterHeaderContainer: {
      marginHorizontal: 20,
      marginBottom: 16,
    },
    filterToggleButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      gap: 8,
    },
    filterToggleText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "500",
      color: isDarkMode ? "#ccc" : "#666",
    },
    
    // Active filter chips
    activeFiltersContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 12,
    },
    activeFilterChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      gap: 4,
    },
    activeFilterText: {
      fontSize: 12,
      fontWeight: "500",
      color: isDarkMode ? "#ccc" : "#666",
    },

    // Filter bar container
    filterBarContainer: {
      marginHorizontal: 20,
      marginBottom: 16,
    },
    
    // Search row
    searchRow: {
      marginBottom: 12,
    },
    
    // Filter row
    filterRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    
    // Filter button (collapsed state)
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#f0f0f0",
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      gap: 6,
      flex: 1,
      minWidth: 0,
      height: 44,
    },
    filterButtonActive: {
      backgroundColor: "#FF6B35",
      borderColor: "#FF6B35",
    },
    filterButtonText: {
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#666",
      fontWeight: "500",
      flex: 1,
    },
    
    // Search button (collapsed state)
    searchButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#2a2a2a" : "#f0f0f0",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      gap: 8,
      height: 44,
    },
    searchButtonText: {
      fontSize: 16,
      color: isDarkMode ? "#ccc" : "#666",
      fontWeight: "500",
    },
    
    // Search container (expanded state)
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      gap: 8,
      height: 44,
    },
    searchIcon: {
      marginRight: 4,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 0,
    },
    clearButton: {
      marginLeft: 4,
    },
    
    // Favorites toggle (no button styling)
    favoritesToggle: {
      padding: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    
    // Dropdown container
    dropdownContainer: {
      flex: 1,
      minWidth: 0,
    },
    
    // Modal dropdown overlay
    dropdownOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      justifyContent: "flex-start",
      alignItems: "center",
      paddingTop: 200, // Position below the filter bar
    },
    dropdownBackdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    dropdownModal: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      width: "80%",
      maxWidth: 320,
      maxHeight: 280,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 12,
    },
    dropdownTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      textAlign: "center",
    },
    dropdownItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
    },
    dropdownItemActive: {
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f8f9fa",
    },
    dropdownItemText: {
      fontSize: 16,
      color: isDarkMode ? "#ccc" : "#666",
    },
    dropdownItemTextActive: {
      color: "#FF6B35",
      fontWeight: "600",
    },
    
    // Compact statistics
    compactStatsContainer: {
      marginHorizontal: 20,
      marginBottom: 16,
    },
    compactStatsText: {
      fontSize: 14,
      color: isDarkMode ? "#888" : "#666",
      textAlign: "center",
      fontWeight: "500",
    },
  });

const shareTemplates = [
  // Just the question
  (entry: any) =>
    `What's going well for you today?`,

  // Simple and warm - universally approachable
  (entry: any) =>
    `${entry.transcription}\n\nWhat's been good in your corner of the world?`,

  // Lead with them - casual and conversational
  (entry: any) =>
    `What's going well for you today? For me, it's:\n"${entry.transcription}"`,

  // Personal connection - makes it meaningful
  (entry: any) =>
    `I thought of you as I reflected on what's going well today:\n"${entry.transcription}"\n\nHope you're finding good moments too.`,

  // Simple and warm - universally approachable
  (entry: any) =>
    `Something brightened my day today:\n"${entry.transcription}"\n\nWhat's been good in your corner of the world?`,

];

const shareMessage = async (
  method: "text" | "share" = "share",
  templateIdx = 0,
  entry: any
) => {
  const message = shareTemplates[templateIdx](entry);

  if (method === "text") {
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    const supported = await Linking.canOpenURL(smsUrl);
    if (supported) {
      await Linking.openURL(smsUrl);
    } else {
      Alert.alert("Cannot open Messages", "Unable to open the Messages app");
    }
  } else {
    try {
      await Share.share({
        message,
        title: "What's Going Well?",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share");
    }
  }
};
