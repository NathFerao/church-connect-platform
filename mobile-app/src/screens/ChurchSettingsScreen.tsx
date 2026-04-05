import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image,
} from 'react-native';
import { Text, TextInput, Button, Surface, Divider, ActivityIndicator, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MoreStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import { useAuthStore } from '../stores/auth.store';
import { useAppTheme } from '../hooks/useAppTheme';

// ─── Preset colour swatches ───────────────────────────────────────────────────

const PRESET_COLORS = [
  '#4F46E5', '#7C3AED', '#2563EB', '#0891B2',
  '#059669', '#D97706', '#DC2626', '#DB2777',
  '#9333EA', '#1D4ED8', '#047857', '#B91C1C',
  '#374151', '#111827', '#0F172A', '#1E293B',
];

type Props = NativeStackScreenProps<MoreStackParamList, 'ChurchSettings'>;

interface ChurchForm {
  name: string; description: string; email: string; phone: string;
  address: string; city: string; state: string; country: string;
  zipCode: string; primaryColor: string; secondaryColor: string;
}

function ColorPickerRow({
  label, value, onChange, c,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  c: ReturnType<typeof import('../theme/colors').getColors>;
}) {
  return (
    <View style={styles.colorSection}>
      <View style={styles.colorLabelRow}>
        <Text variant="labelMedium" style={{ color: c.textSecondary }}>{label}</Text>
        <View style={[styles.colorPreview, { backgroundColor: value }]} />
      </View>
      <View style={styles.swatchGrid}>
        {PRESET_COLORS.map((hex) => (
          <TouchableOpacity key={hex}
            style={[styles.swatch, { backgroundColor: hex }, value === hex && styles.swatchSelected]}
            onPress={() => onChange(hex)} />
        ))}
      </View>
      <TextInput
        label="Custom hex (e.g. #4F46E5)"
        value={value}
        onChangeText={(v) => onChange(v.startsWith('#') ? v : `#${v}`)}
        mode="outlined" style={styles.hexInput}
        autoCapitalize="none" maxLength={7}
      />
    </View>
  );
}

export default function ChurchSettingsScreen({ navigation }: Props) {
  const { c, primary } = useAppTheme();
  const { user, church, token, setAuth } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [form, setForm] = useState<ChurchForm>({
    name: '', description: '', email: '', phone: '',
    address: '', city: '', state: '', country: '', zipCode: '',
    primaryColor: '#4F46E5', secondaryColor: '#10B981',
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/churches/settings');
      const ch = data.data;
      setForm({
        name: ch.name ?? '', description: ch.description ?? '',
        email: ch.email ?? '', phone: ch.phone ?? '',
        address: ch.address ?? '', city: ch.city ?? '',
        state: ch.state ?? '', country: ch.country ?? '',
        zipCode: ch.zipCode ?? '',
        primaryColor: ch.primaryColor ?? '#4F46E5',
        secondaryColor: ch.secondaryColor ?? '#10B981',
      });
      setLogoUri(ch.logoUrl ?? null);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Could not load church settings');
      navigation.goBack();
    } finally { setLoading(false); }
  };

  const set = (field: keyof ChurchForm) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  // ── Logo upload ────────────────────────────────────────────────────────────

  const handlePickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload a logo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('logo', {
        uri: asset.uri,
        type: asset.mimeType ?? 'image/jpeg',
        name: asset.fileName ?? 'logo.jpg',
      } as any);

      const { data } = await api.post('/upload/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newLogoUrl = data.data?.logoUrl ?? data.data?.url ?? asset.uri;
      setLogoUri(newLogoUrl);

      // Update church in auth store so logo shows in dashboard immediately
      if (church && user && token) {
        await setAuth(user, { ...church, logoUrl: newLogoUrl }, token);
      }

      Alert.alert('Success', 'Church logo updated');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Could not upload logo');
    } finally { setUploadingLogo(false); }
  };

  // ── Save settings ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Error', 'Church name is required'); return; }
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(form.primaryColor) || !hexRegex.test(form.secondaryColor)) {
      Alert.alert('Error', 'Colours must be valid hex codes (e.g. #4F46E5)'); return;
    }

    setSaving(true);
    try {
      const { data } = await api.put('/churches/settings', form);
      const updatedChurch = data.data;
      const updatedChurchObj = {
        id: updatedChurch.id ?? church?.id ?? '',
        name: updatedChurch.name,
        logoUrl: updatedChurch.logoUrl ?? logoUri ?? church?.logoUrl ?? null,
        primaryColor: updatedChurch.primaryColor,
        secondaryColor: updatedChurch.secondaryColor,
      };

      if (user && token) await setAuth(user, updatedChurchObj, token);

      Alert.alert('Saved', 'Church settings updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Could not save church settings');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['bottom']}>
        <ActivityIndicator size="large" color={primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Logo ── */}
        <Surface style={[styles.section, { backgroundColor: c.surface }]} elevation={1}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: c.text }]}>Church Logo</Text>
          <View style={styles.logoRow}>
            <TouchableOpacity onPress={handlePickLogo} disabled={uploadingLogo} style={styles.logoContainer}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="contain" />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: `${primary}15`, borderColor: `${primary}40` }]}>
                  <Icon source="image-plus" size={36} color={primary} />
                </View>
              )}
              {uploadingLogo && (
                <View style={styles.logoOverlay}>
                  <ActivityIndicator color="white" />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.logoInfo}>
              <Text variant="bodyMedium" style={{ color: c.text, fontWeight: '600', marginBottom: 4 }}>
                {logoUri ? 'Change Logo' : 'Add Logo'}
              </Text>
              <Text variant="bodySmall" style={{ color: c.textSecondary, marginBottom: 12 }}>
                Tap the image to pick from your photo library. Square images work best.
              </Text>
              <Button mode="outlined" icon="image-edit" onPress={handlePickLogo}
                disabled={uploadingLogo} loading={uploadingLogo} compact>
                {uploadingLogo ? 'Uploading...' : logoUri ? 'Change Logo' : 'Upload Logo'}
              </Button>
            </View>
          </View>
        </Surface>

        {/* ── Church Info ── */}
        <Surface style={[styles.section, { backgroundColor: c.surface }]} elevation={1}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: c.text }]}>Church Information</Text>
          <TextInput label="Church Name *" value={form.name} onChangeText={set('name')} mode="outlined" style={styles.input} />
          <TextInput label="Description" value={form.description} onChangeText={set('description')}
            mode="outlined" style={styles.input} multiline numberOfLines={3} />
          <View style={styles.row}>
            <TextInput label="Email" value={form.email} onChangeText={set('email')}
              mode="outlined" style={[styles.input, styles.flex]} keyboardType="email-address" autoCapitalize="none" />
            <TextInput label="Phone" value={form.phone} onChangeText={set('phone')}
              mode="outlined" style={[styles.input, styles.flex]} keyboardType="phone-pad" />
          </View>
          <TextInput label="Address" value={form.address} onChangeText={set('address')} mode="outlined" style={styles.input} />
          <View style={styles.row}>
            <TextInput label="City" value={form.city} onChangeText={set('city')} mode="outlined" style={[styles.input, styles.flex]} />
            <TextInput label="State" value={form.state} onChangeText={set('state')} mode="outlined" style={[styles.input, styles.flex]} />
          </View>
          <View style={styles.row}>
            <TextInput label="Country" value={form.country} onChangeText={set('country')} mode="outlined" style={[styles.input, styles.flex]} />
            <TextInput label="ZIP Code" value={form.zipCode} onChangeText={set('zipCode')} mode="outlined" style={[styles.input, styles.flex]} />
          </View>
        </Surface>

        {/* ── Branding ── */}
        <Surface style={[styles.section, { backgroundColor: c.surface }]} elevation={1}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: c.text }]}>Church Branding</Text>
          <Text variant="bodySmall" style={[styles.brandingNote, { color: c.textSecondary }]}>
            These colours are applied across the app for all members of your church.
          </Text>
          <Divider style={styles.divider} />
          <ColorPickerRow label="PRIMARY COLOUR" value={form.primaryColor} onChange={set('primaryColor')} c={c} />
          <Divider style={styles.divider} />
          <ColorPickerRow label="SECONDARY COLOUR" value={form.secondaryColor} onChange={set('secondaryColor')} c={c} />
          <View style={styles.previewRow}>
            <View style={[styles.previewSwatch, { backgroundColor: form.primaryColor }]}>
              <Text style={styles.previewLabel}>Primary</Text>
            </View>
            <View style={[styles.previewSwatch, { backgroundColor: form.secondaryColor }]}>
              <Text style={styles.previewLabel}>Secondary</Text>
            </View>
          </View>
        </Surface>

        <View style={styles.actions}>
          <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.actionBtn} disabled={saving}>Cancel</Button>
          <Button mode="contained" onPress={handleSave}
            style={[styles.actionBtn, { backgroundColor: primary }]}
            loading={saving} disabled={saving}>Save Changes</Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  section: { borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 16 },
  input: { marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  logoRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  logoContainer: { position: 'relative' },
  logoImage: { width: 80, height: 80, borderRadius: 12 },
  logoPlaceholder: { width: 80, height: 80, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  logoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  logoInfo: { flex: 1 },
  brandingNote: { marginBottom: 12 },
  divider: { marginVertical: 16 },
  colorSection: { marginBottom: 8 },
  colorLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  colorPreview: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#E5E7EB' },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  swatch: { width: 36, height: 36, borderRadius: 8 },
  swatchSelected: { borderWidth: 3, borderColor: 'white', elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4 },
  hexInput: { marginBottom: 4 },
  previewRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  previewSwatch: { flex: 1, height: 56, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  previewLabel: { color: 'white', fontWeight: '700', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtn: { flex: 1 },
});