import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  ChevronDown,
  ChevronUp,
  BarChart2,
  TrendingUp,
  PieChart as PieIcon,
  Users,
  Filter,
  Grid,
} from 'lucide-react';
import { api } from '../lib/api';

interface DailyData {
  date: string;
  count: number;
  admission?: number;
  scholarship?: number;
  concert?: number;
  general?: number;
}

interface CategoryData {
  category: string;
  count: number;
  percentage?: number;
}

interface UserTypeData {
  userType: string;
  count: number;
  percentage?: number;
}

interface StatusFunnelItem {
  stage: string;
  count: number;
  percentage: number;
}

interface HeatmapItem {
  day: number;
  hour: number;
  count: number;
}

interface AnalyticsPayload {
  range: string;
  daily: DailyData[];
  previousDaily?: { date: string; count: number }[];
  byCategory: CategoryData[];
  byUserType: UserTypeData[];
  byStatus: { status: string; count: number; percentage?: number }[];
  funnel?: StatusFunnelItem[];
  heatmap?: HeatmapItem[];
}

interface AnalyticsPanelProps {
  onCategoryFilter?: (category: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Scholarship: '#FFD60A',
  Concert: '#FB923C',
  Admission: '#60A5FA',
  'General Query': '#A78BFA',
};

const DEFAULT_COLORS = ['#FFD60A', '#FB923C', '#60A5FA', '#A78BFA', '#34D399'];
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ onCategoryFilter }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [showPreviousPeriod, setShowPreviousPeriod] = useState<boolean>(false);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [hoveredSlice, setHoveredSlice] = useState<{ name: string; count: number } | null>(null);
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadAnalytics() {
      setIsLoading(true);
      try {
        const res = await api.get(`/inquiries/analytics?range=${range}`);
        if (isMounted) {
          setData(res.data.data || res.data);
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
  }, [range]);

  // Merge current and previous daily data for comparison
  const combinedDailyData = useMemo(() => {
    if (!data?.daily) return [];
    return data.daily.map((item, idx) => {
      const prev = data.previousDaily?.[idx];
      return {
        ...item,
        prevCount: prev ? prev.count : 0,
      };
    });
  }, [data]);

  // Total count for donut center label
  const totalCategoryInquiries = useMemo(() => {
    if (!data?.byCategory) return 0;
    return data.byCategory.reduce((sum, item) => sum + item.count, 0);
  }, [data]);

  // Max count in heatmap for cell opacity normalization
  const maxHeatmapCount = useMemo(() => {
    if (!data?.heatmap || data.heatmap.length === 0) return 1;
    return Math.max(...data.heatmap.map((h) => h.count), 1);
  }, [data]);

  return (
    <div className="glass-card mb-8 overflow-hidden transition-all duration-300">
      {/* Header with Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
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
                {range === '7d' ? 'Last 7 Days' : range === '90d' ? 'Last 90 Days' : 'Last 30 Days'}
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
        <div className="p-4 sm:p-6 pt-0 border-t border-white/5 space-y-6 animate-fadeIn">
          {isLoading ? (
            <div className="py-16 flex items-center justify-center text-xs text-[#A3A3A3]">
              <div className="w-5 h-5 border-2 border-[#FFD60A] border-t-transparent rounded-full animate-spin mr-2.5" />
              Loading real-time analytics...
            </div>
          ) : !data ? (
            <div className="py-8 text-center text-xs text-[#A3A3A3]">
              Analytics data unavailable.
            </div>
          ) : (
            <>
              {/* Controls bar: Range switcher & previous period toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {/* 7d / 30d / 90d Pill Switcher */}
                <div className="inline-flex rounded-lg bg-[#141414] p-1 border border-white/10 text-xs">
                  {(['7d', '30d', '90d'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRange(r)}
                      className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        range === r
                          ? 'bg-[#FFD60A] text-[#0A0A0A] shadow-sm'
                          : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
                      }`}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Sub-toggles: Previous Period & Peak Hours Heatmap */}
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 text-[#A3A3A3] hover:text-[#F5F5F5] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showPreviousPeriod}
                      onChange={(e) => setShowPreviousPeriod(e.target.checked)}
                      className="rounded border-white/20 bg-[#171717] text-[#FFD60A] focus:ring-0 cursor-pointer"
                    />
                    <span>Compare previous period</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                      showHeatmap
                        ? 'bg-[#FFD60A]/10 border-[#FFD60A]/40 text-[#FFD60A]'
                        : 'border-white/10 text-[#A3A3A3] hover:text-[#F5F5F5]'
                    }`}
                  >
                    <Grid className="w-3 h-3" />
                    <span>Peak Hours</span>
                  </button>
                </div>
              </div>

              {/* Main Charts Grid: Trajectory (2 cols) & Donut (1 col) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trajectory Line Chart */}
                <div className="lg:col-span-2 bg-[#0C0C0C]/80 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#FFD60A]" />
                      Inquiries Trajectory ({range.toUpperCase()})
                    </span>
                    <div className="flex items-center gap-3 text-[11px] text-[#A3A3A3]">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-0.5 bg-[#FFD60A] inline-block" /> Current
                      </span>
                      {showPreviousPeriod && (
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-0.5 bg-white/40 border-t border-dashed border-white inline-block" /> Prev
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    {combinedDailyData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-[#A3A3A3]">
                        No inquiry volume recorded in this timeframe.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={combinedDailyData}
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
                            content={({ active, payload, label }) => {
                              if (!active || !payload || !payload.length) return null;
                              const currentVal = payload[0]?.value;
                              const row = payload[0]?.payload as DailyData;
                              return (
                                <div className="p-2.5 rounded-lg bg-[#141414] border border-white/10 shadow-xl space-y-1 text-xs">
                                  <div className="font-semibold text-[#F5F5F5] border-b border-white/10 pb-1">
                                    Date: {label}
                                  </div>
                                  <div className="text-[#FFD60A] font-bold">
                                    Total: {currentVal} inquiries
                                  </div>
                                  {row.admission !== undefined && (
                                    <div className="text-[11px] text-[#A3A3A3] grid grid-cols-2 gap-x-2 pt-1">
                                      <span>Admission: {row.admission}</span>
                                      <span>Scholarship: {row.scholarship}</span>
                                      <span>Concert: {row.concert}</span>
                                      <span>General: {row.general}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#FFD60A"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#yellowGradient)"
                            isAnimationActive={true}
                            animationDuration={600}
                          />
                          {showPreviousPeriod && (
                            <Line
                              type="monotone"
                              dataKey="prevCount"
                              stroke="#A3A3A3"
                              strokeWidth={1.5}
                              strokeDasharray="4 4"
                              dot={false}
                              isAnimationActive={false}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Donut Chart with Center Label & Hover Dimming */}
                <div className="bg-[#0C0C0C]/80 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-1.5">
                      <PieIcon className="w-3.5 h-3.5 text-[#FB923C]" />
                      By Category
                    </span>
                    <span className="text-[10px] text-[#A3A3A3]">Click to filter</span>
                  </div>

                  <div className="h-52 w-full relative flex items-center justify-center">
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
                          onClick={(entry: any) => {
                            if (onCategoryFilter && entry?.category) {
                              onCategoryFilter(entry.category);
                            }
                          }}
                          onMouseEnter={(_, index) => {
                            const entry = data.byCategory[index];
                            if (entry) {
                              setHoveredSlice({ name: entry.category, count: entry.count });
                            }
                          }}
                          onMouseLeave={() => setHoveredSlice(null)}
                          className="cursor-pointer"
                        >
                          {data.byCategory.map((entry, index) => {
                            const isHovered = hoveredSlice?.name === entry.category;
                            const isAnyHovered = hoveredSlice !== null;
                            const opacity = isAnyHovered ? (isHovered ? 1 : 0.35) : 1;
                            return (
                              <Cell
                                key={`cell-${entry.category || index}`}
                                fill={CATEGORY_COLORS[entry.category] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                                opacity={opacity}
                                className="transition-opacity duration-200"
                              />
                            );
                          })}
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
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Center Label (Total count or hovered slice) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-extrabold text-[#F5F5F5] leading-tight">
                        {hoveredSlice ? hoveredSlice.count : totalCategoryInquiries}
                      </span>
                      <span className="text-[10px] text-[#A3A3A3] max-w-[80px] text-center truncate">
                        {hoveredSlice ? hoveredSlice.name : 'Total'}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Legend with counts & percentages */}
                  <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/5 text-[11px]">
                    {data.byCategory.map((cat, idx) => {
                      const color = CATEGORY_COLORS[cat.category] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                      return (
                        <button
                          key={cat.category}
                          type="button"
                          onClick={() => onCategoryFilter && onCategoryFilter(cat.category)}
                          className="flex items-center justify-between p-1 rounded hover:bg-white/5 transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="truncate text-[#A3A3A3]">{cat.category}</span>
                          </div>
                          <span className="font-semibold text-[#F5F5F5] ml-1">{cat.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Secondary Visuals: User Type Distribution & Status Funnel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Horizontal Bar Chart: By User Type */}
                <div className="bg-[#0C0C0C]/80 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#60A5FA]" />
                      By User Type
                    </span>
                    <span className="text-[11px] text-[#A3A3A3]">Parent / Student / School</span>
                  </div>

                  <div className="h-36 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={data.byUserType}
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <XAxis type="number" stroke="#6B6B6B" fontSize={10} tickLine={false} />
                        <YAxis
                          type="category"
                          dataKey="userType"
                          stroke="#A3A3A3"
                          fontSize={11}
                          tickLine={false}
                          width={65}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#141414',
                            borderColor: '#333',
                            borderRadius: '8px',
                            fontSize: '11px',
                            color: '#F5F5F5',
                          }}
                          formatter={(value: any) => [`${value} inquiries`, 'Count']}
                        />
                        <Bar
                          dataKey="count"
                          fill="#60A5FA"
                          radius={[0, 4, 4, 0]}
                          barSize={18}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status Funnel: Total -> Engaged -> Resolved */}
                <div className="bg-[#0C0C0C]/80 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-[#4ADE80]" />
                      Inquiry Conversion Funnel
                    </span>
                    <span className="text-[11px] text-[#A3A3A3]">Dropoff & resolution</span>
                  </div>

                  <div className="space-y-2.5 flex-1 flex flex-col justify-center">
                    {(data.funnel || []).map((step, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#A3A3A3] font-medium">{step.stage}</span>
                          <span className="text-[#F5F5F5] font-bold">
                            {step.count} ({step.percentage}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(5, step.percentage)}%`,
                              backgroundColor: idx === 0 ? '#FFD60A' : idx === 1 ? '#FB923C' : '#4ADE80',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Peak Hours Heatmap (IST Weekday x Hour) if toggled */}
              {showHeatmap && data.heatmap && (
                <div className="bg-[#0C0C0C]/80 p-4 rounded-xl border border-white/5 animate-fadeIn">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-[#FFD60A]" />
                      Inquiry Peak Hours Heatmap (IST Timezone)
                    </span>
                    <span className="text-[11px] text-[#A3A3A3]">High inquiry intake windows</span>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="min-w-[600px] space-y-1 text-[10px]">
                      {/* Hours header */}
                      <div className="grid grid-cols-25 gap-1 text-center text-[#A3A3A3] pb-1">
                        <div className="text-left font-medium">Day</div>
                        {Array.from({ length: 24 }).map((_, h) => (
                          <div key={h} className="truncate">
                            {h}h
                          </div>
                        ))}
                      </div>

                      {/* Weekday rows */}
                      {DAYS_OF_WEEK.map((dayName, dIdx) => (
                        <div key={dayName} className="grid grid-cols-25 gap-1 items-center">
                          <div className="text-left font-semibold text-[#A3A3A3]">{dayName}</div>
                          {Array.from({ length: 24 }).map((_, h) => {
                            const entry = data.heatmap?.find((item) => item.day === dIdx && item.hour === h);
                            const count = entry ? entry.count : 0;
                            const opacity = count > 0 ? Math.min(1, 0.2 + (count / maxHeatmapCount) * 0.8) : 0.04;
                            return (
                              <div
                                key={h}
                                title={`${dayName} at ${h}:00 IST: ${count} inquiries`}
                                className="h-5 rounded-sm flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                                style={{
                                  backgroundColor: count > 0 ? `rgba(255, 214, 10, ${opacity})` : 'rgba(255, 255, 255, 0.03)',
                                  color: count > 0 ? '#0A0A0A' : 'transparent',
                                  fontWeight: 'bold',
                                }}
                              >
                                {count > 0 ? count : ''}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
