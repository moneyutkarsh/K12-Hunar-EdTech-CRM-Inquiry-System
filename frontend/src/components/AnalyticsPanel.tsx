import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ChevronDown, ChevronUp, BarChart2, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { api } from '../lib/api';

interface DailyData {
  date: string;
  count: number;
}

interface CategoryData {
  category: string;
  count: number;
}

interface AnalyticsPayload {
  daily: DailyData[];
  byCategory: CategoryData[];
  byUserType: { userType: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Scholarship: '#FFD60A',
  Concert: '#FB923C',
  Admission: '#60A5FA',
  'General Query': '#A78BFA',
};

const DEFAULT_COLORS = ['#FFD60A', '#FB923C', '#60A5FA', '#A78BFA', '#34D399'];

export const AnalyticsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadAnalytics() {
      try {
        const res = await api.get('/inquiries/analytics');
        if (isMounted) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadAnalytics();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="glass-card mb-8 overflow-hidden transition-all duration-300">
      {/* Header with Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFD60A]/10 border border-[#FFD60A]/20 flex items-center justify-center text-[#FFD60A]">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
              <span>Trends & Inquiries Breakdown</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#FFD60A] font-semibold">
                Last 30 Days
              </span>
            </h2>
            <p className="text-xs text-[#A3A3A3]">Volume trajectory and interest distribution</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#A3A3A3] font-medium">
          <span>{isOpen ? 'Collapse' : 'Expand Analytics'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-4 sm:p-6 pt-0 border-t border-white/5 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {isLoading ? (
            <div className="col-span-3 py-16 flex items-center justify-center text-xs text-[#A3A3A3]">
              <div className="w-5 h-5 border-2 border-[#FFD60A] border-t-transparent rounded-full animate-spin mr-2.5" />
              Loading real-time analytics...
            </div>
          ) : !data ? (
            <div className="col-span-3 py-8 text-center text-xs text-[#A3A3A3]">
              Analytics data unavailable.
            </div>
          ) : (
            <>
              {/* 30-Day Inquiries Volume Trend (2 columns on desktop) */}
              <div className="lg:col-span-2 bg-[#0C0C0C]/80 p-4 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#FFD60A]" />
                    Inquiries Trajectory (Daily)
                  </span>
                  <span className="text-[11px] text-[#A3A3A3]">Zero-gap timeseries</span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.daily}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFD60A" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#FFD60A" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        stroke="#6B6B6B"
                        fontSize={10}
                        tickLine={false}
                        tickFormatter={(val) => {
                          const parts = val.split('-');
                          return `${parts[1]}/${parts[2]}`;
                        }}
                      />
                      <YAxis
                        stroke="#6B6B6B"
                        fontSize={10}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#141414',
                          borderColor: '#333',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#F5F5F5',
                        }}
                        labelFormatter={(label) => `Date: ${label}`}
                        formatter={(value: any) => [`${value} Inquiries`, 'Count']}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#FFD60A"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#yellowGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Distribution Donut Chart */}
              <div className="bg-[#0C0C0C]/80 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-1.5">
                    <PieIcon className="w-3.5 h-3.5 text-[#FB923C]" />
                    By Category
                  </span>
                  <span className="text-[11px] text-[#A3A3A3]">Inquiries split</span>
                </div>

                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.byCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="category"
                      >
                        {data.byCategory.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.category || index}`}
                            fill={CATEGORY_COLORS[entry.category] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#141414',
                          borderColor: '#333',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#F5F5F5',
                        }}
                        formatter={(value: any, name: any) => [`${value} inquiries`, name]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span className="text-[10px] text-[#A3A3A3]">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
