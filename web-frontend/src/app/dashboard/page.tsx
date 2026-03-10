'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useThemeStore } from '@/lib/stores/theme.store';
import api from '@/lib/api';
import { Bell, Heart, BookOpen, Users } from 'lucide-react';

interface Stats {
  announcements: number;
  prayerRequests: number;
  testimonies: number;
  members: number;
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { primary } = useThemeStore();
  const [stats, setStats] = useState<Stats>({ announcements: 0, prayerRequests: 0, testimonies: 0, members: 0 });
  const [recentAnnouncement, setRecentAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [annRes, prayRes, testRes, membersRes] = await Promise.all([
          api.get('/announcements?limit=1&sortBy=createdAt&sortOrder=desc'),
          api.get('/prayers?limit=1&sortBy=createdAt&sortOrder=desc'),
          api.get('/testimonies?limit=1&sortBy=createdAt&sortOrder=desc'),
          api.get('/users/church-members?limit=1'),
        ]);

        setRecentAnnouncement(annRes.data.data?.data?.[0] || null);
        setStats({
          announcements: annRes.data.data?.pagination?.total || 0,
          prayerRequests: prayRes.data.data?.pagination?.total || 0,
          testimonies: testRes.data.data?.pagination?.total || 0,
          members: membersRes.data.data?.pagination?.total || 0,
        });
      } catch {
        // silently degrade
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { label: 'Announcements', value: stats.announcements, icon: Bell, color: '#4F46E5' },
    { label: 'Prayer Requests', value: stats.prayerRequests, icon: Heart, color: '#E11D48' },
    { label: 'Testimonies', value: stats.testimonies, icon: BookOpen, color: '#059669' },
    { label: 'Members', value: stats.members, icon: Users, color: '#D97706' },
  ];

  return (
    <AppShell>
      {/* Greeting banner */}
      <div
        className="rounded-xl text-white p-5 mb-6"
        style={{ background: `linear-gradient(135deg, ${primary}, #6366f1)` }}
      >
        <h2 className="text-xl font-semibold">
          Good day, {user?.firstName || 'Friend'}
        </h2>
        <p className="text-sm opacity-80 mt-0.5">
          Here&apos;s what&apos;s happening in your church today.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-4 flex items-center gap-4"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon size={20} color={color} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Latest announcement card */}
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Latest Announcement
        </h3>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : recentAnnouncement ? (
          <div>
            <h4 className="font-semibold text-foreground">{recentAnnouncement.title}</h4>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {recentAnnouncement.content}
            </p>
            <Link
              href="/announcements"
              className="text-sm mt-2 inline-block"
              style={{ color: primary }}
            >
              View all announcements →
            </Link>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No announcements yet.</p>
        )}
      </div>
    </AppShell>
  );
}