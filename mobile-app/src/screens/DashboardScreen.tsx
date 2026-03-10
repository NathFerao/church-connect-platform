import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Avatar } from 'react-native-paper';
import { useAuthStore } from '../stores/auth.store';
import { useThemeStore } from '../stores/theme.store';
import { getColors, colors } from '../theme/colors';
import api from '../services/api';

interface Stats {
  announcements: number;
  prayers: number;
  events: number;
  testimonies: number;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  CHURCH_ADMIN: 'Church Admin',
  PASTOR: 'Pastor',
  LEADER: 'Leader',
  MEMBER: 'Member',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#DC2626',
  CHURCH_ADMIN: '#7C3AED',
  PASTOR: '#2563EB',
  LEADER: '#059669',
  MEMBER: '#6B7280',
};

export default function DashboardScreen() {
  const { user, church } = useAuthStore();
  const { isDark } = useThemeStore();
  const c = getColors(isDark);

  const [stats, setStats] = useState<Stats>({ announcements: 0, prayers: 0, events: 0, testimonies: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [annRes, prayRes, evtRes, testRes] = await Promise.all([
        api.get('/announcements?limit=1'),
        api.get('/prayers?limit=1'),
        api.get('/events?limit=1'),
        api.get('/testimonies?limit=1'),
      ]);
      setStats({
        announcements: annRes.data.data?.pagination?.total ?? 0,
        prayers: prayRes.data.data?.pagination?.total ?? 0,
        events: evtRes.data.data?.pagination?.total ?? 0,
        testimonies: testRes.data.data?.pagination?.total ?? 0,
      });
    } catch {
      // silent
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  const roleColor = ROLE_COLORS[user?.role ?? ''] ?? '#6B7280';

  const statCards = [
    { label: 'Announcements', value: stats.announcements, icon: '📢', color: '#3B82F6' },
    { label: 'Prayer Requests', value: stats.prayers, icon: '🙏', color: '#8B5CF6' },
    { label: 'Events', value: stats.events, icon: '📅', color: '#059669' },
    { label: 'Testimonies', value: stats.testimonies, icon: '📖', color: '#F59E0B' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome card */}
      <Card style={[styles.welcomeCard, { backgroundColor: c.surface }]}>
        <Card.Content>
          <View style={styles.welcomeRow}>
            <Avatar.Text
              size={52}
              label={initials}
              style={{ backgroundColor: roleColor }}
            />
            <View style={styles.welcomeText}>
              <Text variant="headlineSmall" style={[styles.welcomeName, { color: c.text }]}>
                Welcome, {user?.firstName}
              </Text>
              {church && (
                <Text variant="bodyMedium" style={{ color: c.textSecondary }}>
                  {church.name}
                </Text>
              )}
              <Text variant="bodySmall" style={[styles.roleTag, { color: roleColor }]}>
                {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Stats grid */}
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: c.text }]}>
        Overview
      </Text>

      <View style={styles.statsGrid}>
        {statCards.map((stat) => (
          <Card key={stat.label} style={[styles.statCard, { backgroundColor: c.surface }]}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text variant="headlineMedium" style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text variant="bodySmall" style={[styles.statLabel, { color: c.textSecondary }]}>
                {stat.label}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>

      {/* Church branding strip */}
      {church && (
        <Card style={[styles.churchCard, { backgroundColor: c.surface }]}>
          <Card.Content>
            <View style={styles.churchRow}>
              <View style={[styles.colorDot, { backgroundColor: church.primaryColor }]} />
              <View style={[styles.colorDot, { backgroundColor: church.secondaryColor, marginLeft: -6 }]} />
              <Text variant="bodyMedium" style={[styles.churchCardName, { color: c.text }]}>
                {church.name}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },

  welcomeCard: { marginBottom: 20, borderRadius: 14 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  welcomeText: { flex: 1 },
  welcomeName: { fontWeight: 'bold' },
  roleTag: { marginTop: 2, fontWeight: '600' },

  sectionTitle: { fontWeight: 'bold', marginBottom: 12 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: { borderRadius: 12, width: '47%' },
  statContent: { alignItems: 'center', paddingVertical: 8 },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: { fontWeight: 'bold' },
  statLabel: { marginTop: 2, textAlign: 'center' },

  churchCard: { borderRadius: 12 },
  churchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'white' },
  churchCardName: { fontWeight: '500' },
});