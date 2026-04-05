import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, FlatList, RefreshControl, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Chip, IconButton, FAB, Portal, Modal, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import api from '../services/api';
import { useAppTheme } from '../hooks/useAppTheme';
import { format } from 'date-fns';

interface PrayerRequest {
  id: string; title: string; description: string;
  category: string; status: string; createdAt: string;
  requester: { firstName: string; lastName: string };
  _count: { prayers: number };
}

type Category = 'HEALING' | 'FAMILY' | 'FINANCES' | 'GUIDANCE' | 'THANKSGIVING' | 'OTHER';

const CATEGORY_OPTIONS = [
  { value: 'HEALING', label: 'Healing' }, { value: 'FAMILY', label: 'Family' },
  { value: 'FINANCES', label: 'Finances' }, { value: 'GUIDANCE', label: 'Guidance' },
  { value: 'THANKSGIVING', label: 'Thanks' }, { value: 'OTHER', label: 'Other' },
];

const CATEGORY_COLORS: Record<string, string> = {
  HEALING: '#10B981', FAMILY: '#3B82F6', FINANCES: '#F59E0B',
  GUIDANCE: '#8B5CF6', THANKSGIVING: '#EC4899', OTHER: '#6B7280',
};

export default function PrayersScreen() {
  const { c, primary } = useAppTheme();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [prayedSet, setPrayedSet] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('OTHER');
  const [submitting, setSubmitting] = useState(false);

  const fetchPrayers = async () => {
    try {
      const { data } = await api.get('/prayers?limit=50');
      setPrayers(data.data?.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchPrayers(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchPrayers(); setRefreshing(false); };
  const openModal = () => { setTitle(''); setDescription(''); setCategory('OTHER'); setModalVisible(true); };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) { Alert.alert('Error', 'Please fill in the title and description'); return; }
    setSubmitting(true);
    try {
      await api.post('/prayers', { title: title.trim(), description: description.trim(), category });
      setModalVisible(false);
      await fetchPrayers();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Could not submit prayer request');
    } finally { setSubmitting(false); }
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
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <FlatList
        data={prayers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <Text variant="headlineSmall" style={[styles.heading, { color: c.text }]}>Prayer Requests</Text>
        }
        renderItem={({ item }) => {
          const prayed = prayedSet.has(item.id);
          const catColor = CATEGORY_COLORS[item.category] ?? '#6B7280';
          return (
            <Card style={[styles.card, { backgroundColor: c.surface }]}>
              <Card.Content>
                <View style={styles.header}>
                  <Text variant="titleMedium" style={[styles.cardTitle, { color: c.text }]}>{item.title}</Text>
                  <View style={styles.prayButton}>
                    <IconButton icon={prayed ? 'heart' : 'heart-outline'}
                      iconColor={prayed ? '#EF4444' : c.textSecondary}
                      size={20} onPress={() => togglePray(item.id)} />
                    <Text variant="bodySmall" style={{ color: c.textSecondary }}>{item._count.prayers}</Text>
                  </View>
                </View>
                <Chip compact textStyle={{ color: 'white', fontSize: 10 }}
                  style={[styles.chip, { backgroundColor: catColor }]}>
                  {item.category}
                </Chip>
                <Text variant="bodyMedium" style={[styles.description, { color: c.textSecondary }]}>{item.description}</Text>
                <Text variant="bodySmall" style={{ color: c.textSecondary, fontSize: 12 }}>
                  {item.requester.firstName} {item.requester.lastName} • {format(new Date(item.createdAt), 'MMM d')}
                </Text>
              </Card.Content>
            </Card>
          );
        }}
        ListEmptyComponent={<Text style={[styles.empty, { color: c.textSecondary }]}>No prayer requests yet</Text>}
      />

      <FAB icon="plus" style={[styles.fab, { backgroundColor: primary }]} onPress={openModal} />

      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: c.surface }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text variant="titleLarge" style={[styles.modalTitle, { color: c.text }]}>Submit Prayer Request</Text>
              <TextInput label="Title" value={title} onChangeText={setTitle} style={styles.input} mode="outlined" />
              <TextInput label="Description" value={description} onChangeText={setDescription}
                style={styles.input} mode="outlined" multiline numberOfLines={4} />
              <Text variant="labelMedium" style={[styles.fieldLabel, { color: c.textSecondary }]}>Category</Text>
              <SegmentedButtons value={category} onValueChange={(v) => setCategory(v as Category)}
                buttons={CATEGORY_OPTIONS.slice(0, 3).map((o) => ({ value: o.value, label: o.label }))}
                style={styles.segmented} />
              <SegmentedButtons value={category} onValueChange={(v) => setCategory(v as Category)}
                buttons={CATEGORY_OPTIONS.slice(3).map((o) => ({ value: o.value, label: o.label }))}
                style={styles.segmented} />
              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalBtn} disabled={submitting}>Cancel</Button>
                <Button mode="contained" onPress={handleSubmit} style={styles.modalBtn}
                  loading={submitting} disabled={submitting || !title.trim() || !description.trim()}>Submit</Button>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 80 },
  heading: { fontWeight: 'bold', marginBottom: 16 },
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { flex: 1, fontWeight: 'bold' },
  prayButton: { flexDirection: 'row', alignItems: 'center' },
  chip: { alignSelf: 'flex-start', marginBottom: 8 },
  description: { marginBottom: 8 },
  empty: { textAlign: 'center', marginTop: 32 },
  fab: { position: 'absolute', bottom: 24, right: 24 },
  modal: { margin: 20, borderRadius: 16, padding: 24, maxHeight: '90%' },
  modalTitle: { fontWeight: 'bold', marginBottom: 20 },
  input: { marginBottom: 16 },
  fieldLabel: { marginBottom: 8 },
  segmented: { marginBottom: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalBtn: { flex: 1 },
});