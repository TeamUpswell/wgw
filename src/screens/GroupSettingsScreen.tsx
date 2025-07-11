import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { TopNavigationBar } from '../components/TopNavigationBar';
import { InviteModal } from '../components/InviteModal';
import { saveGroupSettings, getGroupSettings, GroupSharingSettings } from '../services/groupService';

interface GroupSettingsScreenProps {
  user: any;
  group: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  isDarkMode?: boolean;
  onBack?: () => void;
  onSave?: (settings: GroupSharingSettings) => void;
}


interface Category {
  name: string;
  icon: string;
  description: string;
}

export const GroupSettingsScreen: React.FC<GroupSettingsScreenProps> = ({
  user,
  group,
  isDarkMode = false,
  onBack,
  onSave,
}) => {
  const [settings, setSettings] = useState<GroupSharingSettings>({
    groupId: group.id,
    shareAllCategories: true,
    sharedCategories: [],
    sharePrivateEntries: false,
    shareImages: true,
  });

  const [userCategories, setUserCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const styles = getStyles(isDarkMode);

  // Enhanced category definitions with icons and descriptions
  const categoryDetails: { [key: string]: Category } = {
    'Health & Fitness': {
      name: 'Health & Fitness',
      icon: 'fitness',
      description: 'Workouts, nutrition, wellness moments'
    },
    'Career & Work': {
      name: 'Career & Work',
      icon: 'briefcase',
      description: 'Professional achievements, work reflections'
    },
    'Family & Friends': {
      name: 'Family & Friends',
      icon: 'people',
      description: 'Relationships, social moments, connections'
    },
    'Personal Growth': {
      name: 'Personal Growth',
      icon: 'trending-up',
      description: 'Learning, self-improvement, insights'
    },
    'Hobbies & Interests': {
      name: 'Hobbies & Interests',
      icon: 'brush',
      description: 'Creative pursuits, passions, fun activities'
    },
    'Financial Goals': {
      name: 'Financial Goals',
      icon: 'wallet',
      description: 'Money management, savings, investments'
    },
    'Community & Service': {
      name: 'Community & Service',
      icon: 'heart',
      description: 'Volunteering, helping others, community involvement'
    },
  };

  useEffect(() => {
    loadUserCategories();
    loadGroupSettings();
  }, []);

  const loadUserCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('user_categories')
        .select('categories')
        .eq('user_id', user.id);

      if (error) throw error;

      const categories = data?.[0]?.categories || Object.keys(categoryDetails);
      setUserCategories(categories);
      
      // Initialize shared categories with all categories if shareAllCategories is true
      if (settings.shareAllCategories) {
        setSettings(prev => ({ ...prev, sharedCategories: categories }));
      }
    } catch (error) {
      console.error('Error loading user categories:', error);
      setUserCategories(Object.keys(categoryDetails));
    }
  };

  const loadGroupSettings = async () => {
    try {
      const groupSettings = await getGroupSettings(user.id, group.id);
      setSettings(groupSettings);
      console.log(`Loaded settings for group: ${group.name}`, groupSettings);
    } catch (error) {
      console.error('Error loading group settings:', error);
    }
  };

  const handleSaveGroupSettings = async () => {
    setIsLoading(true);
    try {
      await saveGroupSettings(user.id, settings);
      
      if (onSave) {
        onSave(settings);
      }
      
      Alert.alert(
        'Settings Saved',
        `Sharing preferences for ${group.name} have been updated.`,
        [{ text: 'OK', onPress: onBack }]
      );
    } catch (error) {
      console.error('Error saving group settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShareAllCategories = (value: boolean) => {
    setSettings(prev => ({
      ...prev,
      shareAllCategories: value,
      sharedCategories: value ? userCategories : [],
    }));
  };

  const toggleCategorySharing = (category: string) => {
    setSettings(prev => {
      const isCurrentlyShared = prev.sharedCategories.includes(category);
      const newSharedCategories = isCurrentlyShared
        ? prev.sharedCategories.filter(c => c !== category)
        : [...prev.sharedCategories, category];

      return {
        ...prev,
        sharedCategories: newSharedCategories,
        shareAllCategories: newSharedCategories.length === userCategories.length,
      };
    });
  };

  const renderCategoryToggle = (category: string) => {
    const details = categoryDetails[category] || {
      name: category,
      icon: 'ellipse',
      description: 'Custom category'
    };
    
    const isShared = settings.sharedCategories.includes(category);
    const isDisabled = settings.shareAllCategories;

    return (
      <View key={category} style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryIcon}>
            <Ionicons 
              name={details.icon as any} 
              size={20} 
              color={isShared ? group.color : (isDarkMode ? '#666' : '#999')} 
            />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{details.name}</Text>
            <Text style={styles.categoryDescription}>{details.description}</Text>
          </View>
          <Switch
            value={isShared}
            onValueChange={() => toggleCategorySharing(category)}
            disabled={isDisabled}
            trackColor={{ 
              false: isDarkMode ? '#3a3a3a' : '#e0e0e0', 
              true: group.color + '40' 
            }}
            thumbColor={isShared ? group.color : (isDarkMode ? '#666' : '#999')}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopNavigationBar
        user={user}
        title={`${group.name} Settings`}
        onProfilePress={() => {}}
        showBackButton={true}
        onBackPress={onBack}
        isDarkMode={isDarkMode}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Header */}
        <View style={styles.groupHeader}>
          <View style={[styles.groupIconLarge, { backgroundColor: group.color }]}>
            <Ionicons name={group.icon as any} size={32} color="#fff" />
          </View>
          <View style={styles.groupHeaderInfo}>
            <Text style={styles.groupTitle}>{group.name}</Text>
            <Text style={styles.groupSubtitle}>Content sharing preferences</Text>
          </View>
        </View>

        {/* Invite Friends Button */}
        <TouchableOpacity 
          style={styles.inviteButton}
          onPress={() => setShowInviteModal(true)}
        >
          <Ionicons name="person-add" size={20} color="#fff" />
          <Text style={styles.inviteButtonText}>Invite Friends to {group.name}</Text>
        </TouchableOpacity>

        {/* Quick Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Settings</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Share All Categories</Text>
                <Text style={styles.settingDescription}>
                  Allow this group to see entries from all your categories
                </Text>
              </View>
              <Switch
                value={settings.shareAllCategories}
                onValueChange={toggleShareAllCategories}
                trackColor={{ 
                  false: isDarkMode ? '#3a3a3a' : '#e0e0e0', 
                  true: group.color + '40' 
                }}
                thumbColor={settings.shareAllCategories ? group.color : (isDarkMode ? '#666' : '#999')}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Include Images</Text>
                <Text style={styles.settingDescription}>
                  Share photos and images with your entries
                </Text>
              </View>
              <Switch
                value={settings.shareImages}
                onValueChange={(value) => setSettings(prev => ({ ...prev, shareImages: value }))}
                trackColor={{ 
                  false: isDarkMode ? '#3a3a3a' : '#e0e0e0', 
                  true: group.color + '40' 
                }}
                thumbColor={settings.shareImages ? group.color : (isDarkMode ? '#666' : '#999')}
              />
            </View>
          </View>

        </View>

        {/* Category-Specific Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Permissions</Text>
          <Text style={styles.sectionSubtitle}>
            Choose which types of content to share with this group
          </Text>
          
          {!settings.shareAllCategories && (
            <View style={styles.categoriesHint}>
              <Ionicons name="information-circle" size={16} color={group.color} />
              <Text style={[styles.hintText, { color: group.color }]}>
                Select individual categories to share
              </Text>
            </View>
          )}

          {userCategories.map(renderCategoryToggle)}
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacySection}>
          <View style={styles.privacyHeader}>
            <Ionicons name="shield-checkmark" size={20} color={group.color} />
            <Text style={[styles.privacyTitle, { color: group.color }]}>Privacy Protection</Text>
          </View>
          <Text style={styles.privacyText}>
            Your private entries are never shared with any group, regardless of these settings. 
            Only public entries from selected categories will be visible to group members.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: group.color }]}
          onPress={handleSaveGroupSettings}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Invite Modal */}
      <InviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        isDarkMode={isDarkMode}
        user={user}
        group={group}
      />
    </SafeAreaView>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  
  // Group Header
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  groupIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  groupHeaderInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 4,
  },
  groupSubtitle: {
    fontSize: 16,
    color: isDarkMode ? '#888' : '#666',
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
    marginBottom: 16,
  },

  // Settings Cards
  settingCard: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
    lineHeight: 20,
  },

  // Category Cards
  categoryCard: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDarkMode ? '#3a3a3a' : '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
    marginRight: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 13,
    color: isDarkMode ? '#888' : '#666',
    lineHeight: 18,
  },

  // Hints and Info
  categoriesHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  hintText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },

  // Privacy Section
  privacySection: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  privacyText: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
    lineHeight: 20,
  },

  // Save Button
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Invite Button
  inviteButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});