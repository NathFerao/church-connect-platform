'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/lib/stores/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CreateChurchPage() {
  const router = useRouter();
  const userRole = useAuthStore((s) => s.user?.role);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
  });

  useEffect(() => {
    if (userRole !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
    }
  }, [userRole, router]);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/churches/register', form);
      toast.success('Church created successfully!');
      router.push('/admin/churches');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to create church');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground";
  const labelCls = "block text-sm font-medium text-foreground mb-1";
  const cardCls = "bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6 space-y-6";

  if (userRole !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Create New Church</h1>

        <form onSubmit={handleSubmit} className={cardCls}>
          {/* Church Info Section */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Church Information</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Church Name *</label>
                <input
                  name="name"
                  required
                  value={form.name}
                  onChange={change}
                  className={inputCls}
                  placeholder="Grace Community Church"
                />
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={change}
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder="A welcoming community..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={change}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={change}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={change}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>City</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={change}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input
                    name="state"
                    value={form.state}
                    onChange={change}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>ZIP Code</label>
                  <input
                    name="zipCode"
                    value={form.zipCode}
                    onChange={change}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Admin User Section */}
          <div className="border-t border-border pt-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Church Administrator</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This person will have full admin access to manage the church
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>First Name *</label>
                  <input
                    name="adminFirstName"
                    required
                    value={form.adminFirstName}
                    onChange={change}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Last Name *</label>
                  <input
                    name="adminLastName"
                    required
                    value={form.adminLastName}
                    onChange={change}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Email *</label>
                <input
                  name="adminEmail"
                  type="email"
                  required
                  value={form.adminEmail}
                  onChange={change}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Password *</label>
                <input
                  name="adminPassword"
                  type="password"
                  required
                  minLength={8}
                  value={form.adminPassword}
                  onChange={change}
                  className={inputCls}
                  placeholder="Min 8 characters"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Creating...' : 'Create Church'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}