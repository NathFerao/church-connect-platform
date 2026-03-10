'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useThemeStore } from '@/lib/stores/theme.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HandHeart } from 'lucide-react'; // ← Changed from Heart

interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  isAnonymous: boolean;
  requester: { firstName: string; lastName: string };
  createdAt: string;
  _count: { prayers: number; comments: number };
}

const CAT_COLORS: Record<string, string> = {
  HEALTH: '#EF4444', FAMILY: '#8B5CF6', FINANCES: '#F59E0B',
  SPIRITUAL: '#3B82F6', RELATIONSHIPS: '#EC4899', WORK: '#10B981', OTHER: '#6B7280',
};

export default function PrayersPage() {
  const { primary } = useThemeStore();
  const userId = useAuthStore((s) => s.user?.id || '');
  const [items, setItems] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'OTHER', isAnonymous: false, isPrivate: false });
  const [prayedSet, setPrayedSet] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    try {
      const { data } = await api.get('/prayers?limit=50&sortBy=createdAt&sortOrder=desc');
      setItems(data.data?.data || []);
    } catch {
      toast.error('Failed to load prayer requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/prayers', form);
      toast.success('Prayer request submitted');
      setShowForm(false);
      setForm({ title: '', description: '', category: 'OTHER', isAnonymous: false, isPrivate: false });
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create');
    }
  };

  const togglePray = async (id: string) => {
    const alreadyPrayed = prayedSet.has(id);
    try {
      if (alreadyPrayed) {
        await api.delete(`/prayers/${id}/pray`);
        setPrayedSet((s) => { const n = new Set(s); n.delete(id); return n; });
        toast.success('Prayer removed');
      } else {
        await api.post(`/prayers/${id}/pray`);
        setPrayedSet((s) => new Set(s).add(id));
        toast.success('Praying for this request');
      }
      // ✅ Refresh the list to get updated counts
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error');
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground";
  const labelCls = "block text-sm font-medium text-foreground mb-1";

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground">Prayer Requests</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: primary }}
        >
          {showForm ? 'Cancel' : '+ New Request'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-card rounded-xl border border-border shadow-sm p-4 mb-5 space-y-3">
          <div>
            <label className={labelCls}>Title *</label>
            <input
              required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Title"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Description *</label>
            <textarea
              required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe your prayer request…"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select
              value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className={inputCls}
            >
              {['HEALTH','FAMILY','FINANCES','SPIRITUAL','RELATIONSHIPS','WORK','OTHER'].map((c) => (
                <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.isAnonymous} onChange={(e) => setForm((f) => ({ ...f, isAnonymous: e.target.checked }))} />
              Anonymous
            </label>
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.isPrivate} onChange={(e) => setForm((f) => ({ ...f, isPrivate: e.target.checked }))} />
              Private (only you can see)
            </label>
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: primary }}>
            Submit Request
          </button>
        </form>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">No prayer requests yet.</p>
          </div>
        ) : (
          items.map((item) => {
            const prayed = prayedSet.has(item.id);
            return (
              <div key={item.id} className="bg-card rounded-xl border border-border shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full text-white inline-block mt-1"
                      style={{ backgroundColor: CAT_COLORS[item.category] || '#6B7280' }}
                    >
                      {item.category.charAt(0) + item.category.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {/* ✅ Changed to HandHeart icon and updated styling */}
                  <button
                    onClick={() => togglePray(item.id)}
                    className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${
                      prayed
                        ? 'bg-indigo-100 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400'
                        : 'border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <HandHeart size={16} className={prayed ? 'fill-current' : ''} />
                    {item._count?.prayers || 0}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {item.isAnonymous ? 'Anonymous' : `${item.requester?.firstName} ${item.requester?.lastName}`}
                  {' · '}{new Date(item.createdAt).toLocaleDateString()}
                  {item.status === 'ANSWERED' && (
                    <span className="ml-2 text-green-600 font-medium">✓ Answered</span>
                  )}
                </p>
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}