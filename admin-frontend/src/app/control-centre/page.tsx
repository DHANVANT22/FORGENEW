'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ControlCentreList() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIdeas = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/control-centre/ideas`, {
        headers: {
          'Authorization': 'Bearer ADMIN_DEMO_TOKEN'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIdeas(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const createIdea = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/control-centre/ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ADMIN_DEMO_TOKEN'
        },
        body: JSON.stringify({
          title: 'Untitled Idea',
          content: '# New Idea\nStart writing here...'
        })
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/control-centre/${data.id}`;
      } else {
        alert('Failed to create idea');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating idea');
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-fade-in-up">
      <div className="flex justify-between items-center mb-10 border-b border-border pb-6">
        <div>
          <h1 className="text-4xl font-bold font-display text-on-surface">Control Centre</h1>
          <p className="text-muted mt-2">Shared idea workspace for administrators. Collaborate without losing history.</p>
        </div>
        <Button onClick={createIdea} className="px-6 py-2.5 shadow-lg shadow-primary/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Idea
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] text-muted">Loading ideas...</div>
      ) : ideas.length === 0 ? (
        <Card className="p-16 flex flex-col items-center justify-center text-center shadow-sm border-border/50 border-dashed bg-surface-container/20">
          <span className="material-symbols-outlined text-5xl text-primary/40 mb-4">lightbulb</span>
          <h2 className="text-xl font-display font-semibold text-on-surface mb-2">No Ideas Yet</h2>
          <p className="text-muted mb-6 max-w-md">The Control Centre is empty. Be the first to propose a new initiative, spec, or strategy doc.</p>
          <Button onClick={createIdea} variant="outline">Draft First Idea</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ideas.map((idea) => (
            <div key={idea.id} onClick={() => window.location.href = `/control-centre/${idea.id}`}>
              <Card 
                className="flex flex-col h-full shadow-sm border-border/50 hover:border-primary/50 transition-all cursor-pointer hover:shadow-[0_4px_24px_rgba(var(--shadow-brand-rgb), 0.1)] overflow-hidden group relative"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded border uppercase ${
                    idea.status === 'active' 
                      ? 'bg-primary/10 text-primary border-primary/20' 
                      : 'bg-surface-container-high text-muted border-border'
                  }`}>
                    {idea.status}
                  </span>
                  
                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted" title="Total unique contributors">
                    <span className="material-symbols-outlined text-[14px]">group</span>
                    {idea.contributorCount}
                  </div>
                </div>
                
                <h3 className="text-xl font-display font-semibold text-on-surface mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {idea.title}
                </h3>
                
                <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted font-mono">
                  <span>Edited by {idea.lastEditedById === 'admin' ? 'Admin' : idea.lastEditedById.substring(0,6)}</span>
                  <span>{new Date(idea.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
