import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Inquiry, InquiryStats, InquiryStatus, PaginationMeta } from '../types/inquiry';
import StatCard from '../components/StatCard';
import InquiryTable from '../components/InquiryTable';
import InquiryBoard from '../components/InquiryBoard';
import InquiryDrawer from '../components/InquiryDrawer';
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
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { admin, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active View: 'table' | 'board'
  const [activeView, setActiveView] = useState<'table' | 'board'>('table');

  // Stats state
  const [stats, setStats] = useState<InquiryStats>({
    total: 0,
    new: 0,
    inProgress: 0,
    resolved: 0,
  });

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

  // Filters read directly from URL query params
  const categoryFilter = searchParams.get('category') || '';
  const userTypeFilter = searchParams.get('userType') || '';
  const statusFilter = searchParams.get('status') || '';
  const searchQuery = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
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
        limit: 10,
        sort: 'created_at',
        order: sortOrder,
      };

      if (categoryFilter) params.category = categoryFilter;
      if (userTypeFilter) params.userType = userTypeFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/inquiries', { params });
      setInquiries(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setIsError(true);
      toast.error('Failed to load inquiries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, userTypeFilter, statusFilter, searchQuery, currentPage, sortOrder]);

  // Fetch Stats from Backend
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/inquiries/stats');
      setStats(res.data);
    } catch {
      // Handled silently
    }
  }, []);

  // Trigger loads on parameter changes
  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Optimistic Status Update Handler
  const handleStatusChange = async (id: string, newStatus: InquiryStatus) => {
    // Save previous state for rollback
    const previousInquiries = [...inquiries];
    const previousSelected = selectedInquiry;

    // Optimistically update table
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
    } catch (err: any) {
      // Rollback on failure
      setInquiries(previousInquiries);
      setSelectedInquiry(previousSelected);
      const errMsg = err.response?.data?.error?.message || 'Failed to update status.';
      toast.error(errMsg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // CSV Export Handler
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params: Record<string, string> = {
        sort: 'created_at',
        order: sortOrder,
      };
      if (categoryFilter) params.category = categoryFilter;
      if (userTypeFilter) params.userType = userTypeFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/inquiries/export', {
        params,
        responseType: 'blob',
      });

      // Trigger download in browser
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

  const hasActiveFilters = Boolean(categoryFilter || userTypeFilter || statusFilter || searchQuery);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Slim Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/10 bg-[#0A0A0A]/90 p-5 shrink-0 justify-between">
        <div className="space-y-6">
          {/* Logo badge */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-lg bg-[#FFD60A] text-[#0A0A0A] flex items-center justify-center font-bold text-sm">
              H
            </div>
            <div>
              <p className="text-sm font-bold text-[#F5F5F5] leading-none">K12 Hunar</p>
              <p className="text-[10px] text-[#A3A3A3] mt-0.5">Management Portal</p>
            </div>
          </div>

          {/* Navigation Items (Active in black pill with yellow border) */}
          <nav className="space-y-1.5" aria-label="Sidebar Navigation">
            <button
              onClick={() => setActiveView('table')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'table'
                  ? 'bg-[#000000] text-[#FFD60A] border border-[#FFD60A]/40 shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#FFD60A]" />
              <span>Inquiries Table</span>
            </button>

            <button
              onClick={() => setActiveView('board')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'board'
                  ? 'bg-[#000000] text-[#FFD60A] border border-[#FFD60A]/40 shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5'
              }`}
            >
              <Kanban className="w-4 h-4 text-[#FFD60A]" />
              <span>Pipeline Board</span>
            </button>
          </nav>
        </div>

        {/* Admin profile and logout */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="px-2">
            <p className="text-xs font-medium text-[#F5F5F5] truncate">{admin?.email}</p>
            <p className="text-[10px] text-[#FFD60A] font-medium">Administrator</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-[#A3A3A3] hover:text-[#F87171] hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
              {greeting}, <span className="text-[#FFD60A]">Admin</span>
            </h1>
            <p className="text-xs text-[#A3A3A3] flex items-center gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5 text-[#FFD60A]" />
              <span>{todayFormatted}</span>
            </p>
          </div>

          {/* View Mode Toggle: Table vs Board */}
          <div className="flex items-center gap-1.5 p-1 bg-[#141414] rounded-xl border border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setActiveView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Inquiries"
            value={stats.total}
            icon={Inbox}
            colorClass="text-[#F5F5F5]"
            badgeBg="bg-white/5"
          />
          <StatCard
            label="New / Unread"
            value={stats.new}
            icon={Sparkles}
            colorClass="text-[#FFD60A]"
            badgeBg="bg-[#FFD60A]/10"
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            icon={Clock}
            colorClass="text-[#FB923C]"
            badgeBg="bg-[#FB923C]/10"
          />
          <StatCard
            label="Resolved"
            value={stats.resolved}
            icon={CheckCircle2}
            colorClass="text-[#4ADE80]"
            badgeBg="bg-[#4ADE80]/10"
          />
        </div>

        {/* Toolbar: Search, Filters, CSV Export */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input with 400ms debounce */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#A3A3A3] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 dark-input text-xs"
              />
            </div>

            {/* Actions: Reset & Export */}
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-[#F5F5F5] text-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}

              <button
                onClick={handleExportCsv}
                disabled={isExporting || inquiries.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[#F5F5F5] hover:text-[#FFD60A] text-xs font-semibold border border-white/10 transition-colors disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
              </button>
            </div>
          </div>

          {/* Filter Selects */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/5">
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
            sortOrder={sortOrder}
            onToggleSortDate={() => {
              updateQueryParam({ order: sortOrder === 'desc' ? 'asc' : 'desc', page: '1' });
            }}
            onPageChange={(newPage) => {
              updateQueryParam({ page: newPage.toString() });
            }}
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

      {/* Side Details Drawer */}
      <InquiryDrawer
        inquiry={selectedInquiry}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStatusChange={handleStatusChange}
        isUpdatingStatus={isUpdatingStatus}
      />
    </div>
  );
};

export default AdminDashboardPage;
