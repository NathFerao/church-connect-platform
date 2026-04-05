import React, { useEffect, useState, useCallback } from 'react';
import {
  View, StyleSheet, FlatList, RefreshControl,
  ScrollView, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card, Text, Chip, FAB, Portal, Modal, TextInput,
  Button, Divider, ActivityIndicator,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  format, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isSameDay,
} from 'date-fns';
import api from '../services/api';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuthStore } from '../stores/auth.store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventRegistration { id: string; userId: string; }

interface Event {
  id: string; title: string; description: string; type: string;
  location: string | null; startTime: string; endTime: string;
  isAllDay: boolean; isPublic: boolean; maxCapacity: number | null;
  recurrenceGroupId: string | null; registrations?: EventRegistration[];
}

type EventType =
  | 'SERVICE' | 'PRAYER_MEETING' | 'BIBLE_STUDY' | 'YOUTH_EVENT'
  | 'CONFERENCE' | 'WORKSHOP' | 'OUTREACH' | 'SOCIAL' | 'OTHER';

type RecurrenceType = 'none' | 'weekly' | 'custom';

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPE_COLORS: Record<string, string> = {
  SERVICE: '#4F46E5', PRAYER_MEETING: '#7C3AED', BIBLE_STUDY: '#2563EB',
  YOUTH_EVENT: '#DB2777', CONFERENCE: '#D97706', WORKSHOP: '#059669',
  OUTREACH: '#DC2626', SOCIAL: '#0891B2', OTHER: '#6B7280',
};

const EVENT_TYPES: EventType[] = [
  'SERVICE', 'PRAYER_MEETING', 'BIBLE_STUDY', 'YOUTH_EVENT',
  'CONFERENCE', 'WORKSHOP', 'OUTREACH', 'SOCIAL', 'OTHER',
];

const TYPE_LABELS: Record<string, string> = {
  SERVICE: 'Service', PRAYER_MEETING: 'Prayer Meeting', BIBLE_STUDY: 'Bible Study',
  YOUTH_EVENT: 'Youth Event', CONFERENCE: 'Conference', WORKSHOP: 'Workshop',
  OUTREACH: 'Outreach', SOCIAL: 'Social', OTHER: 'Other',
};

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const CREATOR_ROLES = ['SUPER_ADMIN', 'CHURCH_ADMIN', 'PASTOR', 'LEADER'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRegs(event: Event): EventRegistration[] {
  return Array.isArray(event.registrations) ? event.registrations : [];
}

function groupByMonth(events: Event[]) {
  const groups: { title: string; data: Event[] }[] = [];
  let currentMonth = '';
  events.forEach((event) => {
    const month = format(new Date(event.startTime), 'MMMM yyyy');
    if (month !== currentMonth) {
      currentMonth = month;
      groups.push({ title: month, data: [] });
    }
    groups[groups.length - 1].data.push(event);
  });
  return groups;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const { user } = useAuthStore();
  const { isDark, c, primary } = useAppTheme();

  const userRole: string = user?.role ?? '';
  const canCreate = CREATOR_ROLES.includes(userRole);
  const userId = user?.id ?? '';

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('SERVICE');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 3600000));
  const [isAllDay, setIsAllDay] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [maxCapacity, setMaxCapacity] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [weeksCount, setWeeksCount] = useState('4');
  const [customDates, setCustomDates] = useState<Date[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showStartDate, setShowStartDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await api.get('/events?limit=200&page=1&sortBy=startTime&sortOrder=asc');
      const list: Event[] = data.data?.data ?? data.data ?? [];
      setEvents(list);
    } catch (err) {
      console.error('fetchEvents error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  // ── Registration (optimistic) ─────────────────────────────────────────────

  const isRegistered = (event: Event) => getRegs(event).some((r) => r.userId === userId);
  const isFull = (event: Event) =>
    event.maxCapacity !== null && getRegs(event).length >= event.maxCapacity;

  const handleRegister = async (event: Event) => {
    const wasRegistered = isRegistered(event);

    // Optimistically update UI immediately
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== event.id) return e;
        const regs = getRegs(e);
        const updatedRegs = wasRegistered
          ? regs.filter((r) => r.userId !== userId)
          : [...regs, { id: `temp-${Date.now()}`, userId }];
        return { ...e, registrations: updatedRegs };
      })
    );

    setRegisteringId(event.id);
    try {
      if (wasRegistered) {
        await api.delete(`/events/${event.id}/register`);
      } else {
        await api.post(`/events/${event.id}/register`);
      }
      // Refresh in background to sync real server state
      fetchEvents();
    } catch (error: any) {
      // Revert optimistic update on failure
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== event.id) return e;
          const regs = getRegs(e);
          const reverted = wasRegistered
            ? [...regs, { id: `temp-${Date.now()}`, userId }]
            : regs.filter((r) => r.userId !== userId);
          return { ...e, registrations: reverted };
        })
      );
      Alert.alert('Error', error?.response?.data?.error || 'Action failed');
    } finally {
      setRegisteringId(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = (event: Event) => {
    const options: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete This Event', style: 'destructive',
        onPress: async () => {
          try { await api.delete(`/events/${event.id}`); await fetchEvents(); }
          catch { Alert.alert('Error', 'Could not delete event'); }
        },
      },
    ];
    if (event.recurrenceGroupId) {
      options.push({
        text: 'Delete Entire Series', style: 'destructive',
        onPress: async () => {
          try { await api.delete(`/events/series/${event.recurrenceGroupId}`); await fetchEvents(); }
          catch { Alert.alert('Error', 'Could not delete series'); }
        },
      });
    }
    Alert.alert('Delete Event', 'What would you like to delete?', options);
  };

  // ── Recurrence ────────────────────────────────────────────────────────────

  const toggleWeekDay = (day: number) =>
    setWeekDays((p) => p.includes(day) ? p.filter((d) => d !== day) : [...p, day]);

  const toggleCustomDate = (date: Date) =>
    setCustomDates((p) => {
      const exists = p.some((d) => isSameDay(d, date));
      return exists ? p.filter((d) => !isSameDay(d, date)) : [...p, date];
    });

  const calendarDays = eachDayOfInterval({
    start: startOfMonth(calendarMonth), end: endOfMonth(calendarMonth),
  });
  const calendarOffset = getDay(startOfMonth(calendarMonth));

  const computedEventCount = () => {
    if (recurrenceType === 'none') return 1;
    if (recurrenceType === 'weekly') return Math.max(1, weekDays.length * parseInt(weeksCount || '1', 10));
    return Math.max(1, customDates.length);
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setEventType('SERVICE'); setLocation('');
    setStartTime(new Date()); setEndTime(new Date(Date.now() + 3600000));
    setIsAllDay(false); setIsPublic(true); setMaxCapacity('');
    setRecurrenceType('none'); setWeekDays([]); setWeeksCount('4');
    setCustomDates([]); setCalendarMonth(new Date()); setShowTypePicker(false);
  };

  // ── Create ────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Title and description are required'); return;
    }
    if (endTime <= startTime) {
      Alert.alert('Error', 'End time must be after start time'); return;
    }
    const payload: Record<string, any> = {
      title: title.trim(), description: description.trim(), type: eventType,
      location: location.trim() || undefined,
      startTime: startTime.toISOString(), endTime: endTime.toISOString(),
      isAllDay, isPublic,
      maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : undefined,
    };
    if (recurrenceType === 'weekly' && weekDays.length > 0) {
      payload.recurrence = { type: 'weekly', weekDays, weeksCount: parseInt(weeksCount || '4', 10), customDates: [] };
    } else if (recurrenceType === 'custom' && customDates.length > 0) {
      payload.recurrence = { type: 'custom', weekDays: [], weeksCount: 0, customDates: customDates.map((d) => d.toISOString()) };
    }
    setSubmitting(true);
    try {
      await api.post('/events', payload);
      setCreateVisible(false);
      await fetchEvents();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Could not create event');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render event card ─────────────────────────────────────────────────────

  const renderEvent = ({ item }: { item: Event }) => {
    const registered = isRegistered(item);
    const full = isFull(item);
    const busy = registeringId === item.id;
    const typeColor = EVENT_TYPE_COLORS[item.type] ?? '#6B7280';
    const regs = getRegs(item);

    return (
      <TouchableOpacity onLongPress={() => canCreate && handleDelete(item)} activeOpacity={0.85}>
        <Card style={[styles.eventCard, { backgroundColor: c.surface }]}>
          <View style={[styles.typeBar, { backgroundColor: typeColor }]} />
          <Card.Content style={styles.eventContent}>
            <View style={styles.dateBlock}>
              <Text style={[styles.dateMonth, { color: c.textSecondary }]}>
                {format(new Date(item.startTime), 'MMM').toUpperCase()}
              </Text>
              <Text style={[styles.dateDay, { color: c.text }]}>
                {format(new Date(item.startTime), 'd')}
              </Text>
            </View>

            <View style={styles.eventDetails}>
              <View style={styles.eventTitleRow}>
                <Text variant="titleSmall" style={[styles.eventTitle, { color: c.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.recurrenceGroupId && (
                  <Chip compact style={styles.recurChip} textStyle={styles.recurChipText}>Recurring</Chip>
                )}
              </View>
              <Chip compact textStyle={{ color: 'white', fontSize: 10 }}
                style={{ backgroundColor: typeColor, alignSelf: 'flex-start', marginBottom: 4 }}>
                {TYPE_LABELS[item.type] ?? item.type}
              </Chip>
              <Text variant="bodySmall" style={[styles.eventMeta, { color: c.textSecondary }]}>
                {item.isAllDay
                  ? 'All day'
                  : `${format(new Date(item.startTime), 'h:mm a')} – ${format(new Date(item.endTime), 'h:mm a')}`}
              </Text>
              {item.location ? (
                <Text variant="bodySmall" style={[styles.eventMeta, { color: c.textSecondary }]}>
                  📍 {item.location}
                </Text>
              ) : null}
              {item.maxCapacity !== null && (
                <Text variant="bodySmall"
                  style={[styles.eventMeta, { color: full ? '#EF4444' : c.textSecondary }, full && styles.fullText]}>
                  {regs.length}/{item.maxCapacity} spots{full ? ' · FULL' : ''}
                </Text>
              )}
            </View>

            <Button
              mode={registered ? 'outlined' : 'contained'}
              compact
              onPress={() => handleRegister(item)}
              disabled={busy || (!registered && full)}
              loading={busy}
              style={styles.regButton}
              labelStyle={styles.regButtonLabel}
            >
              {full && !registered ? 'Full' : registered ? 'Leave' : 'Register'}
            </Button>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  // ── Flat grouped data ─────────────────────────────────────────────────────

  const groups = groupByMonth(events);
  const flatData: (string | Event)[] = [];
  groups.forEach((g) => { flatData.push(g.title); g.data.forEach((e) => flatData.push(e)); });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primary} />
        </View>
      </SafeAreaView>
    );
  }

  const borderColor = isDark ? '#374151' : '#D1D5DB';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <FlatList
        data={flatData}
        keyExtractor={(item) => (typeof item === 'string' ? `header-${item}` : item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) =>
          typeof item === 'string' ? (
            <Text variant="titleMedium"
              style={[styles.monthHeader, { color: primary, borderBottomColor: `${primary}30` }]}>
              {item}
            </Text>
          ) : (
            renderEvent({ item })
          )
        }
        ListHeaderComponent={
          <Text variant="headlineSmall" style={[styles.heading, { color: c.text }]}>Events</Text>
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: c.textSecondary }]}>No events found</Text>
        }
      />

      {canCreate && (
        <FAB icon="plus" style={[styles.fab, { backgroundColor: primary }]}
          onPress={() => { resetForm(); setCreateVisible(true); }} />
      )}

      {/* ─── Create Modal ─── */}
      <Portal>
        <Modal visible={createVisible} onDismiss={() => setCreateVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: c.surface }]}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text variant="titleLarge" style={[styles.modalTitle, { color: c.text }]}>Create Event</Text>

            <TextInput label="Title *" value={title} onChangeText={setTitle} style={styles.input} mode="outlined" />
            <TextInput label="Description *" value={description} onChangeText={setDescription}
              style={styles.input} mode="outlined" multiline numberOfLines={3} />
            <TextInput label="Location" value={location} onChangeText={setLocation} style={styles.input} mode="outlined" />

            {/* Event type */}
            <Text variant="labelMedium" style={[styles.fieldLabel, { color: c.textSecondary }]}>Event Type</Text>
            <TouchableOpacity
              style={[styles.typeSelectorBtn, { borderColor, backgroundColor: c.surface }]}
              onPress={() => setShowTypePicker((v) => !v)}>
              <View style={[styles.typeColorDot, { backgroundColor: EVENT_TYPE_COLORS[eventType] }]} />
              <Text style={{ color: c.text }}>{TYPE_LABELS[eventType]}</Text>
            </TouchableOpacity>
            {showTypePicker && (
              <View style={styles.typeGrid}>
                {EVENT_TYPES.map((t) => (
                  <TouchableOpacity key={t}
                    style={[styles.typeOption, { borderColor }, eventType === t && styles.typeOptionSelected]}
                    onPress={() => { setEventType(t); setShowTypePicker(false); }}>
                    <View style={[styles.typeColorDot, { backgroundColor: EVENT_TYPE_COLORS[t] }]} />
                    <Text style={[styles.typeOptionText, { color: c.text }]}>{TYPE_LABELS[t]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Start */}
            <Text variant="labelMedium" style={[styles.fieldLabel, { color: c.textSecondary }]}>Start</Text>
            <View style={styles.dateRow}>
              <Button mode="outlined" compact onPress={() => setShowStartDate(true)} style={styles.dateBtn}>
                {format(startTime, 'MMM d, yyyy')}
              </Button>
              {!isAllDay && (
                <Button mode="outlined" compact onPress={() => setShowStartTime(true)} style={styles.dateBtn}>
                  {format(startTime, 'h:mm a')}
                </Button>
              )}
            </View>
            {showStartDate && (
              <DateTimePicker value={startTime} mode="date"
                onChange={(_, d) => { setShowStartDate(false); if (d) setStartTime(d); }} />
            )}
            {showStartTime && (
              <DateTimePicker value={startTime} mode="time"
                onChange={(_, d) => { setShowStartTime(false); if (d) setStartTime(d); }} />
            )}

            {/* End */}
            <Text variant="labelMedium" style={[styles.fieldLabel, { color: c.textSecondary }]}>End</Text>
            <View style={styles.dateRow}>
              <Button mode="outlined" compact onPress={() => setShowEndDate(true)} style={styles.dateBtn}>
                {format(endTime, 'MMM d, yyyy')}
              </Button>
              {!isAllDay && (
                <Button mode="outlined" compact onPress={() => setShowEndTime(true)} style={styles.dateBtn}>
                  {format(endTime, 'h:mm a')}
                </Button>
              )}
            </View>
            {showEndDate && (
              <DateTimePicker value={endTime} mode="date"
                onChange={(_, d) => { setShowEndDate(false); if (d) setEndTime(d); }} />
            )}
            {showEndTime && (
              <DateTimePicker value={endTime} mode="time"
                onChange={(_, d) => { setShowEndTime(false); if (d) setEndTime(d); }} />
            )}

            {/* Toggles */}
            <View style={styles.toggleRow}>
              <Text variant="bodyMedium" style={{ color: c.text }}>All Day</Text>
              <Switch value={isAllDay} onValueChange={setIsAllDay} trackColor={{ true: primary }} />
            </View>
            <View style={styles.toggleRow}>
              <Text variant="bodyMedium" style={{ color: c.text }}>Public Event</Text>
              <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: primary }} />
            </View>

            <TextInput label="Max Capacity (optional)" value={maxCapacity}
              onChangeText={setMaxCapacity} keyboardType="numeric" style={styles.input} mode="outlined" />

            {/* Recurrence */}
            <Text variant="labelMedium" style={[styles.fieldLabel, { color: c.textSecondary }]}>Recurrence</Text>
            <View style={styles.recurrenceRow}>
              {(['none', 'weekly', 'custom'] as RecurrenceType[]).map((type) => (
                <TouchableOpacity key={type}
                  style={[styles.recurrenceBtn, { borderColor }, recurrenceType === type && [styles.recurrenceBtnActive, { borderColor: primary, backgroundColor: `${primary}10` }]]}
                  onPress={() => setRecurrenceType(type)}>
                  <Text style={[styles.recurrenceBtnText, { color: c.textSecondary },
                    recurrenceType === type && { color: primary, fontWeight: '600' }]}>
                    {type === 'none' ? 'No repeat' : type === 'weekly' ? 'Weekly' : 'Custom'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {recurrenceType === 'weekly' && (
              <View style={styles.weeklySection}>
                <Text variant="bodySmall" style={[styles.fieldLabel, { color: c.textSecondary }]}>Days of week</Text>
                <View style={styles.daysRow}>
                  {DAYS.map((day, i) => (
                    <TouchableOpacity key={i}
                      style={[styles.dayBtn, { borderColor }, weekDays.includes(i) && { backgroundColor: primary, borderColor: primary }]}
                      onPress={() => toggleWeekDay(i)}>
                      <Text style={[styles.dayBtnText, { color: c.textSecondary },
                        weekDays.includes(i) && { color: 'white', fontWeight: '600' }]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput label="For how many weeks?" value={weeksCount}
                  onChangeText={setWeeksCount} keyboardType="numeric" style={styles.input} mode="outlined" />
              </View>
            )}

            {recurrenceType === 'custom' && (
              <View style={styles.calendarSection}>
                <View style={styles.calNavRow}>
                  <Button compact onPress={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>{'<'}</Button>
                  <Text variant="bodyMedium" style={{ fontWeight: '600', color: c.text }}>{format(calendarMonth, 'MMMM yyyy')}</Text>
                  <Button compact onPress={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>{'>'}</Button>
                </View>
                <View style={styles.calGrid}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <Text key={d} style={[styles.calDayLabel, { color: c.textSecondary }]}>{d}</Text>
                  ))}
                  {Array.from({ length: calendarOffset }).map((_, i) => (
                    <View key={`pad-${i}`} style={styles.calCell} />
                  ))}
                  {calendarDays.map((day) => {
                    const selected = customDates.some((d) => isSameDay(d, day));
                    return (
                      <TouchableOpacity key={day.toISOString()}
                        style={[styles.calCell, selected && { backgroundColor: primary, borderRadius: 100 }]}
                        onPress={() => toggleCustomDate(day)}>
                        <Text style={[styles.calCellText, { color: c.text },
                          selected && { color: 'white', fontWeight: '600' }]}>
                          {format(day, 'd')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {customDates.length > 0 && (
                  <Text variant="bodySmall" style={[styles.fieldLabel, { color: c.textSecondary }]}>
                    {customDates.length} date{customDates.length > 1 ? 's' : ''} selected
                  </Text>
                )}
              </View>
            )}

            <Divider style={{ marginVertical: 16 }} />

            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={() => setCreateVisible(false)}
                style={styles.modalBtn} disabled={submitting}>Cancel</Button>
              <Button mode="contained" onPress={handleCreate}
                style={styles.modalBtn} loading={submitting} disabled={submitting}>
                {`Create${computedEventCount() > 1 ? ` ${computedEventCount()} Events` : ' Event'}`}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 80 },
  heading: { fontWeight: 'bold', marginBottom: 12 },
  monthHeader: { fontWeight: '700', marginTop: 20, marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1 },
  empty: { textAlign: 'center', marginTop: 48 },
  eventCard: { marginBottom: 10, overflow: 'hidden' },
  typeBar: { height: 4, width: '100%' },
  eventContent: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 10, gap: 10 },
  dateBlock: { alignItems: 'center', minWidth: 40, paddingTop: 2 },
  dateMonth: { fontSize: 10, fontWeight: '600' },
  dateDay: { fontSize: 22, fontWeight: 'bold', lineHeight: 26 },
  eventDetails: { flex: 1 },
  eventTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  eventTitle: { fontWeight: 'bold', flex: 1 },
  recurChip: { backgroundColor: '#E0E7FF', height: 20 },
  recurChipText: { fontSize: 9, color: '#4F46E5' },
  eventMeta: { fontSize: 12, marginTop: 2 },
  fullText: { fontWeight: '600' },
  regButton: { alignSelf: 'center', minWidth: 80 },
  regButtonLabel: { fontSize: 11 },
  fab: { position: 'absolute', bottom: 24, right: 24 },
  modal: { margin: 16, borderRadius: 16, padding: 24, maxHeight: '92%' },
  modalTitle: { fontWeight: 'bold', marginBottom: 20 },
  input: { marginBottom: 12 },
  fieldLabel: { marginBottom: 6, marginTop: 4 },
  typeSelectorBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8, gap: 10 },
  typeColorDot: { width: 12, height: 12, borderRadius: 6 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  typeOption: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, gap: 6 },
  typeOptionSelected: { borderColor: '#4F46E5', backgroundColor: '#4F46E510' },
  typeOptionText: { fontSize: 12 },
  dateRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  dateBtn: { flex: 1 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
  recurrenceRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  recurrenceBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  recurrenceBtnActive: {},
  recurrenceBtnText: { fontSize: 12 },
  weeklySection: { marginBottom: 8 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dayBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  dayBtnText: { fontSize: 11 },
  calendarSection: { marginBottom: 8 },
  calNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayLabel: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, paddingVertical: 4 },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  calCellText: { fontSize: 13 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1 },
});