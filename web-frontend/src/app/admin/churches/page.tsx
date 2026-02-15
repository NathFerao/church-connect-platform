'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/lib/stores/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Church {
  id: string;
  name: string;
  slug: string;
  email: string;
  city: string;
  state: string;
  _count: { users: number };
  createdAt: string;
}

export default function ChurchesAdminPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);

  // WHY? Only super admins can access this page
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      toast.error('Access denied');
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch all churches
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

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchChurches();
    }
  }, [user]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This will remove ALL data for this church.`)) {
      return;
    }

    try {
      await api.delete(`/churches/${id}`);
      toast.success('Church deleted');
      fetchChurches();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete');
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Church Management</h1>
        <button
          onClick={() => router.push('/admin/churches/create')}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
        >
          + New Church
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : churches.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <p className="text-gray-500">No churches yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {churches.map((church) => (
                <tr key={church.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{church.name}</div>
                      <div className="text-sm text-gray-500">{church.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {church.city && church.state ? `${church.city}, ${church.state}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">{church._count.users}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(church.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => router.push(`/admin/churches/${church.id}`)}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(church.id, church.name)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
