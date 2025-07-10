import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Dimensions,
  Animated,
  Share,
  Alert,
  TextInput,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";
import { AIService } from "../services/ai";
import { anthropic } from "../config/anthropic";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface JournalEntry {
  id: string;
  created_at: string;
  category: string;
  transcription: string;
  ai_response?: string;
  favorite?: boolean;
  image_url?: string;
  is_private?: boolean;
}

interface JournalInsight {
  id: string;
  insight_text: string;
  insight_type: 'pattern' | 'growth' | 'celebration' | 'reminder';
  created_at: string;
  entry_count: number;
  categories: string[];
}

interface EnhancedJournalScreenProps {
  user: any;
  isDarkMode: boolean;
  onBack: () => void;
  onCreateEntry?: () => void;
}

type ViewMode = 'entries' | 'insights' | 'favorites';

export const EnhancedJournalScreen: React.FC<EnhancedJournalScreenProps> = ({
  user,
  isDarkMode,
  onBack,
  onCreateEntry,
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [insights, setInsights] = useState<JournalInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('month');
  const [viewMode, setViewMode] = useState<ViewMode>('entries');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Edit states
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editText, setEditText] = useState("");
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (user?.id) {
      loadJournalData();
    }
  }, [user?.id, selectedTimeframe]);

  // Generate insights whenever entries change
  useEffect(() => {
    if (entries.length > 0) {
      generateInsights();
    }
  }, [entries]);

  useEffect(() => {
    // Animate in on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadJournalData = async () => {
    try {
      setIsLoading(true);
      await loadEntries();
      // loadInsights will be called after entries are loaded via useEffect
    } catch (error) {
      console.error("Error loading journal data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEntries = async () => {
    try {
      let query = supabase
        .from("daily_entries")
        .select("id, created_at, category, transcription, ai_response, favorite, image_url, is_private")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Apply timeframe filter
      if (selectedTimeframe !== 'all') {
        const days = selectedTimeframe === 'week' ? 7 : 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        query = query.gte("created_at", cutoff.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error loading entries:", error);
    }
  };


  const generateInsights = async () => {
    try {
      console.log('🔍 Generating Claude-powered insights for', entries.length, 'entries');
      setIsGeneratingInsights(true);
      
      // Group entries by category and extract patterns
      const categoryGroups = entries.reduce((acc, entry) => {
        const category = entry.category || 'General';
        if (!acc[category]) acc[category] = [];
        acc[category].push(entry);
        return acc;
      }, {} as Record<string, JournalEntry[]>);

      console.log('📊 Category groups:', categoryGroups);
      const newInsights: JournalInsight[] = [];

      // Generate AI-powered insights using Claude if we have enough entries
      if (entries.length >= 3) {
        try {
          const aiInsights = await generateClaudeInsights(entries, categoryGroups);
          newInsights.push(...aiInsights);
        } catch (error) {
          console.error('Failed to generate Claude insights, falling back to static insights:', error);
        }
      }

      // Generate category-based insights (lowered threshold)
      Object.entries(categoryGroups).forEach(([category, categoryEntries]) => {
        if (categoryEntries.length >= 2) { // Lowered from 3 to 2
          newInsights.push({
            id: `category-${category}-${Date.now()}`,
            insight_text: generateCategoryInsight(category, categoryEntries.length),
            insight_type: 'pattern',
            created_at: new Date().toISOString(),
            entry_count: categoryEntries.length,
            categories: [category],
          });
        }
      });

      // Generate growth insights (lowered threshold)
      if (entries.length >= 3) { // Lowered from 10 to 3
        newInsights.push({
          id: `growth-${Date.now()}`,
          insight_text: `Your ${entries.length} entries show a beautiful journey of growth and self-reflection. You're building something meaningful here.`,
          insight_type: 'growth',
          created_at: new Date().toISOString(),
          entry_count: entries.length,
          categories: Object.keys(categoryGroups),
        });
      }

      const favoriteEntries = entries.filter(e => e.favorite);
      if (favoriteEntries.length > 0) {
        newInsights.push({
          id: `celebration-${Date.now()}`,
          insight_text: `You've marked ${favoriteEntries.length} special moments as favorites. These golden memories are your anchors of joy.`,
          insight_type: 'celebration',
          created_at: new Date().toISOString(),
          entry_count: favoriteEntries.length,
          categories: [...new Set(favoriteEntries.map(e => e.category))],
        });
      }

      // Always add a reminder insight
      if (entries.length >= 5) {
        newInsights.push({
          id: `reminder-${Date.now()}`,
          insight_text: `With ${entries.length} entries captured, you're building a fortress of positivity. Let these memories lift you during challenging times.`,
          insight_type: 'reminder',
          created_at: new Date().toISOString(),
          entry_count: entries.length,
          categories: Object.keys(categoryGroups),
        });
      } else {
        // Welcome insight for new users
        newInsights.push({
          id: `welcome-${Date.now()}`,
          insight_text: `You've started your "What's Going Well" journey with ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}! Every moment of gratitude you capture here becomes a source of strength for tomorrow.`,
          insight_type: 'reminder',
          created_at: new Date().toISOString(),
          entry_count: entries.length,
          categories: Object.keys(categoryGroups),
        });
      }

      console.log('✨ Generated', newInsights.length, 'insights:', newInsights);
      setInsights(newInsights);
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const generateGregBellInsights = (entries: JournalEntry[], categoryGroups: Record<string, JournalEntry[]>): JournalInsight[] => {
    console.log('🎯 Generating Greg Bell-inspired insights...');
    
    const insights: JournalInsight[] = [];
    const favoriteEntries = entries.filter(e => e.favorite);
    const recentEntries = entries.slice(0, 10);
    
    // Pattern insights based on Greg Bell methodology
    const mostActiveCategory = Object.entries(categoryGroups)
      .sort((a, b) => b[1].length - a[1].length)[0];
    
    if (mostActiveCategory && mostActiveCategory[1].length >= 3) {
      const [category, categoryEntries] = mostActiveCategory;
      const gregBellPatternInsights = [
        `Your focus on ${category.toLowerCase()} shows beautiful consistency with ${categoryEntries.length} entries. As Greg Bell teaches, "What you appreciate, appreciates" - and you're building real momentum here.`,
        `In ${category.toLowerCase()}, you've captured ${categoryEntries.length} moments of what's working well. This sustained attention to positive patterns is exactly how resilience grows.`,
        `Your ${categoryEntries.length} entries in ${category.toLowerCase()} reveal a powerful truth: you're training your attention on what's going well. This is the foundation of lasting happiness.`
      ];
      
      insights.push({
        id: `gregbell-pattern-${Date.now()}`,
        insight_text: gregBellPatternInsights[Math.floor(Math.random() * gregBellPatternInsights.length)],
        insight_type: 'pattern',
        created_at: new Date().toISOString(),
        entry_count: categoryEntries.length,
        categories: [category],
      });
    }
    
    // Growth insights inspired by Greg Bell's principles
    if (entries.length >= 5) {
      const gregBellGrowthInsights = [
        `Your ${entries.length} entries demonstrate the power of consistent gratitude practice. You're not just recording moments - you're rewiring your brain for positivity and resilience.`,
        `With ${entries.length} "What's Going Well" reflections, you're building what Greg Bell calls a "fortress of positivity." Each entry strengthens your ability to find good in any situation.`,
        `These ${entries.length} moments you've captured show remarkable growth in awareness. You're developing the skill of seeing abundance where others might see scarcity.`
      ];
      
      insights.push({
        id: `gregbell-growth-${Date.now()}`,
        insight_text: gregBellGrowthInsights[Math.floor(Math.random() * gregBellGrowthInsights.length)],
        insight_type: 'growth',
        created_at: new Date().toISOString(),
        entry_count: entries.length,
        categories: Object.keys(categoryGroups),
      });
    }
    
    // Celebration insights for favorites
    if (favoriteEntries.length > 0) {
      const gregBellCelebrationInsights = [
        `You've marked ${favoriteEntries.length} special moments as favorites - these are your anchors of joy. When challenges arise, these golden memories will remind you of your strength.`,
        `Your ${favoriteEntries.length} favorite entries reveal moments of pure appreciation. These aren't just memories - they're evidence of your capacity for deep gratitude.`,
        `Those ${favoriteEntries.length} favorites you've chosen? They're building your personal library of resilience. Each one is proof that good things flow through your life consistently.`
      ];
      
      insights.push({
        id: `gregbell-celebration-${Date.now()}`,
        insight_text: gregBellCelebrationInsights[Math.floor(Math.random() * gregBellCelebrationInsights.length)],
        insight_type: 'celebration',
        created_at: new Date().toISOString(),
        entry_count: favoriteEntries.length,
        categories: [...new Set(favoriteEntries.map(e => e.category))],
      });
    }
    
    // Always include a reminder insight based on Greg Bell's wisdom
    const gregBellReminderInsights = [
      `Remember: every moment of gratitude you practice is an investment in your future happiness. You're literally creating neural pathways for joy.`,
      `Your gratitude practice isn't just changing your days - it's changing your life. Keep building on this beautiful foundation of appreciation.`,
      `As you continue this journey, remember that noticing what's going well is a superpower. You're training yourself to see abundance everywhere.`,
      `Each entry you create sends a message to your subconscious: "I live in a world where good things happen." Keep reinforcing this powerful truth.`
    ];
    
    insights.push({
      id: `gregbell-reminder-${Date.now()}`,
      insight_text: gregBellReminderInsights[Math.floor(Math.random() * gregBellReminderInsights.length)],
      insight_type: 'reminder',
      created_at: new Date().toISOString(),
      entry_count: entries.length,
      categories: Object.keys(categoryGroups),
    });
    
    console.log('✨ Generated', insights.length, 'Greg Bell-inspired insights');
    return insights;
  };

  const generateClaudeInsights = async (entries: JournalEntry[], categoryGroups: Record<string, JournalEntry[]>) => {
    // Skip Claude API and use Greg Bell insights instead
    console.log('🎯 Skipping Claude API, using Greg Bell methodology for insights');
    return generateGregBellInsights(entries, categoryGroups);
  };

  const generateCategoryInsight = (category: string, count: number) => {
    const insights = [
      `Your ${category.toLowerCase()} journey shows remarkable consistency with ${count} entries. You're building something beautiful here.`,
      `In ${category.toLowerCase()}, you've captured ${count} moments of growth and joy. Each entry adds to your story of resilience.`,
      `${count} entries in ${category.toLowerCase()} reveal your commitment to noticing what's working in your life. That's powerful.`,
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJournalData();
    setRefreshing(false);
  };

  const shareJournal = async () => {
    try {
      const shareText = `My "What's Going Well" Journal\n\nI've been keeping track of ${entries.length} beautiful moments and here's what I've learned:\n\n${insights.slice(0, 2).map(i => `• ${i.insight_text}`).join('\n\n')}\n\nEven on tough days, there's always something going well. 🌟`;
      
      await Share.share({
        message: shareText,
        title: "My What's Going Well Journal",
      });
    } catch (error) {
      console.error("Error sharing journal:", error);
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditText(entry.transcription);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    
    try {
      const { error } = await supabase
        .from("daily_entries")
        .update({ transcription: editText })
        .eq("id", editingEntry.id);

      if (error) throw error;

      // Update local state
      setEntries(prev => prev.map(entry => 
        entry.id === editingEntry.id 
          ? { ...entry, transcription: editText }
          : entry
      ));

      setEditingEntry(null);
      setEditText("");
    } catch (error) {
      console.error("Error updating entry:", error);
      Alert.alert("Error", "Failed to update entry");
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from("daily_entries")
        .delete()
        .eq("id", entryId);

      if (error) throw error;

      setEntries(prev => prev.filter(entry => entry.id !== entryId));
    } catch (error) {
      console.error("Error deleting entry:", error);
      Alert.alert("Error", "Failed to delete entry");
    }
  };

  const handleToggleFavorite = async (entry: JournalEntry) => {
    try {
      const newFavorite = !entry.favorite;
      const { error } = await supabase
        .from("daily_entries")
        .update({ favorite: newFavorite })
        .eq("id", entry.id);

      if (error) throw error;

      setEntries(prev => prev.map(e => 
        e.id === entry.id ? { ...e, favorite: newFavorite } : e
      ));
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const showEntryActions = (entry: JournalEntry) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete', entry.favorite ? 'Remove from Favorites' : 'Add to Favorites'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleEditEntry(entry);
          if (buttonIndex === 2) handleDeleteEntry(entry.id);
          if (buttonIndex === 3) handleToggleFavorite(entry);
        }
      );
    }
  };

  // Filter entries based on current view mode and filters
  const getFilteredEntries = () => {
    let filtered = [...entries];

    // Apply view mode filter
    if (viewMode === 'favorites') {
      filtered = filtered.filter(entry => entry.favorite);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.transcription?.toLowerCase().includes(query) ||
        entry.category?.toLowerCase().includes(query)
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

  const getAvailableCategories = () => {
    const categories = new Set<string>();
    entries.forEach(entry => {
      categories.add(entry.category || 'Uncategorized');
    });
    return Array.from(categories).sort();
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return 'analytics-outline';
      case 'growth': return 'trending-up-outline';
      case 'celebration': return 'star-outline';
      case 'reminder': return 'heart-outline';
      default: return 'bulb-outline';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'pattern': return '#4A90E2';
      case 'growth': return '#7ED321';
      case 'celebration': return '#F5A623';
      case 'reminder': return '#E74C3C';
      default: return '#8E44AD';
    }
  };

  const styles = getStyles(isDarkMode);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={[styles.loadingText, { marginTop: 16 }]}>
          Loading your journal...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#333"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My WGW Journal</Text>
        <TouchableOpacity onPress={shareJournal} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={isDarkMode ? "#fff" : "#333"} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'entries' && styles.activeTab]}
          onPress={() => setViewMode('entries')}
        >
          <Ionicons 
            name="list-outline" 
            size={20} 
            color={viewMode === 'entries' ? "#FF6B35" : (isDarkMode ? "#ccc" : "#666")} 
          />
          <Text style={[styles.tabText, viewMode === 'entries' && styles.activeTabText]}>
            All Entries ({entries.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, viewMode === 'insights' && styles.activeTab]}
          onPress={() => setViewMode('insights')}
        >
          <Ionicons 
            name="bulb-outline" 
            size={20} 
            color={viewMode === 'insights' ? "#FF6B35" : (isDarkMode ? "#ccc" : "#666")} 
          />
          <Text style={[styles.tabText, viewMode === 'insights' && styles.activeTabText]}>
            Insights
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, viewMode === 'favorites' && styles.activeTab]}
          onPress={() => setViewMode('favorites')}
        >
          <Ionicons 
            name="star-outline" 
            size={20} 
            color={viewMode === 'favorites' ? "#FF6B35" : (isDarkMode ? "#ccc" : "#666")} 
          />
          <Text style={[styles.tabText, viewMode === 'favorites' && styles.activeTabText]}>
            Favorites ({entries.filter(e => e.favorite).length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'insights' && (
          <>
            {/* Inspirational Quote */}
            <Animated.View
              style={[
                styles.quoteSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={styles.quote}>
                "Gratitude turns what we have into enough, and more. It turns denial into acceptance, chaos into order, confusion into clarity."
              </Text>
              <Text style={styles.quoteAuthor}>- Melody Beattie</Text>
            </Animated.View>

            {/* Stats Overview */}
            <Animated.View
              style={[
                styles.statsSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{entries.length}</Text>
                  <Text style={styles.statLabel}>Entries</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{entries.filter(e => e.favorite).length}</Text>
                  <Text style={styles.statLabel}>Favorites</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{new Set(entries.map(e => e.category)).size}</Text>
                  <Text style={styles.statLabel}>Categories</Text>
                </View>
              </View>
            </Animated.View>

            {/* AI Insights */}
            <View style={styles.insightsSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Your Journey Insights</Text>
                {isGeneratingInsights && (
                  <ActivityIndicator size="small" color="#FF6B35" />
                )}
              </View>
              {insights.map((insight, index) => (
                <Animated.View
                  key={insight.id}
                  style={[
                    styles.insightCard,
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
                  <View style={styles.insightHeader}>
                    <View style={[styles.insightIcon, { backgroundColor: getInsightColor(insight.insight_type) }]}>
                      <Ionicons name={getInsightIcon(insight.insight_type)} size={20} color="#fff" />
                    </View>
                    <Text style={styles.insightType}>
                      {insight.insight_type.charAt(0).toUpperCase() + insight.insight_type.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.insightText}>{insight.insight_text}</Text>
                  <Text style={styles.insightMeta}>
                    Based on {insight.entry_count} entries
                  </Text>
                </Animated.View>
              ))}
            </View>

            {/* Call to Action */}
            <Animated.View
              style={[
                styles.ctaSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={styles.ctaTitle}>Keep Building Your Story</Text>
              <Text style={styles.ctaText}>
                Every entry you make is a thread in the tapestry of your resilience. 
                On difficult days, come back here to remember all the ways life has been good to you.
              </Text>
            </Animated.View>
          </>
        )}

        {(viewMode === 'entries' || viewMode === 'favorites') && (
          <>
            {/* Filters */}
            <View style={styles.filtersSection}>
              <TouchableOpacity
                style={styles.filterToggle}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Ionicons name="filter-outline" size={20} color="#FF6B35" />
                <Text style={styles.filterToggleText}>Filters</Text>
              </TouchableOpacity>
            </View>

            {showFilters && (
              <View style={styles.filtersContainer}>
                {/* Search */}
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search entries..."
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

            {/* Entries List */}
            <View style={styles.entriesSection}>
              {getFilteredEntries().length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {viewMode === 'favorites' 
                      ? "No favorite entries yet. Tap the star on entries to add them to favorites!"
                      : "No entries found matching your filters."
                    }
                  </Text>
                </View>
              ) : (
                getFilteredEntries().map((entry, index) => (
                  <Animated.View
                    key={entry.id}
                    style={[
                      styles.entryCard,
                      {
                        opacity: fadeAnim,
                        transform: [
                          {
                            translateY: fadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [30, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onLongPress={() => showEntryActions(entry)}
                      style={styles.entryContent}
                    >
                      <View style={styles.entryHeader}>
                        <View style={styles.entryMeta}>
                          <Text style={styles.entryCategory}>{entry.category || 'General'}</Text>
                          <Text style={styles.entryDate}>
                            {new Date(entry.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleToggleFavorite(entry)}>
                          <Ionicons 
                            name={entry.favorite ? "star" : "star-outline"} 
                            size={20} 
                            color={entry.favorite ? "#F5A623" : "#ccc"} 
                          />
                        </TouchableOpacity>
                      </View>
                      {entry.image_url && (
                        <Image source={{ uri: entry.image_url }} style={styles.entryImage} />
                      )}
                      <Text style={styles.entryText}>
                        {entry.transcription}
                      </Text>
                      {entry.ai_response && (
                        <Text style={styles.entryAI}>
                          💭 {entry.ai_response}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {onCreateEntry && (
        <TouchableOpacity
          style={styles.floatingActionButton}
          onPress={onCreateEntry}
          activeOpacity={0.8}
        >
          <View style={styles.fabInner}>
            <Ionicons name="add" size={32} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      {/* Edit Entry Modal */}
      <Modal visible={!!editingEntry} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <Text style={styles.editModalTitle}>Edit Entry</Text>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              style={styles.editTextInput}
              placeholder="Edit your entry..."
              placeholderTextColor="#999"
            />
            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editModalButton, styles.cancelButton]}
                onPress={() => setEditingEntry(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
    },
    centerContent: {
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 16,
      color: isDarkMode ? "#ccc" : "#666",
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
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
    },
    shareButton: {
      padding: 8,
    },
    tabContainer: {
      flexDirection: "row",
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 8,
      gap: 6,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: "#FF6B35",
    },
    tabText: {
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#666",
      fontWeight: "500",
    },
    activeTabText: {
      color: "#FF6B35",
      fontWeight: "600",
    },
    scrollView: {
      flex: 1,
    },
    quoteSection: {
      margin: 16,
      padding: 20,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: "#FF6B35",
    },
    quote: {
      fontSize: 16,
      lineHeight: 24,
      color: isDarkMode ? "#e0e0e0" : "#333",
      fontStyle: "italic",
      marginBottom: 8,
    },
    quoteAuthor: {
      fontSize: 14,
      color: isDarkMode ? "#999" : "#666",
      textAlign: "right",
    },
    statsSection: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    statItem: {
      alignItems: "center",
    },
    statNumber: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#FF6B35",
    },
    statLabel: {
      fontSize: 12,
      color: isDarkMode ? "#999" : "#666",
      marginTop: 4,
    },
    insightsSection: {
      marginHorizontal: 16,
      marginBottom: 16,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
    },
    insightCard: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    insightHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    insightIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    insightType: {
      fontSize: 14,
      fontWeight: "600",
      color: isDarkMode ? "#ccc" : "#666",
    },
    insightText: {
      fontSize: 16,
      lineHeight: 24,
      color: isDarkMode ? "#e0e0e0" : "#333",
      marginBottom: 8,
    },
    insightMeta: {
      fontSize: 12,
      color: isDarkMode ? "#999" : "#666",
    },
    ctaSection: {
      margin: 16,
      padding: 20,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 32,
    },
    ctaTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 8,
      textAlign: "center",
    },
    ctaText: {
      fontSize: 16,
      lineHeight: 24,
      color: isDarkMode ? "#ccc" : "#666",
      textAlign: "center",
    },
    filtersSection: {
      marginHorizontal: 16,
      marginTop: 16,
    },
    filterToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 8,
      gap: 8,
    },
    filterToggleText: {
      fontSize: 16,
      color: "#FF6B35",
      fontWeight: "600",
    },
    filtersContainer: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      marginHorizontal: 16,
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f8f8f8",
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 12,
      height: 44,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333",
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
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 8,
    },
    filterButton: {
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? "#4a4a4a" : "#e0e0e0",
    },
    activeFilterButton: {
      backgroundColor: "#FF6B35",
      borderColor: "#FF6B35",
    },
    filterButtonText: {
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#666",
      fontWeight: "500",
    },
    activeFilterButtonText: {
      color: "#fff",
      fontWeight: "600",
    },
    entriesSection: {
      marginHorizontal: 16,
      marginBottom: 32,
    },
    emptyContainer: {
      padding: 40,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 16,
      color: isDarkMode ? "#999" : "#666",
      textAlign: "center",
      lineHeight: 24,
    },
    entryCard: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    entryContent: {
      padding: 16,
    },
    entryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    entryMeta: {
      flex: 1,
    },
    entryCategory: {
      fontSize: 12,
      fontWeight: "600",
      color: "#FF6B35",
      backgroundColor: isDarkMode ? "rgba(255, 107, 53, 0.1)" : "rgba(255, 107, 53, 0.1)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: "flex-start",
      marginBottom: 4,
    },
    entryDate: {
      fontSize: 12,
      color: isDarkMode ? "#999" : "#666",
    },
    entryImage: {
      width: "100%",
      height: 120,
      borderRadius: 8,
      marginBottom: 8,
    },
    entryText: {
      fontSize: 16,
      lineHeight: 24,
      color: isDarkMode ? "#e0e0e0" : "#333",
      marginBottom: 8,
    },
    entryAI: {
      fontSize: 14,
      lineHeight: 20,
      color: isDarkMode ? "#999" : "#666",
      fontStyle: "italic",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    editModal: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      padding: 20,
      margin: 20,
      minWidth: 300,
    },
    editModalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 16,
      textAlign: "center",
    },
    editTextInput: {
      borderWidth: 1,
      borderColor: isDarkMode ? "#4a4a4a" : "#ddd",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333",
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f9f9f9",
      minHeight: 100,
      textAlignVertical: "top",
      marginBottom: 20,
    },
    editModalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    editModalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    cancelButton: {
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
    },
    saveButton: {
      backgroundColor: "#FF6B35",
    },
    cancelButtonText: {
      color: isDarkMode ? "#ccc" : "#666",
      fontWeight: "600",
    },
    saveButtonText: {
      color: "#fff",
      fontWeight: "600",
    },
    
    // Floating Action Button
    floatingActionButton: {
      position: "absolute",
      bottom: 100, // Position above bottom navigation
      right: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "#FF6B35",
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      zIndex: 1000,
    },
    fabInner: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 30,
    },
  });