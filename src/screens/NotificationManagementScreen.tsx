import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TopNavigationBar } from '../components/TopNavigationBar';
import { NotificationTemplatesService, NotificationTemplate } from '../services/notificationTemplatesService';

interface NotificationManagementScreenProps {
  user: any;
  isDarkMode?: boolean;
  onBack: () => void;
  onEditTemplate?: (template: NotificationTemplate) => void;
  onCreateTemplate?: () => void;
}

export const NotificationManagementScreen: React.FC<NotificationManagementScreenProps> = ({
  user,
  isDarkMode = false,
  onBack,
  onEditTemplate,
  onCreateTemplate,
}) => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const styles = getStyles(isDarkMode);
  const categories = [
    { key: 'all', title: 'All', icon: 'list', color: '#FF6B35' },
    ...NotificationTemplatesService.getTemplateCategories()
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const userTemplates = await NotificationTemplatesService.getTemplates(user.id);
      setTemplates(userTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      Alert.alert('Error', 'Failed to load notification templates');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTemplate = async (template: NotificationTemplate) => {
    try {
      const success = await NotificationTemplatesService.toggleTemplateStatus(
        template.id, 
        !template.is_active
      );
      
      if (success) {
        setTemplates(prev => 
          prev.map(t => 
            t.id === template.id 
              ? { ...t, is_active: !t.is_active }
              : t
          )
        );
      } else {
        Alert.alert('Error', 'Failed to update template status');
      }
    } catch (error) {
      console.error('Error toggling template:', error);
      Alert.alert('Error', 'Failed to update template status');
    }
  };

  const handleDuplicateTemplate = async (template: NotificationTemplate) => {
    try {
      const newTemplateId = await NotificationTemplatesService.duplicateTemplate(
        template.id,
        `${template.name} (Copy)`
      );
      
      if (newTemplateId) {
        Alert.alert('Success', 'Template duplicated successfully');
        loadTemplates(); // Refresh the list
      } else {
        Alert.alert('Error', 'Failed to duplicate template');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      Alert.alert('Error', 'Failed to duplicate template');
    }
  };

  const handleDeleteTemplate = async (template: NotificationTemplate) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await NotificationTemplatesService.deleteTemplate(template.id);
              
              if (success) {
                setTemplates(prev => prev.filter(t => t.id !== template.id));
                Alert.alert('Success', 'Template deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete template');
              }
            } catch (error) {
              console.error('Error deleting template:', error);
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ]
    );
  };

  const handleScheduleTemplate = async (template: NotificationTemplate) => {
    try {
      const scheduledCount = await NotificationTemplatesService.scheduleFromTemplate(template.id, 7);
      
      if (scheduledCount > 0) {
        Alert.alert(
          'Scheduled!', 
          `${scheduledCount} notification${scheduledCount === 1 ? '' : 's'} scheduled from this template.`
        );
      } else {
        Alert.alert('Info', 'No notifications were scheduled. Check your template settings.');
      }
    } catch (error) {
      console.error('Error scheduling template:', error);
      Alert.alert('Error', 'Failed to schedule notifications from template');
    }
  };

  const getTemplateIcon = (type: string, category: string) => {
    const categoryData = categories.find(c => c.key === category);
    if (categoryData) return categoryData.icon;
    
    switch (type) {
      case 'daily_reminder': return 'alarm';
      case 'weekly_summary': return 'calendar';
      case 'monthly_summary': return 'calendar-outline';
      case 'streak_milestone': return 'trophy';
      default: return 'notifications';
    }
  };

  const getTemplateColor = (category: string) => {
    const categoryData = categories.find(c => c.key === category);
    return categoryData?.color || '#FF6B35';
  };

  const formatRecurrence = (template: NotificationTemplate) => {
    if (!template.is_recurring) return 'One-time';
    
    if (template.recurrence_pattern === 'daily') {
      return `Daily at ${formatTime(template.scheduled_time || '20:00:00')}`;
    }
    
    if (template.recurrence_pattern === 'weekly') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const selectedDays = template.scheduled_days?.map(d => days[d]).join(', ') || 'Not set';
      return `Weekly on ${selectedDays} at ${formatTime(template.scheduled_time || '09:00:00')}`;
    }
    
    if (template.recurrence_pattern === 'monthly') {
      return `Monthly at ${formatTime(template.scheduled_time || '09:00:00')}`;
    }
    
    return template.recurrence_pattern || 'Custom';
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNavigationBar
          user={user}
          title="Notification Templates"
          showBackButton={true}
          onBackPress={onBack}
          isDarkMode={isDarkMode}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading templates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopNavigationBar
        user={user}
        title="Notification Templates"
        showBackButton={true}
        onBackPress={onBack}
        isDarkMode={isDarkMode}
        rightComponent={
          <TouchableOpacity onPress={onCreateTemplate} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#FF6B35" />
          </TouchableOpacity>
        }
      />

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScrollView}>
        <View style={styles.categoryContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryChip,
                selectedCategory === category.key && styles.activeCategoryChip,
                { borderColor: category.color }
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={selectedCategory === category.key ? '#fff' : category.color}
              />
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category.key && styles.activeCategoryChipText
              ]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredTemplates.length > 0 ? (
          <View style={styles.templatesList}>
            {filteredTemplates.map((template) => (
              <View key={template.id} style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <View style={styles.templateInfo}>
                    <View style={[
                      styles.templateIcon, 
                      { backgroundColor: getTemplateColor(template.category) }
                    ]}>
                      <Ionicons
                        name={getTemplateIcon(template.notification_type, template.category) as any}
                        size={20}
                        color="#fff"
                      />
                    </View>
                    <View style={styles.templateDetails}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <Text style={styles.templateType}>{formatRecurrence(template)}</Text>
                      {template.description && (
                        <Text style={styles.templateDescription}>{template.description}</Text>
                      )}
                    </View>
                  </View>
                  <Switch
                    value={template.is_active}
                    onValueChange={() => handleToggleTemplate(template)}
                    trackColor={{ false: '#767577', true: '#FF6B35' }}
                    thumbColor={template.is_active ? '#fff' : '#f4f3f4'}
                  />
                </View>

                <View style={styles.templateContent}>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <Text style={styles.templateBody}>{template.body}</Text>
                </View>

                <View style={styles.templateStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{template.send_count}</Text>
                    <Text style={styles.statLabel}>Sent</Text>
                  </View>
                  {template.last_sent_at && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {new Date(template.last_sent_at).toLocaleDateString()}
                      </Text>
                      <Text style={styles.statLabel}>Last Sent</Text>
                    </View>
                  )}
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {template.is_default ? 'Default' : 'Custom'}
                    </Text>
                    <Text style={styles.statLabel}>Type</Text>
                  </View>
                </View>

                <View style={styles.templateActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onEditTemplate?.(template)}
                  >
                    <Ionicons name="create" size={16} color="#3498DB" />
                    <Text style={[styles.actionButtonText, { color: '#3498DB' }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDuplicateTemplate(template)}
                  >
                    <Ionicons name="copy" size={16} color="#2ECC71" />
                    <Text style={[styles.actionButtonText, { color: '#2ECC71' }]}>Duplicate</Text>
                  </TouchableOpacity>

                  {template.is_recurring && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleScheduleTemplate(template)}
                    >
                      <Ionicons name="time" size={16} color="#9B59B6" />
                      <Text style={[styles.actionButtonText, { color: '#9B59B6' }]}>Schedule</Text>
                    </TouchableOpacity>
                  )}

                  {!template.is_default && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteTemplate(template)}
                    >
                      <Ionicons name="trash" size={16} color="#E74C3C" />
                      <Text style={[styles.actionButtonText, { color: '#E74C3C' }]}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color={isDarkMode ? "#666" : "#999"} />
            <Text style={styles.emptyStateTitle}>No Templates Found</Text>
            <Text style={styles.emptyStateText}>
              {selectedCategory === 'all' 
                ? "You don't have any notification templates yet."
                : `No templates in the "${categories.find(c => c.key === selectedCategory)?.title}" category.`
              }
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={onCreateTemplate}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Template</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
    },
    addButton: {
      padding: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: isDarkMode ? "#888" : "#666",
    },
    categoryScrollView: {
      maxHeight: 60,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    categoryContainer: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    categoryChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      gap: 4,
    },
    activeCategoryChip: {
      backgroundColor: "#FF6B35",
    },
    categoryChipText: {
      fontSize: 14,
      fontWeight: "500",
      color: isDarkMode ? "#ccc" : "#666",
    },
    activeCategoryChipText: {
      color: "#fff",
    },
    content: {
      flex: 1,
    },
    templatesList: {
      padding: 16,
      gap: 16,
    },
    templateCard: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    templateHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    templateInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    templateIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    templateDetails: {
      flex: 1,
    },
    templateName: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 2,
    },
    templateType: {
      fontSize: 12,
      color: isDarkMode ? "#888" : "#666",
      marginBottom: 2,
    },
    templateDescription: {
      fontSize: 12,
      color: isDarkMode ? "#aaa" : "#888",
      fontStyle: "italic",
    },
    templateContent: {
      marginBottom: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
      borderRadius: 8,
    },
    templateTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 4,
    },
    templateBody: {
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#666",
      lineHeight: 20,
    },
    templateStats: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    statItem: {
      alignItems: "center",
    },
    statValue: {
      fontSize: 14,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
    },
    statLabel: {
      fontSize: 12,
      color: isDarkMode ? "#888" : "#666",
      marginTop: 2,
    },
    templateActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
      gap: 4,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: "500",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: isDarkMode ? "#888" : "#666",
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 16,
      color: isDarkMode ? "#666" : "#999",
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 24,
    },
    createButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FF6B35",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
    },
    createButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    bottomPadding: {
      height: 20,
    },
  });