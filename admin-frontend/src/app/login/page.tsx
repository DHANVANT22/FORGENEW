'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  // Real-time Email Validation
  const emailValid = useMemo(() => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const isFormValid = useMemo(() => {
    return emailValid && password.length >= 4;
  }, [emailValid, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTouched({ email: true, password: true });

    if (!emailValid) {
      setError('Please enter a valid administrator email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('adminToken', data.token);
        if (data.user && data.user.name) {
          localStorage.setItem('adminName', data.user.name);
        }
        window.location.href = '/';
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Invalid administrator credentials');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAdmin = () => {
    localStorage.setItem('adminToken', 'ADMIN_DEMO_TOKEN');
    localStorage.setItem('adminName', 'Super Admin');
    window.location.href = '/';
  };

  return (
    <main className="min-h-screen bg-[#040608] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-[#5CA8C9] selection:text-black">
      {/* Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#5CA8C9]/20 via-[#82C4DE]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div 
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(92, 168, 201, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(92, 168, 201, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px'
        }}
      />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block group mb-1">
            <Image
              src="/logo/haizo-lockup.png"
              alt="Haizo Workspace"
              width={180}
              height={132}
              priority
              className="h-16 w-auto object-contain mx-auto drop-shadow-[0_0_25px_rgba(92,168,201,0.35)] group-hover:scale-105 transition-transform"
            />
          </Link>
          <div className="block">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#82C4DE]">
                HAIZO WORKSPACE OPS
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-display font-black tracking-tight text-white">
            Administrator Gateway
          </h1>
          <p className="text-xs text-neutral-400 font-sans leading-relaxed max-w-sm mx-auto">
            Internal operations terminal for project managers, lead engineers, and telemetry control.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-[#080B10]/90 border border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(92,168,201,0.08)] backdrop-blur-2xl space-y-5">
          {error && (
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-3 font-sans shadow-lg">
              <span className="material-symbols-outlined text-red-400 text-base shrink-0">warning</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 font-mono">
                  Admin Email
                </label>
                {touched.email && email && (
                  <span className={`text-[10px] font-mono font-semibold flex items-center gap-1 ${emailValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <span className="material-symbols-outlined text-[13px]">{emailValid ? 'check_circle' : 'cancel'}</span>
                    <span>{emailValid ? 'Valid Format' : 'Invalid Email'}</span>
                  </span>
                )}
              </div>
              <input 
                type="email" 
                required
                className={`neu-input w-full px-4 py-3 text-xs font-sans placeholder-neutral-600 transition-all ${
                  touched.email && email && !emailValid ? 'border-rose-500/50 bg-rose-950/10' : emailValid ? 'border-emerald-500/40' : ''
                }`}
                placeholder="admin@haizo.dev"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
                disabled={loading}
              />
              {touched.email && email && !emailValid && (
                <span className="text-[11px] text-rose-400 font-mono mt-1 block">Enter a valid email address</span>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5 font-mono">
                Password
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  className="neu-input w-full px-4 py-3 pr-12 text-xs font-sans placeholder-neutral-600"
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs font-mono px-1 py-0.5 rounded"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || (touched.email && !isFormValid)}
              className="neu-button-primary mt-3 w-full py-3.5 px-6 font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-6 border-t border-white/[0.08] text-center">
            <button
              type="button"
              onClick={handleQuickDemoAdmin}
              className="text-[11px] text-[#82C4DE] hover:underline font-mono"
            >
              ⚡ Instant Demo Ops Session (Bypass Login)
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <a href="http://localhost:3000" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5 font-sans">
            <span className="material-symbols-outlined text-sm">west</span>
            <span>Return to Client Portal</span>
          </a>
        </div>
      </div>
    </main>
  );
}

