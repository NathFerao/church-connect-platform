'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/lib/stores/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { UserPlus, Mail, Eye, EyeOff, Copy, Check, ChevronDown } from 'lucide-react';

interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLES = ['MEMBER', 'LEADER', 'PASTOR', 'CHURCH_ADMIN'] as const;

export default function ManageMembersPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignEmail, setAssignEmail] = useState('');
  const [assignRole, setAssignRole] = useState('MEMBER');
  const [assigning, setAssigning] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Inline role editing state
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'MEMBER',
  });

  const isAdmin = user?.role === 'CHURCH_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/dashboard');
      return;
    }
    fetchMembers();
  }, [isAdmin, router]);

  // Close role dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setEditingRoleId(null);
    if (editingRoleId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [editingRoleId]);

  const fetchMembers = async () => {
    try {
      const { data } = await api.get('/users/church-members');
      setMembers(data.data?.data || []);
    } catch (error) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((f) => ({ ...f, password: pass }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/users/create-member', form);
      toast.success('Member account created! Share the credentials with them.');
      setShowForm(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'MEMBER' });
      fetchMembers();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to create member');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEmail(type);
      toast.success(`${type} copied to clipboard`);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/users/${id}/status`, { isActive: !currentStatus });
      toast.success(currentStatus ? 'Member deactivated' : 'Member activated');
      fetchMembers();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update status');
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    setUpdatingRoleId(id);
    setEditingRoleId(null);
    try {
      await api.patch(`/users/${id}/role`, { role: newRole });
      toast.success('Role updated successfully');
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, role: newRole } : m))
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update role');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleAssignExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssigning(true);
    try {
      await api.post('/users/assign-to-church', { email: assignEmail, role: assignRole });
      toast.success('User assigned to church successfully!');
      setShowAssignForm(false);
      setAssignEmail('');
      setAssignRole('MEMBER');
      fetchMembers();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to assign user');
    } finally {
      setAssigning(false);
    }
  };

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case 'CHURCH_ADMIN': return 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300';
      case 'PASTOR':       return 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300';
      case 'LEADER':       return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300';
      default:             return 'bg-muted text-muted-foreground';
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground";
  const labelCls = "block text-sm font-medium text-foreground mb-1";

  if (!isAdmin) return null;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create accounts for church members
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowForm(!showForm); setShowAssignForm(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <UserPlus size={18} />
            {showForm ? 'Cancel' : 'Create New Member'}
          </button>
          <button
            onClick={() => { setShowAssignForm(!showAssignForm); setShowForm(false); }}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            {showAssignForm ? 'Cancel' : 'Assign Existing User'}
          </button>
        </div>
      </div>

      {/* Assign Existing User Form */}
      {showAssignForm && (
        <form
          onSubmit={handleAssignExisting}
          className="bg-card text-card-foreground rounded-xl border border-border p-6 mb-6"
        >
          <h3 className="font-semibold text-foreground mb-2">Assign Existing User to Your Church</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If someone has already registered but hasn't been assigned to a church, enter their email to add them.
          </p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className={labelCls}>Email Address *</label>
              <input
                type="email"
                required
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                className={inputCls}
                placeholder="user@example.com"
              />
            </div>
            <div className="w-40">
              <label className={labelCls}>Role</label>
              <select
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value)}
                className={inputCls}
              >
                <option value="MEMBER">Member</option>
                <option value="LEADER">Leader</option>
                <option value="PASTOR">Pastor</option>
                <option value="CHURCH_ADMIN">Church Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={assigning}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
            >
              {assigning ? 'Assigning...' : 'Assign User'}
            </button>
          </div>
        </form>
      )}

      {/* Create New Member Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card text-card-foreground rounded-xl border border-border p-6 mb-6 space-y-4"
        >
          <h3 className="font-semibold text-foreground">Create New Member Account</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First Name *</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Last Name *</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className={inputCls}
            >
              <option value="MEMBER">Member</option>
              <option value="LEADER">Leader</option>
              <option value="PASTOR">Pastor</option>
              <option value="CHURCH_ADMIN">Church Admin</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Password *</label>
              <button
                type="button"
                onClick={generatePassword}
                className="text-xs text-primary hover:underline"
              >
                Generate Strong Password
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={inputCls}
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Share these credentials with the member. They can change their password in settings.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {creating ? 'Creating...' : 'Create Member Account'}
            </button>
          </div>
        </form>
      )}

      {/* Members List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : members.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <UserPlus size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No members yet</h3>
            <p className="text-muted-foreground mb-4">
              Create member accounts to get your community started
            </p>
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="bg-card text-card-foreground rounded-xl border border-border p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">
                    {member.firstName[0]}{member.lastName[0]}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {member.firstName} {member.lastName}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <button
                        onClick={() => copyToClipboard(member.email, 'Email')}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title="Copy email"
                      >
                        {copiedEmail === 'Email' ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} className="text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Inline Role Editor */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingRoleId(editingRoleId === member.id ? null : member.id)}
                    disabled={updatingRoleId === member.id}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors ${roleBadgeColor(member.role)} hover:opacity-80 disabled:opacity-50`}
                    title="Click to change role"
                  >
                    {updatingRoleId === member.id ? (
                      <span>Updating...</span>
                    ) : (
                      <>
                        <span>{member.role}</span>
                        <ChevronDown size={12} />
                      </>
                    )}
                  </button>

                  {editingRoleId === member.id && (
                    <div className="absolute right-0 top-full mt-1 z-10 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                      {ROLES.map((role) => (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(member.id, role)}
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                            member.role === role ? 'font-semibold text-primary' : 'text-foreground'
                          }`}
                        >
                          {role}
                          {member.role === role && <span className="ml-1">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active/Inactive Toggle */}
                <button
                  onClick={() => toggleStatus(member.id, member.isActive)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    member.isActive
                      ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900'
                      : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900'
                  }`}
                >
                  {member.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}