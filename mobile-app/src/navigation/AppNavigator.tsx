import React, { useEffect } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Icon } from 'react-native-paper';
import { useAuthStore } from '../stores/auth.store';
import { useThemeStore } from '../stores/theme.store';
import { getColors, colors } from '../theme/colors';
import { useAppTheme } from '../hooks/useAppTheme';

// ── Auth screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

// ── Gated screens
import UnassignedScreen from '../screens/UnassignedScreen';

// ── Main tab screens
import DashboardScreen from '../screens/DashboardScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import PrayersScreen from '../screens/PrayersScreen';
import TestimoniesScreen from '../screens/TestimoniesScreen';
import EventsScreen from '../screens/EventsScreen';

// ── More stack screens
import MoreScreen from '../screens/MoreScreen';
import MembersScreen from '../screens/MembersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChurchSettingsScreen from '../screens/ChurchSettingsScreen';

// ─── Param list types ─────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Members: undefined;
  Settings: undefined;
  ChurchSettings: undefined;
};

// ─── Navigators ───────────────────────────────────────────────────────────────

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const UnassignedStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();
const RootStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function UnassignedNavigator() {
  return (
    <UnassignedStack.Navigator screenOptions={{ headerShown: false }}>
      <UnassignedStack.Screen name="Unassigned" component={UnassignedScreen} />
    </UnassignedStack.Navigator>
  );
}

function MoreNavigator() {
  const { c, primary } = useAppTheme();

  return (
    <MoreStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: primary,
        headerTitleStyle: { color: c.text },
        headerShadowVisible: false,
      }}
    >
      <MoreStack.Screen
        name="MoreMenu"
        component={MoreScreen}
        options={{ title: 'More', headerShown: false }}
      />
      <MoreStack.Screen
        name="Members"
        component={MembersScreen}
        options={{ title: 'Members Directory' }}
      />
      <MoreStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings & Profile' }}
      />
      <MoreStack.Screen
        name="ChurchSettings"
        component={ChurchSettingsScreen}
        options={{ title: 'Church Settings' }}
      />
    </MoreStack.Navigator>
  );
}

function MainTabs() {
  const { isDark, c, primary } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: primary,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: isDark ? '#1F2937' : '#E5E7EB',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11 },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color }) => <Icon source="home" size={24} color={color} /> }}
      />
      <Tab.Screen
        name="Announcements"
        component={AnnouncementsScreen}
        options={{ tabBarIcon: ({ color }) => <Icon source="bell" size={24} color={color} /> }}
      />
      <Tab.Screen
        name="Prayers"
        component={PrayersScreen}
        options={{
          title: 'Prayers',
          tabBarIcon: ({ color }) => <Icon source="hands-pray" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Testimonies"
        component={TestimoniesScreen}
        options={{
          tabBarIcon: ({ color }) => <Icon source="book-open-variant" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{ tabBarIcon: ({ color }) => <Icon source="calendar" size={24} color={color} /> }}
      />
      <Tab.Screen
        name="More"
        component={MoreNavigator}
        options={{ tabBarIcon: ({ color }) => <Icon source="menu" size={24} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { token, user, isLoading, loadToken } = useAuthStore();
  const { isDark } = useThemeStore();
  const c = getColors(isDark);
  const church = useAuthStore((s) => s.church);
  const primary = church?.primaryColor ?? colors.primary;

  useEffect(() => {
    loadToken();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background }}>
          <ActivityIndicator size="large" color={primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  const isAuthenticated = !!token;
  const isAssigned = !!user?.churchId;

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: { ...DarkTheme.colors, background: c.background, card: c.surface, text: c.text, border: '#1F2937', primary, notification: primary },
      }
    : {
        ...DefaultTheme,
        colors: { ...DefaultTheme.colors, background: c.background, card: c.surface, text: c.text, border: '#E5E7EB', primary, notification: primary },
      };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <RootStack.Screen name="Auth" component={AuthNavigator} />
          ) : !isAssigned ? (
            <RootStack.Screen name="UnassignedRoot" component={UnassignedNavigator} />
          ) : (
            <RootStack.Screen name="MainRoot" component={MainTabs} />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}