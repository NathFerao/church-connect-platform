import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, Alert, KeyboardAvoidingView,
  Platform, TouchableOpacity, Keyboard,
} from 'react-native';
import { TextInput, Button, Text, Divider, ActivityIndicator } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../stores/auth.store';
import { useThemeStore } from '../stores/theme.store';
import { getColors, colors } from '../theme/colors';
import api from '../services/api';

WebBrowser.maybeCompleteAuthSession();

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000/api/v1' : 'http://localhost:5000/api/v1');

const OAUTH_REDIRECT_URI = Linking.createURL('auth/callback');

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { isDark } = useThemeStore();
  const c = getColors(isDark);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  // ── Deep link listener ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleIncomingUrl = async ({ url }: { url: string }) => {
      if (!url.includes('auth/callback')) return;
      const tokenMatch = url.match(/[?&]token=([^&]+)/);
      if (tokenMatch) await exchangeTokenForAuth(decodeURIComponent(tokenMatch[1]));
    };

    const subscription = Linking.addEventListener('url', handleIncomingUrl);
    Linking.getInitialURL().then((url: string | null) => {
      if (url?.includes('auth/callback')) handleIncomingUrl({ url });
    });
    return () => subscription.remove();
  }, []);

  const exchangeTokenForAuth = async (token: string) => {
    setGoogleLoading(true);
    try {
      const { data } = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = data.data?.user ?? data.data;
      const churchData = data.data?.church ?? null;
      const church = churchData
        ? {
            id: churchData.id, name: churchData.name,
            logoUrl: churchData.logoUrl ?? null,
            primaryColor: churchData.primaryColor ?? colors.primary,
            secondaryColor: churchData.secondaryColor ?? colors.secondary,
          }
        : null;
      await setAuth(user, church, token);
    } catch {
      Alert.alert('Sign-in Failed', 'Could not retrieve your profile. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Email / password ───────────────────────────────────────────────────────
  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email.trim() || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim().toLowerCase(), password,
      });
      const { user, token } = data.data;
      const church = user.church
        ? {
            id: user.church.id, name: user.church.name,
            logoUrl: user.church.logoUrl ?? null,
            primaryColor: user.church.primaryColor ?? colors.primary,
            secondaryColor: user.church.secondaryColor ?? colors.secondary,
          }
        : null;
      await setAuth(user, church, token);
    } catch (error: any) {
      Alert.alert('Login Failed', error?.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    Keyboard.dismiss();
    setGoogleLoading(true);
    try {
      const authUrl =
        `${API_BASE_URL}/auth/google` +
        `?source=mobile&redirect_uri=${encodeURIComponent(OAUTH_REDIRECT_URI)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, OAUTH_REDIRECT_URI, {
        createTask: false,
        showInRecents: false,
      });

      if (result.type === 'success') {
        const tokenMatch = result.url.match(/[?&]token=([^&]+)/);
        if (tokenMatch) await exchangeTokenForAuth(decodeURIComponent(tokenMatch[1]));
      }
    } catch (error: any) {
      Alert.alert('Sign-in Failed', error?.message || 'Something went wrong. Please try again.');
      setGoogleLoading(false);
    }
  };

  const goToRegister = () => { Keyboard.dismiss(); setTimeout(() => navigation.navigate('Register'), 50); };
  const goToForgotPassword = () => { Keyboard.dismiss(); setTimeout(() => navigation.navigate('ForgotPassword'), 50); };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text variant="headlineMedium" style={[styles.title, { color: c.text }]}>Church Connect</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: c.textSecondary }]}>
          Sign in to your community
        </Text>

        {/* Google button */}
        <TouchableOpacity
          style={[
            styles.googleBtn,
            {
              backgroundColor: isDark ? '#1F2937' : 'white',
              borderColor: isDark ? '#374151' : '#D1D5DB',
            },
            (googleLoading || loading) && styles.btnDisabled,
          ]}
          onPress={handleGoogleLogin}
          disabled={googleLoading || loading}
          activeOpacity={0.8}
        >
          {googleLoading
            ? <ActivityIndicator size={18} color={c.textSecondary} />
            : <Text style={styles.googleG}>G</Text>
          }
          <Text style={[styles.googleBtnText, { color: c.text }]}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Or divider */}
        <View style={styles.orRow}>
          <Divider style={[styles.orLine, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
          <Text variant="bodySmall" style={[styles.orText, { color: c.textSecondary }]}>or</Text>
          <Divider style={[styles.orLine, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
        </View>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          right={
            <TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword((v) => !v)} />
          }
          style={styles.input}
          mode="outlined"
        />

        <TouchableOpacity onPress={goToForgotPassword} style={styles.forgotContainer}>
          <Text variant="bodySmall" style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <Button mode="contained" onPress={handleLogin} loading={loading} disabled={loading || googleLoading} style={styles.button}>
          Sign In
        </Button>

        <View style={styles.registerRow}>
          <Text variant="bodyMedium" style={{ color: c.textSecondary }}>Don't have an account? </Text>
          <TouchableOpacity onPress={goToRegister}>
            <Text variant="bodyMedium" style={styles.registerLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { textAlign: 'center', marginBottom: 8, fontWeight: 'bold' },
  subtitle: { textAlign: 'center', marginBottom: 28 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 8, paddingVertical: 12, marginBottom: 20,
  },
  btnDisabled: { opacity: 0.6 },
  googleG: { fontSize: 17, fontWeight: '800', color: '#4285F4' },
  googleBtnText: { fontSize: 15, fontWeight: '600' },
  orRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  orLine: { flex: 1, height: 1 },
  orText: { marginHorizontal: 12 },
  input: { marginBottom: 12 },
  forgotContainer: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: colors.primary },
  button: { marginTop: 4 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  registerLink: { color: colors.primary, fontWeight: '600' },
});