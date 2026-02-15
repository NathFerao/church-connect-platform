import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Avatar, Button } from 'react-native-paper';
import { useAuthStore } from '../stores/auth.store';
import api from '../services/api';
import { colors } from '../theme/colors';

export default function DashboardScreen() {
  const { user, church, logout } = useAuthStore();
  const [stats, setStats] = useState({ announcements: 0, prayers: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [annRes, prayRes] = await Promise.all([
        api.get('/announcements?limit=1'),
        api.get('/prayers?limit=1'),
      ]);
      setStats({
        announcements: annRes.data.data?.pagination?.total || 0,
        prayers: prayRes.data.data?.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <View style={styles.header}>
            <Avatar.Text size={48} label={user?.firstName[0] || 'U'} />
            <View style={styles.headerText}>
              <Text variant="headlineSmall">Welcome, {user?.firstName}</Text>
              <Text variant="bodyMedium" style={styles.churchName}>{church?.name}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.statLabel}>Announcements</Text>
            <Text variant="headlineMedium" style={styles.statValue}>{stats.announcements}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.statLabel}>Prayer Requests</Text>
            <Text variant="headlineMedium" style={styles.statValue}>{stats.prayers}</Text>
          </Card.Content>
        </Card>
      </View>

      <Button mode="outlined" onPress={logout} style={styles.logoutButton}>
        Logout
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  welcomeCard: {
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  churchName: {
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statLabel: {
    color: colors.textSecondary,
  },
  statValue: {
    marginTop: 4,
    fontWeight: 'bold',
  },
  logoutButton: {
    margin: 16,
  },
});
