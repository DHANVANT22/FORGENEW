'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

type AudioContextType = {
  enabled: boolean;
  setEnabled: (val: boolean) => void;
  playClick: () => void;
  playSuccess: () => void;
  playWarp: () => void;
};

const AudioContext = createContext<AudioContextType>({
  enabled: false,
  setEnabled: () => {},
  playClick: () => {},
  playSuccess: () => {},
  playWarp: () => {},
});

export const useAudio = () => useContext(AudioContext);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  
  // Audio context is created lazily to comply with browser autoplay policies
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  useEffect(() => {
    // Load preference from local storage if available
    const saved = localStorage.getItem('ambient_audio');
    if (saved === 'true') setEnabled(true);
  }, []);

  const toggleEnabled = (val: boolean) => {
    setEnabled(val);
    localStorage.setItem('ambient_audio', val.toString());
    if (val) initAudio();
  };

  const createOscillator = (type: OscillatorType, freq: number, duration: number, vol: number) => {
    if (!enabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playClick = () => {
    createOscillator('sine', 800, 0.05, 0.1);
  };

  const playSuccess = () => {
    if (!enabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    osc1.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1); // C#
    
    osc2.frequency.setValueAtTime(220, ctx.currentTime);
    osc2.frequency.setValueAtTime(277.18, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 0.3);
  };

  const playWarp = () => {
    if (!enabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  };

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, [role="button"]')) {
        playClick();
      }
    };
    if (enabled) {
      document.addEventListener('click', handleGlobalClick);
    }
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [enabled]);

  return (
    <AudioContext.Provider value={{ enabled, setEnabled: toggleEnabled, playClick, playSuccess, playWarp }}>
      {children}
    </AudioContext.Provider>
  );
}
