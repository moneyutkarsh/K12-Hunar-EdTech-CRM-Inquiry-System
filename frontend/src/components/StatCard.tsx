import React, { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  badgeBg: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  colorClass,
  badgeBg,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

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

  return (
    <div className="glass-card p-5 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[#A3A3A3]">
          {label}
        </span>
        <div className={`p-2 rounded-xl ${badgeBg}`}>
          <Icon className={`w-4 h-4 ${colorClass}`} />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-[#F5F5F5]">
          {displayValue}
        </span>
        <span className="text-xs text-[#A3A3A3]">inquiries</span>
      </div>

      {/* Subtle indicator bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <div className={`h-full ${colorClass.replace('text-', 'bg-')} opacity-60 w-full`} />
      </div>
    </div>
  );
};

export default StatCard;
