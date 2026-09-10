'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-800/40 transition cursor-pointer disabled:opacity-50"
      title="Sign Out"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}
