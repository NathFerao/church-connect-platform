'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const { token, setAuth, setLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLocalLoading] = useState(false);

  // Already logged in → go straight to dashboard
  useEffect(() => {
    if (token) router.replace('/dashboard');
  }, [token, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      // data.data contains { user, token }
      const { user, token: jwt } = data.data;

      // Build the church meta object the store needs.
      // The backend already includes `church` on the user object
      // when fetched via the profile endpoint; for login we fetch
      // it separately if not present.
      let churchMeta = {
        id: user.churchId,
        name: user.church?.name || 'My Church',
        logoUrl: user.church?.logoUrl || null,
        primaryColor: user.church?.primaryColor || '#4F46E5',
        secondaryColor: user.church?.secondaryColor || '#10B981',
      };

      // If church data wasn't embedded, do a quick profile fetch
      if (!user.church) {
        const profileRes = await api.get('/auth/profile', {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const p = profileRes.data.data;
        if (p.church) {
          churchMeta = {
            id: p.church.id,
            name: p.church.name,
            logoUrl: p.church.logoUrl,
            primaryColor: p.church.primaryColor,
            secondaryColor: p.church.secondaryColor,
          };
        }
      }

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
        jwt,
        churchMeta
      );

      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Login failed';
      toast.error(msg);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-emerald-50
                    flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Logo placeholder */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center
                          text-white text-2xl font-bold mb-3"
               style={{ backgroundColor: '#4F46E5' }}>
            C
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Church Connect</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your church community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-indigo-400
                         text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-indigo-400
                         text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-white font-medium text-sm
                       transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#4F46E5' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-indigo-600 hover:underline font-medium">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}