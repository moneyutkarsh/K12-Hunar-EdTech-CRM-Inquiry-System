import React from 'react';
import type { Inquiry, InquiryStatus } from '../types/inquiry';
import { Mail, Phone, Clock } from 'lucide-react';

interface InquiryBoardProps {
  inquiries: Inquiry[];
  onSelectInquiry: (inquiry: Inquiry) => void;
  onStatusChange: (id: string, newStatus: InquiryStatus) => Promise<void>;
  isLoading: boolean;
}

export const InquiryBoard: React.FC<InquiryBoardProps> = ({
  inquiries,
  onSelectInquiry,
  onStatusChange,
  isLoading,
}) => {
  const columns: { status: InquiryStatus; label: string; headerColor: string; dotColor: string }[] = [
    { status: 'New', label: 'New', headerColor: 'text-[#FFD60A]', dotColor: 'bg-[#FFD60A]' },
    { status: 'In Progress', label: 'In Progress', headerColor: 'text-[#FB923C]', dotColor: 'bg-[#FB923C]' },
    { status: 'Resolved', label: 'Resolved', headerColor: 'text-[#4ADE80]', dotColor: 'bg-[#4ADE80]' },
  ];

  const getInquiriesByStatus = (status: InquiryStatus) => {
    return inquiries.filter((item) => item.status === status);
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
        {[1, 2, 3].map((col) => (
          <div key={col} className="glass-card p-4 space-y-3 animate-pulse">
            <div className="h-6 bg-white/5 rounded w-1/3 mb-4" />
            <div className="h-28 bg-white/5 rounded-xl" />
            <div className="h-28 bg-white/5 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 items-start">
      {columns.map((col) => {
        const items = getInquiriesByStatus(col.status);

        return (
          <div key={col.status} className="glass-card p-4 flex flex-col min-h-[450px]">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <h3 className={`text-sm font-bold ${col.headerColor}`}>{col.label}</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[#A3A3A3] font-semibold">
                {items.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
              {items.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#A3A3A3] border border-dashed border-white/10 rounded-xl">
                  No inquiries in {col.label}
                </div>
              ) : (
                items.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    onClick={() => onSelectInquiry(inquiry)}
                    className="p-4 rounded-xl bg-[#141414] border border-white/10 hover:border-[#FFD60A]/40 transition-all cursor-pointer group hover:shadow-lg"
                  >
                    {/* Category & Time */}
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#FFD60A] font-medium">
                        {inquiry.category}
                      </span>
                      <span className="text-[#A3A3A3] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getRelativeTime(inquiry.created_at)}
                      </span>
                    </div>

                    {/* Name & User Type */}
                    <h4 className="text-sm font-semibold text-[#F5F5F5] group-hover:text-[#FFD60A] transition-colors mb-1">
                      {inquiry.name}
                    </h4>
                    <p className="text-xs text-[#A3A3A3] mb-3">{inquiry.user_type}</p>

                    {/* Contact Snippets */}
                    <div className="space-y-1 text-xs text-[#A3A3A3] mb-3">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-[#A3A3A3]" />
                        <span className="truncate">{inquiry.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#A3A3A3]" />
                        <span>{inquiry.phone}</span>
                      </div>
                    </div>

                    {/* Quick Move Selector */}
                    <div
                      className="pt-2 border-t border-white/5 flex items-center justify-between"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider">Move:</span>
                      <select
                        aria-label="Move inquiry status"
                        value={inquiry.status}
                        onChange={(e) => onStatusChange(inquiry.id, e.target.value as InquiryStatus)}
                        className="text-[11px] bg-[#171717] border border-white/10 text-[#F5F5F5] rounded px-2 py-0.5 focus:border-[#FFD60A] focus:outline-none"
                      >
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InquiryBoard;
