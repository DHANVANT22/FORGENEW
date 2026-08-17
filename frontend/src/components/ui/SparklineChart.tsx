'use client';

import React from 'react';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';

export function SparklineChart({ data, width = 200, height = 40, color = "#ff3c3c" }: { data: number[], width?: number, height?: number, color?: string }) {
  if (data.length === 0) return null;
  return (
    <Sparklines data={data} width={width} height={height} margin={5}>
      <SparklinesLine color={color} style={{ strokeWidth: 2, fill: "none" }} />
      <SparklinesSpots size={3} style={{ stroke: color, strokeWidth: 2, fill: "white" }} />
    </Sparklines>
  );
}
