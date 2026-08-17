'use client';
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

export const AmbientBackground = () => {
  const shouldReduceMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for mouse position (-1 to 1)
  const springConfig = { damping: 30, stiffness: 100, mass: 1 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const parallaxX = useTransform(smoothX, [-1, 1], [-15, 15]);
  const parallaxY = useTransform(smoothY, [-1, 1], [-15, 15]);

  const motesX = useTransform(smoothX, [-1, 1], [-30, 30]);
  const motesY = useTransform(smoothY, [-1, 1], [-30, 30]);

  const [motes, setMotes] = useState<any[]>([]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    
    // Generate static motes that drift locally
    const numMotes = 15;
    const initialMotes = Array.from({ length: numMotes }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * -20,
    }));
    setMotes(initialMotes);

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse pos from -1 to 1
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(nx);
      mouseY.set(ny);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [shouldReduceMotion, mouseX, mouseY]);

  if (shouldReduceMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden bg-bg-deep">
      
      {/* Parallax Grid Horizon */}
      <motion.div 
        className="absolute inset-[-5%] w-[110%] h-[110%] bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0" 
        style={{ x: parallaxX, y: parallaxY }}
      />

      <motion.div
        className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full blur-[140px]"
        style={{
          background: 'radial-gradient(circle, var(--color-brand-primary) 0%, transparent 70%)',
          opacity: 0.06,
          x: parallaxX, y: parallaxY
        }}
        animate={{
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute right-0 bottom-0 w-[700px] h-[700px] rounded-full blur-[120px]"
        style={{
          background: 'radial-gradient(circle, var(--color-brand-primary-bright) 0%, transparent 70%)',
          opacity: 0.04,
          x: parallaxX, y: parallaxY
        }}
        animate={{
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Ambient Motes */}
      <motion.div className="absolute inset-0" style={{ x: motesX, y: motesY }}>
        {motes.map(mote => (
          <motion.div
            key={mote.id}
            className="absolute rounded-full bg-primary"
            style={{
              left: `${mote.x}%`,
              top: `${mote.y}%`,
              width: mote.size,
              height: mote.size,
              opacity: 0.15,
              filter: 'blur(1px)'
            }}
            animate={{
              y: ['0%', '-500%', '0%'],
              x: ['0%', '100%', '0%'],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: mote.duration,
              delay: mote.delay,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};
