'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('adminToken', data.token);
        if (data.user && data.user.name) {
          localStorage.setItem('adminName', data.user.name);
        }
        window.location.href = '/';
      } else {
        const errData = await res.json();
        setError(errData.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during login');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 border-none bg-surface-container-low base-card">
        <h1 className="text-3xl font-display font-bold text-center mb-6">Admin Login</h1>
        <p className="text-muted mb-6">Enter your credentials to access the Forge Dashboard.</p>
        
        {error && <div className="bg-danger/10 text-danger p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full bg-surface-container border border-border p-3 rounded-lg text-foreground focus:outline-none focus:border-primary"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full bg-surface-container border border-border p-3 rounded-lg text-foreground focus:outline-none focus:border-primary"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full mt-4">Sign In</Button>
        </form>
      </Card>
    </div>
  );
}
