'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

// Mock EXPLAIN ANALYZE JSON
const defaultPlan = [
  {
    "Plan": {
      "Node Type": "Hash Join",
      "Actual Rows": 125,
      "Actual Total Time": 3.425,
      "Plans": [
        {
          "Node Type": "Seq Scan",
          "Relation Name": "users",
          "Actual Rows": 1000,
          "Actual Total Time": 1.250
        },
        {
          "Node Type": "Hash",
          "Actual Rows": 250,
          "Actual Total Time": 0.850
        }
      ]
    }
  }
];

import { QueryPlanTree } from '@/components/ui/QueryPlanTree';
export default function BlogEditor() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [selectedBlogId, setSelectedBlogId] = useState<string>('');
  const [title, setTitle] = useState('Optimizing our Postgres Queries');
  const [content, setContent] = useState('We recently found a bottleneck in our project retrieval query. Here is the query plan before and after our optimization.');
  const [tagsInput, setTagsInput] = useState('');
  const [planJson, setPlanJson] = useState(JSON.stringify(defaultPlan, null, 2));
  const [planBeforeJson, setPlanBeforeJson] = useState(JSON.stringify(defaultPlan, null, 2));
  const [parsedPlan, setParsedPlan] = useState<any[]>(defaultPlan);
  const [parsedPlanBefore, setParsedPlanBefore] = useState<any[]>(defaultPlan);
  const [error, setError] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBlogs = async (currentPage = 1) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/v1/blogs?page=${currentPage}&limit=10`);
      if (res.ok) {
        const json = await res.json();
        setBlogs(json.data);
        setTotalPages(json.meta.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBlogs(page);
  }, [page]);

  const handleSelectBlog = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedBlogId(id);
    if (!id) {
      setTitle('Optimizing our Postgres Queries');
      setContent('We recently found a bottleneck in our project retrieval query...');
      setTagsInput('');
      setPlanJson(JSON.stringify(defaultPlan, null, 2));
      setPlanBeforeJson(JSON.stringify(defaultPlan, null, 2));
      setParsedPlan(defaultPlan);
      setParsedPlanBefore(defaultPlan);
      return;
    }
    const blog = blogs.find(b => b.id === id);
    if (blog) {
      setTitle(blog.title);
      setContent(blog.content);
      setTagsInput(blog.tags?.join(', ') || '');
      if (blog.queryPlan) {
        setPlanJson(JSON.stringify(blog.queryPlan, null, 2));
        setParsedPlan(blog.queryPlan);
      }
      if (blog.queryPlanBefore) {
        setPlanBeforeJson(JSON.stringify(blog.queryPlanBefore, null, 2));
        setParsedPlanBefore(blog.queryPlanBefore);
      } else {
        setPlanBeforeJson('');
        setParsedPlanBefore([]);
      }
    }
  };

  const validatePlanNode = (node: any) => {
    if (!node["Node Type"]) throw new Error(`Missing "Node Type" in plan node`);
    if (typeof node["Actual Total Time"] !== 'number') throw new Error(`Missing or invalid "Actual Total Time" in node ${node["Node Type"] || 'unknown'}`);
    if (node.Plans) {
      if (!Array.isArray(node.Plans)) throw new Error(`"Plans" must be an array in node ${node["Node Type"]}`);
      node.Plans.forEach(validatePlanNode);
    }
  };

  const validatePlan = () => {
    try {
      if (planJson.trim()) {
        const parsed = JSON.parse(planJson);
        if (!Array.isArray(parsed) || !parsed[0].Plan) {
          throw new Error('Invalid After Plan: missing root Plan node');
        }
        validatePlanNode(parsed[0].Plan);
        setParsedPlan(parsed);
      } else {
        setParsedPlan([]);
      }

      if (planBeforeJson.trim()) {
        const parsedBefore = JSON.parse(planBeforeJson);
        if (!Array.isArray(parsedBefore) || !parsedBefore[0].Plan) {
          throw new Error('Invalid Before Plan: missing root Plan node');
        }
        validatePlanNode(parsedBefore[0].Plan);
        setParsedPlanBefore(parsedBefore);
      } else {
        setParsedPlanBefore([]);
      }
      
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handlePublish = async () => {
    try {
      validatePlan();
      if (error) return alert('Fix JSON errors before publishing');
      
      const token = 'ADMIN_DEMO_TOKEN';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const url = selectedBlogId 
        ? `${apiUrl}/api/v1/blogs/${selectedBlogId}`
        : `${apiUrl}/api/v1/blogs`;
      const method = selectedBlogId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
          queryPlan: parsedPlan.length > 0 ? parsedPlan : undefined,
          queryPlanBefore: parsedPlanBefore.length > 0 ? parsedPlanBefore : undefined,
          authorId: 'admin' // mock author ID
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Blog ${selectedBlogId ? 'updated' : 'published'} successfully! Slug: ${data.slug}`);
        fetchBlogs();
        if (!selectedBlogId) setSelectedBlogId(data.id);
      } else {
        alert('Failed to publish');
      }
    } catch (err) {
      console.error(err);
      alert('Error publishing');
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-4xl font-bold font-display text-on-surface">Blog Editor</h1>
          <p className="text-muted mt-2">Create and edit engineering blog posts with interactive execution plans.</p>
        </div>
        <div className="flex items-center gap-4">
          <select className="p-2.5 bg-surface-container border border-border rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" value={selectedBlogId} onChange={handleSelectBlog}>
            <option value="">-- Create New Blog --</option>
            {blogs.map(b => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 mr-4">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span className="text-sm font-mono text-muted">{page} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
          <Button onClick={handlePublish} className="px-6 py-2.5 shadow-lg shadow-[var(--color-brand-primary)]/20">{selectedBlogId ? 'Update Post' : 'Publish Post'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Editor Side */}
        <div className="flex flex-col gap-6">
          <Card className="p-8 flex flex-col shadow-sm border-border/50">
            <input 
              type="text" 
              placeholder="Post Title" 
              className="w-full bg-transparent border-none text-3xl font-display font-bold focus:outline-none mb-6 text-on-surface placeholder:text-muted"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Tags (comma separated)" 
              className="w-full bg-background border border-border/50 p-3 rounded-lg text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-[var(--color-brand-primary)]/20 mb-6 text-on-surface placeholder:text-muted transition-colors"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
            <div className="flex-1 min-h-[300px] mb-2 border border-border/50 rounded-xl overflow-hidden bg-background">
              <RichTextEditor 
                content={content}
                onChange={setContent}
              />
            </div>
          </Card>
          
          <Card className="p-8 flex flex-col shadow-sm border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-semibold text-on-surface">Execution Plans Data</h2>
              {error && <span className="text-sm font-medium text-danger bg-danger/10 px-3 py-1 rounded-full">{error}</span>}
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono font-medium text-muted uppercase tracking-wider">Before Optimization (JSON)</label>
                <textarea
                  className="w-full h-64 bg-background border border-border/50 p-4 font-mono text-sm leading-relaxed rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-[var(--color-brand-primary)]/20 text-on-surface resize-none transition-all"
                  value={planBeforeJson}
                  onChange={(e) => setPlanBeforeJson(e.target.value)}
                  placeholder="Paste EXPLAIN ANALYZE JSON here..."
                  spellCheck={false}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono font-medium text-brand-primary uppercase tracking-wider">After Optimization (JSON)</label>
                <textarea
                  className="w-full h-64 bg-background border border-brand-primary/30 p-4 font-mono text-sm leading-relaxed rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-[var(--color-brand-primary)]/20 text-on-surface resize-none transition-all shadow-[0_0_15px_rgba(var(--shadow-brand-rgb), 0.1)]"
                  value={planJson}
                  onChange={(e) => setPlanJson(e.target.value)}
                  placeholder="Paste EXPLAIN ANALYZE JSON here..."
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button size="sm" variant="outline" onClick={validatePlan}>Validate &amp; Preview Plans</Button>
            </div>
          </Card>
        </div>

        {/* Preview Side */}
        <Card className="p-10 overflow-y-auto bg-background border-border/50 shadow-xl relative min-h-[800px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-brand-primary)]/50 via-[var(--color-brand-primary)] to-transparent"></div>
          
          <div className="flex items-center gap-3 mb-10 text-muted border-b border-border/40 pb-6">
            <span className="font-mono text-[10px] font-bold px-2.5 py-1 bg-brand-primary/10 rounded border border-brand-primary/20 text-brand-primary">LIVE PREVIEW</span>
            <span className="text-sm font-medium tracking-wide text-on-surface-variant">Blog Article View</span>
          </div>

          <h1 className="text-4xl font-display font-bold mb-6 text-on-surface leading-tight">{title || 'Untitled Post'}</h1>
          
          <div 
            className="text-lg text-on-surface-variant mb-12 leading-relaxed prose prose-invert max-w-none prose-headings:font-display prose-headings:text-on-surface prose-a:text-primary hover:prose-a:text-primary-hover"
            dangerouslySetInnerHTML={{ __html: content || '<p class="text-muted italic">Start writing to see preview...</p>' }}
          />
          
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8 mt-12 pt-8 border-t border-border/40">
            {parsedPlanBefore && parsedPlanBefore.length > 0 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-mono font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted"></span>
                  Before Optimization
                </h3>
                <div className="p-5 border border-border/60 rounded-2xl bg-surface-container-low shadow-sm">
                  {parsedPlanBefore.map((planRoot, i) => (
                    <QueryPlanTree key={i} node={planRoot.Plan} isRoot={true} />
                  ))}
                </div>
              </div>
            )}
            
            {parsedPlan && parsedPlan.length > 0 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-mono font-bold text-brand-primary uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-primary-bright animate-pulse"></span>
                  After Optimization
                </h3>
                <div className="p-5 border border-brand-primary/30 rounded-2xl bg-surface-container shadow-[0_4px_24px_rgba(var(--shadow-brand-rgb), 0.15)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-[50px] rounded-full pointer-events-none"></div>
                  {parsedPlan.map((planRoot, i) => (
                    <QueryPlanTree key={i} node={planRoot.Plan} isRoot={true} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
