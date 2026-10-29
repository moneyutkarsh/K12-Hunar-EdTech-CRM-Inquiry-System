import React from 'react';
import type { Inquiry, InquiryStatus } from '../types/inquiry';
import { X, Calendar, Mail, Phone, User, RefreshCw } from 'lucide-react';

interface InquiryDrawerProps {
  inquiry: Inquiry | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: InquiryStatus) => Promise<void>;
  isUpdatingStatus: boolean;
}

export const InquiryDrawer: React.FC<InquiryDrawerProps> = ({
  inquiry,
  isOpen,
  onClose,
  onStatusChange,
  isUpdatingStatus,
}) => {
  if (!isOpen || !inquiry) return null;

  const formattedDate = new Date(inquiry.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-[#0F0F0F] border-l border-white/10 h-full overflow-y-auto shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-start justify-between bg-[#141414]/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getStatusBadge(inquiry.status)}`}>
                {inquiry.status}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#A3A3A3]">
                {inquiry.category}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#F5F5F5]">{inquiry.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Quick Contact Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 text-xs text-[#A3A3A3] mb-1">
                <User className="w-3.5 h-3.5 text-[#FFD60A]" />
                <span>User Type</span>
              </div>
              <p className="text-sm font-semibold text-[#F5F5F5]">{inquiry.user_type}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 text-xs text-[#A3A3A3] mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#FFD60A]" />
                <span>Submitted</span>
              </div>
              <p className="text-xs font-medium text-[#F5F5F5]">{formattedDate}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 col-span-2">
              <div className="flex items-center gap-2 text-xs text-[#A3A3A3] mb-1">
                <Mail className="w-3.5 h-3.5 text-[#FFD60A]" />
                <span>Email Address</span>
              </div>
              <a
                href={`mailto:${inquiry.email}`}
                className="text-sm font-medium text-[#FFD60A] hover:underline break-all"
              >
                {inquiry.email}
              </a>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 col-span-2">
              <div className="flex items-center gap-2 text-xs text-[#A3A3A3] mb-1">
                <Phone className="w-3.5 h-3.5 text-[#FFD60A]" />
                <span>Phone Number</span>
              </div>
              <a
                href={`tel:${inquiry.phone}`}
                className="text-sm font-medium text-[#F5F5F5] hover:text-[#FFD60A]"
              >
                {inquiry.phone}
              </a>
            </div>
          </div>

          {/* Message Section */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold mb-2">
              Inquiry Message
            </h3>
            <div className="p-4 rounded-xl bg-[#141414] border border-white/10 text-sm text-[#F5F5F5] leading-relaxed whitespace-pre-wrap">
              {inquiry.message}
            </div>
          </div>

          {/* Status Change Control */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <label className="block text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold mb-2">
              Update Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['New', 'In Progress', 'Resolved'] as InquiryStatus[]).map((status) => (
                <button
                  key={status}
                  disabled={isUpdatingStatus || inquiry.status === status}
                  onClick={() => onStatusChange(inquiry.id, status)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    inquiry.status === status
                      ? 'bg-[#FFD60A] text-[#0A0A0A] shadow-sm font-bold'
                      : 'bg-[#171717] hover:bg-white/10 text-[#F5F5F5] border border-white/10'
                  }`}
                >
                  {isUpdatingStatus && inquiry.status === status && (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  )}
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#141414]/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default InquiryDrawer;
