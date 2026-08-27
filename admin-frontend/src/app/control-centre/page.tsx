'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ControlCentreList() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  const fetchIdeas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/control-centre/ideas`, {
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
      const res = await fetch(`${API_URL}/api/v1/control-centre/ideas`, {
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
    <div className="p-8 max-w-[1600px] mx-auto text-slate-200">
      <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-display-xl font-bold text-slate-100">Control Centre</h1>
          <p className="text-ui-sm text-slate-400 mt-1">Shared idea workspace for administrators. Collaborate without losing history.</p>
        </div>
        <Button onClick={createIdea} variant="primary" size="md">
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Idea</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] text-slate-400 font-mono text-xs">Loading ideas...</div>
      ) : ideas.length === 0 ? (
        <div className="card-level-1 p-16 flex flex-col items-center justify-center text-center border-dashed border-white/10 bg-slate-950/40">
          <span className="material-symbols-outlined text-5xl text-cyan-400/40 mb-4">lightbulb</span>
          <h2 className="text-ui-lg font-semibold text-slate-100 mb-2">No Ideas Yet</h2>
          <p className="text-ui-sm text-slate-400 mb-6 max-w-md">The Control Centre is empty. Be the first to propose a new initiative, spec, or strategy doc.</p>
          <Button onClick={createIdea} variant="secondary">Draft First Idea</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ideas.map((idea) => (
            <div key={idea.id} onClick={() => window.location.href = `/control-centre/${idea.id}`}>
              <div 
                className="card-level-1 flex flex-col h-full hover:border-cyan-500/40 transition-all cursor-pointer overflow-hidden group relative p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${
                    idea.status === 'active' 
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                      : 'bg-slate-800 text-slate-400 border-white/5'
                  }`}>
                    {idea.status}
                  </span>
                  
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400" title="Total unique contributors">
                    <span className="material-symbols-outlined text-[14px]">group</span>
                    {idea.contributorCount}
                  </div>
                </div>
                
                <h3 className="text-ui-lg font-semibold mb-3 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                  {idea.title === 'Untitled Idea' || !idea.title ? (
                    <span className="italic text-slate-400 font-normal">Untitled Idea</span>
                  ) : (
                    <span className="text-slate-100">{idea.title}</span>
                  )}
                </h3>
                
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Edited by {idea.lastEditedById === 'admin' ? 'Admin' : idea.lastEditedById.substring(0,6)}</span>
                  <span>{new Date(idea.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
