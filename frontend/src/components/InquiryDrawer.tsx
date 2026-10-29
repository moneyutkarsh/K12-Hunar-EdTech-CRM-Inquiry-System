import React, { useState, useEffect } from 'react';
import type { Inquiry, InquiryStatus, InquiryPriority, Assignee, RelatedInquiry } from '../types/inquiry';
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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  MessageCircle,
  Flame,
  UserCheck,
  ArrowRight,
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
  from_value?: string | null;
  to_value?: string | null;
  fromValue?: string | null;
  toValue?: string | null;
  admin_email?: string | null;
  adminEmail?: string | null;
  created_at: string;
}

interface InquiryDrawerProps {
  inquiry: Inquiry | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: InquiryStatus) => Promise<void>;
  onPriorityChange?: (id: string, newPriority: InquiryPriority) => Promise<void>;
  onAssigneeChange?: (id: string, newAdminId: string | null) => Promise<void>;
  onSelectInquiry?: (inquiry: Inquiry) => void;
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
  onPriorityChange,
  onAssigneeChange,
  onSelectInquiry,
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
  const [detailedInquiry, setDetailedInquiry] = useState<Inquiry | null>(inquiry);
  const [adminOptions, setAdminOptions] = useState<Assignee[]>([]);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState<boolean>(false);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Quick reply state
  const [customReplyText, setCustomReplyText] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Fetch admin options once for assignment dropdown
  useEffect(() => {
    api
      .get('/admins/options')
      .then((res) => {
        setAdminOptions(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen && inquiry?.id) {
      setDetailedInquiry(inquiry);
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
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
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
    try {
      const res = await api.get(`/inquiries/${id}`);
      const payload = res.data.data || res.data;
      if (payload.notes) setNotes(payload.notes);
      if (payload.activity) setActivity(payload.activity);
      setDetailedInquiry(payload);
    } catch {
      // Handled silently
    }
  };

  const handlePrioritySelect = async (newPriority: InquiryPriority) => {
    if (!inquiry?.id || isUpdatingPriority) return;
    setIsUpdatingPriority(true);
    try {
      await api.patch(`/inquiries/${inquiry.id}/priority`, { priority: newPriority });
      setDetailedInquiry((prev) => (prev ? { ...prev, priority: newPriority } : null));
      if (onPriorityChange) {
        await onPriorityChange(inquiry.id, newPriority);
      }
      toast.success(`Priority updated to ${newPriority}`);
      loadInquiryDetails(inquiry.id);
    } catch {
      toast.error('Failed to update priority');
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  const handleAssigneeSelect = async (targetAdminId: string | null) => {
    if (!inquiry?.id || isUpdatingAssignee) return;
    setIsUpdatingAssignee(true);
    try {
      const res = await api.patch(`/inquiries/${inquiry.id}/assign`, { adminId: targetAdminId });
      const updated = res.data.data || res.data;
      setDetailedInquiry((prev) =>
        prev ? { ...prev, assignedTo: targetAdminId, assignee: updated.assignee } : null
      );
      if (onAssigneeChange) {
        await onAssigneeChange(inquiry.id, targetAdminId);
      }
      toast.success('Assignee updated successfully');
      loadInquiryDetails(inquiry.id);
    } catch {
      toast.error('Failed to update assignee');
    } finally {
      setIsUpdatingAssignee(false);
    }
  };

  const handleCopyRef = async () => {
    const code = detailedInquiry?.referenceCode || detailedInquiry?.reference_code || inquiry?.referenceCode || inquiry?.reference_code;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedRef(true);
      toast.success('Reference code copied to clipboard');
      setTimeout(() => setCopiedRef(false), 2000);
    } catch {
      toast.error('Could not copy reference code');
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
    } catch {
      toast.error('Failed to add note');
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

  const currentItem = detailedInquiry || inquiry;
  const currentPriority: InquiryPriority = currentItem.priority || 'Normal';
  const referenceCode = currentItem.referenceCode || currentItem.reference_code;
  const contactCount = currentItem.contactCount || currentItem.contact_count || 1;

  const formattedDate = new Date(currentItem.created_at || currentItem.createdAt || '').toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const digitsPhone = currentItem.phone.replace(/\D/g, '');

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

  const availableTemplates = REPLY_TEMPLATES[currentItem.category] || REPLY_TEMPLATES['General Query'] || [];

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

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getStatusBadge(currentItem.status)}`}>
              {currentItem.status}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#A3A3A3]">
              {currentItem.category}
            </span>
            {referenceCode && (
              <button
                type="button"
                onClick={handleCopyRef}
                title="Click to copy tracking reference code"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-xs bg-[#FFD60A]/10 text-[#FFD60A] border border-[#FFD60A]/30 hover:bg-[#FFD60A]/20 transition-colors"
              >
                <span>{referenceCode}</span>
                {copiedRef ? <Check className="w-3 h-3 text-[#4ADE80]" /> : <Copy className="w-3 h-3 opacity-70" />}
              </button>
            )}
            {contactCount > 1 && (
              <span
                title={`${contactCount} total submissions from this contact`}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFD60A]/20 text-[#FFD60A] border border-[#FFD60A]/30"
              >
                ×{contactCount} Repeat Contact
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold text-[#F5F5F5] truncate">{currentItem.name}</h2>
          <p className="text-xs text-[#A3A3A3] mt-0.5 truncate">{currentItem.email}</p>

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
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Reply</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                activeTab === 'notes'
                  ? 'bg-[#FFD60A] text-[#0A0A0A]'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Notes</span>
              {notes.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-white/20 text-[10px] rounded-full">
                  {notes.length}
                </span>
              )}
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
                <p className="text-sm font-semibold text-[#F5F5F5]">{currentItem.user_type || currentItem.userType}</p>
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
                  href={`mailto:${currentItem.email}`}
                  className="text-sm font-medium text-[#FFD60A] hover:underline break-all"
                >
                  {currentItem.email}
                </a>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 col-span-2">
                <div className="flex items-center gap-2 text-xs text-[#A3A3A3] mb-1">
                  <Phone className="w-3.5 h-3.5 text-[#FFD60A]" />
                  <span>Phone Number</span>
                </div>
                <a
                  href={`tel:${currentItem.phone}`}
                  className="text-sm font-medium text-[#F5F5F5] hover:text-[#FFD60A]"
                >
                  {currentItem.phone}
                </a>
              </div>
            </div>

            {/* Workflow Controls: Priority & Assignee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Priority Selector */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <label className="block text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold mb-2">
                  Priority Level
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Low', 'Normal', 'High', 'Urgent'] as InquiryPriority[]).map((p) => {
                    const isSelected = currentPriority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        disabled={isUpdatingPriority}
                        onClick={() => handlePrioritySelect(p)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          isSelected
                            ? p === 'Urgent'
                              ? 'bg-[#F87171] text-black shadow-sm font-bold'
                              : p === 'High'
                              ? 'bg-[#FB923C] text-black shadow-sm font-bold'
                              : 'bg-[#FFD60A] text-black shadow-sm font-bold'
                            : 'bg-white/5 hover:bg-white/10 text-[#A3A3A3] border border-white/5'
                        }`}
                      >
                        {p === 'Urgent' && <Flame className="w-3 h-3" />}
                        <span>{p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assignee Selector */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <label className="block text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold mb-2">
                  Assigned Team Member
                </label>
                <select
                  disabled={isUpdatingAssignee}
                  value={currentItem.assignedTo || currentItem.assigned_to || ''}
                  onChange={(e) => handleAssigneeSelect(e.target.value ? e.target.value : null)}
                  className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#FFD60A] cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {adminOptions.map((adm) => (
                    <option key={adm.id} value={adm.id}>
                      {adm.name} ({adm.email})
                    </option>
                  ))}
                </select>
                {currentItem.assignee && (
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#A3A3A3]">
                    <UserCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
                    <span>Active: {currentItem.assignee.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Message Section */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold mb-2">
                Inquiry Message
              </h3>
              <div className="p-4 rounded-xl bg-[#141414] border border-white/10 text-sm text-[#F5F5F5] leading-relaxed whitespace-pre-wrap">
                {currentItem.message}
              </div>
            </div>

            {/* Related Inquiries from Same Contact */}
            {currentItem.related && currentItem.related.length > 0 && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#A3A3A3] uppercase tracking-wider font-semibold">
                  <span>Related Inquiries ({currentItem.related.length})</span>
                  <span className="text-[10px] text-[#737373] lowercase">same email/phone</span>
                </div>
                <div className="space-y-2">
                  {currentItem.related.map((rel: RelatedInquiry) => (
                    <div
                      key={rel.id}
                      onClick={() => {
                        if (onSelectInquiry) {
                          onSelectInquiry({
                            ...currentItem,
                            id: rel.id,
                            category: rel.category,
                            status: rel.status,
                            priority: rel.priority,
                            referenceCode: rel.referenceCode || rel.reference_code,
                            createdAt: rel.createdAt || rel.created_at,
                          });
                        }
                      }}
                      className="p-2.5 rounded-lg bg-[#141414] hover:bg-white/5 border border-white/5 transition-colors cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#FFD60A] text-[11px]">
                          {rel.referenceCode || rel.reference_code || 'KH-REF'}
                        </span>
                        <span className="text-[#F5F5F5] font-medium">{rel.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            rel.status === 'Resolved'
                              ? 'text-[#4ADE80]'
                              : rel.status === 'In Progress'
                              ? 'text-[#FB923C]'
                              : 'text-[#FFD60A]'
                          }`}
                        >
                          {rel.status}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#737373]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Change Control */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <label className="block text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold mb-2">
                Update Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['New', 'In Progress', 'Resolved'] as InquiryStatus[]).map((status) => (
                  <button
                    key={status}
                    disabled={isUpdatingStatus || currentItem.status === status}
                    onClick={() => onStatusChange(currentItem.id, status)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      currentItem.status === status
                        ? 'bg-[#FFD60A] text-[#0A0A0A] shadow-sm font-bold'
                        : 'bg-[#171717] hover:bg-white/10 text-[#F5F5F5] border border-white/10'
                    }`}
                  >
                    {isUpdatingStatus && currentItem.status === status && (
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
                Select Canned Response ({currentItem.category})
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

            {/* Dispatch Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={copyReplyText}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#F5F5F5] font-semibold text-xs border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>

              <a
                href={`mailto:${currentItem.email}?subject=${encodeURIComponent(
                  `K12 Hunar: Regarding your inquiry (${currentItem.category})`
                )}&body=${encodeURIComponent(customReplyText)}`}
                className="py-2.5 px-3 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] text-[#0A0A0A] font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Client</span>
              </a>

              <a
                href={`https://wa.me/${digitsPhone}?text=${encodeURIComponent(customReplyText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* Tab 3: Internal Notes */}
        {activeTab === 'notes' && (
          <div className="p-6 space-y-5 flex-1 flex flex-col">
            <form onSubmit={handleAddNote} className="space-y-3">
              <label className="block text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
                Add Counselor Note <span className="text-[10px] text-[#737373] lowercase">(Ctrl+Enter to save)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Log internal conversation, phone follow-up notes, or next steps..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full p-3 dark-input text-xs rounded-xl resize-none"
              />
              <button
                type="submit"
                disabled={isSubmittingNote || !newNote.trim()}
                className="w-full py-2 px-3 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] text-[#0A0A0A] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingNote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Save Internal Note</span>
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 pt-2">
              {notes.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#737373]">
                  No internal notes recorded yet.
                </div>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="p-3.5 rounded-xl bg-[#141414] border border-white/5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-[#A3A3A3]">
                      <span className="font-semibold text-[#F5F5F5]">{n.admin_email}</span>
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-[#D4D4D4] whitespace-pre-wrap">{n.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Audit History */}
        {activeTab === 'activity' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            <h3 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-2">
              Audit Trail & Timeline
            </h3>
            {activity.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#737373]">
                No logged activity yet.
              </div>
            ) : (
              <div className="relative border-l border-white/10 ml-3 space-y-5">
                {activity.map((act) => {
                  const fromVal = act.fromValue || act.from_value;
                  const toVal = act.toValue || act.to_value;
                  const admEmail = act.adminEmail || act.admin_email;

                  return (
                    <div key={act.id} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#FFD60A] ring-4 ring-[#0F0F0F]" />
                      <div className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-1.5">
                        <span className="capitalize">{act.action.replace('_', ' ')}</span>
                        {fromVal && toVal && (
                          <span className="text-[11px] text-[#A3A3A3]">
                            ({fromVal} → <span className="text-[#FFD60A] font-bold">{toVal}</span>)
                          </span>
                        )}
                        {!fromVal && toVal && (
                          <span className="text-[11px] text-[#FFD60A] font-bold">({toVal})</span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#737373] mt-0.5">
                        {admEmail ? `by ${admEmail}` : 'Public submission'} •{' '}
                        {new Date(act.created_at).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiryDrawer;
