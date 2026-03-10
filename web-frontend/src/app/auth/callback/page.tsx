'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth.store';
import toast from 'react-hot-toast';

// This page handles the redirect from the backend after Google OAuth.
// URL shape: /auth/callback?token=<jwt>
// It fetches the user profile using the token, populates the store, then redirects.

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      setStatus('error');
      setErrorMsg(
        error === 'google_failed'
          ? 'Google sign-in was cancelled or failed. Please try again.'
          : 'Something went wrong during sign-in.'
      );
      return;
    }

    // Fetch the full profile using the token (same as login page does)
    api
      .get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        const user = data.data;

        const churchMeta = user.church
          ? {
              id: user.church.id,
              name: user.church.name,
              logoUrl: user.church.logoUrl || null,
              primaryColor: user.church.primaryColor || '#4F46E5',
              secondaryColor: user.church.secondaryColor || '#10B981',
            }
          : {
              id: user.churchId || '',
              name: 'My Church',
              logoUrl: null,
              primaryColor: '#4F46E5',
              secondaryColor: '#10B981',
            };

        setAuth(
          {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            churchId: user.churchId,
            avatarUrl: user.avatarUrl || null,
          },
          token,
          churchMeta
        );

        toast.success(`Welcome, ${user.firstName}!`);

        // Same routing logic as the login page
        if (!user.churchId) {
          router.replace('/unassigned');
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('Failed to fetch your profile. Please try signing in again.');
      });
  }, [setAuth, router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl shadow-xl p-8 border border-border text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Sign-in Failed</h2>
          <p className="text-muted-foreground text-sm mb-6">{errorMsg}</p>
          <a
            href="/login"
            className="inline-block px-6 py-2.5 rounded-lg text-white font-medium text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#4F46E5' }}
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl shadow-xl p-8 border border-border text-center">
        {/* Animated spinner */}
        <div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-bold text-foreground mb-2">Signing you in…</h2>
        <p className="text-muted-foreground text-sm">
          Just a moment while we set up your account.
        </p>
      </div>
    </div>
  );
}