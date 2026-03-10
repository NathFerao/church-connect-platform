'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore, useThemeStore } from '@/lib/stores';
import api from '@/lib/api';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'church';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { refresh: refreshTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [churchForm, setChurchForm] = useState({
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

  const canEditChurch = user?.role === 'CHURCH_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        if (canEditChurch) {
          const { data } = await api.get('/churches/settings');
          setChurchForm(data.data);
        }
      } catch (error) {
        toast.error('Failed to load church settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [canEditChurch]);

  const changeProfile = (e: ChangeEvent<HTMLInputElement>) =>
    setProfileForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const changeChurch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setChurchForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await api.put('/users/profile', {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        ...(profileForm.newPassword && {
          currentPassword: profileForm.currentPassword,
          newPassword: profileForm.newPassword,
        }),
      });
      toast.success('Profile updated!');
      // Update local user state
      useAuthStore.setState({
        user: { ...user!, firstName: profileForm.firstName, lastName: profileForm.lastName, email: profileForm.email },
      });
      setProfileForm((f) => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const { data } = await api.post('/upload/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setChurchForm((f) => ({ ...f, logoUrl: data.data.url }));
      toast.success('Logo uploaded!');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleChurchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/churches/settings', churchForm);
      toast.success('Church settings saved!');
      const { data } = await api.get('/auth/profile');
      const updatedChurch = data.data.church;
      useAuthStore.setState({
        church: {
          id: updatedChurch.id,
          name: updatedChurch.name,
          logoUrl: updatedChurch.logoUrl,
          primaryColor: updatedChurch.primaryColor,
          secondaryColor: updatedChurch.secondaryColor,
        }
      });
      refreshTheme();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground";
  const labelCls = "block text-sm font-medium text-foreground mb-1";
  const cardCls  = "bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6";

  if (loading && canEditChurch) {
    return <AppShell><p className="text-muted-foreground">Loading...</p></AppShell>;
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Profile
          </button>
          {canEditChurch && (
            <button
              onClick={() => setActiveTab('church')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'church'
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Church Settings
            </button>
          )}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className={cardCls}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>First Name</label>
                    <input name="firstName" value={profileForm.firstName} onChange={changeProfile} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name</label>
                    <input name="lastName" value={profileForm.lastName} onChange={changeProfile} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input name="email" type="email" value={profileForm.email} onChange={changeProfile} className={inputCls} />
                </div>
              </div>
            </div>

            <div className={cardCls}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Change Password</h2>
              <p className="text-sm text-muted-foreground mb-4">Leave blank to keep your current password</p>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Current Password</label>
                  <input name="currentPassword" type="password" value={profileForm.currentPassword} onChange={changeProfile} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>New Password</label>
                  <input name="newPassword" type="password" minLength={8} value={profileForm.newPassword} onChange={changeProfile} className={inputCls} placeholder="Min 8 characters" />
                </div>
                <div>
                  <label className={labelCls}>Confirm New Password</label>
                  <input name="confirmPassword" type="password" value={profileForm.confirmPassword} onChange={changeProfile} className={inputCls} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium transition-opacity"
              style={{ backgroundColor: '#4F46E5' }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}

        {/* Church Settings Tab */}
        {activeTab === 'church' && canEditChurch && (
          <form onSubmit={handleChurchSubmit} className="space-y-6">
            {/* (Your existing church settings form from before - I'll include it in the next message) */}
            <div className={cardCls}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Branding</h2>
              <div className="mb-6">
                <label className={labelCls}>Church Logo</label>
                <div className="flex items-center gap-4">
                  {churchForm.logoUrl && (
                    <img
                      src={`http://localhost:5000${churchForm.logoUrl}`}
                      alt="Church logo"
                      className="w-20 h-20 object-contain border border-border rounded"
                    />
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      className="text-sm text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80"
                    />
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Primary Color</label>
                  <div className="flex gap-2">
                    <input type="color" name="primaryColor" value={churchForm.primaryColor} onChange={changeChurch} className="w-12 h-10 rounded border border-border cursor-pointer bg-background" />
                    <input type="text" name="primaryColor" value={churchForm.primaryColor} onChange={changeChurch} placeholder="#4F46E5" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Secondary Color</label>
                  <div className="flex gap-2">
                    <input type="color" name="secondaryColor" value={churchForm.secondaryColor} onChange={changeChurch} className="w-12 h-10 rounded border border-border cursor-pointer bg-background" />
                    <input type="text" name="secondaryColor" value={churchForm.secondaryColor} onChange={changeChurch} placeholder="#10B981" className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            {/* Church Info section (all your existing fields) */}
            <div className={cardCls}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Church Information</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Church Name</label>
                  <input name="name" value={churchForm.name} onChange={changeChurch} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea name="description" value={churchForm.description || ''} onChange={changeChurch} rows={3} className={`${inputCls} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Email</label>
                    <input name="email" type="email" value={churchForm.email || ''} onChange={changeChurch} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input name="phone" value={churchForm.phone || ''} onChange={changeChurch} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Website</label>
                  <input name="website" type="url" value={churchForm.website || ''} onChange={changeChurch} className={inputCls} placeholder="https://yourchurch.org" />
                </div>
                <div>
                  <label className={labelCls}>Address</label>
                  <input name="address" value={churchForm.address || ''} onChange={changeChurch} className={inputCls} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>City</label>
                    <input name="city" value={churchForm.city || ''} onChange={changeChurch} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>State</label>
                    <input name="state" value={churchForm.state || ''} onChange={changeChurch} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>ZIP</label>
                    <input name="zipCode" value={churchForm.zipCode || ''} onChange={changeChurch} className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full py-3 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium transition-opacity"
              style={{ backgroundColor: churchForm.primaryColor || '#4F46E5' }}
            >
              {saving ? 'Saving...' : 'Save Church Settings'}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}