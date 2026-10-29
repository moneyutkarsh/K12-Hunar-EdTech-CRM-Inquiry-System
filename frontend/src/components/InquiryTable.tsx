import React from 'react';
import type { Inquiry, InquiryStatus, PaginationMeta } from '../types/inquiry';
import { ChevronUp, ChevronDown, Eye, ChevronLeft, ChevronRight, Inbox, RefreshCw, AlertTriangle } from 'lucide-react';

interface InquiryTableProps {
  inquiries: Inquiry[];
  pagination: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
  onSelectInquiry: (inquiry: Inquiry) => void;
  onStatusChange: (id: string, newStatus: InquiryStatus) => Promise<void>;
  sortOrder: 'asc' | 'desc';
  onToggleSortDate: () => void;
  onPageChange: (newPage: number) => void;
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
  sortOrder,
  onToggleSortDate,
  onPageChange,
}) => {
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

  const getCategoryBadge = (_category?: string) => {
    return 'bg-white/5 text-[#A3A3A3] border-white/10';
  };

  // 1. Error State
  if (isError) {
    return (
      <div className="glass-card p-12 text-center my-6 flex flex-col items-center justify-center">
        <AlertTriangle className="w-10 h-10 text-[#F87171] mb-3" />
        <h3 className="text-lg font-semibold text-[#F5F5F5] mb-1">Failed to load inquiries</h3>
        <p className="text-sm text-[#A3A3A3] mb-4">An error occurred while fetching inquiry records from the server.</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFD60A] text-[#0A0A0A] font-semibold text-xs hover:bg-[#FFE14D] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // Calculate paging labels
  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="glass-card overflow-hidden my-6">
      <div className="overflow-x-auto min-h-[350px]">
        <table className="w-full text-left text-xs border-collapse">
          {/* Sticky Header */}
          <thead className="sticky top-0 bg-[#0F0F0F]/95 backdrop-blur-md text-[#A3A3A3] uppercase tracking-wider font-semibold border-b border-white/10 z-10">
            <tr>
              <th className="py-3.5 px-4">Name</th>
              <th className="py-3.5 px-4">Phone</th>
              <th className="py-3.5 px-4 hidden sm:table-cell">Email</th>
              <th className="py-3.5 px-4 hidden md:table-cell">User Type</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4 cursor-pointer select-none group" onClick={onToggleSortDate}>
                <div className="flex items-center gap-1.5 hover:text-[#FFD60A]">
                  <span>Date</span>
                  {sortOrder === 'desc' ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#FFD60A]" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 text-[#FFD60A]" />
                  )}
                </div>
              </th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              // Skeleton Loading Rows
              Array.from({ length: 7 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-4 bg-white/5 rounded w-28" /></td>
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
              // Empty State
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#A3A3A3] mb-3">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-[#F5F5F5] mb-1">No inquiries found</h4>
                    <p className="text-xs text-[#A3A3A3] mb-4">
                      No records matched your active search or filter criteria.
                    </p>
                    <button
                      onClick={onClearFilters}
                      className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-[#F5F5F5] transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              // Rendered Rows
              inquiries.map((inquiry) => {
                const dateStr = new Date(inquiry.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <tr
                    key={inquiry.id}
                    onClick={() => onSelectInquiry(inquiry)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-medium text-[#F5F5F5] group-hover:text-[#FFD60A] transition-colors">
                      {inquiry.name}
                    </td>
                    <td className="py-3 px-4 text-[#A3A3A3] whitespace-nowrap">
                      {inquiry.phone}
                    </td>
                    <td className="py-3 px-4 text-[#A3A3A3] hidden sm:table-cell max-w-[180px] truncate">
                      {inquiry.email}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-[11px] text-[#A3A3A3] bg-white/[0.04] px-2 py-0.5 rounded border border-white/5">
                        {inquiry.user_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${getCategoryBadge(inquiry.category)}`}>
                        {inquiry.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#A3A3A3] whitespace-nowrap">
                      {dateStr}
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {/* Inline Status Dropdown */}
                      <select
                        aria-label={`Change status for ${inquiry.name}`}
                        value={inquiry.status}
                        onChange={(e) => onStatusChange(inquiry.id, e.target.value as InquiryStatus)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-md border appearance-none cursor-pointer bg-[#141414] focus:outline-none focus:ring-1 focus:ring-[#FFD60A] ${getStatusBadge(
                          inquiry.status
                        )}`}
                      >
                        <option value="New" className="bg-[#171717] text-[#FFD60A]">New</option>
                        <option value="In Progress" className="bg-[#171717] text-[#FB923C]">In Progress</option>
                        <option value="Resolved" className="bg-[#171717] text-[#4ADE80]">Resolved</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectInquiry(inquiry)}
                        aria-label={`View details for ${inquiry.name}`}
                        className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-[#FFD60A] hover:bg-white/5 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
            className="p-2 rounded-lg border border-white/10 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
            className="p-2 rounded-lg border border-white/10 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
