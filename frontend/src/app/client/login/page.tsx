'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ClientLogin() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const endpoint = mode === 'signup' ? '/api/v1/client-auth/signup' : '/api/v1/client-auth/login';
      const payload = mode === 'signup'
        ? { name: name.trim(), companyName: companyName.trim() || undefined, email: email.trim(), password }
        : { email: email.trim(), password };

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Authentication failed. Please check your details.');
      }

      const data = await res.json();
      if (data.token) {
        localStorage.setItem('clientToken', data.token);
      }
      if (data.account) {
        localStorage.setItem('clientAccount', JSON.stringify(data.account));
      }
      
      // Redirect to client portal
      window.location.href = '/client/dashboard';
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('client@example.com');
    setPassword('Client123!');
    setMode('login');
    setError('');
  };

  return (
    <main className="min-h-screen bg-[#040608] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-[#5CA8C9] selection:text-black">
      {/* Ambient Radial Mesh & Glowing Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#5CA8C9]/15 via-[#82C4DE]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
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

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] hover:border-[#5CA8C9]/40 transition-all">
            <span className="w-2 h-2 rounded-full bg-[#5CA8C9] animate-ping" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#82C4DE]">
              FORGE 2.0 ENTERPRISE GATEWAY
            </span>
          </Link>
          <h1 className="text-3xl font-display font-black tracking-tight text-white mb-2">
            {mode === 'signup' ? 'Create Client Workspace' : 'Client Executive Sign In'}
          </h1>
          <p className="text-xs text-neutral-400 font-sans leading-relaxed">
            Secure client workspace for real-time delivery telemetry, milestone sign-offs, and live engineering discussion.
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex bg-[#0A0D12] border border-white/[0.08] p-1 rounded-2xl mb-6 shadow-xl">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all font-mono ${
              mode === 'login' 
                ? 'bg-[#5CA8C9] text-black shadow-[0_0_15px_rgba(92,168,201,0.4)]' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all font-mono ${
              mode === 'signup' 
                ? 'bg-[#5CA8C9] text-black shadow-[0_0_15px_rgba(92,168,201,0.4)]' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Auth Form Card */}
        <div className="p-8 rounded-3xl bg-[#080B10]/90 border border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(92,168,201,0.06)] backdrop-blur-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-3 font-sans">
              <span className="material-symbols-outlined text-red-400 text-base">warning</span>
              <span>{error}</span>
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5 font-mono">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="neu-input w-full px-4 py-3 text-xs font-sans placeholder-neutral-600"
                    placeholder="e.g. Sarah Jenkins"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5 font-mono">
                    Company / Organization <span className="text-neutral-500 text-[10px] lowercase">(optional)</span>
                  </label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="neu-input w-full px-4 py-3 text-xs font-sans placeholder-neutral-600"
                    placeholder="e.g. Acme Health Corp"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5 font-mono">
                Work Email
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neu-input w-full px-4 py-3 text-xs font-sans placeholder-neutral-600"
                placeholder="client@company.com"
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5 font-mono">
                Password
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neu-input w-full px-4 py-3 pr-10 text-xs font-sans placeholder-neutral-600"
                  placeholder="Minimum 8 characters"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 w-full py-3.5 px-6 rounded-2xl bg-[#5CA8C9] hover:bg-[#82C4DE] text-black font-extrabold text-xs uppercase tracking-widest transition-all duration-200 shadow-[0_0_20px_rgba(92,168,201,0.4)] hover:shadow-[0_0_30px_rgba(92,168,201,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-mono"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Workspace & Launch' : 'Sign In to Client Portal'}</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Autofill Helper */}
          <div className="mt-6 pt-6 border-t border-white/[0.08] text-center">
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="text-[11px] text-[#82C4DE] hover:underline font-mono"
            >
              ⚡ Fill Demo Client Credentials
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5 font-sans">
            <span className="material-symbols-outlined text-sm">west</span>
            <span>Return to Public Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
