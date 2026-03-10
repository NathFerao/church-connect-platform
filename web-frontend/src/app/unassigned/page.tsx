'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Users, Mail, LogOut } from 'lucide-react';

export default function UnassignedPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    // If user has a church, redirect to dashboard
    if (user?.churchId) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-card text-card-foreground rounded-2xl shadow-xl p-8 border border-border">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <Users size={40} className="text-muted-foreground" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Welcome, {user.firstName}!
          </h1>
          
          <p className="text-lg text-muted-foreground mb-6">
            Your account has been created successfully.
          </p>

          <div className="bg-muted rounded-lg p-6 mb-6 w-full">
            <h2 className="font-semibold text-foreground mb-3">
              🏛️ Not Assigned to a Church Yet
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              To access Church Connect features, you need to be added to a church by your church administrator.
            </p>
            
            <div className="bg-card rounded-lg p-4 border border-border">
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Mail size={18} />
                Next Steps:
              </h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Contact your church administrator</li>
                <li>Provide them with your email: <strong className="text-foreground">{user.email}</strong></li>
                <li>Wait for them to add you to your church</li>
                <li>Log back in to access all features</li>
              </ol>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Once added, you'll be able to view announcements, prayer requests, events, and connect with your church community.
          </p>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}