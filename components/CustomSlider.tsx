import React from 'react';

interface CustomSliderProps {
  label: string;
  subLabel?: string;
  ariaLabel?: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  formatValue?: (val: number) => string;
  step?: number;
  benchmarkRange?: [number, number]; // [min, max] as values
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
  label,
  subLabel,
  ariaLabel,
  value,
  min,
  max,
  onChange,
  formatValue,
  step = 1,
  benchmarkRange
}) => {
  const denom = max - min;
  const rawPercent = denom === 0 ? 0 : ((value - min) / denom) * 100;
  const percent = Math.min(100, Math.max(0, rawPercent));
  const ariaValueText = formatValue ? formatValue(value) : String(value);
  const computedAriaLabel = ariaLabel || label || subLabel || 'Slider';
  
  return (
    <div className="flex flex-col w-full group">
      <div className="flex justify-between items-end mb-2">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</span>
        <span className="text-white font-bold text-sm tabular-nums">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      
      <div className="relative h-2 bg-slate-800 rounded-full w-full">
        
        {/* Benchmark Range Indicator */}
        {benchmarkRange && (
          <div 
            className="absolute top-0 h-full bg-slate-700/50 rounded-full"
            style={{
              left: `${((benchmarkRange[0] - min) / (max - min)) * 100}%`,
              width: `${((benchmarkRange[1] - benchmarkRange[0]) / (max - min)) * 100}%`
            }}
            title="Industry Benchmark"
          />
        )}

        {/* Active Track */}
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-100" 
          style={{ width: `${percent}%` }}
        />

        {/* Range Input (Invisible overlay) */}
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step}
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={computedAriaLabel}
          aria-valuetext={ariaValueText}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        {/* Thumb Handle */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)] pointer-events-none transition-all duration-100 border border-slate-200 group-hover:scale-110"
          style={{ left: `${percent}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-mono">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{subLabel}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  );
};
