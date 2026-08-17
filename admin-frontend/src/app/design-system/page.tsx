"use client";

import React, { useState } from 'react';
import { Panel, LedIndicator, Gauge, LeverSlider, ReadoutNumber } from '@/components/ui';

export default function DesignSystemPage() {
  const [sliderValue, setSliderValue] = useState(42);

  return (
    <div className="p-8 pb-20 max-w-4xl mx-auto space-y-12">
      <div className="mb-12 border-b border-border pb-4">
        <h1 className="text-3xl font-display text-brand-primary-bright mb-2">Forge Terminal</h1>
        <p className="text-text-muted font-mono">Phase 0: Primitive Components Preview</p>
      </div>

      <section className="space-y-6">
        <h2 className="text-xl font-display text-text-strong border-b border-border pb-2">Panels</h2>
        <div className="grid grid-cols-2 gap-6">
          <Panel className="p-6 h-32 flex items-center justify-center">
            <span className="text-text-muted font-mono">Standard Panel</span>
          </Panel>
          <Panel className="p-6 h-32 flex items-center justify-center" withRivets>
            <span className="text-text-muted font-mono">Panel with Rivets</span>
          </Panel>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-display text-text-strong border-b border-border pb-2">LED Indicators</h2>
        <div className="flex gap-12 items-center bg-bg-deep p-6 rounded-[6px] border border-border">
          <div className="flex items-center gap-3">
            <LedIndicator status="active" />
            <span className="font-mono text-sm text-text-strong">Active</span>
          </div>
          <div className="flex items-center gap-3">
            <LedIndicator status="warning" />
            <span className="font-mono text-sm text-text-strong">Warning</span>
          </div>
          <div className="flex items-center gap-3">
            <LedIndicator status="critical" />
            <span className="font-mono text-sm text-text-strong">Critical</span>
          </div>
          <div className="flex items-center gap-3">
            <LedIndicator status="idle" />
            <span className="font-mono text-sm text-text-strong">Idle</span>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-display text-text-strong border-b border-border pb-2">Gauges & Readouts</h2>
        <div className="grid grid-cols-3 gap-6">
          <Panel className="p-6 flex flex-col items-center justify-center gap-4">
            <Gauge value={sliderValue} label="Risk Level" />
          </Panel>
          
          <Panel className="p-6 flex flex-col items-center justify-center gap-4">
            <div className="text-xs text-text-muted font-mono uppercase tracking-widest text-center">
              Active Value
            </div>
            <div className="text-4xl text-brand-primary-bright">
              <ReadoutNumber value={sliderValue} />
            </div>
          </Panel>

          <Panel className="p-6 flex flex-col items-center justify-center gap-4" withRivets>
             <div className="text-xs text-text-muted font-mono uppercase tracking-widest text-center">
              Max Capacity
            </div>
            <div className="text-4xl text-text-strong">
              <ReadoutNumber value={100} />
            </div>
          </Panel>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-display text-text-strong border-b border-border pb-2">Lever Slider</h2>
        <Panel className="p-8">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-end mb-4">
              <span className="font-mono text-text-muted uppercase tracking-widest text-xs">Adjust Thrust</span>
              <span className="font-[family-name:var(--font-mono-readout)] text-text-strong">
                {sliderValue}%
              </span>
            </div>
            <LeverSlider 
              value={sliderValue} 
              onChange={setSliderValue} 
              min={0} 
              max={100} 
            />
          </div>
        </Panel>
      </section>

    </div>
  );
}
