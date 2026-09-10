'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flame, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';

  const [email, setEmail] = useState('admin@fireslab.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // Successful login -> Redirect to dashboard
      router.push(from);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Brand Card */}
      <div className="bg-[#111614]/90 border border-neutral-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4 flex items-center justify-center">
            {/* Real FireSlab logo - transparent PNG, no white box */}
            <img
              src="/logo-fireslab.png"
              alt="FireSlab"
              className="h-14 w-auto object-contain drop-shadow-[0_4px_16px_rgba(45,106,53,0.35)]"
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#e07b2a]/15 text-[#e07b2a] border border-[#e07b2a]/30">
              CMS Administration Console
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Sign in to manage industrial heating products &amp; projects
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-950/40 border border-red-800/50 flex items-start gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fireslab.com"
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35] focus:ring-1 focus:ring-[#2d6a35] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35] focus:ring-1 focus:ring-[#2d6a35] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#2d6a35] to-[#24572b] hover:from-[#357c3e] hover:to-[#2d6a35] text-white font-medium rounded-lg text-sm shadow-lg shadow-[#2d6a35]/30 flex items-center justify-center gap-2 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer note */}
        <div className="mt-8 pt-6 border-t border-neutral-800/80 text-center">
          <p className="text-xs text-neutral-500">
            Secured with HTTP-Only Sessions &amp; JWT Verification
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0d0c] text-neutral-100 flex items-center justify-center p-4 selection:bg-[#2d6a35] selection:text-white">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#2d6a35]/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[300px] bg-[#e07b2a]/10 blur-[140px] rounded-full" />
      </div>

      <Suspense fallback={<div className="text-neutral-500 text-sm">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
