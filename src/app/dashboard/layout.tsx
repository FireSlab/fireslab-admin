import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Flame,
  LayoutDashboard,
  Package,
  Briefcase,
  Layers,
  Tags,
  Inbox,
  Settings,
  ShieldCheck,
  Server,
  Presentation,
  BarChart3,
  Award,
} from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Projects', href: '/dashboard/projects', icon: Briefcase },
  { name: 'Solutions', href: '/dashboard/solutions', icon: Flame },
  { name: 'Categories', href: '/dashboard/categories', icon: Tags },
  { name: 'Applications', href: '/dashboard/applications', icon: Layers },
  { name: 'Hero Slides', href: '/dashboard/hero-slides', icon: Presentation },
  { name: 'Company Stats', href: '/dashboard/company-stats', icon: BarChart3 },
  { name: 'Certifications', href: '/dashboard/certifications', icon: Award },
  { name: 'Leads & Quotes', href: '/dashboard/leads', icon: Inbox },
  { name: 'Site Settings', href: '/dashboard/settings', icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('fireslab_admin_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let user = { name: 'Admin', email: 'admin@fireslab.com', role: 'superadmin' };

  try {
    const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      redirect('/login');
    }

    const data = await res.json();
    if (data.user) {
      user = data.user;
    } else {
      redirect('/login');
    }
  } catch {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#0a0d0c] text-neutral-100 flex selection:bg-[#2d6a35] selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f1412] border-r border-neutral-800/80 flex flex-col shrink-0 fixed inset-y-0 left-0 z-30">
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-800/80">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            {/* Real FireSlab logo - transparent PNG, no white box */}
            <img
              src="/logo-fireslab.png"
              alt="FireSlab"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#e07b2a]/15 text-[#e07b2a] border border-[#e07b2a]/30">
            CMS
          </span>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Content Management
          </div>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition group"
              >
                <Icon className="w-4 h-4 text-neutral-400 group-hover:text-[#e07b2a] transition" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* System & Backend Status Pill */}
        <div className="p-3 border-t border-neutral-800/80">
          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                Backend API
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                Port 5000
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2d6a35]" />
                Auth Token
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                httpOnly
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-64 min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-[#0f1412]/80 backdrop-blur border-b border-neutral-800/80 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-neutral-200">
              Admin Console
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* User details */}
            <div className="flex items-center gap-3 pr-3 border-r border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-[#2d6a35]/30 border border-[#2d6a35]/50 flex items-center justify-center text-xs font-semibold text-emerald-300">
                {user.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium text-white">{user.name}</div>
                <div className="text-[10px] text-neutral-400">{user.email}</div>
              </div>
            </div>

            {/* Logout Action */}
            <LogoutButton />
          </div>
        </header>

        {/* View Body */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
