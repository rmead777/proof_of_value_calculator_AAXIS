
import React from 'react';

interface TickMeterProps {
  low: number;  
  high: number; 
  target?: number;
}

export const TickMeter: React.FC<TickMeterProps> = ({ low, high, target }) => {
  const ticks = Array.from({ length: 20 });
  const MAX_SCALE = 0.60;

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  const magToIndex = (v: number) => {
    const vv = clamp(Math.abs(v), 0, MAX_SCALE);
    const normalized = vv / MAX_SCALE;
    return clamp(Math.round(normalized * (ticks.length - 1)), 0, ticks.length - 1);
  };

  const lowIndex = magToIndex(low);
  const highIndex = magToIndex(high);
  const targetIndex = target !== undefined ? magToIndex(target) : -1;

  const rangeStart = Math.min(lowIndex, highIndex);
  const rangeEnd = Math.max(lowIndex, highIndex);
  const targetValue = target ?? low;
  const isNegative = targetValue < 0;
  const hasRange = (Math.abs(low) > 0 || Math.abs(high) > 0);

  return (
    <div className="flex flex-col items-center w-full max-w-[100px] mx-auto">
      <span
        className={`text-[10px] font-bold font-mono mb-1 tabular-nums ${
          targetValue === 0
            ? 'text-slate-600'
            : isNegative
              ? 'text-rose-300'
              : 'text-emerald-400'
        }`}
      >
        {(targetValue * 100).toFixed(0)}%
      </span>

      <div className="flex items-end justify-between w-full h-3 gap-[1px]" aria-hidden="true">
        {ticks.map((_, i) => {
          const isInRange = hasRange && i >= rangeStart && i <= rangeEnd;
          const isTarget = i === targetIndex;
          const isMajor = i % 5 === 0; 
          
          let bgColor = 'bg-slate-800';
          if (isTarget) bgColor = 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] z-10';
          else if (isInRange) bgColor = isNegative
            ? 'bg-rose-400/50 shadow-[0_0_4px_rgba(251,113,133,0.25)]'
            : 'bg-emerald-400/60 shadow-[0_0_4px_rgba(52,211,153,0.3)]';

          return (
            <div 
              key={i}
              className={`w-1 rounded-sm transition-all duration-300 ${bgColor}
                ${isTarget ? 'h-[120%]' : isInRange ? 'h-full' : isMajor ? 'h-2' : 'h-1'}
              `}
            />
          );
        })}
      </div>
    </div>
  );
};
