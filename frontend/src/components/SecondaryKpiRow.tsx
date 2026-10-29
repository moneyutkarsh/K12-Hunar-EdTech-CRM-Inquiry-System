import React from 'react';
import type { SecondaryKpis } from '../types/inquiry';
import { Calendar, Timer, CheckCircle, Flame } from 'lucide-react';

interface SecondaryKpiRowProps {
  kpis: SecondaryKpis | null;
  isLoading?: boolean;
}

export const SecondaryKpiRow: React.FC<SecondaryKpiRowProps> = ({ kpis, isLoading }) => {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse h-16" />
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "Today's Inquiries",
      value: `${kpis.todayCount}`,
      subtext: 'Since midnight IST',
      icon: Calendar,
      accent: 'text-[#FFD60A]',
    },
    {
      label: 'Avg First Response',
      value: `${kpis.avgFirstResponseHours}h`,
      subtext: 'Audit log median',
      icon: Timer,
      accent: 'text-[#60A5FA]',
    },
    {
      label: 'Resolution Rate',
      value: `${kpis.resolutionRate}%`,
      subtext: 'Overall inquiries resolved',
      icon: CheckCircle,
      accent: 'text-[#4ADE80]',
    },
    {
      label: 'Busiest Category (30d)',
      value: kpis.busiestCategory.name,
      subtext: `${kpis.busiestCategory.count} inquiries`,
      icon: Flame,
      accent: 'text-[#FB923C]',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="p-3 rounded-xl bg-[#0F0F0F] border border-white/5 flex items-center justify-between hover:border-white/15 transition-all group"
          >
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A3A3A3] block truncate">
                {item.label}
              </span>
              <div className="text-base font-bold text-[#F5F5F5] tracking-tight truncate mt-0.5">
                {item.value}
              </div>
              <span className="text-[10px] text-[#A3A3A3]/70 block truncate">
                {item.subtext}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Icon className={`w-4 h-4 ${item.accent}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SecondaryKpiRow;
