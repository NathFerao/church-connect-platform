'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';

// Minimal church list for the dropdown.
// In production you'd fetch this from GET /churches/public
// For now we seed one church via prisma/seed.ts — paste its
// UUID into SAMPLE_CHURCH_ID below after running the seed.
const SAMPLE_CHURCH_ID = 'ca7a9fc1-6aff-4339-944c-3b2499c4f158';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    churchId: SAMPLE_CHURCH_ID,
  });
  const [loading, setLoading] = useState(false);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        churchId: form.churchId,
      });

      toast.success('Account created! Please log in.');
      router.push('/login');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-emerald-50
                    flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center
                          text-white text-2xl font-bold mb-3"
               style={{ backgroundColor: '#4F46E5' }}>
            C
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Join Church Connect</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                name="firstName" required value={form.firstName} onChange={change}
                className="w-full px-3 py-2 rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                placeholder="John"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                name="lastName" required value={form.lastName} onChange={change}
                className="w-full px-3 py-2 rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" name="email" required value={form.email} onChange={change}
              className="w-full px-3 py-2 rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" name="password" required minLength={8}
              value={form.password} onChange={change}
              className="w-full px-3 py-2 rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password" name="confirmPassword" required minLength={8}
              value={form.confirmPassword} onChange={change}
              className="w-full px-3 py-2 rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              placeholder="Re-enter password"
            />
          </div>

          {/* Church selector — in a full build this is a searchable dropdown
              populated from the API. Hardcoded for initial wiring. */}
          <input type="hidden" name="churchId" value={form.churchId} />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-white font-medium text-sm
                       transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#4F46E5' }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-600 hover:underline font-medium">Sign in</a>
        </p>
      </div>
    </div>
  );
}