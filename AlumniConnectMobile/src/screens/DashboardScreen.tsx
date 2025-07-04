import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/Card';
import CustomButton from '../components/CustomButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { colors, spacing, typography, globalStyles } from '../styles/globalStyles';

const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [profileData, setProfileData] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch profile data based on user role
      let profileEndpoint = '';
      switch (user?.role) {
        case 'STUDENT':
          profileEndpoint = 'http://localhost:8082/onboarding/student';
          break;
        case 'ALUMNI':
          profileEndpoint = 'http://localhost:8082/onboarding/alumni';
          break;
        case 'FACULTY':
          profileEndpoint = 'http://localhost:8082/onboarding/faculty';
          break;
        default:
          break;
      }

      if (profileEndpoint) {
        try {
          const profileResponse = await axios.get(profileEndpoint);
          setProfileData(profileResponse.data);
        } catch (error) {
          console.log('Profile not found or error fetching profile');
        }
      }

      // Fetch pending connection requests
      try {
        const requestsResponse = await axios.get('http://localhost:8083/api/chat/connection/pending');
        setPendingRequests(requestsResponse.data);
      } catch (error) {
        console.log('Error fetching pending requests');
      }
    } catch (error) {
      addToast('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { title: 'Find People', icon: 'search', screen: 'UserSearch' },
    { title: 'My Connections', icon: 'people', screen: 'Connections' },
    { title: 'Start Chat', icon: 'chat', screen: 'Chat' },
    { title: 'Edit Profile', icon: 'person', screen: `${user?.role?.toLowerCase()}Profile` },
  ];

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
        <View style={styles.heroSection}>
          <View style={styles.profileAvatar}>
            <Icon name="person" size={48} color={colors.light} />
          </View>
          <Text style={styles.heroTitle}>Welcome, {user?.username || 'User'}!</Text>
          <Text style={styles.heroSubtitle}>
            Role: {user?.role} | Email: {user?.email}
          </Text>
        </View>

        <View style={styles.statusGrid}>
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Profile Status</Text>
              <Icon name="settings" size={20} color={colors.primary} />
            </View>
            <View style={styles.statusContent}>
              {profileData ? (
                <View>
                  <View style={styles.statusBadge}>
                    <View style={[styles.badge, styles.badgeSuccess]}>
                      <Text style={styles.badgeText}>Complete</Text>
                    </View>
                    <Text style={styles.statusText}>Profile is set up</Text>
                  </View>
                  <Text style={styles.statusDescription}>
                    Your profile information is complete and visible to other users.
                  </Text>
                </View>
              ) : (
                <View>
                  <View style={styles.statusBadge}>
                    <View style={[styles.badge, styles.badgePending]}>
                      <Text style={styles.badgeText}>Incomplete</Text>
                    </View>
                    <Text style={styles.statusText}>Profile needs setup</Text>
                  </View>
                  <Text style={styles.statusDescription}>
                    Complete your profile to connect with others.
                  </Text>
                </View>
              )}
            </View>
            <CustomButton
              title={profileData ? 'Update Profile' : 'Complete Profile'}
              onPress={() => navigation.navigate('Profile')}
              variant={profileData ? 'secondary' : 'primary'}
              icon={<Icon name="person" size={18} color={colors.light} />}
            />
          </Card>

          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Connection Requests</Text>
              <Icon name="notifications" size={20} color={colors.primary} />
            </View>
            <View style={styles.statusContent}>
              {pendingRequests.length > 0 ? (
                <View>
                  <View style={styles.statusBadge}>
                    <View style={[styles.badge, styles.badgePending]}>
                      <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                    </View>
                    <Text style={styles.statusText}>Pending requests</Text>
                  </View>
                  <Text style={styles.statusDescription}>
                    You have connection requests waiting for your response.
                  </Text>
                </View>
              ) : (
                <View>
                  <View style={styles.statusBadge}>
                    <View style={[styles.badge, styles.badgeSuccess]}>
                      <Text style={styles.badgeText}>0</Text>
                    </View>
                    <Text style={styles.statusText}>No pending requests</Text>
                  </View>
                  <Text style={styles.statusDescription}>
                    No new connection requests at the moment.
                  </Text>
                </View>
              )}
            </View>
            <CustomButton
              title="Manage Requests"
              onPress={() => navigation.navigate('PendingRequests')}
              icon={<Icon name="person-add" size={18} color={colors.light} />}
            />
          </Card>
        </View>

        <Card>
          <View style={globalStyles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Icon name="flash-on" size={24} color={colors.primary} />
              <Text style={globalStyles.cardTitle}>Quick Actions</Text>
            </View>
          </View>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionButton}
                onPress={() => navigation.navigate(action.screen)}
              >
                <Icon name={action.icon} size={18} color={colors.primary} />
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {pendingRequests.length > 0 && (
          <Card>
            <View style={globalStyles.cardHeader}>
              <Text style={globalStyles.cardTitle}>Recent Connection Requests</Text>
            </View>
            <View style={styles.requestsList}>
              {pendingRequests.slice(0, 4).map((request: any) => (
                <View key={request.id} style={styles.requestItem}>
                  <View style={styles.requestInfo}>
                    <View style={styles.requestAvatar}>
                      <Text style={styles.requestAvatarText}>
                        {request.senderUsername.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.requestDetails}>
                      <Text style={styles.requestName}>{request.senderUsername}</Text>
                      <Text style={styles.requestText}>Connection request</Text>
                    </View>
                  </View>
                  <View style={[styles.badge, styles.badgePending]}>
                    <Text style={styles.badgeText}>{request.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  heroSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderRadius: 24,
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.light,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.light,
    textAlign: 'center',
    opacity: 0.9,
  },
  statusGrid: {
    marginBottom: spacing.lg,
  },
  statusCard: {
    marginBottom: spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusTitle: {
    ...typography.h5,
    color: colors.text,
  },
  statusContent: {
    marginBottom: spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  badgeSuccess: {
    backgroundColor: colors.success,
  },
  badgePending: {
    backgroundColor: colors.warning,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.light,
    textTransform: 'uppercase',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  statusDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  requestsList: {
    gap: spacing.sm,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 12,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  requestAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light,
  },
  requestDetails: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  requestText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default DashboardScreen;