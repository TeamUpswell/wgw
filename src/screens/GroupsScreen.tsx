import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { TopNavigationBar } from '../components/TopNavigationBar';
import { GroupSettingsScreen } from './GroupSettingsScreen';
import { EnhancedProfileScreen } from './EnhancedProfileScreen';

interface GroupsScreenProps {
  user: any;
  isDarkMode?: boolean;
  onBack?: () => void;
}

interface Group {
  id: string;
  name: string;
  icon: string;
  color: string;
  memberCount: number;
}

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  email: string;
}

export const GroupsScreen: React.FC<GroupsScreenProps> = ({
  user,
  isDarkMode = false,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'discover' | 'groups' | 'following'>('discover');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const styles = getStyles(isDarkMode);

  // Default groups with elegant icons and colors
  const defaultGroups: Group[] = [
    { id: 'family', name: 'Family', icon: 'people', color: '#FF6B6B', memberCount: 0 },
    { id: 'work', name: 'Work', icon: 'briefcase', color: '#4ECDC4', memberCount: 0 },
    { id: 'friends', name: 'Friends', icon: 'heart', color: '#45B7D1', memberCount: 0 },
    { id: 'fitness', name: 'Fitness', icon: 'fitness', color: '#96CEB4', memberCount: 0 },
  ];

  useEffect(() => {
    loadMyGroups();
    loadFollowing();
  }, []);

  const loadMyGroups = async () => {
    // For now, use default groups. Later, we'll load from database
    setMyGroups(defaultGroups);
  };

  const loadFollowing = async () => {
    try {
      const { data: followsData } = await supabase
        .from('follows')
        .select('followed_id')
        .eq('follower_id', user.id);

      if (followsData && followsData.length > 0) {
        const userIds = followsData.map(f => f.followed_id);
        const { data: usersData } = await supabase
          .from('users')
          .select('id, username, display_name, avatar_url, email')
          .in('id', userIds);

        setFollowing(usersData || []);
      }
    } catch (error) {
      console.error('Error loading following:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url, email')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%`)
        .neq('id', user.id) // Exclude current user
        .limit(20);

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollow = async (targetUser: User) => {
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, followed_id: targetUser.id });

      if (error) throw error;

      Alert.alert('Success', `You are now following ${targetUser.display_name || targetUser.username}`);
      loadFollowing(); // Refresh following list
    } catch (error) {
      console.error('Error following user:', error);
      Alert.alert('Error', 'Failed to follow user');
    }
  };

  const handleUnfollow = async (targetUser: User) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followed_id', targetUser.id);

      if (error) throw error;

      Alert.alert('Success', `You unfollowed ${targetUser.display_name || targetUser.username}`);
      loadFollowing(); // Refresh following list
    } catch (error) {
      console.error('Error unfollowing user:', error);
      Alert.alert('Error', 'Failed to unfollow user');
    }
  };

  const isUserFollowed = (targetUser: User) => {
    return following.some(f => f.id === targetUser.id);
  };

  const handleGroupPress = (group: Group) => {
    setSelectedGroup(group);
    setShowGroupSettings(true);
  };

  const handleGroupSettingsSave = (settings: any) => {
    console.log('Group settings saved:', settings);
    // TODO: Save to database and update UI
  };

  const handleUserPress = (targetUser: User) => {
    setSelectedUser(targetUser);
    setShowUserProfile(true);
  };

  const renderDiscoverTab = () => (
    <View style={styles.tabContent}>
      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={isDarkMode ? "#888" : "#666"} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username, name, or email..."
            placeholderTextColor={isDarkMode ? "#888" : "#666"}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchUsers(text);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}>
              <Ionicons name="close-circle" size={20} color={isDarkMode ? "#888" : "#666"} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          {searchResults.map((foundUser) => (
            <View key={foundUser.id} style={styles.userCard}>
              <TouchableOpacity 
                style={styles.userInfo}
                onPress={() => handleUserPress(foundUser)}
              >
                <View style={styles.avatar}>
                  <Ionicons name="person" size={24} color={isDarkMode ? "#666" : "#999"} />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{foundUser.display_name || foundUser.username}</Text>
                  <Text style={styles.userHandle}>@{foundUser.username}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isUserFollowed(foundUser) ? styles.unfollowButton : styles.followButton
                ]}
                onPress={() => {
                  if (isUserFollowed(foundUser)) {
                    handleUnfollow(foundUser);
                  } else {
                    handleFollow(foundUser);
                  }
                }}
              >
                <Text style={[
                  styles.actionButtonText,
                  isUserFollowed(foundUser) ? styles.unfollowButtonText : styles.followButtonText
                ]}>
                  {isUserFollowed(foundUser) ? 'Unfollow' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Quick Invite Section */}
      <View style={styles.inviteSection}>
        <Text style={styles.sectionTitle}>Invite Friends</Text>
        <TouchableOpacity style={styles.inviteCard}>
          <View style={styles.inviteContent}>
            <Ionicons name="mail" size={24} color="#FF6B35" />
            <View style={styles.inviteText}>
              <Text style={styles.inviteTitle}>Invite by Email</Text>
              <Text style={styles.inviteSubtitle}>Send invitations to friends</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#666" : "#999"} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGroupsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>My Groups</Text>
      
      {myGroups.map((group) => (
        <TouchableOpacity 
          key={group.id} 
          style={styles.groupCard}
          onPress={() => handleGroupPress(group)}
        >
          <View style={[styles.groupIcon, { backgroundColor: group.color }]}>
            <Ionicons name={group.icon as any} size={24} color="#fff" />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupMemberCount}>
              {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>
          <View style={styles.groupActions}>
            <Ionicons name="settings-outline" size={16} color={isDarkMode ? "#666" : "#999"} />
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#666" : "#999"} />
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.createGroupCard}>
        <View style={styles.createGroupIcon}>
          <Ionicons name="add" size={24} color="#FF6B35" />
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.createGroupText}>Create New Group</Text>
          <Text style={styles.createGroupSubtext}>Organize your connections</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderFollowingTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Following ({following.length})</Text>
      
      {following.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={isDarkMode ? "#666" : "#999"} />
          <Text style={styles.emptyStateText}>No one followed yet</Text>
          <Text style={styles.emptyStateSubtext}>Start discovering and following friends!</Text>
        </View>
      ) : (
        following.map((followedUser) => (
          <View key={followedUser.id} style={styles.userCard}>
            <TouchableOpacity 
              style={styles.userInfo}
              onPress={() => handleUserPress(followedUser)}
            >
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={isDarkMode ? "#666" : "#999"} />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{followedUser.display_name || followedUser.username}</Text>
                <Text style={styles.userHandle}>@{followedUser.username}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.unfollowButton]}
              onPress={() => handleUnfollow(followedUser)}
            >
              <Text style={[styles.actionButtonText, styles.unfollowButtonText]}>
                Unfollow
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopNavigationBar
        user={user}
        title="Groups"
        onProfilePress={() => {}} // Handle profile press
        showBackButton={!!onBack}
        onBackPress={onBack}
        isDarkMode={isDarkMode}
      />

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {[
          { key: 'discover', title: 'Discover', icon: 'search' },
          { key: 'groups', title: 'Groups', icon: 'people' },
          { key: 'following', title: 'Following', icon: 'heart' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? '#FF6B35' : (isDarkMode ? '#666' : '#999')}
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'discover' && renderDiscoverTab()}
        {activeTab === 'groups' && renderGroupsTab()}
        {activeTab === 'following' && renderFollowingTab()}
      </ScrollView>

      {/* Group Settings Modal */}
      {showGroupSettings && selectedGroup && (
        <Modal visible={showGroupSettings} animationType="slide">
          <GroupSettingsScreen
            user={user}
            group={selectedGroup}
            isDarkMode={isDarkMode}
            onBack={() => {
              setShowGroupSettings(false);
              setSelectedGroup(null);
            }}
            onSave={handleGroupSettingsSave}
          />
        </Modal>
      )}

      {/* User Profile Modal */}
      {showUserProfile && selectedUser && (
        <Modal visible={showUserProfile} animationType="slide">
          <EnhancedProfileScreen
            user={selectedUser}
            isDarkMode={isDarkMode}
            isOwnProfile={false}
            onClose={() => {
              setShowUserProfile(false);
              setSelectedUser(null);
            }}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: isDarkMode ? '#666' : '#999',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 16,
  },
  
  // Search Section
  searchSection: {
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: isDarkMode ? '#fff' : '#333',
  },

  // Results Section
  resultsSection: {
    marginBottom: 24,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: isDarkMode ? '#3a3a3a' : '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: '#FF6B35',
  },
  unfollowButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: isDarkMode ? '#666' : '#999',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  followButtonText: {
    color: '#fff',
  },
  unfollowButtonText: {
    color: isDarkMode ? '#888' : '#666',
  },

  // Invite Section
  inviteSection: {
    marginBottom: 24,
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  inviteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inviteText: {
    marginLeft: 12,
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 2,
  },
  inviteSubtitle: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
  },

  // Groups Section
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 2,
  },
  groupMemberCount: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
  },
  createGroupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
    borderStyle: 'dashed',
  },
  createGroupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: isDarkMode ? '#3a3a3a' : '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  createGroupText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 2,
  },
  createGroupSubtext: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: isDarkMode ? '#666' : '#999',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: isDarkMode ? '#666' : '#999',
    textAlign: 'center',
  },
});