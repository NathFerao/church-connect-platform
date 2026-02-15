
'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore, useThemeStore } from '@/lib/stores';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { refresh: refreshTheme } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    logoUrl: '',
  });

  // WHY? Only church admins can access this page
  const canEdit = user?.role === 'CHURCH_ADMIN' || user?.role === 'SUPER_ADMIN';

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/churches/settings');
        setForm(data.data);
      } catch (error) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    if (canEdit) {
      fetchSettings();
    }
  }, [canEdit]);

  const change = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Handle logo upload
  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      // WHY FormData? File uploads require multipart/form-data, not JSON
      const { data } = await api.post('/upload/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update form with new logo URL
      const newLogoUrl = data.data.url;
      setForm((f) => ({ ...f, logoUrl: newLogoUrl }));
      toast.success('Logo uploaded!');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Save settings
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put('/churches/settings', form);
      toast.success('Settings saved!');
      
      // WHY? Theme store needs to re-read colors/logo from the updated church data
      // We need to refetch the user's profile (which includes church data)
      const { data } = await api.get('/auth/profile');
      const updatedChurch = data.data.church;
      
      // Update auth store with new church data
      useAuthStore.setState({ 
        church: {
          id: updatedChurch.id,
          name: updatedChurch.name,
          logoUrl: updatedChurch.logoUrl,
          primaryColor: updatedChurch.primaryColor,
          secondaryColor: updatedChurch.secondaryColor,
        }
      });
      
      // Refresh theme (applies new colors immediately)
      refreshTheme();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <p className="text-gray-500">Only church administrators can access settings</p>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return <AppShell><p>Loading...</p></AppShell>;
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Church Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Branding Section */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Branding</h2>
            
            {/* Logo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Church Logo</label>
              <div className="flex items-center gap-4">
                {form.logoUrl && (
                  <img
                    src={`http://localhost:5000${form.logoUrl}`}
                    alt="Church logo"
                    className="w-20 h-20 object-contain border rounded"
                  />
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="primaryColor"
                    value={form.primaryColor}
                    onChange={change}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    name="primaryColor"
                    value={form.primaryColor}
                    onChange={change}
                    placeholder="#4F46E5"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Secondary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={form.secondaryColor}
                    onChange={change}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    name="secondaryColor"
                    value={form.secondaryColor}
                    onChange={change}
                    placeholder="#10B981"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Church Info Section */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Church Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Church Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={change}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description || ''}
                  onChange={change}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email || ''}
                    onChange={change}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    name="phone"
                    value={form.phone || ''}
                    onChange={change}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input
                  name="website"
                  type="url"
                  value={form.website || ''}
                  onChange={change}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://yourchurch.org"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  name="address"
                  value={form.address || ''}
                  onChange={change}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    name="city"
                    value={form.city || ''}
                    onChange={change}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    name="state"
                    value={form.state || ''}
                    onChange={change}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP</label>
                  <input
                    name="zipCode"
                    value={form.zipCode || ''}
                    onChange={change}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full py-3 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </AppShell>
  );
}