import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import api from '../services/api';
import { colors } from '../theme/colors';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  createdAt: string;
  author: { firstName: string; lastName: string };
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#9CA3AF',
  MEDIUM: '#3B82F6',
  HIGH: '#F59E0B',
  URGENT: '#EF4444',
};

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get('/announcements?limit=50');
      setAnnouncements(data.data?.data || []);
    } catch (error) {
      console.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  };

  return (
    <FlatList
      data={announcements}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text variant="titleMedium" style={styles.title}>{item.title}</Text>
              <Chip 
                textStyle={{ color: 'white', fontSize: 10 }}
                style={{ backgroundColor: PRIORITY_COLORS[item.priority] }}
              >
                {item.priority}
              </Chip>
            </View>
            <Text variant="bodyMedium" style={styles.content}>{item.content}</Text>
            <Text variant="bodySmall" style={styles.meta}>
              {item.author.firstName} {item.author.lastName} • {format(new Date(item.createdAt), 'MMM d, yyyy')}
            </Text>
          </Card.Content>
        </Card>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>No announcements yet</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginRight: 8,
    fontWeight: 'bold',
  },
  content: {
    marginBottom: 8,
    color: colors.textSecondary,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
    color: colors.textSecondary,
  },
});
