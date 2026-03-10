'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useThemeStore } from '@/lib/stores/theme.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Heart, Plus, Star } from 'lucide-react';

interface Testimony {
  id: string;
  title: string;
  content: string;
  category: string;
  isPublished: boolean;
  isFeatured: boolean;
  author: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const CATEGORIES: Record<string, string> = {
  HEALING: 'Healing',
  SALVATION: 'Salvation',
  PROVISION: 'Provision',
  DELIVERANCE: 'Deliverance',
  ANSWERED_PRAYER: 'Answered Prayer',
  LIFE_CHANGE: 'Life Change',
  OTHER: 'Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  HEALING: '#10B981',
  SALVATION: '#3B82F6',
  PROVISION: '#F59E0B',
  DELIVERANCE: '#8B5CF6',
  ANSWERED_PRAYER: '#EC4899',
  LIFE_CHANGE: '#06B6D4',
  OTHER: '#6B7280',
};

export default function TestimoniesPage() {
  const { primary } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'OTHER',
    isPublished: true,
  });

  const fetchTestimonies = async () => {
    try {
      const { data } = await api.get('/testimonies?limit=50&sortBy=createdAt&sortOrder=desc');
      setItems(data.data?.data || []);
    } catch {
      toast.error('Failed to load testimonies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonies();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/testimonies', form);
      toast.success('Testimony shared!');
      setShowForm(false);
      setForm({ title: '', content: '', category: 'OTHER', isPublished: true });
      fetchTestimonies();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create testimony');
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground";
  const labelCls = "block text-sm font-medium text-foreground mb-1";

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground">Testimonies</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-2"
          style={{ backgroundColor: primary }}
        >
          {showForm ? 'Cancel' : <><Plus size={18} /> Share Testimony</>}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-card rounded-xl border border-border shadow-sm p-4 mb-5 space-y-3">
          <div>
            <label className={labelCls}>Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="God's faithfulness in my life"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Your Testimony *</label>
            <textarea
              required
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Share how God has worked in your life..."
              rows={6}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className={labelCls}>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className={inputCls}
            >
              {Object.entries(CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
            />
            Publish immediately (uncheck to save as draft)
          </label>

          <button
            type="submit"
            className="w-full py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: primary }}
          >
            Share Testimony
          </button>
        </form>
      )}

      {/* Testimonies List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Heart size={48} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No testimonies yet. Be the first to share!</p>
          </div>
        ) : (
          items.map((testimony) => (
            <div key={testimony.id} className="bg-card rounded-xl border border-border shadow-sm p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">
                  {testimony.author.firstName[0]}{testimony.author.lastName[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">
                      {testimony.author.firstName} {testimony.author.lastName}
                    </h4>
                    {testimony.isFeatured && (
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(testimony.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className="text-xs font-medium px-2 py-1 rounded-full text-white"
                  style={{ backgroundColor: CATEGORY_COLORS[testimony.category] || '#6B7280' }}
                >
                  {CATEGORIES[testimony.category] || testimony.category}
                </span>
              </div>

              <h3 className="font-semibold text-foreground text-lg mb-2">{testimony.title}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {testimony.content}
              </p>

              {!testimony.isPublished && (
                <div className="mt-3 text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 inline-block">
                  Draft - Not published
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}