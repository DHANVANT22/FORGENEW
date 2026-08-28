'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="bg-card shadow-card rounded-3xl p-8 max-w-md w-full border border-border text-center">
        <div className="w-16 h-16 rounded-full bg-danger-container/30 text-brand-primary flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-text-strong mb-3">System Error</h2>
        <p className="text-text-muted mb-8 text-sm">An unexpected disruption occurred in the Haizo Workspace system. Our diagnostics have logged the event.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/" className="btn-secondary px-4 py-2 text-sm flex items-center justify-center">Return Home</a>
          <button onClick={() => reset()} className="btn-primary px-4 py-2 text-sm font-medium">Try Again</button>
        </div>
      </div>
    </div>
  );
}
