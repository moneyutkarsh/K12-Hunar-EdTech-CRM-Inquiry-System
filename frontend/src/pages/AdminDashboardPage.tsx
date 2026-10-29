import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Inquiry, InquiryStats, InquiryStatus, PaginationMeta, SecondaryKpis } from '../types/inquiry';
import StatCard from '../components/StatCard';
import InquiryTable from '../components/InquiryTable';
import InquiryBoard from '../components/InquiryBoard';
import InquiryDrawer from '../components/InquiryDrawer';
import AnalyticsPanel from '../components/AnalyticsPanel';
import CommandPalette from '../components/CommandPalette';
import NeedsAttentionStrip from '../components/NeedsAttentionStrip';
import SecondaryKpiRow from '../components/SecondaryKpiRow';
import ShortcutsModal from '../components/ShortcutsModal';
import {
  Inbox,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Download,
  RotateCcw,
  Table as TableIcon,
  Kanban,
  LayoutDashboard,
  LogOut,
  Calendar,
  Sparkles,
  Command,
  PanelLeftClose,
  PanelLeftOpen,
  Keyboard,
  X,
  Flame,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { admin, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active View: 'table' | 'board'
  const [activeView, setActiveView] = useState<'table' | 'board'>('table');

  // Sidebar Collapsed State (persisted)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('k12_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('k12_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Stats state
  const [stats, setStats] = useState<InquiryStats>({
    total: 0,
    new: 0,
    inProgress: 0,
    resolved: 0,
  });

  // Secondary KPIs state
  const [secondaryKpis, setSecondaryKpis] = useState<SecondaryKpis | null>(null);
  const [isLoadingKpis, setIsLoadingKpis] = useState<boolean>(false);

  // Inquiries and pagination state
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const previousTotalRef = useRef<number | null>(null);

  // Filters read directly from URL query params
  const categoryFilter = searchParams.get('category') || '';
  const userTypeFilter = searchParams.get('userType') || '';
  const statusFilter = searchParams.get('status') || '';
  const searchQuery = searchParams.get('search') || '';
  const fromParam = searchParams.get('from') || '';
  const toParam = searchParams.get('to') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentLimit = parseInt(searchParams.get('limit') || '10', 10);
  const sortOrder = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

  // Local state for search input to handle 400ms debounce
  const [searchInput, setSearchInput] = useState<string>(searchQuery);

  // Synchronize local search input when URL changes externally
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Debounce search update to URL (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== searchQuery) {
        updateQueryParam({ search: searchInput || undefined, page: '1' });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Helper to update URL search parameters
  const updateQueryParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value === undefined || value === '') {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        });
        return next;
      });
    },
    [setSearchParams]
  );

  // Dynamic Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // Fetch Inquiries from Backend
  const fetchInquiries = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: currentLimit,
        sort: 'createdAt',
        order: sortOrder,
      };

      if (categoryFilter) params.category = categoryFilter;
      if (userTypeFilter) params.userType = userTypeFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery && searchQuery.trim().length >= 2) params.search = searchQuery.trim();
      if (fromParam) params.from = fromParam;
      if (toParam) params.to = toParam;

      const res = await api.get('/inquiries', { params });
      const items = res.data.data || res.data;
      setInquiries(Array.isArray(items) ? items : []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch {
      setIsError(true);
      toast.error('Failed to load inquiries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, userTypeFilter, statusFilter, searchQuery, fromParam, toParam, currentPage, currentLimit, sortOrder]);

  // Fetch Stats from Backend
  const fetchStats = useCallback(
    async (isPolling = false) => {
      try {
        const res = await api.get('/inquiries/stats?range=7d');
        const raw = res.data.data || res.data;
        const total = Number(raw.total ?? 0);
        const newCount = Number(raw.new ?? raw.byStatus?.New ?? 0);
        const inProgress = Number(raw.inProgress ?? raw.byStatus?.InProgress ?? 0);
        const resolved = Number(raw.resolved ?? raw.byStatus?.Resolved ?? 0);

        const incoming: InquiryStats = {
          total,
          new: newCount,
          inProgress,
          resolved,
          range: raw.range,
          sparklines: raw.sparklines,
          deltas: raw.deltas,
          previous: raw.previous,
          deltaPct: raw.deltaPct,
        };

        if (
          isPolling &&
          previousTotalRef.current !== null &&
          incoming.total > previousTotalRef.current
        ) {
          const diff = incoming.total - previousTotalRef.current;
          toast.info(`${diff} new inquiry received!`, {
            action: {
              label: 'Refresh',
              onClick: () => {
                fetchInquiries();
                fetchStats(false);
                fetchKpis();
              },
            },
          });
        }
        previousTotalRef.current = incoming.total;
        setStats(incoming);
      } catch {
        // Handled silently
      }
    },
    [fetchInquiries]
  );

  // Fetch Secondary KPIs
  const fetchKpis = useCallback(async () => {
    setIsLoadingKpis(true);
    try {
      const res = await api.get('/inquiries/kpis');
      const raw = res.data.data || res.data;
      setSecondaryKpis(raw);
    } catch {
      // Handled silently
    } finally {
      setIsLoadingKpis(false);
    }
  }, []);

  // Trigger loads on parameter changes
  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  useEffect(() => {
    fetchStats(false);
    fetchKpis();
  }, [fetchStats, fetchKpis]);

  // New-inquiry awareness: poll /stats every 30s while tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchStats(true);
        fetchKpis();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchKpis]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside input/textarea
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '?' && !isInput) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        const el = document.getElementById('dashboard-search-input');
        if (el) el.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Custom Event Listeners for Header Actions
  useEffect(() => {
    const handleRefresh = () => {
      fetchInquiries();
      fetchStats(false);
      fetchKpis();
    };

    const handleOpenInquiry = (e: any) => {
      if (e.detail) {
        setSelectedInquiry(e.detail);
        setIsDrawerOpen(true);
      }
    };

    window.addEventListener('refresh-dashboard', handleRefresh);
    window.addEventListener('open-inquiry', handleOpenInquiry);

    return () => {
      window.removeEventListener('refresh-dashboard', handleRefresh);
      window.removeEventListener('open-inquiry', handleOpenInquiry);
    };
  }, [fetchInquiries, fetchStats, fetchKpis]);

  // Action handler for Command Palette
  const handleCommandAction = (actionId: string, payload?: string) => {
    switch (actionId) {
      case 'focus_search': {
        const el = document.getElementById('dashboard-search-input');
        if (el) el.focus();
        break;
      }
      case 'view_table':
        setActiveView('table');
        break;
      case 'view_board':
        setActiveView('board');
        break;
      case 'export_csv':
        handleExportCsv();
        break;
      case 'reset_filters':
        handleClearFilters();
        break;
      case 'filter_cat_scholarship':
      case 'filter_cat_concert':
      case 'filter_cat_admission':
      case 'filter_cat_general':
        if (payload) updateQueryParam({ category: payload, page: '1' });
        break;
      case 'filter_status_new':
      case 'filter_status_progress':
      case 'filter_status_resolved':
        if (payload) updateQueryParam({ status: payload, page: '1' });
        break;
      case 'logout':
        logout();
        break;
    }
  };

  // Status Update Handler
  const handleStatusChange = async (id: string, newStatus: InquiryStatus) => {
    const previousInquiries = [...inquiries];
    const previousSelected = selectedInquiry;

    setInquiries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    if (selectedInquiry && selectedInquiry.id === id) {
      setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    setIsUpdatingStatus(true);
    try {
      await api.patch(`/inquiries/${id}/status`, { status: newStatus });
      toast.success(`Inquiry status updated to "${newStatus}"`);
      fetchStats();
      fetchKpis();
    } catch (err: any) {
      setInquiries(previousInquiries);
      setSelectedInquiry(previousSelected);
      const errMsg = err.response?.data?.error?.message || 'Failed to update status.';
      toast.error(errMsg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Bulk Status Update Handler (U3f)
  const handleBulkStatusChange = async (ids: string[], newStatus: InquiryStatus) => {
    try {
      await api.patch('/inquiries/bulk-status', { ids, status: newStatus });
      toast.success(`Updated ${ids.length} inquiries to "${newStatus}"`);
      fetchInquiries();
      fetchStats();
      fetchKpis();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update selected inquiries');
    }
  };

  // Bulk CSV Export Handler (U3f)
  const handleBulkExport = async (ids: string[]) => {
    try {
      const res = await api.get('/inquiries/export', {
        params: { ids: ids.join(',') },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `k12_hunar_selected_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Exported ${ids.length} selected inquiries successfully!`);
    } catch {
      toast.error('Failed to export selected inquiries');
    }
  };

  // Full CSV Export Handler
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params: Record<string, string> = {
        sort: 'createdAt',
        order: sortOrder,
      };
      if (categoryFilter) params.category = categoryFilter;
      if (userTypeFilter) params.userType = userTypeFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery && searchQuery.trim().length >= 2) params.search = searchQuery.trim();
      if (fromParam) params.from = fromParam;
      if (toParam) params.to = toParam;

      const res = await api.get('/inquiries/export', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `k12_hunar_inquiries_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Inquiries exported successfully!');
    } catch {
      toast.error('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams({ page: '1' }));
  };

  const hasActiveFilters = Boolean(
    categoryFilter || userTypeFilter || statusFilter || searchQuery || fromParam || toParam
  );

  // Drawer Navigation Helpers (U5a)
  const currentInquiryIndex = selectedInquiry
    ? inquiries.findIndex((i) => i.id === selectedInquiry.id)
    : -1;
  const hasPrev = currentInquiryIndex > 0;
  const hasNext = currentInquiryIndex >= 0 && currentInquiryIndex < inquiries.length - 1;

  const handleNavigatePrev = () => {
    if (hasPrev) {
      setSelectedInquiry(inquiries[currentInquiryIndex - 1]);
    }
  };

  const handleNavigateNext = () => {
    if (hasNext) {
      setSelectedInquiry(inquiries[currentInquiryIndex + 1]);
    }
  };

  // Quick Date Range Helpers
  const applyDateRange = (days: number | 'today') => {
    if (days === 'today') {
      const today = new Date().toISOString().split('T')[0];
      updateQueryParam({ from: today, to: undefined, page: '1' });
    } else {
      const d = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
      updateQueryParam({ from: d, to: undefined, page: '1' });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Slim Desktop Sidebar (U6a) */}
      <aside
        className={`hidden lg:flex flex-col border-r border-white/10 bg-[#0A0A0A]/90 p-4 shrink-0 justify-between transition-all duration-200 ${
          isSidebarCollapsed ? 'w-20 items-center' : 'w-64'
        }`}
      >
        <div className="space-y-6 w-full">
          {/* Logo badge & Collapse Toggle */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#FFD60A] text-[#0A0A0A] flex items-center justify-center font-bold text-sm shrink-0">
                H
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#F5F5F5] leading-none truncate">K12 Hunar</p>
                  <p className="text-[10px] text-[#A3A3A3] mt-0.5 truncate">Management Portal</p>
                </div>
              )}
            </div>

            <button
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1 rounded-lg text-[#A3A3A3] hover:text-[#FFD60A] hover:bg-white/5 transition-colors cursor-pointer"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Items (Active in black pill with yellow border) */}
          <nav className="space-y-1.5" aria-label="Sidebar Navigation">
            <button
              onClick={() => setActiveView('table')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'table'
                  ? 'bg-[#000000] text-[#FFD60A] border border-[#FFD60A]/40 shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5'
              } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
              title="Inquiries Table"
            >
              <LayoutDashboard className="w-4 h-4 text-[#FFD60A] shrink-0" />
              {!isSidebarCollapsed && <span>Inquiries Table</span>}
            </button>

            <button
              onClick={() => setActiveView('board')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'board'
                  ? 'bg-[#000000] text-[#FFD60A] border border-[#FFD60A]/40 shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5'
              } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
              title="Pipeline Board"
            >
              <Kanban className="w-4 h-4 text-[#FFD60A] shrink-0" />
              {!isSidebarCollapsed && <span>Pipeline Board</span>}
            </button>
          </nav>

          {/* U6a (i): Quick Views List */}
          {!isSidebarCollapsed && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#A3A3A3] px-2 block">
                Quick Views
              </span>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    handleClearFilters();
                    setActiveView('table');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    !hasActiveFilters
                      ? 'bg-white/10 text-[#FFD60A] font-medium'
                      : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5'
                  }`}
                >
                  <span>All Inquiries</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#A3A3A3]">
                    {stats.total}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    applyDateRange('today');
                    updateQueryParam({ status: 'New' });
                    setActiveView('table');
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFD60A]" />
                    <span>New Today</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFD60A]/10 text-[#FFD60A] font-semibold">
                    {secondaryKpis?.todayCount ?? stats.new}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateQueryParam({ status: 'New', order: 'asc', page: '1' });
                    setActiveView('table');
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FB923C]" />
                    <span>Needs Attention</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FB923C]/10 text-[#FB923C] font-semibold">
                    {secondaryKpis?.needsAttentionCount ?? 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    applyDateRange(7);
                    updateQueryParam({ status: 'Resolved' });
                    setActiveView('table');
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                    <span>Resolved (7d)</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4ADE80]/10 text-[#4ADE80] font-semibold">
                    {stats.resolved}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* U6a (ii): Compact Today Card */}
          {!isSidebarCollapsed && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#F5F5F5]">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#FFD60A]" />
                  <span>Today's Pulse</span>
                </span>
                <span className="text-[10px] text-[#A3A3A3]">IST</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-base font-bold text-[#FFD60A] block leading-tight">
                    {secondaryKpis?.todayCount ?? 0}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-[#A3A3A3]">Received</span>
                </div>
                <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-base font-bold text-[#4ADE80] block leading-tight">
                    {secondaryKpis?.resolutionRate ?? 0}%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-[#A3A3A3]">Resolved</span>
                </div>
              </div>
            </div>
          )}

          {/* U6a (iii): Keyboard Shortcuts Hint Card */}
          {!isSidebarCollapsed && (
            <div
              onClick={() => setIsShortcutsOpen(true)}
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all cursor-pointer flex items-center justify-between text-xs text-[#A3A3A3] hover:text-[#F5F5F5] group"
              title="Click to view all keyboard shortcuts"
            >
              <div className="flex items-center gap-2">
                <Keyboard className="w-3.5 h-3.5 text-[#FFD60A]" />
                <span className="text-[11px]">Shortcuts</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-[#FFD60A] group-hover:bg-[#FFD60A] group-hover:text-black transition-colors">
                ?
              </kbd>
            </div>
          )}
        </div>

        {/* Admin profile and logout */}
        <div className="pt-4 border-t border-white/10 space-y-3 w-full">
          {!isSidebarCollapsed ? (
            <div className="px-2">
              <p className="text-xs font-medium text-[#F5F5F5] truncate">{admin?.email}</p>
              <p className="text-[10px] text-[#FFD60A] font-medium">Administrator</p>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-[#FFD60A] mx-auto">
              A
            </div>
          )}
          <button
            onClick={logout}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#A3A3A3] hover:text-[#F87171] hover:bg-white/5 transition-colors cursor-pointer ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
              {greeting}, <span className="text-[#FFD60A]">Admin</span>
            </h1>
            <p className="text-xs text-[#A3A3A3] flex items-center gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5 text-[#FFD60A]" />
              <span>{todayFormatted}</span>
            </p>
          </div>

          {/* Header Controls: Command Palette and View Switcher */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] border border-white/10 transition-colors cursor-pointer"
              title="Open Command Palette (Ctrl+K / Cmd+K)"
            >
              <Command className="w-3.5 h-3.5 text-[#FFD60A]" />
              <span>Actions</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-[#F5F5F5]">
                ⌘K
              </kbd>
            </button>

            {/* View Mode Toggle: Table vs Board */}
            <div className="flex items-center gap-1.5 p-1 bg-[#141414] rounded-xl border border-white/10">
              <button
                onClick={() => setActiveView('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'table'
                    ? 'bg-[#FFD60A] text-[#0A0A0A] shadow-sm'
                    : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setActiveView('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'board'
                    ? 'bg-[#FFD60A] text-[#0A0A0A] shadow-sm'
                    : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Board</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards Grid (U1a) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
          <StatCard
            label="Total Inquiries"
            value={stats.total}
            icon={Inbox}
            colorClass="text-[#F5F5F5]"
            badgeBg="bg-white/5"
            accentColor="#F5F5F5"
            delta={stats.deltaPct}
            rangeLabel="7d"
            sparklineData={stats.sparklines?.total}
            onClickFilter={() => {
              handleClearFilters();
              setActiveView('table');
            }}
          />
          <StatCard
            label="New / Unread"
            value={stats.new}
            icon={Sparkles}
            colorClass="text-[#FFD60A]"
            badgeBg="bg-[#FFD60A]/10"
            accentColor="#FFD60A"
            delta={stats.deltas?.new}
            rangeLabel="7d"
            sparklineData={stats.sparklines?.new}
            onClickFilter={() => {
              updateQueryParam({ status: 'New', page: '1' });
              setActiveView('table');
            }}
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            icon={Clock}
            colorClass="text-[#FB923C]"
            badgeBg="bg-[#FB923C]/10"
            accentColor="#FB923C"
            delta={stats.deltas?.inProgress}
            rangeLabel="7d"
            sparklineData={stats.sparklines?.inProgress}
            onClickFilter={() => {
              updateQueryParam({ status: 'In Progress', page: '1' });
              setActiveView('table');
            }}
          />
          <StatCard
            label="Resolved"
            value={stats.resolved}
            icon={CheckCircle2}
            colorClass="text-[#4ADE80]"
            badgeBg="bg-[#4ADE80]/10"
            accentColor="#4ADE80"
            delta={stats.deltas?.resolved}
            rangeLabel="7d"
            sparklineData={stats.sparklines?.resolved}
            onClickFilter={() => {
              updateQueryParam({ status: 'Resolved', page: '1' });
              setActiveView('table');
            }}
          />
        </div>

        {/* Needs Attention Strip (U1b) */}
        <NeedsAttentionStrip
          count={secondaryKpis?.needsAttentionCount ?? 0}
          onReview={() => {
            updateQueryParam({ status: 'New', order: 'asc', page: '1' });
            setActiveView('table');
          }}
        />

        {/* Secondary KPI Row (U1c) */}
        <SecondaryKpiRow kpis={secondaryKpis} isLoading={isLoadingKpis} />

        {/* Collapsible Trends & Analytics Panel (U2) */}
        <AnalyticsPanel />

        {/* Toolbar: Search, Filters, Quick Date Chips, CSV Export (U3g) */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input with 400ms debounce */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#A3A3A3] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="dashboard-search-input"
                type="text"
                placeholder="Search by name or phone... (Press '/' to focus)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 dark-input text-xs"
              />
            </div>

            {/* Quick Date Chips (U3g) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[#A3A3A3] font-semibold hidden sm:inline">Range:</span>
              <button
                type="button"
                onClick={() => applyDateRange('today')}
                className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-[#FFD60A] border border-white/5 transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyDateRange(7)}
                className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-[#FFD60A] border border-white/5 transition-colors cursor-pointer"
              >
                7d
              </button>
              <button
                type="button"
                onClick={() => applyDateRange(30)}
                className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-[#FFD60A] border border-white/5 transition-colors cursor-pointer"
              >
                30d
              </button>
            </div>

            {/* Actions: Reset & Export */}
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-[#F5F5F5] text-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}

              <button
                onClick={handleExportCsv}
                disabled={isExporting || inquiries.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[#F5F5F5] hover:text-[#FFD60A] text-xs font-semibold border border-white/10 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
              </button>
            </div>
          </div>

          {/* Filter Selects & Active Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] uppercase tracking-wider text-[#A3A3A3] font-semibold flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#FFD60A]" />
                <span>Filters:</span>
              </span>

              {/* Category Filter */}
              <select
                aria-label="Filter by Category"
                value={categoryFilter}
                onChange={(e) => updateQueryParam({ category: e.target.value || undefined, page: '1' })}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[#141414] border border-white/10 text-[#F5F5F5] focus:border-[#FFD60A] focus:outline-none cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="Scholarship">Scholarship</option>
                <option value="Concert">Concert</option>
                <option value="Admission">Admission</option>
                <option value="General Query">General Query</option>
              </select>

              {/* User Type Filter */}
              <select
                aria-label="Filter by User Type"
                value={userTypeFilter}
                onChange={(e) => updateQueryParam({ userType: e.target.value || undefined, page: '1' })}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[#141414] border border-white/10 text-[#F5F5F5] focus:border-[#FFD60A] focus:outline-none cursor-pointer"
              >
                <option value="">All User Types</option>
                <option value="Parent">Parent</option>
                <option value="Student">Student</option>
                <option value="School">School</option>
              </select>

              {/* Status Filter */}
              <select
                aria-label="Filter by Status"
                value={statusFilter}
                onChange={(e) => updateQueryParam({ status: e.target.value || undefined, page: '1' })}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[#141414] border border-white/10 text-[#F5F5F5] focus:border-[#FFD60A] focus:outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Active Filter Chips (U3g) */}
            {hasActiveFilters && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {categoryFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FFD60A]/10 border border-[#FFD60A]/20 text-[11px] text-[#FFD60A]">
                    {categoryFilter}
                    <button
                      onClick={() => updateQueryParam({ category: undefined, page: '1' })}
                      className="hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {userTypeFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#60A5FA]/10 border border-[#60A5FA]/20 text-[11px] text-[#60A5FA]">
                    {userTypeFilter}
                    <button
                      onClick={() => updateQueryParam({ userType: undefined, page: '1' })}
                      className="hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {statusFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[11px] text-[#4ADE80]">
                    {statusFilter}
                    <button
                      onClick={() => updateQueryParam({ status: undefined, page: '1' })}
                      className="hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {fromParam && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-[11px] text-[#F5F5F5]">
                    From: {fromParam}
                    <button
                      onClick={() => updateQueryParam({ from: undefined, page: '1' })}
                      className="hover:text-[#FFD60A]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* View Switcher: Table or Kanban Board */}
        {activeView === 'table' ? (
          <InquiryTable
            inquiries={inquiries}
            pagination={pagination}
            isLoading={isLoading}
            isError={isError}
            onRetry={fetchInquiries}
            onClearFilters={handleClearFilters}
            onSelectInquiry={(inquiry) => {
              setSelectedInquiry(inquiry);
              setIsDrawerOpen(true);
            }}
            onStatusChange={handleStatusChange}
            onBulkStatusChange={handleBulkStatusChange}
            onBulkExport={handleBulkExport}
            sortOrder={sortOrder}
            onToggleSortDate={() => {
              updateQueryParam({ order: sortOrder === 'desc' ? 'asc' : 'desc', page: '1' });
            }}
            onPageChange={(newPage) => {
              updateQueryParam({ page: newPage.toString() });
            }}
            onPageSizeChange={(newLimit) => {
              updateQueryParam({ limit: newLimit.toString(), page: '1' });
            }}
            searchQuery={searchQuery}
          />
        ) : (
          <InquiryBoard
            inquiries={inquiries}
            onSelectInquiry={(inquiry) => {
              setSelectedInquiry(inquiry);
              setIsDrawerOpen(true);
            }}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Side Details Drawer (U5) */}
      <InquiryDrawer
        inquiry={selectedInquiry}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStatusChange={handleStatusChange}
        isUpdatingStatus={isUpdatingStatus}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onNavigatePrev={handleNavigatePrev}
        onNavigateNext={handleNavigateNext}
      />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectAction={handleCommandAction}
      />

      {/* Global Keyboard Shortcuts Modal (U6c) */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};

export default AdminDashboardPage;
