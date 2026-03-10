'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/lib/stores/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Mail, User, Search } from 'lucide-react';

interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  CHURCH_ADMIN: 'Church Admin',
  PASTOR: 'Pastor',
  LEADER: 'Leader',
  MEMBER: 'Member',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#EF4444',
  CHURCH_ADMIN: '#F59E0B',
  PASTOR: '#8B5CF6',
  LEADER: '#3B82F6',
  MEMBER: '#10B981',
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchTerm, roleFilter, members]);

  const fetchMembers = async () => {
    try {
      const { data } = await api.get('/users/church-members?limit=500');
      setMembers(data.data?.data || []);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = members;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.firstName.toLowerCase().includes(term) ||
          m.lastName.toLowerCase().includes(term) ||
          m.email.toLowerCase().includes(term)
      );
    }

    // Filter by role
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter((m) => m.role === roleFilter);
    }

    setFilteredMembers(filtered);
  };

  const inputCls = "px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground";

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Church Members</h1>
        <p className="text-sm text-muted-foreground">
          {members.length} member{members.length !== 1 ? 's' : ''} in your church
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputCls} pl-10 w-full`}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={`${inputCls} w-full sm:w-48`}
        >
          <option value="ALL">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Members Grid */}
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <User size={48} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {searchTerm || roleFilter !== 'ALL'
              ? 'No members match your filters'
              : 'No members found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-card text-card-foreground rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold">
                    {member.firstName[0]}
                    {member.lastName[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {member.firstName} {member.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                    <Mail size={12} />
                    {member.email}
                  </p>
                  {member.phone && (
                    <p className="text-xs text-muted-foreground mt-1">{member.phone}</p>
                  )}
                  <span
                    className="inline-block text-xs font-medium px-2 py-0.5 rounded-full text-white mt-2"
                    style={{ backgroundColor: ROLE_COLORS[member.role] || '#6B7280' }}
                  >
                    {ROLE_LABELS[member.role] || member.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}