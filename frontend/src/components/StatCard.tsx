import React, { useEffect, useState, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  badgeBg: string;
  delta?: number;
  rangeLabel?: string;
  sparklineData?: number[];
  accentColor?: string;
  onClickFilter?: () => void;
  isActive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  colorClass,
  badgeBg,
  delta,
  rangeLabel = '7d',
  sparklineData = [],
  accentColor = '#FFD60A',
  onClickFilter,
  isActive = false,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Animated Count-Up effect
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 600; // ms
    const incrementTime = 25;
    const step = Math.max(1, Math.ceil(end / (duration / incrementTime)));

    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  // Cursor spotlight handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  // SVG Sparkline calculation
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const width = 80;
    const height = 28;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;

    const points = sparklineData.map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${points.join(' L ')}`;

    return (
      <svg
        width={width}
        height={height}
        className="overflow-visible ml-auto"
        aria-hidden="true"
      >
        <path
          d={pathD}
          fill="none"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
          style={{ opacity: 0.85 }}
        />
        {/* Active endpoint dot */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].split(',')[0]}
            cy={points[points.length - 1].split(',')[1]}
            r="2.5"
            fill={accentColor}
          />
        )}
      </svg>
    );
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClickFilter}
      role={onClickFilter ? 'button' : undefined}
      tabIndex={onClickFilter ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClickFilter && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClickFilter();
        }
      }}
      className={`glass-card p-5 relative overflow-hidden group transition-all duration-200 select-none ${
        onClickFilter ? 'cursor-pointer hover:border-white/20 hover:-translate-y-0.5' : ''
      } ${isActive ? 'ring-2 ring-[#FFD60A]/60 bg-white/[0.04]' : ''}`}
      style={{
        background:
          mousePos
            ? `radial-gradient(220px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 214, 10, 0.08), transparent 80%)`
            : undefined,
      }}
    >
      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
          {label}
        </span>
        <div className={`p-2 rounded-xl ${badgeBg} transition-transform group-hover:scale-105`}>
          <Icon className={`w-4 h-4 ${colorClass}`} />
        </div>
      </div>

      {/* Middle row: Big number & Sparkline */}
      <div className="flex items-end justify-between gap-2 relative z-10">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-[#F5F5F5]">
              {displayValue}
            </span>
            <span className="text-xs text-[#A3A3A3]">inquiries</span>
          </div>

          {/* Delta Chip */}
          {delta !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  delta > 0
                    ? 'bg-[#4ADE80]/15 text-[#4ADE80]'
                    : delta < 0
                    ? 'bg-[#FB923C]/15 text-[#FB923C]'
                    : 'bg-white/10 text-[#A3A3A3]'
                }`}
              >
                {delta > 0 ? `▲ ${delta}%` : delta < 0 ? `▼ ${Math.abs(delta)}%` : '• 0%'}
              </span>
              <span className="text-[10px] text-[#A3A3A3]/80">vs prev {rangeLabel}</span>
            </div>
          )}
        </div>

        {/* 14-day Mini Sparkline */}
        <div className="pb-1">{renderSparkline()}</div>
      </div>

      {/* Subtle indicator bottom accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <div
          className="h-full transition-all duration-300 w-full"
          style={{ backgroundColor: accentColor, opacity: isActive ? 1 : 0.7 }}
        />
      </div>
    </div>
  );
};

export default StatCard;
