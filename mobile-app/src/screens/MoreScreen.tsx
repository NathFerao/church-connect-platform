import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon, Divider, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MoreStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../stores/auth.store';
import { useThemeStore } from '../stores/theme.store';
import { getColors, colors } from '../theme/colors';

type NavProp = NativeStackNavigationProp<MoreStackParamList, 'MoreMenu'>;

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', CHURCH_ADMIN: 'Church Admin',
  PASTOR: 'Pastor', LEADER: 'Leader', MEMBER: 'Member',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#DC2626', CHURCH_ADMIN: '#7C3AED',
  PASTOR: '#2563EB', LEADER: '#059669', MEMBER: '#6B7280',
};

export default function MoreScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, church, logout } = useAuthStore();
  const { isDark } = useThemeStore();
  const c = getColors(isDark);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  const roleColor = ROLE_COLORS[user?.role ?? ''] ?? '#6B7280';

  const menuItems = [
    { label: 'Members Directory', icon: 'account-group', onPress: () => navigation.navigate('Members') },
    { label: 'Settings & Profile', icon: 'cog', onPress: () => navigation.navigate('Settings') },
  ];

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Profile card */}
      <TouchableOpacity
        style={[
          styles.profileCard,
          { backgroundColor: c.surface },
          isDark && styles.profileCardDark,
        ]}
        onPress={() => navigation.navigate('Settings')}
        activeOpacity={0.75}
      >
        <Avatar.Text size={52} label={initials} style={{ backgroundColor: roleColor }} />
        <View style={styles.profileInfo}>
          <Text variant="titleMedium" style={[styles.name, { color: c.text }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text variant="bodySmall" style={{ color: c.textSecondary, marginTop: 2 }} numberOfLines={1}>
            {user?.email}
          </Text>
          <Text variant="bodySmall" style={[styles.role, { color: roleColor }]}>
            {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
            {church ? `  ·  ${church.name}` : ''}
          </Text>
        </View>
        <Icon source="chevron-right" size={20} color={c.textSecondary} />
      </TouchableOpacity>

      <Divider style={styles.divider} />

      {/* Menu items */}
      {menuItems.map((item) => (
        <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
            <Icon source={item.icon} size={22} color={colors.primary} />
          </View>
          <Text variant="bodyLarge" style={[styles.menuLabel, { color: c.text }]}>{item.label}</Text>
          <Icon source="chevron-right" size={20} color={c.textSecondary} />
        </TouchableOpacity>
      ))}

      <Divider style={styles.divider} />

      {/* Sign out */}
      <TouchableOpacity style={styles.menuItem} onPress={logout} activeOpacity={0.7}>
        <View style={[styles.iconBox, { backgroundColor: isDark ? '#450a0a' : '#FEE2E2' }]}>
          <Icon source="logout" size={22} color="#EF4444" />
        </View>
        <Text variant="bodyLarge" style={styles.logoutLabel}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    padding: 14, marginBottom: 4, gap: 14,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  profileCardDark: { shadowOpacity: 0 },
  profileInfo: { flex: 1 },
  name: { fontWeight: 'bold' },
  role: { marginTop: 2, fontWeight: '600' },
  divider: { marginVertical: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1 },
  logoutLabel: { flex: 1, color: '#EF4444' },
});