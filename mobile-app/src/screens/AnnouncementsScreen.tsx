import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, FlatList, RefreshControl, Alert,
  KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Chip, FAB, Portal, Modal, TextInput, Button } from 'react-native-paper';
import api from '../services/api';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuthStore } from '../stores/auth.store';
import { format } from 'date-fns';

interface Announcement {
  id: string; title: string; content: string;
  priority: string; createdAt: string;
  author: { firstName: string; lastName: string };
}

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#9CA3AF', MEDIUM: '#3B82F6', HIGH: '#F59E0B', URGENT: '#EF4444',
};

const PRIORITY_OPTIONS: { label: string; value: Priority }[] = [
  { label: 'Low', value: 'LOW' }, { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' }, { label: 'Urgent', value: 'URGENT' },
];

const CREATOR_ROLES = ['SUPER_ADMIN', 'CHURCH_ADMIN', 'PASTOR', 'LEADER'];

export default function AnnouncementsScreen() {
  const { isDark, c, primary } = useAppTheme();
  const { user } = useAuthStore();
  const canCreate = CREATOR_ROLES.includes(user?.role ?? '');

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get('/announcements?limit=50');
      setAnnouncements(data.data?.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchAnnouncements(); setRefreshing(false); };

  const openModal = () => { setTitle(''); setContent(''); setPriority('MEDIUM'); setModalVisible(true); };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) { Alert.alert('Error', 'Please fill in the title and content'); return; }
    setSubmitting(true);
    try {
      await api.post('/announcements', { title: title.trim(), content: content.trim(), priority });
      setModalVisible(false);
      await fetchAnnouncements();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Could not post announcement');
    } finally { setSubmitting(false); }
  };

  const borderColor = isDark ? '#374151' : '#D1D5DB';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <Text variant="headlineSmall" style={[styles.heading, { color: c.text }]}>Announcements</Text>
        }
        renderItem={({ item }) => (
          <Card style={[styles.card, { backgroundColor: c.surface }]}>
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleMedium" style={[styles.cardTitle, { color: c.text }]}>{item.title}</Text>
                <Chip compact textStyle={{ color: 'white', fontSize: 10 }}
                  style={{ backgroundColor: PRIORITY_COLORS[item.priority] ?? '#6B7280' }}>
                  {item.priority}
                </Chip>
              </View>
              <Text variant="bodyMedium" style={[styles.cardContent, { color: c.textSecondary }]}>{item.content}</Text>
              <Text variant="bodySmall" style={{ color: c.textSecondary, fontSize: 12 }}>
                {item.author.firstName} {item.author.lastName} • {format(new Date(item.createdAt), 'MMM d, yyyy')}
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={!loading ? <Text style={[styles.empty, { color: c.textSecondary }]}>No announcements yet</Text> : null}
      />

      {canCreate && <FAB icon="plus" style={[styles.fab, { backgroundColor: primary }]} onPress={openModal} />}

      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: c.surface }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text variant="titleLarge" style={[styles.modalTitle, { color: c.text }]}>New Announcement</Text>
              <TextInput label="Title" value={title} onChangeText={setTitle} style={styles.input} mode="outlined" />
              <TextInput label="Content" value={content} onChangeText={setContent}
                style={styles.input} mode="outlined" multiline numberOfLines={5} />
              <Text variant="labelMedium" style={[styles.fieldLabel, { color: c.textSecondary }]}>Priority</Text>
              <View style={styles.priorityRow}>
                {PRIORITY_OPTIONS.map((opt) => (
                  <TouchableOpacity key={opt.value}
                    style={[styles.priorityBtn, { borderColor },
                      priority === opt.value && { borderColor: PRIORITY_COLORS[opt.value], backgroundColor: `${PRIORITY_COLORS[opt.value]}18` }]}
                    onPress={() => setPriority(opt.value)}>
                    <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[opt.value] }]} />
                    <Text style={[styles.priorityLabel,
                      { color: priority === opt.value ? PRIORITY_COLORS[opt.value] : c.textSecondary },
                      priority === opt.value && { fontWeight: '600' }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalBtn} disabled={submitting}>Cancel</Button>
                <Button mode="contained" onPress={handleSubmit} style={styles.modalBtn}
                  loading={submitting} disabled={submitting || !title.trim() || !content.trim()}>Post</Button>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  cardTitle: { flex: 1, fontWeight: 'bold' },
  cardContent: { marginBottom: 8 },
  empty: { textAlign: 'center', marginTop: 32 },
  fab: { position: 'absolute', bottom: 24, right: 24 },
  modal: { margin: 20, borderRadius: 16, padding: 24, maxHeight: '90%' },
  modalTitle: { fontWeight: 'bold', marginBottom: 20 },
  input: { marginBottom: 16 },
  fieldLabel: { marginBottom: 10 },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  priorityBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, flex: 1, justifyContent: 'center' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityLabel: { fontSize: 13 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1 },
});