import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Chip, Avatar, Searchbar, ActivityIndicator } from 'react-native-paper';
import api from '../services/api';
import { getColors, colors } from '../theme/colors';
import { useThemeStore } from '../stores/theme.store';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  avatarUrl: string | null;
}

type RoleFilter = 'ALL' | 'MEMBER' | 'LEADER' | 'PASTOR' | 'CHURCH_ADMIN';

const ROLE_FILTERS: { label: string; value: RoleFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Member', value: 'MEMBER' },
  { label: 'Leader', value: 'LEADER' },
  { label: 'Pastor', value: 'PASTOR' },
  { label: 'Admin', value: 'CHURCH_ADMIN' },
];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#DC2626', CHURCH_ADMIN: '#7C3AED',
  PASTOR: '#2563EB', LEADER: '#059669', MEMBER: '#6B7280',
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', CHURCH_ADMIN: 'Admin',
  PASTOR: 'Pastor', LEADER: 'Leader', MEMBER: 'Member',
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export default function MembersScreen() {
  const { isDark } = useThemeStore();
  const c = getColors(isDark);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');

  const fetchMembers = async () => {
    try {
      const { data } = await api.get('/users/church-members?limit=200');
      setMembers(data.data?.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    let result = members;
    if (roleFilter !== 'ALL') result = result.filter((m) => m.role === roleFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.firstName.toLowerCase().includes(q) ||
          m.lastName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [members, search, roleFilter]);

  const renderMember = ({ item }: { item: Member }) => {
    const roleColor = ROLE_COLORS[item.role] ?? '#6B7280';
    return (
      <View style={styles.row}>
        <Avatar.Text
          size={44}
          label={getInitials(item.firstName, item.lastName)}
          style={{ backgroundColor: roleColor }}
          labelStyle={styles.avatarLabel}
        />
        <View style={styles.info}>
          <Text variant="titleSmall" style={[styles.name, { color: c.text }]}>
            {item.firstName} {item.lastName}
          </Text>
          <Text variant="bodySmall" style={{ color: c.textSecondary, marginTop: 2 }} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        <Chip compact textStyle={{ color: 'white', fontSize: 10 }} style={{ backgroundColor: roleColor }}>
          {ROLE_LABELS[item.role] ?? item.role}
        </Chip>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const borderColor = isDark ? '#374151' : '#D1D5DB';

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <Text variant="headlineSmall" style={[styles.heading, { color: c.text }]}>Members</Text>

            <Searchbar
              placeholder="Search by name or email"
              value={search}
              onChangeText={setSearch}
              style={[styles.searchbar, { backgroundColor: c.surface, borderColor }]}
              inputStyle={[styles.searchInput, { color: c.text }]}
              placeholderTextColor={c.textSecondary}
            />

            <View style={styles.filters}>
              {ROLE_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[
                    styles.filterChip,
                    { borderColor },
                    roleFilter === f.value && styles.filterChipActive,
                  ]}
                  onPress={() => setRoleFilter(f.value)}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: c.textSecondary },
                    roleFilter === f.value && styles.filterChipTextActive,
                  ]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text variant="bodySmall" style={{ color: c.textSecondary, marginBottom: 8 }}>
              {filtered.length} member{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]} />
        )}
        renderItem={renderMember}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: c.textSecondary }]}>
            {search || roleFilter !== 'ALL' ? 'No members match your search' : 'No members yet'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  heading: { fontWeight: 'bold', marginBottom: 12 },
  searchbar: { marginBottom: 12, elevation: 0, borderWidth: 1 },
  searchInput: { fontSize: 14 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  filterChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  filterChipActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
  filterChipText: { fontSize: 13 },
  filterChipTextActive: { color: colors.primary, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  avatarLabel: { fontSize: 15, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontWeight: '600' },
  separator: { height: 1 },
  empty: { textAlign: 'center', marginTop: 48 },
});