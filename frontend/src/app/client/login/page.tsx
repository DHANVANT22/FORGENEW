'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ClientLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/client-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }
      
      // Redirect to estimator as the primary landing page
      window.location.href = '/estimator';
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Client Portal</h1>
          <p className="text-muted">Sign in to view your project Kanban, milestones, and chat with the team.</p>
        </div>

        <Card className="p-8">
          {error && <div className="mb-4 p-3 rounded bg-danger/10 text-danger border border-danger/20 text-sm">{error}</div>}
          <form className="flex flex-col gap-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium mb-2 text-on-surface">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surface-container-lowest border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="client@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-on-surface">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surface-container-lowest border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" size="lg" className="mt-2 w-full">Sign In</Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
