'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QueryPlanNodeProps {
  node: any;
  isRoot?: boolean;
  maxTime?: number;
}

const NODE_TOOLTIPS: Record<string, string> = {
  "Seq Scan": "Scans the entire table sequentially, reading every row.",
  "Hash Join": "Joins two tables by building a hash table on the smaller one and probing it with the larger.",
  "Index Scan": "Traverses an index to quickly find matching rows, then fetches them from the table.",
  "Index Only Scan": "Scans an index and returns data directly from it without hitting the table.",
  "Nested Loop": "Joins tables by looping over the first table and for each row, querying the second table.",
  "Sort": "Sorts the input rows according to a specified key.",
  "Hash": "Builds a hash table in memory from the input rows.",
  "Aggregate": "Groups rows and computes aggregate functions like SUM, COUNT, or AVG.",
  "Limit": "Returns only a specified number of rows from the input.",
  "Bitmap Heap Scan": "Uses a bitmap of page locations (from a Bitmap Index Scan) to fetch rows from the table.",
  "Bitmap Index Scan": "Scans an index to build a bitmap of page locations containing matching rows."
};

function aggregateCosts(node: any, breakdown: Record<string, number> = {}) {
  if (!node) return breakdown;
  
  const type = node["Node Type"];
  const time = node["Actual Total Time"] || 0;
  
  let childrenTime = 0;
  if (node.Plans && Array.isArray(node.Plans)) {
    for (const child of node.Plans) {
      childrenTime += child["Actual Total Time"] || 0;
      aggregateCosts(child, breakdown);
    }
  }
  
  const selfTime = Math.max(0, time - childrenTime);
  breakdown[type] = (breakdown[type] || 0) + selfTime;
  
  return breakdown;
}

export const QueryPlanTree = ({ node, isRoot = false, maxTime }: QueryPlanNodeProps) => {
  const [expanded, setExpanded] = useState(true);
  
  if (!node) return null;

  const currentMaxTime = isRoot ? (node["Actual Total Time"] || 1) : maxTime || 1;
  const time = node["Actual Total Time"] || 0;
  
  // Relative hot path percentage (0 to 1)
  const hotRatio = Math.min(1, time / currentMaxTime);
  const isHotPath = hotRatio > 0.5;

  const costBreakdown = isRoot ? aggregateCosts(node) : null;
  const sortedCosts = costBreakdown ? Object.entries(costBreakdown).sort((a, b) => b[1] - a[1]) : [];

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(node, null, 2));
    alert('Query Plan JSON copied to clipboard');
  };

  return (
    <div className={isRoot ? "flex flex-col lg:flex-row gap-8" : ""}>
      <div className={`flex-1 ${!isRoot ? 'ml-4 pl-4 border-l border-border my-2' : ''}`}>
        {isRoot && (
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-mono font-bold text-on-surface uppercase tracking-wider">Query Plan Tree</h4>
            <button 
              onClick={handleCopy}
              className="px-3 py-1 bg-surface-container border border-border rounded text-xs text-on-surface-variant hover:text-on-surface hover:border-primary transition-colors font-mono"
            >
              Copy JSON
            </button>
          </div>
        )}
        <div 
          className={`p-3 rounded border cursor-pointer flex justify-between items-center transition-colors relative group overflow-hidden
            ${isHotPath ? 'border-brand-primary-bright/30 bg-surface-container-low' : 'bg-surface-container-low border-border hover:border-brand-primary/50'}
          `}
          style={{
            boxShadow: isHotPath ? `0 0 ${hotRatio * 15}px rgba(192, 24, 42, ${hotRatio * 0.2})` : undefined
          }}
          onClick={() => setExpanded(!expanded)}
        >
          {/* Relative hot path bar */}
          {hotRatio > 0.05 && (
            <div 
              className="absolute left-0 bottom-0 h-[2px] bg-brand-primary-bright/40 transition-all" 
              style={{ width: `${hotRatio * 100}%` }} 
            />
          )}
          <div className="relative z-10">
            <strong className={isHotPath ? 'text-brand-primary-bright' : 'text-text-strong'}>{node["Node Type"]}</strong>
            {node["Relation Name"] && <span className="ml-2 text-muted text-sm">on {node["Relation Name"]}</span>}
            
            {/* Tooltip */}
            {NODE_TOOLTIPS[node["Node Type"]] && (
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-surface-container-highest border border-border rounded-lg shadow-xl text-xs text-on-surface z-10 pointer-events-none">
                {NODE_TOOLTIPS[node["Node Type"]]}
              </div>
            )}
          </div>
          <div className="flex gap-4 text-xs font-mono text-muted">
            <span>Rows: {node["Actual Rows"] ?? '?'}</span>
            <span>Time: {time.toFixed(3)}ms</span>
          </div>
        </div>
        
        <AnimatePresence initial={false}>
          {expanded && node.Plans && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-2">
                {node.Plans.map((child: any, i: number) => (
                  <QueryPlanTree key={i} node={child} maxTime={currentMaxTime} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isRoot && sortedCosts.length > 0 && (
        <div className="w-full lg:w-64 flex-shrink-0">
          <h4 className="text-sm font-mono font-bold text-on-surface uppercase tracking-wider mb-4">Cost by Node Type</h4>
          <div className="flex flex-col gap-3">
            {sortedCosts.map(([type, costTime]) => (
              <div key={type} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-on-surface-variant truncate mr-2" title={type}>{type}</span>
                  <span className="text-primary font-bold">{costTime.toFixed(2)}ms</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${Math.max(1, (costTime / currentMaxTime) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
