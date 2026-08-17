import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="bg-card shadow-card rounded-3xl p-8 max-w-md w-full border border-border text-center">
        <div className="w-16 h-16 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-3xl">explore_off</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-text-strong mb-3">Signal Lost (404)</h2>
        <p className="text-text-muted mb-8 text-sm">The requested sector could not be located within the Forge system. It may have been relocated or purged.</p>
        <Link href="/" className="btn-primary px-6 py-2.5 text-sm font-medium inline-block">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
