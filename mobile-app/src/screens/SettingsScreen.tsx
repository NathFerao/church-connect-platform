import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Alert, TouchableOpacity, Switch,
} from 'react-native';
import { Text, TextInput, Button, Divider, Avatar, Surface, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MoreStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import { useAuthStore } from '../stores/auth.store';
import { useAppTheme } from '../hooks/useAppTheme';

// ─── Constants ────────────────────────────────────────────────────────────────

type ActiveSection = 'profile' | 'password' | 'appearance';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', CHURCH_ADMIN: 'Church Admin',
  PASTOR: 'Pastor', LEADER: 'Leader', MEMBER: 'Member',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#DC2626', CHURCH_ADMIN: '#7C3AED',
  PASTOR: '#2563EB', LEADER: '#059669', MEMBER: '#6B7280',
};

const ADMIN_ROLES = ['SUPER_ADMIN', 'CHURCH_ADMIN'];

type Props = NativeStackScreenProps<MoreStackParamList, 'Settings'>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsScreen({ navigation }: Props) {
  const { user, church, updateUser, logout } = useAuthStore();
  const { isDark, c, primary } = useAppTheme();
  const { toggleDark } = require('../stores/theme.store').useThemeStore();

  const isAdmin = ADMIN_ROLES.includes(user?.role ?? '');

  // Profile fields
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [activeSection, setActiveSection] = useState<ActiveSection>('profile');

  useEffect(() => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setPhone(user?.phone ?? '');
    setBio(user?.bio ?? '');
  }, [user]);

  // ── Save profile ───────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First and last name are required'); return;
    }
    setSavingProfile(true);
    try {
      const { data } = await api.put('/users/profile', {
        firstName: firstName.trim(), lastName: lastName.trim(),
        phone: phone.trim() || undefined, bio: bio.trim() || undefined,
      });
      await updateUser(data.data?.user ?? data.data);
      Alert.alert('Saved', 'Your profile has been updated');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Could not save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Change password ────────────────────────────────────────────────────────

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields'); return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters'); return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match'); return;
    }
    setSavingPassword(true);
    try {
      await api.put('/users/profile', { currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      Alert.alert('Done', 'Password changed successfully');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Could not change password');
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  const roleColor = ROLE_COLORS[user?.role ?? ''] ?? '#6B7280';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Avatar / name header ── */}
      <View style={styles.header}>
        <Avatar.Text size={72} label={initials}
          style={{ backgroundColor: roleColor }} labelStyle={styles.avatarLabel} />
        <Text variant="headlineSmall" style={[styles.fullName, { color: c.text }]}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text variant="bodySmall" style={[styles.roleTag, { color: roleColor }]}>
          {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
          {church ? `  ·  ${church.name}` : ''}
        </Text>
        <Text variant="bodySmall" style={{ color: c.textSecondary }}>{user?.email}</Text>
      </View>

      {/* ── Church Settings button (admins only) ── */}
      {isAdmin && (
        <TouchableOpacity
          style={[styles.churchSettingsBtn, { backgroundColor: c.surface, borderColor: primary }]}
          onPress={() => navigation.navigate('ChurchSettings')}
          activeOpacity={0.8}
        >
          <View style={[styles.churchSettingsIcon, { backgroundColor: `${primary}15` }]}>
            <Icon source="church" size={20} color={primary} />
          </View>
          <View style={styles.churchSettingsText}>
            <Text variant="bodyMedium" style={[styles.churchSettingsTitle, { color: c.text }]}>
              Church Settings
            </Text>
            <Text variant="bodySmall" style={{ color: c.textSecondary }}>
              Name, branding colours, contact info
            </Text>
          </View>
          <Icon source="chevron-right" size={20} color={c.textSecondary} />
        </TouchableOpacity>
      )}

      {/* ── Section tabs ── */}
      <View style={[styles.tabs, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
        {([
          { key: 'profile', label: 'Profile' },
          { key: 'password', label: 'Password' },
          { key: 'appearance', label: 'Appearance' },
        ] as { key: ActiveSection; label: string }[]).map((tab) => (
          <TouchableOpacity key={tab.key}
            style={[styles.tab, activeSection === tab.key && [styles.tabActive, { backgroundColor: isDark ? '#1F2937' : 'white' }]]}
            onPress={() => setActiveSection(tab.key)}>
            <Text style={[styles.tabText, { color: activeSection === tab.key ? primary : c.textSecondary },
              activeSection === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Profile ── */}
      {activeSection === 'profile' && (
        <Surface style={[styles.section, { backgroundColor: c.surface }]} elevation={1}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: c.text }]}>Edit Profile</Text>
          <View style={styles.nameRow}>
            <TextInput label="First Name" value={firstName} onChangeText={setFirstName}
              style={[styles.input, styles.nameInput]} mode="outlined" autoCapitalize="words" />
            <TextInput label="Last Name" value={lastName} onChangeText={setLastName}
              style={[styles.input, styles.nameInput]} mode="outlined" autoCapitalize="words" />
          </View>
          <TextInput label="Phone (optional)" value={phone} onChangeText={setPhone}
            style={styles.input} mode="outlined" keyboardType="phone-pad" />
          <TextInput label="Bio (optional)" value={bio} onChangeText={setBio}
            style={styles.input} mode="outlined" multiline numberOfLines={3} />
          <Button mode="contained" onPress={handleSaveProfile}
            loading={savingProfile} disabled={savingProfile} style={styles.saveBtn}>
            Save Changes
          </Button>
        </Surface>
      )}

      {/* ── Password ── */}
      {activeSection === 'password' && (
        <Surface style={[styles.section, { backgroundColor: c.surface }]} elevation={1}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: c.text }]}>Change Password</Text>
          <TextInput label="Current Password" value={currentPassword} onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrent}
            right={<TextInput.Icon icon={showCurrent ? 'eye-off' : 'eye'} onPress={() => setShowCurrent((v) => !v)} />}
            style={styles.input} mode="outlined" />
          <TextInput label="New Password" value={newPassword} onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            right={<TextInput.Icon icon={showNew ? 'eye-off' : 'eye'} onPress={() => setShowNew((v) => !v)} />}
            style={styles.input} mode="outlined" />
          <TextInput label="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            right={<TextInput.Icon icon={showConfirm ? 'eye-off' : 'eye'} onPress={() => setShowConfirm((v) => !v)} />}
            style={styles.input} mode="outlined" />
          <Text variant="bodySmall" style={[styles.hint, { color: c.textSecondary }]}>
            Password must be at least 8 characters
          </Text>
          <Button mode="contained" onPress={handleChangePassword}
            loading={savingPassword} disabled={savingPassword} style={styles.saveBtn}>
            Update Password
          </Button>
        </Surface>
      )}

      {/* ── Appearance ── */}
      {activeSection === 'appearance' && (
        <Surface style={[styles.section, { backgroundColor: c.surface }]} elevation={1}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: c.text }]}>Appearance</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge" style={{ color: c.text }}>Dark Mode</Text>
              <Text variant="bodySmall" style={{ color: c.textSecondary }}>Easier on the eyes in low light</Text>
            </View>
            <Switch value={isDark} onValueChange={toggleDark}
              trackColor={{ false: '#D1D5DB', true: `${primary}80` }}
              thumbColor={isDark ? primary : '#F3F4F6'} />
          </View>
          <Divider style={styles.rowDivider} />
          {church && (
            <>
              <Text variant="labelSmall" style={[styles.fieldLabel, { color: c.textSecondary }]}>
                CHURCH BRANDING
              </Text>
              <View style={styles.churchRow}>
                <Text variant="bodyMedium" style={{ color: c.text }}>{church.name}</Text>
              </View>
              <View style={styles.colorRow}>
                <View style={styles.colorSwatch}>
                  <View style={[styles.colorDot, { backgroundColor: church.primaryColor }]} />
                  <View>
                    <Text variant="bodySmall" style={{ color: c.text }}>Primary</Text>
                    <Text variant="bodySmall" style={{ color: c.textSecondary }}>{church.primaryColor}</Text>
                  </View>
                </View>
                <View style={styles.colorSwatch}>
                  <View style={[styles.colorDot, { backgroundColor: church.secondaryColor }]} />
                  <View>
                    <Text variant="bodySmall" style={{ color: c.text }}>Secondary</Text>
                    <Text variant="bodySmall" style={{ color: c.textSecondary }}>{church.secondaryColor}</Text>
                  </View>
                </View>
              </View>
              {isAdmin ? (
                <Button mode="outlined" onPress={() => navigation.navigate('ChurchSettings')}
                  style={{ marginTop: 8 }} icon="pencil">
                  Edit Church Branding
                </Button>
              ) : (
                <Text variant="bodySmall" style={[styles.brandingNote, { color: c.textSecondary }]}>
                  Colors are set by your church administrator.
                </Text>
              )}
            </>
          )}
        </Surface>
      )}

      <Divider style={styles.divider} />
      <Button mode="outlined" onPress={handleLogout} icon="logout"
        style={styles.logoutBtn} textColor="#EF4444">
        Sign Out
      </Button>
      <Text variant="bodySmall" style={[styles.version, { color: c.textSecondary }]}>
        Church Connect
      </Text>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  header: { alignItems: 'center', marginBottom: 20 },
  avatarLabel: { fontSize: 26, fontWeight: '700' },
  fullName: { fontWeight: 'bold', marginTop: 12 },
  roleTag: { marginTop: 4, fontWeight: '600', marginBottom: 4 },
  churchSettingsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 16,
  },
  churchSettingsIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  churchSettingsText: { flex: 1 },
  churchSettingsTitle: { fontWeight: '600' },
  tabs: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  tabText: { fontSize: 13 },
  tabTextActive: { fontWeight: '600' },
  section: { borderRadius: 12, padding: 16, marginBottom: 8 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 16 },
  nameRow: { flexDirection: 'row', gap: 12 },
  nameInput: { flex: 1 },
  input: { marginBottom: 12 },
  hint: { marginBottom: 12, marginTop: -8 },
  saveBtn: { marginTop: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  settingInfo: { flex: 1, marginRight: 16 },
  rowDivider: { marginVertical: 12 },
  fieldLabel: { letterSpacing: 1, marginBottom: 10 },
  churchRow: { marginBottom: 12 },
  colorRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  colorSwatch: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  brandingNote: { fontStyle: 'italic' },
  divider: { marginVertical: 20 },
  logoutBtn: { borderColor: '#EF4444' },
  version: { textAlign: 'center', marginTop: 24 },
});