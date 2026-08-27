import React from 'react';
import { notFound } from 'next/navigation';
import { QueryPlanTree } from '@/components/ui/QueryPlanTree';
import { CopyButtonScript } from '@/components/ui/CopyButtonScript';

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  let blog = null;
  let error = null;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const res = await fetch(`${apiUrl}/api/v1/blogs/${resolvedParams.slug}`, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`[Blog 404] Failed to load blog post with slug: ${resolvedParams.slug} (Status: ${res.status})`);
      error = 'Blog post not found.';
    } else {
      blog = await res.json();
    }
  } catch (err) {
    error = 'Failed to load blog.';
  }

  if (error || !blog) {
    return (
      <main className="min-h-screen bg-background py-16 px-6 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-container-lowest via-background to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none"></div>
        <div className="p-10 max-w-md w-full text-center border border-border/50 bg-surface-container/30 backdrop-blur-md rounded-2xl shadow-2xl relative z-10">
          <div className="w-16 h-16 mx-auto bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(187,19,39,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface mb-3">Blog Post Not Found</h1>
          <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
            The blog post you're looking for doesn't exist or has been removed. Check the URL and try again.
          </p>
          <a href="/" className="inline-block bg-primary text-background font-bold px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
            Return to Home
          </a>
        </div>
      </main>
    );
  }

  const getPlanTime = (planWrapper: any) => planWrapper?.Plan?.['Actual Total Time'] || 0;
  
  const beforeTime = blog.queryPlanBefore?.[0] ? getPlanTime(blog.queryPlanBefore[0]) : 0;
  const afterTime = blog.queryPlan?.[0] ? getPlanTime(blog.queryPlan[0]) : 0;
  const speedupMultiplier = beforeTime && afterTime && afterTime > 0 ? (beforeTime / afterTime).toFixed(1) : null;

  return (
    <main className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b border-border pb-8 relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-primary font-mono text-sm uppercase tracking-wider">Engineering Blog</span>
                <span className="text-muted">/</span>
                <span className="text-primary font-mono text-sm uppercase tracking-wider">{new Date(blog.createdAt).toLocaleDateString()}</span>
                {blog.tags && blog.tags.length > 0 && (
                  <>
                    <span className="text-muted">/</span>
                    {blog.tags.map((t: string) => (
                      <span key={t} className="text-[10px] font-mono font-bold px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded uppercase tracking-wider">
                        {t}
                      </span>
                    ))}
                  </>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold font-display text-on-surface">{blog.title}</h1>
            </div>
            
            {speedupMultiplier && (
              <div className="flex flex-col items-center justify-center bg-primary/10 border border-primary/30 p-4 rounded-xl shadow-[0_0_20px_rgba(255,179,175,0.1)]">
                <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider mb-1">Performance Win</span>
                <span className="text-3xl font-display font-bold text-primary">{speedupMultiplier}× faster</span>
              </div>
            )}
          </div>
        </header>

        <article className="prose prose-invert max-w-none text-on-surface-variant leading-relaxed text-lg mb-12" dangerouslySetInnerHTML={{ __html: blog.content }}>
        </article>
        
        <CopyButtonScript />

        {(blog.queryPlanBefore?.length > 0 || blog.queryPlan?.length > 0) && (
          <div className="mb-12 p-6 bg-surface-container rounded-2xl border border-border">
            <h3 className="text-xl font-bold mb-4 font-display">Performance Impact</h3>
            <div className="flex gap-8">
              <div>
                <div className="text-sm text-muted mb-1">Before</div>
                <div className="text-2xl font-mono text-danger">{beforeTime.toFixed(2)}ms</div>
              </div>
              <div>
                <div className="text-sm text-muted mb-1">After</div>
                <div className="text-2xl font-mono text-primary">{afterTime.toFixed(2)}ms</div>
              </div>
              {speedupMultiplier && (
                <div>
                  <div className="text-sm text-muted mb-1">Speedup</div>
                  <div className="text-2xl font-mono text-primary">{speedupMultiplier}× faster</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blog.queryPlanBefore && Array.isArray(blog.queryPlanBefore) && blog.queryPlanBefore.length > 0 && (
            <div className="mt-8 pt-8 border-t border-border">
              <h2 className="text-2xl font-bold mb-6 font-display text-on-surface">Before Optimization</h2>
              <div className="bg-surface-container-low rounded p-6">
                {blog.queryPlanBefore.map((planRoot: any, i: number) => (
                  <QueryPlanTree key={i} node={planRoot.Plan} isRoot={true} />
                ))}
              </div>
            </div>
          )}
          
          {blog.queryPlan && Array.isArray(blog.queryPlan) && blog.queryPlan.length > 0 && (
            <div className="mt-8 pt-8 border-t border-border">
              <h2 className="text-2xl font-bold mb-6 font-display text-on-surface">After Optimization</h2>
              <div className="bg-surface-container-low rounded p-6 border border-primary/20 shadow-[0_0_15px_rgba(255,179,175,0.05)]">
                {blog.queryPlan.map((planRoot: any, i: number) => (
                  <QueryPlanTree key={i} node={planRoot.Plan} isRoot={true} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
