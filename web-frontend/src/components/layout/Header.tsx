'use client';

import { useAuthStore } from '@/lib/stores/auth.store';

export default function Header() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-800">
        {/* Page title could be driven by route — kept simple for now */}
        Welcome
      </h1>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <span className="text-sm text-gray-500">
              {user.firstName} {user.lastName}
            </span>
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
              {user.firstName[0]}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
