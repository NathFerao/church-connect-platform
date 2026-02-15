import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Text, Chip, IconButton } from 'react-native-paper';
import api from '../services/api';
import { colors } from '../theme/colors';
import { format } from 'date-fns';

interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  requester: { firstName: string; lastName: string };
  _count: { prayers: number };
}

export default function PrayersScreen() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [prayedSet, setPrayedSet] = useState<Set<string>>(new Set());

  const fetchPrayers = async () => {
    try {
      const { data } = await api.get('/prayers?limit=50');
      setPrayers(data.data?.data || []);
    } catch (error) {
      console.error('Failed to load prayers');
    }
  };

  useEffect(() => {
    fetchPrayers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrayers();
    setRefreshing(false);
  };

  const togglePray = async (id: string) => {
    const hasPrayed = prayedSet.has(id);
    try {
      if (hasPrayed) {
        await api.delete(`/prayers/${id}/pray`);
        setPrayedSet((s) => { const n = new Set(s); n.delete(id); return n; });
      } else {
        await api.post(`/prayers/${id}/pray`);
        setPrayedSet((s) => new Set(s).add(id));
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to update prayer');
    }
  };

  return (
    <FlatList
      data={prayers}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => {
        const prayed = prayedSet.has(item.id);
        return (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleMedium" style={styles.title}>{item.title}</Text>
                <View style={styles.prayButton}>
                  <IconButton
                    icon={prayed ? 'heart' : 'heart-outline'}
                    iconColor={prayed ? colors.error : colors.textSecondary}
                    size={20}
                    onPress={() => togglePray(item.id)}
                  />
                  <Text variant="bodySmall">{item._count.prayers}</Text>
                </View>
              </View>
              <Chip style={styles.chip} textStyle={{ fontSize: 10 }}>
                {item.category}
              </Chip>
              <Text variant="bodyMedium" style={styles.description}>{item.description}</Text>
              <Text variant="bodySmall" style={styles.meta}>
                {item.requester.firstName} {item.requester.lastName} • {format(new Date(item.createdAt), 'MMM d')}
              </Text>
            </Card.Content>
          </Card>
        );
      }}
      ListEmptyComponent={
        <Text style={styles.empty}>No prayer requests yet</Text>
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
    fontWeight: 'bold',
  },
  prayButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  description: {
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