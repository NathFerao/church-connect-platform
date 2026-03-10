import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface, Icon } from 'react-native-paper';
import { useAuthStore } from '../stores/auth.store';
import { useThemeStore } from '../stores/theme.store';
import { getColors, colors } from '../theme/colors';

export default function UnassignedScreen() {
  const { user, logout } = useAuthStore();
  const { isDark } = useThemeStore();
  const c = getColors(isDark);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={2}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
          <Icon source="church" size={56} color={colors.primary} />
        </View>

        <Text variant="headlineSmall" style={[styles.title, { color: c.text }]}>
          Not Yet Assigned
        </Text>

        <Text variant="bodyMedium" style={[styles.body, { color: c.textSecondary }]}>
          Your account has been created, but you haven't been added to a church yet.
          Share your email address with your church administrator to get access.
        </Text>

        <Surface
          style={[
            styles.emailBox,
            {
              backgroundColor: `${colors.primary}10`,
              borderColor: `${colors.primary}30`,
            },
          ]}
          elevation={0}
        >
          <Text variant="labelSmall" style={[styles.emailLabel, { color: colors.primary }]}>
            YOUR EMAIL ADDRESS
          </Text>
          <Text variant="titleMedium" style={[styles.email, { color: c.text }]} selectable>
            {user?.email ?? '—'}
          </Text>
        </Surface>

        <Text variant="bodySmall" style={[styles.hint, { color: c.textSecondary }]}>
          Once an admin assigns you to a church, simply log out and log back in to get started.
        </Text>
      </Surface>

      <Button
        mode="outlined"
        onPress={logout}
        style={[styles.logoutButton, { borderColor: c.textSecondary }]}
        icon="logout"
      >
        Sign Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { borderRadius: 16, padding: 28, alignItems: 'center' },
  iconContainer: { marginBottom: 20, padding: 16, borderRadius: 50 },
  title: { fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  body: { textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emailBox: {
    width: '100%', borderRadius: 10, padding: 16,
    alignItems: 'center', marginBottom: 20, borderWidth: 1,
  },
  emailLabel: { letterSpacing: 1.2, marginBottom: 4 },
  email: { fontWeight: '600' },
  hint: { textAlign: 'center', lineHeight: 18 },
  logoutButton: { marginTop: 24 },
});