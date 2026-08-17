import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Engineering Blog | Forge',
  description: 'Technical deep dives, optimization wins, and engineering stories.',
};

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : '';
  const tag = typeof resolvedSearchParams.tag === 'string' ? resolvedSearchParams.tag : '';
  
  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (tag) queryParams.set('tag', tag);
  
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/blogs?${queryParams.toString()}`;
  let blogs: any[] = [];
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      blogs = data.data || [];
    }
  } catch (err) {
    console.error('Failed to fetch blogs', err);
  }

  return (
    <main className="min-h-screen bg-background text-on-surface font-body-md py-20 px-6 animate-fade-in-up">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-on-surface">Engineering Blog</h1>
        <p className="text-xl text-on-surface-variant font-light mb-12">
          Technical deep dives, optimization wins, and engineering stories from the Forge team.
        </p>

        <form className="mb-12 flex flex-col sm:flex-row gap-4" method="GET" action="/blog">
          <input 
            type="text" 
            name="search" 
            defaultValue={search} 
            placeholder="Search by title..." 
            className="flex-1 bg-surface-container border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-primary text-on-surface"
          />
          <input 
            type="text" 
            name="tag" 
            defaultValue={tag} 
            placeholder="Filter by tag..." 
            className="flex-1 bg-surface-container border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-primary text-on-surface"
          />
          <button type="submit" className="bg-primary hover:bg-primary-hover text-on-primary font-bold px-6 py-3 rounded-lg transition-colors shadow-lg shadow-primary/20">
            Search
          </button>
          {(search || tag) && (
            <Link href="/blog" className="flex items-center justify-center bg-surface-container hover:bg-surface-container-high border border-border text-on-surface font-medium px-6 py-3 rounded-lg transition-colors">
              Clear
            </Link>
          )}
        </form>

        <div className="flex flex-col gap-6">
          {blogs.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-low border border-border rounded-xl">
              <p className="text-on-surface-variant">No blog posts found matching your criteria.</p>
            </div>
          ) : (
            blogs.map(blog => (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="block group">
                <div className="p-6 bg-surface-container-low border border-border rounded-xl hover:border-primary/50 transition-colors shadow-sm hover:shadow-[0_0_20px_rgba(255,179,175,0.05)]">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {blog.tags?.map((t: string) => (
                      <span key={t} className="text-[10px] font-mono font-bold px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded uppercase tracking-wider">
                        {t}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-2 group-hover:text-primary transition-colors">{blog.title}</h2>
                  <div className="text-sm text-on-surface-variant font-mono">
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
