import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Card,
  Text,
  Chip,
  FAB,
  Portal,
  Modal,
  TextInput,
  Button,
  SegmentedButtons,
} from 'react-native-paper';
import { format } from 'date-fns';
import api from '../services/api';
import { getColors, colors } from '../theme/colors';
import { useThemeStore } from '../stores/theme.store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Testimony {
  id: string;
  title: string;
  content: string;
  category: string;
  isApproved: boolean;
  createdAt: string;
  author: { firstName: string; lastName: string };
}

type Category = 'SALVATION' | 'HEALING' | 'PROVISION' | 'RELATIONSHIPS' | 'OTHER';

const CATEGORY_COLORS: Record<Category, string> = {
  SALVATION: '#8B5CF6',
  HEALING: '#10B981',
  PROVISION: '#F59E0B',
  RELATIONSHIPS: '#EC4899',
  OTHER: '#6B7280',
};

const CATEGORY_OPTIONS = [
  { value: 'SALVATION', label: 'Salvation' },
  { value: 'HEALING', label: 'Healing' },
  { value: 'PROVISION', label: 'Provision' },
  { value: 'RELATIONSHIPS', label: 'Relationships' },
  { value: 'OTHER', label: 'Other' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TestimoniesScreen() {
  const { isDark } = useThemeStore();
  const c = getColors(isDark);

  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>('OTHER');
  const [submitting, setSubmitting] = useState(false);

  const fetchTestimonies = async () => {
    try {
      const { data } = await api.get('/testimonies?limit=50');
      setTestimonies(data.data?.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTestimonies(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTestimonies();
    setRefreshing(false);
  };

  const openModal = () => {
    setTitle(''); setContent(''); setCategory('OTHER');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/testimonies', {
        title: title.trim(),
        content: content.trim(),
        category,
      });
      setModalVisible(false);
      await fetchTestimonies();
    } catch {
      // keep modal open so user doesn't lose input
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: Testimony }) => (
    <Card style={[styles.card, { backgroundColor: c.surface }]}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: c.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Chip
            compact
            textStyle={{ color: 'white', fontSize: 10 }}
            style={{ backgroundColor: CATEGORY_COLORS[item.category as Category] ?? '#6B7280' }}
          >
            {item.category}
          </Chip>
        </View>
        <Text variant="bodyMedium" style={[styles.excerpt, { color: c.textSecondary }]} numberOfLines={3}>
          {item.content}
        </Text>
        <Text variant="bodySmall" style={{ color: c.textSecondary, fontSize: 12 }}>
          {item.author.firstName} {item.author.lastName} •{' '}
          {format(new Date(item.createdAt), 'MMM d, yyyy')}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <FlatList
        data={testimonies}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <Text variant="headlineSmall" style={[styles.heading, { color: c.text }]}>
            Testimonies
          </Text>
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.empty, { color: c.textSecondary }]}>
              No testimonies yet. Be the first to share!
            </Text>
          ) : null
        }
      />

      <FAB icon="plus" style={styles.fab} onPress={openModal} />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: c.surface }]}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text variant="titleLarge" style={[styles.modalTitle, { color: c.text }]}>
                Share Your Testimony
              </Text>

              <TextInput
                label="Title"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Your testimony"
                value={content}
                onChangeText={setContent}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={6}
              />

              <Text variant="labelMedium" style={[styles.categoryLabel, { color: c.textSecondary }]}>
                Category
              </Text>

              <SegmentedButtons
                value={category}
                onValueChange={(v) => setCategory(v as Category)}
                buttons={CATEGORY_OPTIONS.slice(0, 3).map((o) => ({ value: o.value, label: o.label }))}
                style={styles.segmented}
              />
              <SegmentedButtons
                value={category}
                onValueChange={(v) => setCategory(v as Category)}
                buttons={CATEGORY_OPTIONS.slice(3).map((o) => ({ value: o.value, label: o.label }))}
                style={styles.segmented}
              />

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalBtn}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={styles.modalBtn}
                  loading={submitting}
                  disabled={submitting || !title.trim() || !content.trim()}
                >
                  Share
                </Button>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 80 },
  heading: { fontWeight: 'bold', marginBottom: 16 },
  card: { marginBottom: 12 },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8, gap: 8,
  },
  cardTitle: { flex: 1, fontWeight: 'bold' },
  excerpt: { marginBottom: 8, lineHeight: 20 },
  empty: { textAlign: 'center', marginTop: 48 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary },
  modal: { margin: 20, borderRadius: 16, padding: 24, maxHeight: '90%' },
  modalTitle: { fontWeight: 'bold', marginBottom: 20 },
  input: { marginBottom: 16 },
  categoryLabel: { marginBottom: 8 },
  segmented: { marginBottom: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalBtn: { flex: 1 },
});