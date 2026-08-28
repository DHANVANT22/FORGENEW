'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

export default function ClientLogin() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  // Real-time Email Validation
  const emailValid = useMemo(() => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  // Real-time Password Strength Meter
  const passwordCriteria = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasDigit: /\d/.test(password),
      hasSpecial: /[^a-zA-Z0-9]/.test(password),
    };
  }, [password]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.minLength) score += 1;
    if (passwordCriteria.hasLetter) score += 1;
    if (passwordCriteria.hasDigit) score += 1;
    if (passwordCriteria.hasSpecial) score += 1;
    return score;
  }, [passwordCriteria]);

  const passwordStrengthLabel = useMemo(() => {
    if (!password) return '';
    if (passwordScore <= 2) return 'Weak';
    if (passwordScore === 3) return 'Medium';
    return 'Strong';
  }, [password, passwordScore]);

  const passwordStrengthColor = useMemo(() => {
    if (passwordScore <= 2) return 'bg-rose-500 text-rose-400 border-rose-500/30';
    if (passwordScore === 3) return 'bg-amber-400 text-amber-300 border-amber-400/30';
    return 'bg-emerald-400 text-emerald-300 border-emerald-400/30';
  }, [passwordScore]);

  const isFormValid = useMemo(() => {
    if (mode === 'signup' && !name.trim()) return false;
    if (!emailValid) return false;
    if (!password || password.length < 8) return false;
    return true;
  }, [mode, name, emailValid, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTouched({ name: true, email: true, password: true });

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!emailValid) {
      setError('Please enter a valid work email address (e.g. user@company.com).');
      return;
    }

    if (!password || password.length < 8) {
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
    setTouched({ name: true, email: true, password: true });
  };

  return (
    <main className="min-h-screen bg-[#040608] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-cyan-400 selection:text-slate-950">
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-br from-cyan-500/15 via-sky-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div 
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header Branding */}
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
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 hover:border-cyan-400/40 transition-all backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
              HAIZO WORKSPACE ENTERPRISE GATEWAY
            </span>
          </div>
          <h1 className="text-display-2xl font-bold text-slate-100 tracking-tight">
            {mode === 'signup' ? 'Create Client Workspace' : 'Client Executive Sign In'}
          </h1>
          <p className="text-ui-sm text-slate-400 font-sans leading-relaxed max-w-sm mx-auto">
            Secure client workspace for real-time delivery telemetry, milestone sign-offs, and live engineering discussion.
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex bg-[#080B10] border border-white/10 p-1.5 rounded-2xl shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 font-mono ${
              mode === 'login' 
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.4)]' 
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 font-mono ${
              mode === 'signup' 
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.4)]' 
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Main Auth Form Container */}
        <div className="p-8 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(56,189,248,0.06)] backdrop-blur-2xl space-y-5">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3 font-sans shadow-lg">
              <span className="material-symbols-outlined text-rose-400 text-base shrink-0">warning</span>
              <span>{error}</span>
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, name: true }))}
                    className={`neu-input w-full px-4 py-3 text-xs font-sans placeholder:text-slate-600 transition-all ${
                      touched.name && !name.trim() ? 'border-rose-500/50 bg-rose-950/10' : ''
                    }`}
                    placeholder="e.g. Sarah Jenkins"
                    disabled={loading}
                    required
                  />
                  {touched.name && !name.trim() && (
                    <span className="text-[11px] text-rose-400 font-mono mt-1 block">Full name is required</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Company / Organization <span className="text-slate-500 text-[10px] lowercase font-normal">(optional)</span>
                  </label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="neu-input w-full px-4 py-3 text-xs font-sans placeholder:text-slate-600"
                    placeholder="e.g. Acme Health Corp"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {/* Email Field with Real-Time Validation */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Work Email
                </label>
                {touched.email && email && (
                  <span className={`text-[10px] font-mono font-semibold flex items-center gap-1 ${emailValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <span className="material-symbols-outlined text-[13px]">{emailValid ? 'check_circle' : 'cancel'}</span>
                    <span>{emailValid ? 'Valid Format' : 'Invalid Email'}</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, email: true }))}
                  className={`neu-input w-full px-4 py-3 text-xs font-sans placeholder:text-slate-600 transition-all ${
                    touched.email && email && !emailValid ? 'border-rose-500/50 bg-rose-950/10' : emailValid ? 'border-emerald-500/40' : ''
                  }`}
                  placeholder="client@company.com"
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>
              {touched.email && email && !emailValid && (
                <span className="text-[11px] text-rose-400 font-mono mt-1 block">Please enter a valid email address</span>
              )}
            </div>
            
            {/* Password Field with Password Strength Meter */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                {password && (
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${passwordStrengthColor}`}>
                    {passwordStrengthLabel}
                  </span>
                )}
              </div>

              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  className={`neu-input w-full px-4 py-3 pr-12 text-xs font-sans placeholder:text-slate-600 transition-all ${
                    touched.password && password && password.length < 8 ? 'border-rose-500/50 bg-rose-950/10' : ''
                  }`}
                  placeholder="Minimum 8 characters"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-mono px-1 py-0.5 rounded"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Dynamic Password Strength Progress Bar */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        passwordScore <= 2 ? 'bg-rose-500 w-1/3' : passwordScore === 3 ? 'bg-amber-400 w-2/3' : 'bg-emerald-400 w-full'
                      }`} 
                    />
                  </div>

                  {/* Requirements Indicators */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[10px] font-mono text-slate-400">
                    <span className={passwordCriteria.minLength ? 'text-emerald-400 font-bold' : ''}>
                      {passwordCriteria.minLength ? '✓' : '•'} 8+ chars
                    </span>
                    <span className={passwordCriteria.hasLetter ? 'text-emerald-400 font-bold' : ''}>
                      {passwordCriteria.hasLetter ? '✓' : '•'} Letters
                    </span>
                    <span className={passwordCriteria.hasDigit ? 'text-emerald-400 font-bold' : ''}>
                      {passwordCriteria.hasDigit ? '✓' : '•'} Numbers
                    </span>
                    <span className={passwordCriteria.hasSpecial ? 'text-emerald-400 font-bold' : ''}>
                      {passwordCriteria.hasSpecial ? '✓' : '•'} Symbols
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading || (touched.email && !isFormValid)}
              className="neu-button-primary mt-2 w-full py-3.5 px-6 font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
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

          {/* Quick Demo Fill Helper */}
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="text-xs text-cyan-400 hover:underline font-mono"
            >
              ⚡ Fill Demo Client Credentials
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
              <span className="material-symbols-outlined text-sm">west</span>
              <span>Return to Public Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

