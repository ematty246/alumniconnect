import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import CustomButton from '../components/CustomButton';
import { colors, spacing, typography, globalStyles } from '../styles/globalStyles';

const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();

  const features = [
    {
      icon: 'people',
      title: 'Connect',
      description: 'Build meaningful connections with alumni, current students, and faculty members from your institution.',
    },
    {
      icon: 'chat',
      title: 'Chat',
      description: 'Engage in real-time conversations, share experiences, and collaborate on projects with your network.',
    },
    {
      icon: 'search',
      title: 'Discover',
      description: 'Find and connect with people based on interests, departments, graduation years, and professional backgrounds.',
    },
  ];

  const quickActions = [
    { title: 'Update Profile', icon: 'person', screen: 'Profile' },
    { title: 'My Connections', icon: 'people', screen: 'Connections' },
    { title: 'Start Chat', icon: 'chat', screen: 'Chat' },
    { title: 'Find People', icon: 'search', screen: 'UserSearch' },
  ];

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Welcome to AlumniConnect</Text>
          <Text style={styles.heroSubtitle}>
            Connect with alumni, students, and faculty. Build your professional network.
          </Text>
          {!user && (
            <View style={styles.heroActions}>
              <CustomButton
                title="Get Started"
                onPress={() => navigation.navigate('Register')}
                style={styles.heroButton}
              />
              <CustomButton
                title="Sign In"
                onPress={() => navigation.navigate('Login')}
                variant="outline"
                style={styles.heroButton}
              />
            </View>
          )}
        </View>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Card key={index} style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <Icon name={feature.icon} size={24} color={colors.primary} />
                <Text style={styles.featureTitle}>{feature.title}</Text>
              </View>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </Card>
          ))}
        </View>

        {user && (
          <Card>
            <View style={globalStyles.cardHeader}>
              <Text style={globalStyles.cardTitle}>Quick Actions</Text>
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
  heroTitle: {
    ...typography.h1,
    color: colors.light,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.light,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: spacing.lg,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroButton: {
    flex: 1,
  },
  featuresGrid: {
    marginBottom: spacing.lg,
  },
  featureCard: {
    marginBottom: spacing.md,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureTitle: {
    ...typography.h4,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  featureDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
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
});

export default HomeScreen;