'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useThemeStore } from '@/lib/stores/theme.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  isPublished: boolean;
  author: { firstName: string; lastName: string };
  createdAt: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#9CA3AF',
  MEDIUM: '#3B82F6',
  HIGH: '#F59E0B',
  URGENT: '#EF4444',
};

export default function AnnouncementsPage() {
  const { primary } = useThemeStore();
  const userRole = useAuthStore((s) => s.user?.role || '');
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'MEDIUM' });

  const canCreate = ['CHURCH_ADMIN', 'PASTOR', 'LEADER'].includes(userRole);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/announcements?limit=50&sortBy=createdAt&sortOrder=desc');
      setItems(data.data?.data || []);
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/announcements', { ...form, isPublished: true });
      toast.success('Announcement created');
      setShowForm(false);
      setForm({ title: '', content: '', priority: 'MEDIUM' });
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create');
    }
  };

  return (
    <AppShell>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground">Announcements</h2>
        {canCreate && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: primary }}
          >
            {showForm ? 'Cancel' : '+ New'}
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-card rounded-xl border border-border shadow-sm p-4 mb-5 space-y-3">
          <input
            required value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground
                       text-sm focus:outline-none focus:ring-2 focus:ring-ring
                       placeholder:text-muted-foreground"
          />
          <textarea
            required value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="Write your announcement…"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground
                       text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none
                       placeholder:text-muted-foreground"
          />
          <select
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground
                       text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: primary }}
          >
            Post Announcement
          </button>
        </form>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">No announcements yet.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-card rounded-xl border border-border shadow-sm p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: PRIORITY_COLORS[item.priority] || '#9CA3AF' }}
                >
                  {item.priority}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{item.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                By {item.author?.firstName} {item.author?.lastName}
                {' · '}{new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}