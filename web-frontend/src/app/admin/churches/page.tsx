'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/lib/stores/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Building2, Users, Plus, Pencil, Trash2 } from 'lucide-react';

interface Church {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  email: string;
  createdAt: string;
  _count: {
    users: number;
  };
}

export default function ChurchesPage() {
  const router = useRouter();
  const userRole = useAuthStore((s) => s.user?.role);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (userRole !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }
    fetchChurches();
  }, [userRole, router]);

  const fetchChurches = async () => {
    try {
      const { data } = await api.get('/churches');
      setChurches(data.data || []);
    } catch (error) {
      toast.error('Failed to load churches');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will permanently delete all associated data including users, announcements, and prayer requests.`)) {
      return;
    }

    setDeleting(id);
    try {
      await api.delete(`/churches/${id}`);
      toast.success('Church deleted successfully');
      fetchChurches();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete church');
    } finally {
      setDeleting(null);
    }
  };

  if (userRole !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Churches</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage churches across the platform</p>
        </div>
        <Link
          href="/admin/churches/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={18} />
          Add Church
        </Link>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : churches.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Building2 size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No churches yet</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first church</p>
          <Link
            href="/admin/churches/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
          >
            <Plus size={18} />
            Create Church
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {churches.map((church) => (
            <div
              key={church.id}
              className="bg-card text-card-foreground rounded-xl border border-border p-5 flex items-start justify-between"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 size={24} className="text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">{church.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {church.city && church.state && (
                      <span>{church.city}, {church.state}</span>
                    )}
                    {church.email && (
                      <span>{church.email}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {church._count.users} members
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {new Date(church.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/admin/churches/${church.id}/edit`)}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(church.id, church.name)}
                  disabled={deleting === church.id}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}