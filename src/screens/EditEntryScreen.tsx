import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { TopNavigationBar } from '../components/TopNavigationBar';

interface DailyEntry {
  id: string;
  user_id: string;
  category: string;
  transcription: string;
  ai_response?: string;
  created_at: string;
  image_url?: string;
  is_private: boolean;
  favorite?: boolean;
}

interface EditEntryScreenProps {
  user: any;
  entry: DailyEntry;
  isDarkMode?: boolean;
  onBack: () => void;
  onSave: (updatedEntry: DailyEntry) => void;
  onDelete?: (entryId: string) => void;
}

export const EditEntryScreen: React.FC<EditEntryScreenProps> = ({
  user,
  entry,
  isDarkMode = false,
  onBack,
  onSave,
  onDelete,
}) => {
  const [transcription, setTranscription] = useState(entry.transcription);
  const [category, setCategory] = useState(entry.category);
  const [isPrivate, setIsPrivate] = useState(entry.is_private);
  const [imageUrl, setImageUrl] = useState(entry.image_url);
  const [isLoading, setIsLoading] = useState(false);

  const styles = getStyles(isDarkMode);

  // Enhanced category definitions with icons and colors
  const categoryOptions = [
    { name: 'Health & Fitness', icon: 'fitness', color: '#4CAF50' },
    { name: 'Career & Work', icon: 'briefcase', color: '#2196F3' },
    { name: 'Family & Friends', icon: 'people', color: '#FF9800' },
    { name: 'Personal Growth', icon: 'trending-up', color: '#9C27B0' },
    { name: 'Hobbies & Interests', icon: 'brush', color: '#F44336' },
    { name: 'Financial Goals', icon: 'wallet', color: '#795548' },
    { name: 'Community & Service', icon: 'heart', color: '#E91E63' },
  ];

  const handleSaveEntry = async () => {
    if (!transcription.trim()) {
      Alert.alert('Error', 'Please enter some content for your entry.');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Please select a category for your entry.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('daily_entries')
        .update({
          transcription: transcription.trim(),
          category,
          is_private: isPrivate,
          image_url: imageUrl,
        })
        .eq('id', entry.id)
        .select()
        .single();

      if (error) throw error;

      const updatedEntry: DailyEntry = {
        ...entry,
        transcription: transcription.trim(),
        category,
        is_private: isPrivate,
        image_url: imageUrl,
      };

      Alert.alert(
        'Success',
        'Your entry has been updated successfully!',
        [{ text: 'OK', onPress: () => {
          onSave(updatedEntry);
          onBack();
        }}]
      );
    } catch (error) {
      console.error('Error updating entry:', error);
      Alert.alert('Error', 'Failed to update entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove the image from this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setImageUrl(undefined),
        },
      ]
    );
  };

  const handleDeleteEntry = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const { error } = await supabase
                .from('daily_entries')
                .delete()
                .eq('id', entry.id);

              if (error) throw error;

              if (onDelete) {
                onDelete(entry.id);
              }
              
              Alert.alert(
                'Entry Deleted',
                'Your entry has been deleted successfully.',
                [{ text: 'OK', onPress: onBack }]
              );
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderCategoryOption = (categoryOption: any) => {
    const isSelected = category === categoryOption.name;

    return (
      <TouchableOpacity
        key={categoryOption.name}
        style={[
          styles.categoryOption,
          isSelected && { backgroundColor: categoryOption.color + '20', borderColor: categoryOption.color }
        ]}
        onPress={() => setCategory(categoryOption.name)}
      >
        <View style={[styles.categoryIcon, { backgroundColor: categoryOption.color }]}>
          <Ionicons 
            name={categoryOption.icon as any} 
            size={20} 
            color="#fff" 
          />
        </View>
        <Text style={[
          styles.categoryText,
          isSelected && { color: categoryOption.color, fontWeight: '600' }
        ]}>
          {categoryOption.name}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={categoryOption.color} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopNavigationBar
        user={user}
        title="Edit Entry"
        onProfilePress={() => {}}
        showBackButton={true}
        onBackPress={onBack}
        isDarkMode={isDarkMode}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Entry Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Going Well</Text>
          <TextInput
            style={styles.textInput}
            value={transcription}
            onChangeText={setTranscription}
            placeholder="Share what's going well in your life..."
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Image Section */}
        {imageUrl && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Image</Text>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                <Text style={styles.removeImageText}>Remove</Text>
              </TouchableOpacity>
            </View>
            <Image source={{ uri: imageUrl }} style={styles.entryImage} />
          </View>
        )}

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <Text style={styles.sectionSubtitle}>
            Choose which area of life this entry relates to
          </Text>
          <View style={styles.categoriesContainer}>
            {categoryOptions.map(renderCategoryOption)}
          </View>
        </View>

        {/* Privacy Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <Text style={styles.sectionSubtitle}>
            Control who can see this entry
          </Text>
          
          <TouchableOpacity
            style={[
              styles.privacyOption,
              !isPrivate && styles.privacyOptionSelected
            ]}
            onPress={() => setIsPrivate(false)}
          >
            <View style={styles.privacyIconContainer}>
              <Ionicons 
                name="globe-outline" 
                size={24} 
                color={!isPrivate ? '#4CAF50' : (isDarkMode ? '#666' : '#999')} 
              />
            </View>
            <View style={styles.privacyInfo}>
              <Text style={[
                styles.privacyTitle,
                !isPrivate && { color: '#4CAF50', fontWeight: '600' }
              ]}>
                Public
              </Text>
              <Text style={styles.privacyDescription}>
                Visible to your followers and in groups you're part of
              </Text>
            </View>
            {!isPrivate && (
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.privacyOption,
              isPrivate && styles.privacyOptionSelected
            ]}
            onPress={() => setIsPrivate(true)}
          >
            <View style={styles.privacyIconContainer}>
              <Ionicons 
                name="lock-closed-outline" 
                size={24} 
                color={isPrivate ? '#FF9800' : (isDarkMode ? '#666' : '#999')} 
              />
            </View>
            <View style={styles.privacyInfo}>
              <Text style={[
                styles.privacyTitle,
                isPrivate && { color: '#FF9800', fontWeight: '600' }
              ]}>
                Private
              </Text>
              <Text style={styles.privacyDescription}>
                Only visible to you in your personal journal
              </Text>
            </View>
            {isPrivate && (
              <Ionicons name="checkmark-circle" size={20} color="#FF9800" />
            )}
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSaveEntry}
            disabled={isLoading}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          {onDelete && (
            <TouchableOpacity
              style={[styles.deleteButton, isLoading && styles.deleteButtonDisabled]}
              onPress={handleDeleteEntry}
              disabled={isLoading}
            >
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              <Text style={styles.deleteButtonText}>Delete Entry</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  
  // Text Input
  textInput: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: isDarkMode ? '#fff' : '#333',
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
    textAlignVertical: 'top',
  },

  // Image Section
  entryImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: isDarkMode ? '#3a3a3a' : '#f0f0f0',
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeImageText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },

  // Categories
  categoriesContainer: {
    gap: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryText: {
    flex: 1,
    fontSize: 16,
    color: isDarkMode ? '#fff' : '#333',
  },

  // Privacy Options
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  privacyOptionSelected: {
    borderColor: isDarkMode ? '#4CAF50' : '#4CAF50',
  },
  privacyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDarkMode ? '#3a3a3a' : '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  privacyInfo: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 4,
  },
  privacyDescription: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
    lineHeight: 18,
  },

  // Action Buttons
  actionButtonsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    gap: 8,
  },
  deleteButtonDisabled: {
    borderColor: '#ccc',
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
});