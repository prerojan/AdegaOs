import React from 'react';

export interface EnterpriseCustomSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  isDark?: boolean;
  disabled?: boolean;
  label?: string;
  sublabel?: string;
  valueDisplay?: string;
  presets?: { label: string; value: number }[];
  className?: string;
}

export const EnterpriseCustomSlider: React.FC<EnterpriseCustomSliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  isDark = true,
  disabled = false,
  label,
  sublabel,
  valueDisplay,
  presets,
  className = ''
}) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min || 1)) * 100));

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {(label || valueDisplay) && (
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            {label && (
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                {label}
              </span>
            )}
            {sublabel && (
              <span className="text-[10px] font-mono text-gray-400">
                {sublabel}
              </span>
            )}
          </div>
          {valueDisplay && (
            <span className={`px-2 py-0.5 rounded-lg border font-mono font-black text-xs ${
              isDark ? 'bg-[#18F2A4]/10 border-[#18F2A4]/30 text-[#18F2A4]' : 'bg-emerald-100 border-emerald-300 text-emerald-800'
            }`}>
              {valueDisplay}
            </span>
          )}
        </div>
      )}

      {/* Custom Track Slider (Volume Control Mixer Engine) */}
      <div className="relative flex items-center w-full py-1.5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full cursor-pointer h-2.5 rounded-full appearance-none outline-none transition-all z-10 opacity-0 disabled:cursor-not-allowed"
        />

        {/* Custom Track Background & Progress Fill */}
        <div className={`absolute left-0 right-0 h-2.5 rounded-full overflow-hidden pointer-events-none border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-slate-200 border-slate-300'
        }`}>
          <div
            className={`h-full transition-all duration-75 rounded-full ${
              disabled
                ? 'bg-gray-500'
                : isDark
                  ? 'bg-gradient-to-r from-emerald-500 to-[#18F2A4] shadow-[0_0_12px_rgba(24,242,164,0.4)]'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Custom Thumb handle overlay */}
        <div
          className={`absolute w-5 h-5 rounded-full border-2 shadow-md pointer-events-none transition-all duration-75 -ml-2.5 flex items-center justify-center ${
            disabled
              ? 'bg-gray-400 border-gray-600'
              : isDark
                ? 'bg-white border-[#18F2A4] ring-2 ring-[#18F2A4]/30'
                : 'bg-white border-emerald-600 ring-2 ring-emerald-400/30'
          }`}
          style={{ left: `${percentage}%` }}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#18F2A4]' : 'bg-emerald-600'}`} />
        </div>
      </div>

      {/* Preset Quick Select Ticks */}
      {presets && presets.length > 0 && (
        <div className="flex gap-1.5 justify-between pt-0.5">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onChange(p.value)}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                value === p.value
                  ? (isDark ? 'bg-[#18F2A4] text-black border-[#18F2A4]' : 'bg-emerald-600 text-white border-emerald-600')
                  : (isDark ? 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 border-gray-300 text-slate-600 hover:text-slate-900')
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
