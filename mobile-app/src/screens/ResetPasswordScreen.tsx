import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { useThemeStore } from '../stores/theme.store';
import { getColors, colors } from '../theme/colors';
import api from '../services/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ route, navigation }: Props) {
  const { token } = route.params;
  const { isDark } = useThemeStore();
  const c = getColors(isDark);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      Alert.alert(
        'Password Reset',
        'Your password has been updated. Please sign in with your new password.',
        [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Reset Failed', error?.response?.data?.error || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text variant="headlineMedium" style={[styles.title, { color: c.text }]}>
          Reset Password
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: c.textSecondary }]}>
          Enter your new password below.
        </Text>

        <TextInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNew}
          right={
            <TextInput.Icon icon={showNew ? 'eye-off' : 'eye'} onPress={() => setShowNew((v) => !v)} />
          }
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirm}
          right={
            <TextInput.Icon icon={showConfirm ? 'eye-off' : 'eye'} onPress={() => setShowConfirm((v) => !v)} />
          }
          style={styles.input}
          mode="outlined"
        />

        <Button mode="contained" onPress={handleReset} loading={loading} disabled={loading} style={styles.button}>
          Set New Password
        </Button>

        <Button mode="text" onPress={() => navigation.navigate('Login')} style={styles.backButton}>
          Back to Sign In
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontWeight: 'bold', marginBottom: 8 },
  subtitle: { marginBottom: 28 },
  input: { marginBottom: 16 },
  button: { marginTop: 8 },
  backButton: { marginTop: 8 },
});