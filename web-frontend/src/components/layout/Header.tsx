'use client';

import { useAuthStore } from '@/lib/stores/auth.store';

export default function Header() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="h-16 bg-background border-b flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-foreground">
        {/* Page title could be driven by route — kept simple for now */}
        Welcome
      </h1>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <span className="text-sm text-foreground">
              {user.firstName} {user.lastName}
            </span>
            <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-sm font-bold text-foreground">
              {user.firstName[0]}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
