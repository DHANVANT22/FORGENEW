"use client";

import React, { useEffect, useRef, useState } from 'react';

export type CursorState = 'idle' | 'precision' | 'busy' | 'click';

let currentCursorState: CursorState = 'idle';
const cursorListeners = new Set<(state: CursorState) => void>();

export const setCursorState = (state: CursorState) => {
  currentCursorState = state;
  cursorListeners.forEach(listener => listener(state));
};

export function useCursorState() {
  const [state, setState] = useState<CursorState>(currentCursorState);
  useEffect(() => {
    cursorListeners.add(setState);
    return () => { cursorListeners.delete(setState); };
  }, []);
  return [state, setCursorState] as const;
}

// Catmull-Rom to Bezier curve helper
function catmullRom2bezier(points: { x: number, y: number }[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const k = 0.2; // tension
    const cp1x = p1.x + (p2.x - p0.x) * k;
    const cp1y = p1.y + (p2.y - p0.y) * k;
    const cp2x = p2.x - (p3.x - p1.x) * k;
    const cp2y = p2.y - (p3.y - p1.y) * k;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function CometCursor() {
  const [isSupported, setIsSupported] = useState(true);
  const nucleusRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGRectElement>(null);
  const tailGroupRef = useRef<SVGGElement>(null);
  const flareGroupRef = useRef<SVGGElement>(null);

  const pointerPos = useRef({ x: -100, y: -100 });
  const magneticPos = useRef({ x: -100, y: -100 });
  const points = useRef<{ x: number, y: number }[]>([]);
  const isHovering = useRef(false);
  const hoverRect = useRef<{ x: number, y: number, w: number, h: number } | null>(null);

  useEffect(() => {
    if (
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsSupported(false);
      return;
    }

    let rAF: number;
    let lastTime = performance.now();

    // Spark particles
    const sparks: { x: number, y: number, vx: number, vy: number, life: number, maxLife: number, elem: SVGCircleElement }[] = [];
    const MAX_POINTS = 16;

    const onMouseMove = (e: MouseEvent) => {
      pointerPos.current = { x: e.clientX, y: e.clientY };

      const target = e.target as Element;
      const interactive = target.closest('a, button, input, [role="button"], .interactive');
      if (interactive) {
        if (!isHovering.current) {
          isHovering.current = true;
          setCursorState('precision');
        }
        const rect = interactive.getBoundingClientRect();
        hoverRect.current = { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
      } else {
        if (isHovering.current) {
          isHovering.current = false;
          hoverRect.current = null;
          setCursorState('idle');
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      setCursorState('click');
      setTimeout(() => setCursorState(isHovering.current ? 'precision' : 'idle'), 400);

      if (points.current.length > 2 && flareGroupRef.current) {
        const dx = points.current[0].x - points.current[points.current.length - 1].x;
        const dy = points.current[0].y - points.current[points.current.length - 1].y;
        const dist = Math.hypot(dx, dy) || 1;
        const dirX = dx / dist;
        const dirY = dy / dist;

        for (let i = 0; i < 6; i++) {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('r', '1.5');
          circle.setAttribute('fill', 'var(--color-brand-primary-bright)');
          flareGroupRef.current.appendChild(circle);

          sparks.push({
            x: pointerPos.current.x,
            y: pointerPos.current.y,
            vx: -dirX * (Math.random() * 6 + 2) + (Math.random() - 0.5) * 5, // backward bias
            vy: -dirY * (Math.random() * 6 + 2) + (Math.random() - 0.5) * 5,
            life: 1,
            maxLife: 20 + Math.random() * 20,
            elem: circle
          });
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onClick);

    const render = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      if (isHovering.current && hoverRect.current) {
        const cx = hoverRect.current.x + hoverRect.current.w / 2;
        const cy = hoverRect.current.y + hoverRect.current.h / 2;

        magneticPos.current.x += ((pointerPos.current.x * 0.9 + cx * 0.1) - magneticPos.current.x) * 0.4;
        magneticPos.current.y += ((pointerPos.current.y * 0.9 + cy * 0.1) - magneticPos.current.y) * 0.4;
      } else {
        magneticPos.current.x = pointerPos.current.x;
        magneticPos.current.y = pointerPos.current.y;
      }

      points.current.unshift({ x: magneticPos.current.x, y: magneticPos.current.y });
      if (points.current.length > MAX_POINTS) points.current.pop();

      let totalDist = 0;
      for (let i = 0; i < points.current.length - 1; i++) {
        totalDist += Math.hypot(points.current[i].x - points.current[i + 1].x, points.current[i].y - points.current[i + 1].y);
      }

      if (tailGroupRef.current) {
        const paths = tailGroupRef.current.children;
        const pathData = catmullRom2bezier(points.current);
        for (let i = 0; i < paths.length; i++) {
          const path = paths[i] as SVGPathElement;
          path.setAttribute('d', pathData);

          const len = totalDist;
          if (len > 0) {
            path.style.strokeDasharray = `${len * (1 - i * 0.2)} 10000`;
            path.style.opacity = `${Math.min(1, len / 80) * (0.8 - i * 0.25)}`;
          } else {
            path.style.opacity = '0';
          }
        }
      }

      if (nucleusRef.current) {
        // Offset by 5px so the center of the 10x10 core is exactly at the pointer
        nucleusRef.current.style.transform = `translate(${magneticPos.current.x - 5}px, ${magneticPos.current.y - 5}px)`;
        if (totalDist > 10) {
          nucleusRef.current.classList.add('moving');
        } else {
          nucleusRef.current.classList.remove('moving');
        }
      }

      if (ringRef.current) {
        if (isHovering.current && hoverRect.current) {
          ringRef.current.setAttribute('x', String(hoverRect.current.x - 6));
          ringRef.current.setAttribute('y', String(hoverRect.current.y - 6));
          ringRef.current.setAttribute('width', String(hoverRect.current.w + 12));
          ringRef.current.setAttribute('height', String(hoverRect.current.h + 12));
          ringRef.current.style.opacity = '1';
          const perim = (hoverRect.current.w + hoverRect.current.h) * 2 + 48;
          ringRef.current.style.strokeDasharray = `${perim}`;
          if (!ringRef.current.classList.contains('drawing')) {
            ringRef.current.classList.add('drawing');
            ringRef.current.style.strokeDashoffset = '0';
          }
        } else {
          ringRef.current.style.opacity = '0';
          ringRef.current.classList.remove('drawing');
          const perim = ((hoverRect.current?.w || 0) + (hoverRect.current?.h || 0)) * 2 + 48;
          ringRef.current.style.strokeDashoffset = `${perim}`;
        }
      }

      // Random stardust particle occasionally while moving fast
      if (totalDist > 40 && Math.random() < 0.05 && flareGroupRef.current && points.current.length > 5) {
        const idx = Math.floor(Math.random() * (points.current.length - 2)) + 1;
        const p = points.current[idx];
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', '1');
        circle.setAttribute('fill', 'var(--color-brand-primary-bright)');
        flareGroupRef.current.appendChild(circle);
        sparks.push({
          x: p.x + (Math.random() - 0.5) * 4,
          y: p.y + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 1,
          vy: (Math.random() - 0.5) * 1,
          life: 1,
          maxLife: 15 + Math.random() * 10,
          elem: circle
        });
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.95;
        s.vy *= 0.95;
        s.elem.setAttribute('cx', String(s.x));
        s.elem.setAttribute('cy', String(s.y));
        s.elem.style.opacity = String(1 - s.life / s.maxLife);

        if (s.life >= s.maxLife) {
          s.elem.remove();
          sparks.splice(i, 1);
        }
      }

      rAF = requestAnimationFrame(render);
    };

    rAF = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onClick);
      cancelAnimationFrame(rAF);

      // Cleanup sparks to prevent memory leaks
      sparks.forEach(s => s.elem.remove());
      sparks.length = 0;
    };
  }, []);

  const [globalState] = useCursorState();

  if (!isSupported) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        * { cursor: none !important; }
        .comet-nucleus-coma {
          transition: transform 0.2s ease, opacity 0.2s ease;
          animation: breathe 2.5s ease-in-out infinite alternate;
          top: 50%; left: 50%; transform: translate(-50%, -50%);
        }
        .moving .comet-nucleus-coma {
          animation: none;
          transform: translate(-50%, -50%) scale(0.6);
        }
        @keyframes breathe {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0.15; }
        }
        .hover-ring {
          transition: stroke-dashoffset 0.4s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.2s ease;
        }
        
        /* Flare rays */
        .flare-rays {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.5);
          transition: opacity 0.1s ease, transform 0.1s ease;
          top: 50%; left: 50%;
        }
        .state-click .flare-rays {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.5) rotate(45deg);
          transition: opacity 0.05s ease, transform 0.3s cubic-bezier(0.1, 0.9, 0.2, 1);
        }
        
        .comet-core {
          transition: transform 0.2s cubic-bezier(0.1, 0.9, 0.2, 1), box-shadow 0.2s ease, background 0.2s ease;
        }
        .state-click .comet-core {
          transform: scale(1.8);
          background: #fff;
          box-shadow: 0 0 20px 4px var(--color-brand-primary-bright);
        }
        .state-precision .comet-core {
          background: #fff;
          transform: scale(1.3);
          box-shadow: 0 0 15px 2px var(--color-brand-primary-bright);
        }
      `}} />

      {/* SVG Overlay */}
      <svg
        className="fixed inset-0 pointer-events-none z-[9998]"
        style={{ width: '100vw', height: '100vh' }}
      >
        <defs>
          <linearGradient id="tail-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-brand-primary-bright)" stopOpacity="0.8" />
            <stop offset="20%" stopColor="var(--color-brand-primary)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect
          ref={ringRef}
          fill="none"
          stroke="var(--color-brand-primary-bright)"
          strokeWidth="1"
          rx="6"
          className="hover-ring"
          style={{ opacity: 0 }}
        />

        <g ref={tailGroupRef} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="url(#tail-gradient)" strokeWidth="6" style={{ opacity: 0, transition: 'stroke-dasharray 0.05s linear' }} />
          <path stroke="url(#tail-gradient)" strokeWidth="3" style={{ opacity: 0, transition: 'stroke-dasharray 0.05s linear' }} />
          <path stroke="url(#tail-gradient)" strokeWidth="1" style={{ opacity: 0, transition: 'stroke-dasharray 0.05s linear' }} />
        </g>

        <g ref={flareGroupRef}></g>
      </svg>

      {/* Nucleus */}
      <div
        ref={nucleusRef}
        className={`fixed top-0 left-0 pointer-events-none z-[9999] w-[10px] h-[10px] state-${globalState}`}
      >
        <div className="absolute flare-rays w-12 h-12">
          <div className="absolute w-[2px] h-12 bg-brand-primary-bright blur-[1px] left-1/2 -translate-x-1/2"></div>
          <div className="absolute w-12 h-[2px] bg-brand-primary-bright blur-[1px] top-1/2 -translate-y-1/2"></div>
          <div className="absolute w-[1px] h-10 bg-white rotate-45 left-1/2 -translate-x-1/2 top-1"></div>
          <div className="absolute w-10 h-[1px] bg-white rotate-45 top-1/2 -translate-y-1/2 left-1"></div>
        </div>

        <div className="absolute comet-nucleus-coma w-[24px] h-[24px] rounded-full bg-brand-primary blur-[6px] opacity-20"></div>

        <div className="absolute comet-core w-full h-full rounded-full bg-brand-primary-bright shadow-[0_0_12px_rgba(var(--shadow-brand-rgb),0.9)]"></div>
      </div>
    </>
  );
}
