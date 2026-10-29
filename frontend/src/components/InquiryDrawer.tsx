import React, { useState, useEffect } from 'react';
import type { Inquiry, InquiryStatus } from '../types/inquiry';
import { api } from '../lib/api';
import { toast } from 'sonner';
import {
  X,
  Calendar,
  Mail,
  Phone,
  User,
  RefreshCw,
  MessageSquare,
  History,
  Send,
  FileText,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Copy,
  MessageCircle,
} from 'lucide-react';
import { REPLY_TEMPLATES, fillTemplate } from '../constants/replyTemplates';

interface Note {
  id: string;
  note: string;
  admin_email: string;
  created_at: string;
}

interface ActivityItem {
  id: string;
  action: string;
  from_value: string | null;
  to_value: string | null;
  admin_email: string | null;
  created_at: string;
}

interface InquiryDrawerProps {
  inquiry: Inquiry | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: InquiryStatus) => Promise<void>;
  isUpdatingStatus: boolean;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const InquiryDrawer: React.FC<InquiryDrawerProps> = ({
  inquiry,
  isOpen,
  onClose,
  onStatusChange,
  isUpdatingStatus,
  onNavigatePrev,
  onNavigateNext,
  hasPrev = false,
  hasNext = false,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'reply' | 'notes' | 'activity'>('details');
  const [notes, setNotes] = useState<Note[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [newNote, setNewNote] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // Quick reply state
  const [customReplyText, setCustomReplyText] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  useEffect(() => {
    if (isOpen && inquiry?.id) {
      loadInquiryDetails(inquiry.id);
      // Pre-select first template for inquiry category
      const available = REPLY_TEMPLATES[inquiry.category] || REPLY_TEMPLATES['General Query'];
      if (available && available[0]) {
        setSelectedTemplateId(available[0].id);
        setCustomReplyText(fillTemplate(available[0].template, inquiry.name, inquiry.category));
      }
    }
  }, [isOpen, inquiry?.id]);

  // J/K and Escape keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in textarea or input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          handleAddNote();
        }
        return;
      }

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'j' || e.key === 'ArrowRight') {
        if (hasNext && onNavigateNext) onNavigateNext();
      } else if (e.key === 'k' || e.key === 'ArrowLeft') {
        if (hasPrev && onNavigatePrev) onNavigatePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onNavigateNext, onNavigatePrev, onClose, newNote]);

  const loadInquiryDetails = async (id: string) => {
    setIsLoadingDetails(true);
    try {
      const res = await api.get(`/inquiries/${id}`);
      const payload = res.data.data || res.data;
      if (payload.notes) setNotes(payload.notes);
      if (payload.activity) setActivity(payload.activity);
    } catch {
      // Handled silently
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleAddNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newNote.trim() || !inquiry?.id) return;

    setIsSubmittingNote(true);
    try {
      const res = await api.post(`/inquiries/${inquiry.id}/notes`, { note: newNote.trim() });
      const added = res.data.data || res.data;
      setNotes((prev) => [added, ...prev]);
      setNewNote('');
      toast.success('Internal note added (Ctrl+Enter)');
      loadInquiryDetails(inquiry.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!inquiry) return;
    const catTemplates = REPLY_TEMPLATES[inquiry.category] || REPLY_TEMPLATES['General Query'];
    const chosen = catTemplates.find((t) => t.id === templateId);
    if (chosen) {
      setCustomReplyText(fillTemplate(chosen.template, inquiry.name, inquiry.category));
    }
  };

  const copyReplyText = () => {
    navigator.clipboard.writeText(customReplyText);
    toast.success('Reply template copied to clipboard');
  };

  if (!isOpen || !inquiry) return null;

  const formattedDate = new Date(inquiry.created_at || inquiry.createdAt || '').toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const digitsPhone = inquiry.phone.replace(/\D/g, '');

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

  const availableTemplates = REPLY_TEMPLATES[inquiry.category] || REPLY_TEMPLATES['General Query'] || [];

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
        {/* Header with Prev/Next Navigation */}
        <div className="p-5 border-b border-white/10 bg-[#141414]/90 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            {/* Prev / Next Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onNavigatePrev}
                disabled={!hasPrev}
                title="Previous inquiry (k)"
                aria-label="Previous inquiry"
                className="p-1.5 rounded-lg border border-white/10 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNavigateNext}
                disabled={!hasNext}
                title="Next inquiry (j)"
                aria-label="Next inquiry"
                className="p-1.5 rounded-lg border border-white/10 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-[11px] text-[#A3A3A3] ml-1">Use J / K to flip</span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getStatusBadge(inquiry.status)}`}>
              {inquiry.status}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#A3A3A3]">
              {inquiry.category}
            </span>
          </div>

          <h2 className="text-xl font-bold text-[#F5F5F5] truncate">{inquiry.name}</h2>
          <p className="text-xs text-[#A3A3A3] mt-0.5 truncate">{inquiry.email}</p>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-[#FFD60A] text-[#0A0A0A]'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reply')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'reply'
                  ? 'bg-[#FFD60A] text-[#0A0A0A]'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FB923C]" />
              <span>Quick Reply</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-[#FFD60A] text-[#0A0A0A]'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Notes ({notes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-[#FFD60A] text-[#0A0A0A]'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Details */}
        {activeTab === 'details' && (
          <div className="p-6 space-y-6 flex-1">
            {/* Quick Contact Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 text-xs text-[#A3A3A3] mb-1">
                  <User className="w-3.5 h-3.5 text-[#FFD60A]" />
                  <span>User Type</span>
                </div>
                <p className="text-sm font-semibold text-[#F5F5F5]">{inquiry.user_type || inquiry.userType}</p>
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
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
        )}

        {/* Tab 2: Quick Reply Templates */}
        {activeTab === 'reply' && (
          <div className="p-6 space-y-5 flex-1 flex flex-col">
            <div>
              <label className="block text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-2">
                Select Canned Response ({inquiry.category})
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTemplates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleTemplateSelect(tmpl.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      selectedTemplateId === tmpl.id
                        ? 'bg-[#FFD60A] text-[#0A0A0A] border-[#FFD60A] font-bold'
                        : 'bg-[#141414] text-[#A3A3A3] border-white/10 hover:text-[#F5F5F5]'
                    }`}
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable reply text */}
            <div className="flex-1 flex flex-col space-y-2">
              <label className="block text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
                Message Preview & Edits
              </label>
              <textarea
                rows={9}
                value={customReplyText}
                onChange={(e) => setCustomReplyText(e.target.value)}
                className="w-full flex-1 p-3.5 dark-input text-xs rounded-xl resize-none leading-relaxed"
              />
            </div>

            {/* Quick Actions for Reply */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={copyReplyText}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[#F5F5F5] text-xs font-medium border border-white/10 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </button>

              <a
                href={`mailto:${inquiry.email}?subject=${encodeURIComponent(
                  `K12 Hunar: Regarding your ${inquiry.category} inquiry`
                )}&body=${encodeURIComponent(customReplyText)}`}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#60A5FA]/15 hover:bg-[#60A5FA]/25 text-[#60A5FA] border border-[#60A5FA]/30 text-xs font-semibold transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open Email</span>
              </a>

              <a
                href={`https://wa.me/${digitsPhone}?text=${encodeURIComponent(customReplyText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/30 text-xs font-semibold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* Tab 3: Internal Notes with Ctrl+Enter */}
        {activeTab === 'notes' && (
          <div className="p-6 space-y-6 flex-1 flex flex-col">
            <form onSubmit={handleAddNote} className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="new-note-input"
                  className="block text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider"
                >
                  Add Private Internal Note
                </label>
                <span className="text-[10px] text-[#A3A3A3]/70">Press Ctrl+Enter to save</span>
              </div>
              <textarea
                id="new-note-input"
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log internal updates, callback notes, counselor assignment..."
                className="w-full px-3.5 py-2.5 dark-input text-xs rounded-xl resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingNote || !newNote.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFD60A] text-[#0A0A0A] font-bold text-xs hover:bg-[#FFE14D] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmittingNote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Save Note</span>
                </button>
              </div>
            </form>

            <div className="space-y-3 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
                  Note History ({notes.length})
                </h4>
                {isLoadingDetails && <RefreshCw className="w-3 h-3 animate-spin text-[#FFD60A]" />}
              </div>
              {isLoadingDetails && notes.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#A3A3A3]">Loading notes...</div>
              ) : notes.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#A3A3A3] border border-dashed border-white/10 rounded-xl">
                  No internal notes recorded yet. Add one above!
                </div>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="p-3.5 rounded-xl bg-[#141414] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#A3A3A3]">
                      <span className="text-[#FFD60A] font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {n.admin_email}
                      </span>
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-[#F5F5F5] leading-relaxed whitespace-pre-wrap">{n.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Activity Audit Timeline */}
        {activeTab === 'activity' && (
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <h4 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-2">
              System Audit Timeline
            </h4>
            {activity.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#A3A3A3] border border-dashed border-white/10 rounded-xl">
                No activity recorded yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                {activity.map((act) => (
                  <div key={act.id} className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#FFD60A] ring-4 ring-[#0F0F0F]" />
                    <div className="text-xs font-semibold text-[#F5F5F5]">
                      {act.action === 'created'
                        ? 'Inquiry Created via Public Form'
                        : act.action === 'status_changed'
                        ? `Status changed from "${act.from_value}" to "${act.to_value}"`
                        : act.action === 'note_added'
                        ? `Added internal note: "${act.to_value}"`
                        : act.action}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#A3A3A3] mt-0.5">
                      {act.admin_email && <span>By {act.admin_email}</span>}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(act.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#141414]/50 flex justify-between items-center">
          <span className="text-[11px] text-[#A3A3A3]">ID: {inquiry.id.slice(0, 8)}...</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default InquiryDrawer;
