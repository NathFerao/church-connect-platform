'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/lib/stores/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function EditChurchPage() {
  const router = useRouter();
  const params = useParams();
  const churchId = params.id as string;
  const userRole = useAuthStore((s) => s.user?.role);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
  });

  useEffect(() => {
    if (userRole !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }
    fetchChurch();
  }, [userRole, router, churchId]);

  const fetchChurch = async () => {
    try {
      const { data } = await api.get(`/churches/${churchId}`);
      setForm({
        name: data.data.name || '',
        description: data.data.description || '',
        email: data.data.email || '',
        phone: data.data.phone || '',
        address: data.data.address || '',
        city: data.data.city || '',
        state: data.data.state || '',
        country: data.data.country || '',
        zipCode: data.data.zipCode || '',
        primaryColor: data.data.primaryColor || '#4F46E5',
        secondaryColor: data.data.secondaryColor || '#10B981',
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to load church');
      router.push('/admin/churches');
    } finally {
      setLoading(false);
    }
  };

  const change = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put(`/churches/${churchId}`, form);
      toast.success('Church updated successfully!');
      router.push('/admin/churches');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update church');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground";
  const labelCls = "block text-sm font-medium text-foreground mb-1";
  const cardCls = "bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6 space-y-6";

  if (userRole !== 'SUPER_ADMIN') return null;
  if (loading) return <AppShell><p className="text-muted-foreground">Loading...</p></AppShell>;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Edit Church</h1>

        <form onSubmit={handleSubmit} className={cardCls}>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="primaryColor"
                      value={form.primaryColor}
                      onChange={change}
                      className="w-12 h-10 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      name="primaryColor"
                      value={form.primaryColor}
                      onChange={change}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="secondaryColor"
                      value={form.secondaryColor}
                      onChange={change}
                      className="w-12 h-10 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      name="secondaryColor"
                      value={form.secondaryColor}
                      onChange={change}
                      className={inputCls}
                    />
                  </div>
                </div>
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
              disabled={saving}
              className="flex-1 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}