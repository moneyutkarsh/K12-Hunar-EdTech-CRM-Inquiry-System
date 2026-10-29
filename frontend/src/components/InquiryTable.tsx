import React, { useState, useEffect } from 'react';
import type { Inquiry, InquiryStatus, PaginationMeta } from '../types/inquiry';
import {
  ChevronUp,
  ChevronDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Copy,
  Phone,
  Mail,
  MessageCircle,
  CheckSquare,
  Square,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown as ChevronDownIcon,
  Download,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

interface InquiryTableProps {
  inquiries: Inquiry[];
  pagination: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
  onSelectInquiry: (inquiry: Inquiry) => void;
  onStatusChange: (id: string, newStatus: InquiryStatus) => Promise<void>;
  onBulkStatusChange?: (ids: string[], newStatus: InquiryStatus) => Promise<void>;
  onBulkExport?: (ids: string[]) => void;
  sortOrder: 'asc' | 'desc';
  onToggleSortDate: () => void;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newLimit: number) => void;
  searchQuery?: string;
}

export const InquiryTable: React.FC<InquiryTableProps> = ({
  inquiries,
  pagination,
  isLoading,
  isError,
  onRetry,
  onClearFilters,
  onSelectInquiry,
  onStatusChange,
  onBulkStatusChange,
  onBulkExport,
  sortOrder,
  onToggleSortDate,
  onPageChange,
  onPageSizeChange,
  searchQuery = '',
}) => {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Density: 'comfortable' | 'compact'
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    phone: true,
    email: true,
    userType: true,
    category: true,
    date: true,
    status: true,
  });
  const [showColMenu, setShowColMenu] = useState(false);

  // Active focused row for j/k keyboard navigation
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);

  // Unseen tracking via localStorage
  const [seenIds, setSeenIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('seen_inquiry_ids');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Saving state per inquiry id
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);

  // Mark inquiry seen
  const markAsSeen = (id: string) => {
    setSeenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('seen_inquiry_ids', JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Keyboard navigation: j/k, Enter, x
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'j') {
        e.preventDefault();
        setFocusedRowIndex((prev) => Math.min(inquiries.length - 1, prev + 1));
      } else if (e.key === 'k') {
        e.preventDefault();
        setFocusedRowIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Enter' && focusedRowIndex >= 0 && focusedRowIndex < inquiries.length) {
        e.preventDefault();
        const inq = inquiries[focusedRowIndex];
        markAsSeen(inq.id);
        onSelectInquiry(inq);
      } else if (e.key === 'x' && focusedRowIndex >= 0 && focusedRowIndex < inquiries.length) {
        e.preventDefault();
        const inq = inquiries[focusedRowIndex];
        toggleSelectOne(inq.id, focusedRowIndex, false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inquiries, focusedRowIndex]);

  // Checkbox selection logic
  const toggleSelectAll = () => {
    if (selectedIds.length === inquiries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(inquiries.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: string, index: number, isShiftKey: boolean) => {
    if (isShiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = inquiries.slice(start, end + 1).map((i) => i.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
    } else {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }
    setLastSelectedIndex(index);
  };

  // Status Change with Undo toast
  const handleStatusUpdate = async (id: string, currentStatus: InquiryStatus, newStatus: InquiryStatus) => {
    if (currentStatus === newStatus) return;
    setSavingStatusId(id);
    try {
      await onStatusChange(id, newStatus);
      toast.success(`Status changed to ${newStatus}`, {
        duration: 6000,
        action: {
          label: 'Undo',
          onClick: async () => {
            await onStatusChange(id, currentStatus);
            toast.info(`Reverted status back to ${currentStatus}`);
          },
        },
      });
    } catch {
      // Handled in parent
    } finally {
      setSavingStatusId(null);
    }
  };

  // Deterministic avatar tint
  const getAvatarInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const tints = [
      'bg-[#FFD60A]/15 text-[#FFD60A] border-[#FFD60A]/30',
      'bg-[#FB923C]/15 text-[#FB923C] border-[#FB923C]/30',
      'bg-[#60A5FA]/15 text-[#60A5FA] border-[#60A5FA]/30',
      'bg-[#A78BFA]/15 text-[#A78BFA] border-[#A78BFA]/30',
      'bg-white/10 text-[#F5F5F5] border-white/20',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return tints[hash % tints.length];
  };

  // Format relative + time
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return { main: 'Recently', sub: '' };
    const date = new Date(dateStr);
    const main = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    let rel = 'Just now';
    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      rel = `${days}d ago`;
    } else if (diffHours >= 1) {
      rel = `${diffHours}h ago`;
    }

    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return { main, sub: `${rel} · ${time}`, full: date.toLocaleString() };
  };

  // Quick Action Handlers
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusBadge = (status: InquiryStatus) => {
    switch (status) {
      case 'New':
        return 'bg-[#FFD60A]/10 text-[#FFD60A] border-[#FFD60A]/30';
      case 'In Progress':
        return 'bg-[#FB923C]/10 text-[#FB923C] border-[#FB923C]/30';
      case 'Resolved':
        return 'bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/30';
    }
  };

  // Highlight matches
  const highlightMatch = (text: string, query: string) => {
    if (!query || query.trim().length < 2) return text;
    const parts = text.split(new RegExp(`(${query.trim()})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.trim().toLowerCase() ? (
        <span key={i} className="bg-[#FFD60A]/30 text-[#FFD60A] font-bold px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Error State
  if (isError) {
    return (
      <div className="glass-card p-12 text-center my-6 flex flex-col items-center justify-center">
        <AlertTriangle className="w-10 h-10 text-[#F87171] mb-3" />
        <h3 className="text-lg font-semibold text-[#F5F5F5] mb-1">Failed to load inquiries</h3>
        <p className="text-sm text-[#A3A3A3] mb-4">An error occurred while fetching inquiry records from the server.</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFD60A] text-[#0A0A0A] font-semibold text-xs hover:bg-[#FFE14D] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="glass-card overflow-hidden my-6 relative">
      {/* Table Toolbar Utilities */}
      <div className="px-4 py-2.5 border-b border-white/5 bg-[#0F0F0F]/60 flex items-center justify-between gap-3 text-xs">
        {/* Left: Results Count & Column Visibility */}
        <div className="flex items-center gap-3">
          <span className="text-[#A3A3A3] font-medium">
            <span className="text-[#F5F5F5] font-bold">{pagination.total}</span> inquiries found
          </span>

          {/* Density Toggle */}
          <div className="hidden sm:inline-flex rounded-lg bg-[#141414] p-0.5 border border-white/10 text-[11px]">
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                density === 'comfortable' ? 'bg-[#FFD60A] text-[#0A0A0A]' : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
              }`}
            >
              Comfortable
            </button>
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                density === 'compact' ? 'bg-[#FFD60A] text-[#0A0A0A]' : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
              }`}
            >
              Compact
            </button>
          </div>
        </div>

        {/* Right: Page Size & Column Settings */}
        <div className="flex items-center gap-2.5 relative">
          <span className="text-[11px] text-[#A3A3A3] hidden sm:inline">Per page:</span>
          <select
            value={pagination.limit}
            onChange={(e) => onPageSizeChange && onPageSizeChange(Number(e.target.value))}
            className="text-[11px] bg-[#141414] border border-white/10 text-[#F5F5F5] rounded px-2 py-1 focus:outline-none focus:border-[#FFD60A] cursor-pointer"
            aria-label="Items per page"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>

          {/* Column Visibility Popover Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColMenu(!showColMenu)}
              className="p-1.5 rounded-lg border border-white/10 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors cursor-pointer"
              title="Column visibility"
              aria-label="Column visibility settings"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {showColMenu && (
              <div className="absolute right-0 top-8 z-30 w-44 rounded-xl bg-[#141414] border border-white/15 p-2 shadow-2xl space-y-1.5 text-xs animate-in fade-in zoom-in-95">
                <div className="font-semibold text-[#F5F5F5] px-1 pb-1 border-b border-white/10">
                  Toggle Columns
                </div>
                {Object.entries(visibleColumns).map(([col, isVis]) => (
                  <label
                    key={col}
                    className="flex items-center gap-2 px-1 py-0.5 text-[#A3A3A3] hover:text-[#F5F5F5] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isVis}
                      onChange={() =>
                        setVisibleColumns((prev) => ({
                          ...prev,
                          [col]: !isVis,
                        }))
                      }
                      className="rounded border-white/20 bg-[#1A1A1A] text-[#FFD60A] focus:ring-0"
                    />
                    <span className="capitalize">{col}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[350px]">
        <table className="w-full text-left text-xs border-collapse">
          {/* Sticky Header with soft shadow */}
          <thead className="sticky top-0 bg-[#0F0F0F]/95 backdrop-blur-md text-[#A3A3A3] uppercase tracking-wider font-semibold border-b border-white/10 z-10 shadow-sm">
            <tr>
              {/* Checkbox column */}
              <th className="py-3 px-3 w-8">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  aria-label="Select all rows"
                  className="p-1 rounded text-[#A3A3A3] hover:text-[#FFD60A] cursor-pointer"
                >
                  {selectedIds.length === inquiries.length && inquiries.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-[#FFD60A]" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-3.5 px-4">Name</th>
              {visibleColumns.phone && <th className="py-3.5 px-4">Phone</th>}
              {visibleColumns.email && <th className="py-3.5 px-4 hidden sm:table-cell">Email</th>}
              {visibleColumns.userType && <th className="py-3.5 px-4 hidden md:table-cell">User Type</th>}
              {visibleColumns.category && <th className="py-3.5 px-4">Category</th>}
              {visibleColumns.date && (
                <th
                  className="py-3.5 px-4 cursor-pointer select-none group"
                  onClick={onToggleSortDate}
                >
                  <div className="flex items-center gap-1.5 hover:text-[#FFD60A]">
                    <span>Date</span>
                    {sortOrder === 'desc' ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#FFD60A]" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5 text-[#FFD60A]" />
                    )}
                  </div>
                </th>
              )}
              {visibleColumns.status && <th className="py-3.5 px-4">Status</th>}
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              Array.from({ length: 7 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="py-3 px-3"><div className="h-4 bg-white/5 rounded w-4" /></td>
                  <td className="py-4 px-4"><div className="h-4 bg-white/5 rounded w-32" /></td>
                  <td className="py-4 px-4"><div className="h-4 bg-white/5 rounded w-24" /></td>
                  <td className="py-4 px-4 hidden sm:table-cell"><div className="h-4 bg-white/5 rounded w-36" /></td>
                  <td className="py-4 px-4 hidden md:table-cell"><div className="h-4 bg-white/5 rounded w-16" /></td>
                  <td className="py-4 px-4"><div className="h-4 bg-white/5 rounded w-20" /></td>
                  <td className="py-4 px-4"><div className="h-4 bg-white/5 rounded w-20" /></td>
                  <td className="py-4 px-4"><div className="h-6 bg-white/5 rounded-full w-20" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-6 bg-white/5 rounded w-8 ml-auto" /></td>
                </tr>
              ))
            ) : inquiries.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    {/* Inline SVG Illustration */}
                    <svg
                      className="w-16 h-16 text-white/20 mb-3"
                      viewBox="0 0 64 64"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="12" y="14" width="40" height="36" rx="4" strokeDasharray="3 3" />
                      <circle cx="32" cy="28" r="6" />
                      <path d="M22 42c0-4 4-6 10-6s10 2 10 6" />
                    </svg>
                    <h4 className="text-sm font-semibold text-[#F5F5F5] mb-1">No inquiries found</h4>
                    <p className="text-xs text-[#A3A3A3] mb-4">
                      No records matched your active search or filter criteria.
                    </p>
                    <button
                      onClick={onClearFilters}
                      className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-[#F5F5F5] transition-colors cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              inquiries.map((inquiry, idx) => {
                const dateObj = formatDateTime(inquiry.created_at || inquiry.createdAt || '');
                const isSelected = selectedIds.includes(inquiry.id);
                const isFocused = focusedRowIndex === idx;
                const isRecent =
                  Date.now() - new Date(inquiry.created_at || inquiry.createdAt || '').getTime() <
                  24 * 3600 * 1000;
                const isUnseen = isRecent && !seenIds.has(inquiry.id);
                const digitsPhone = inquiry.phone.replace(/\D/g, '');
                const rowPadding = density === 'compact' ? 'py-2 px-4' : 'py-3.5 px-4';

                return (
                  <tr
                    key={inquiry.id}
                    onClick={() => {
                      markAsSeen(inquiry.id);
                      onSelectInquiry(inquiry);
                    }}
                    className={`hover:bg-white/[0.03] transition-colors cursor-pointer group relative ${
                      isSelected ? 'bg-white/[0.04]' : ''
                    } ${isFocused ? 'ring-1 ring-inset ring-[#FFD60A]' : ''}`}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-3 px-3 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectOne(inquiry.id, idx, e.shiftKey);
                      }}
                    >
                      <button
                        type="button"
                        aria-label={`Select ${inquiry.name}`}
                        className={`p-1 rounded transition-opacity cursor-pointer ${
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#FFD60A]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#A3A3A3]" />
                        )}
                      </button>
                    </td>

                    {/* Name cell: Avatar + Name + Message Preview + Unseen Dot */}
                    <td className={rowPadding}>
                      <div className="flex items-center gap-2.5">
                        {/* Unseen Pulsing Marker */}
                        {isUnseen && (
                          <span
                            title="New unseen inquiry in last 24h"
                            className="w-2 h-2 rounded-full bg-[#FFD60A] shrink-0 animate-pulse"
                          />
                        )}

                        {/* Initials Avatar */}
                        <div
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-[10px] shrink-0 ${getAvatarColor(
                            inquiry.name
                          )}`}
                        >
                          {getAvatarInitials(inquiry.name)}
                        </div>

                        {/* Name & message snippet */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-[#F5F5F5] group-hover:text-[#FFD60A] transition-colors truncate">
                              {highlightMatch(inquiry.name, searchQuery)}
                            </span>
                            {inquiry.contactCount && inquiry.contactCount > 1 ? (
                              <span
                                title={`${inquiry.contactCount} inquiries from this contact`}
                                className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/30 shrink-0"
                              >
                                ×{inquiry.contactCount}
                              </span>
                            ) : null}
                            {inquiry.priority === 'Urgent' && (
                              <span
                                title="Priority: Urgent"
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/30 shrink-0"
                              >
                                <Flame className="w-2.5 h-2.5" />
                                Urgent
                              </span>
                            )}
                            {inquiry.priority === 'High' && (
                              <span
                                title="Priority: High"
                                className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#FB923C]/15 text-[#FB923C] border border-[#FB923C]/30 shrink-0"
                              >
                                High
                              </span>
                            )}
                          </div>
                          <p
                            className="text-[11px] text-[#A3A3A3] truncate max-w-[200px]"
                            title={inquiry.message}
                          >
                            {inquiry.message}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    {visibleColumns.phone && (
                      <td className={`${rowPadding} text-[#A3A3A3] whitespace-nowrap`}>
                        {highlightMatch(inquiry.phone, searchQuery)}
                      </td>
                    )}

                    {/* Email */}
                    {visibleColumns.email && (
                      <td className={`${rowPadding} text-[#A3A3A3] hidden sm:table-cell max-w-[180px] truncate`}>
                        {inquiry.email}
                      </td>
                    )}

                    {/* User Type */}
                    {visibleColumns.userType && (
                      <td className={`${rowPadding} hidden md:table-cell`}>
                        <span className="text-[11px] text-[#A3A3A3] bg-white/[0.04] px-2 py-0.5 rounded border border-white/5">
                          {inquiry.user_type || inquiry.userType}
                        </span>
                      </td>
                    )}

                    {/* Category + Assignee */}
                    {visibleColumns.category && (
                      <td className={rowPadding}>
                        <span className="text-[11px] px-2 py-0.5 rounded-full border bg-white/5 text-[#A3A3A3] border-white/10">
                          {inquiry.category}
                        </span>
                        {inquiry.assignee && (
                          <div
                            title={`Assigned to ${inquiry.assignee.name}`}
                            className="text-[10px] text-[#A3A3A3] flex items-center gap-1 mt-1"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-white/10 text-[#FFD60A] font-bold flex items-center justify-center text-[8px] shrink-0">
                              {inquiry.assignee.name.charAt(0)}
                            </span>
                            <span className="truncate max-w-[85px]">{inquiry.assignee.name.split(' ')[0]}</span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* Date: 2-line with relative time & tooltip */}
                    {visibleColumns.date && (
                      <td className={`${rowPadding} whitespace-nowrap`} title={dateObj.full}>
                        <div className="text-xs text-[#F5F5F5] font-medium">{dateObj.main}</div>
                        <div className="text-[10px] text-[#A3A3A3]">{dateObj.sub}</div>
                      </td>
                    )}

                    {/* Status Dropdown with Spinner */}
                    {visibleColumns.status && (
                      <td className={rowPadding} onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-flex items-center">
                          <select
                            aria-label={`Change status for ${inquiry.name}`}
                            value={inquiry.status}
                            onChange={(e) =>
                              handleStatusUpdate(
                                inquiry.id,
                                inquiry.status,
                                e.target.value as InquiryStatus
                              )
                            }
                            disabled={savingStatusId === inquiry.id}
                            className={`text-[11px] font-semibold pl-2 pr-6 py-1 rounded-md border appearance-none cursor-pointer bg-[#141414] focus:outline-none focus:ring-1 focus:ring-[#FFD60A] ${getStatusBadge(
                              inquiry.status
                            )}`}
                          >
                            <option value="New" className="bg-[#171717] text-[#FFD60A]">New</option>
                            <option value="In Progress" className="bg-[#171717] text-[#FB923C]">In Progress</option>
                            <option value="Resolved" className="bg-[#171717] text-[#4ADE80]">Resolved</option>
                          </select>
                          {savingStatusId === inquiry.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin absolute right-1.5 pointer-events-none text-[#FFD60A]" />
                          ) : (
                            <ChevronDownIcon className="w-3 h-3 absolute right-1.5 pointer-events-none opacity-60" />
                          )}
                        </div>
                      </td>
                    )}

                    {/* Row Quick Actions: Copy, Call, WhatsApp, Email, View */}
                    <td className={`${rowPadding} text-right`} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* Hover Quick Action Buttons */}
                        <div className="hidden group-hover:flex items-center gap-0.5 animate-fadeIn">
                          {/* Copy Email */}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(inquiry.email, 'Email')}
                            title="Copy Email"
                            aria-label={`Copy email ${inquiry.email}`}
                            className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-[#FFD60A] hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Call Tel */}
                          <a
                            href={`tel:${inquiry.phone}`}
                            title="Call Phone"
                            aria-label={`Call ${inquiry.phone}`}
                            className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-[#4ADE80] hover:bg-white/5 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          {/* WhatsApp */}
                          <a
                            href={`https://wa.me/${digitsPhone}?text=${encodeURIComponent(
                              `Hello ${inquiry.name}, regarding your ${inquiry.category} inquiry with K12 Hunar:`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat on WhatsApp"
                            aria-label="Chat on WhatsApp"
                            className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-[#22C55E] hover:bg-white/5 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          {/* Mailto */}
                          <a
                            href={`mailto:${inquiry.email}?subject=${encodeURIComponent(
                              `K12 Hunar: Regarding your ${inquiry.category} inquiry`
                            )}`}
                            title="Send Email"
                            aria-label="Send email"
                            className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-[#60A5FA] hover:bg-white/5 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {/* Eye details action */}
                        <button
                          onClick={() => {
                            markAsSeen(inquiry.id);
                            onSelectInquiry(inquiry);
                          }}
                          aria-label={`View details for ${inquiry.name}`}
                          className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-[#FFD60A] hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Bottom Center Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#141414] border border-[#FFD60A]/40 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3 text-xs animate-in slide-in-from-bottom duration-200">
          <span className="font-bold text-[#FFD60A] whitespace-nowrap">
            {selectedIds.length} selected
          </span>

          <span className="h-4 w-px bg-white/10" />

          {/* Bulk Status Select */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#A3A3A3] hidden sm:inline">Set Status:</span>
            <select
              onChange={async (e) => {
                if (e.target.value && onBulkStatusChange) {
                  await onBulkStatusChange(selectedIds, e.target.value as InquiryStatus);
                  setSelectedIds([]);
                }
              }}
              defaultValue=""
              className="bg-[#1A1A1A] border border-white/10 text-[#F5F5F5] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#FFD60A] cursor-pointer"
              aria-label="Bulk change status"
            >
              <option value="" disabled>
                Change status...
              </option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Export Selected */}
          {onBulkExport && (
            <button
              type="button"
              onClick={() => onBulkExport(selectedIds)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#F5F5F5] border border-white/10 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}

          {/* Clear Selection */}
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="p-1 rounded-lg text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors cursor-pointer"
            title="Clear selection"
            aria-label="Clear selection"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="p-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0F0F0F]/80">
        <span className="text-xs text-[#A3A3A3]">
          Showing <span className="font-semibold text-[#F5F5F5]">{startItem}</span> to{' '}
          <span className="font-semibold text-[#F5F5F5]">{endItem}</span> of{' '}
          <span className="font-semibold text-[#F5F5F5]">{pagination.total}</span> inquiries
        </span>

        <div className="flex items-center gap-1.5">
          <button
            disabled={pagination.page <= 1 || isLoading}
            onClick={() => onPageChange(pagination.page - 1)}
            className="p-2 rounded-lg border border-white/10 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#F5F5F5] font-medium">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)}
          </span>

          <button
            disabled={pagination.page >= pagination.totalPages || isLoading}
            onClick={() => onPageChange(pagination.page + 1)}
            className="p-2 rounded-lg border border-white/10 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InquiryTable;
