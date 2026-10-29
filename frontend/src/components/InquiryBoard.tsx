import React, { useState, useMemo } from 'react';
import type { Inquiry, InquiryStatus } from '../types/inquiry';
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  Mail,
  Phone,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  MessageCircle,
  Copy,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

interface InquiryBoardProps {
  inquiries: Inquiry[];
  onSelectInquiry: (inquiry: Inquiry) => void;
  onStatusChange: (id: string, newStatus: InquiryStatus) => Promise<void>;
  isLoading: boolean;
}

// Draggable Card Component
interface BoardCardProps {
  inquiry: Inquiry;
  onSelectInquiry: (inquiry: Inquiry) => void;
  onStatusChange: (id: string, newStatus: InquiryStatus) => Promise<void>;
  isOverlay?: boolean;
}

const BoardCard: React.FC<BoardCardProps> = ({
  inquiry,
  onSelectInquiry,
  onStatusChange,
  isOverlay = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: inquiry.id,
    data: { inquiry },
    disabled: isOverlay,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const dateStr = inquiry.created_at || inquiry.createdAt || '';
  const diffHours = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  // Age dot logic: neutral (<24h), amber (>24h), red (>72h) for non-resolved
  let ageDotColor = 'bg-white/30';
  let ageTooltip = 'Submitted recently';
  if (inquiry.status !== 'Resolved') {
    if (diffHours >= 72) {
      ageDotColor = 'bg-[#F87171] ring-2 ring-[#F87171]/20';
      ageTooltip = `Waiting ${diffDays} days (${diffHours}h)`;
    } else if (diffHours >= 24) {
      ageDotColor = 'bg-[#FB923C] ring-2 ring-[#FB923C]/20';
      ageTooltip = `Waiting ${diffDays} day (${diffHours}h)`;
    } else {
      ageDotColor = 'bg-[#FFD60A]/80';
      ageTooltip = `Waiting ${diffHours}h`;
    }
  }

  const copyToClipboard = (e: React.MouseEvent, text: string, label: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const digitsPhone = inquiry.phone.replace(/\D/g, '');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelectInquiry(inquiry)}
      className={`p-4 rounded-xl bg-[#141414] border transition-all cursor-pointer group hover:shadow-xl relative ${
        isDragging ? 'opacity-30 border-dashed border-[#FFD60A]' : 'border-white/10 hover:border-[#FFD60A]/50'
      } ${isOverlay ? 'shadow-2xl border-[#FFD60A] rotate-2 scale-105 z-50 pointer-events-none' : ''}`}
    >
      {/* Category, Priority, Age Dot, & Relative Time */}
      <div className="flex items-center justify-between text-[11px] mb-2 gap-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`w-2 h-2 rounded-full ${ageDotColor}`}
            title={ageTooltip}
          />
          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#FFD60A] font-semibold text-[10px]">
            {inquiry.category}
          </span>
          {inquiry.priority === 'Urgent' && (
            <span
              title="Urgent Priority"
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] font-bold text-[9px]"
            >
              <Flame className="w-2.5 h-2.5" />
              Urgent
            </span>
          )}
          {inquiry.priority === 'High' && (
            <span
              title="High Priority"
              className="px-1.5 py-0.5 rounded-md bg-[#FB923C]/15 border border-[#FB923C]/30 text-[#FB923C] font-semibold text-[9px]"
            >
              High
            </span>
          )}
        </div>
        <span className="text-[#A3A3A3] flex items-center gap-1 text-[10px] shrink-0">
          <Clock className="w-3 h-3" />
          {diffHours < 1 ? 'Just now' : diffHours < 24 ? `${diffHours}h ago` : `${diffDays}d ago`}
        </span>
      </div>

      {/* Name & User Type & Contact Count */}
      <div className="flex items-center gap-1.5 mb-0.5">
        <h4 className="text-sm font-bold text-[#F5F5F5] group-hover:text-[#FFD60A] transition-colors truncate">
          {inquiry.name}
        </h4>
        {inquiry.contactCount && inquiry.contactCount > 1 ? (
          <span
            title={`${inquiry.contactCount} inquiries from this contact`}
            className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-bold bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/30 shrink-0"
          >
            ×{inquiry.contactCount}
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between text-xs text-[#A3A3A3] mb-3">
        <span>{inquiry.user_type || inquiry.userType}</span>
        {inquiry.assignee && (
          <span
            title={`Assigned to ${inquiry.assignee.name}`}
            className="inline-flex items-center gap-1 text-[10px] text-[#A3A3A3]"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-white/10 text-[#FFD60A] font-bold flex items-center justify-center text-[8px]">
              {inquiry.assignee.name.charAt(0)}
            </span>
            <span className="truncate max-w-[70px]">{inquiry.assignee.name.split(' ')[0]}</span>
          </span>
        )}
      </div>

      {/* Contact Snippets */}
      <div className="space-y-1 text-xs text-[#A3A3A3] mb-3">
        <div className="flex items-center gap-1.5 truncate">
          <Mail className="w-3 h-3 text-[#A3A3A3] shrink-0" />
          <span className="truncate">{inquiry.email}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-[#A3A3A3] shrink-0" />
          <span>{inquiry.phone}</span>
        </div>
      </div>

      {/* Hover Quick Actions Bar */}
      <div
        className="flex items-center justify-between pt-2 border-t border-white/5 mt-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Quick Contact Icons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => copyToClipboard(e, inquiry.email, 'Email')}
            title="Copy Email"
            aria-label="Copy email"
            className="p-1 rounded text-[#A3A3A3] hover:text-[#FFD60A] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <a
            href={`tel:${inquiry.phone}`}
            title="Call"
            aria-label="Call phone"
            className="p-1 rounded text-[#A3A3A3] hover:text-[#4ADE80] hover:bg-white/5 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
          <a
            href={`https://wa.me/${digitsPhone}?text=${encodeURIComponent(
              `Hello ${inquiry.name}, regarding your inquiry with K12 Hunar:`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp"
            aria-label="Chat on WhatsApp"
            className="p-1 rounded text-[#A3A3A3] hover:text-[#22C55E] hover:bg-white/5 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Fallback MOVE select */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider">Move:</span>
          <select
            aria-label="Move inquiry status"
            value={inquiry.status}
            onChange={(e) => onStatusChange(inquiry.id, e.target.value as InquiryStatus)}
            className="text-[11px] bg-[#171717] border border-white/10 text-[#F5F5F5] rounded px-1.5 py-0.5 focus:border-[#FFD60A] focus:outline-none cursor-pointer"
          >
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Droppable Column Component
interface BoardColumnProps {
  status: InquiryStatus;
  label: string;
  headerColor: string;
  dotColor: string;
  items: Inquiry[];
  onSelectInquiry: (inquiry: Inquiry) => void;
  onStatusChange: (id: string, newStatus: InquiryStatus) => Promise<void>;
  sortOrder: 'newest' | 'oldest';
  onToggleSort: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOver: boolean;
  hasJustResolved?: boolean;
}

const BoardColumn: React.FC<BoardColumnProps> = ({
  status,
  label,
  headerColor,
  dotColor,
  items,
  onSelectInquiry,
  onStatusChange,
  sortOrder,
  onToggleSort,
  isCollapsed,
  onToggleCollapse,
  isOver,
  hasJustResolved = false,
}) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  // Calculate oldest waiting item in this column
  const oldestWaiting = useMemo(() => {
    if (items.length === 0) return null;
    let oldest = items[0];
    for (const item of items) {
      const itemTime = new Date(item.created_at || item.createdAt || '').getTime();
      const oldestTime = new Date(oldest.created_at || oldest.createdAt || '').getTime();
      if (itemTime < oldestTime) oldest = item;
    }
    const diffHours = Math.floor((Date.now() - new Date(oldest.created_at || oldest.createdAt || '').getTime()) / 3600000);
    return diffHours < 24 ? `${diffHours}h` : `${Math.floor(diffHours / 24)}d`;
  }, [items]);

  // Sort items according to column preference
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const timeA = new Date(a.created_at || a.createdAt || '').getTime();
      const timeB = new Date(b.created_at || b.createdAt || '').getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [items, sortOrder]);

  return (
    <div
      ref={setNodeRef}
      className={`glass-card p-4 flex flex-col min-h-[480px] transition-all duration-200 ${
        isOver ? 'ring-2 ring-dashed ring-[#FFD60A] bg-[#FFD60A]/[0.02]' : ''
      } ${hasJustResolved ? 'ring-2 ring-[#4ADE80] animate-pulse' : ''}`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <div>
            <h3 className={`text-sm font-bold ${headerColor}`}>{label}</h3>
            {oldestWaiting && status !== 'Resolved' && (
              <span className="text-[10px] text-[#A3A3A3] block">
                Oldest: {oldestWaiting}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Item Count */}
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[#A3A3A3] font-semibold">
            {items.length}
          </span>

          {/* Sort toggle (Newest vs Oldest) */}
          <button
            type="button"
            onClick={onToggleSort}
            className="p-1 rounded text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors cursor-pointer"
            title={`Sort: ${sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}`}
            aria-label="Toggle column sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors cursor-pointer"
            aria-label={isCollapsed ? 'Expand column' : 'Collapse column'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Column Cards Container */}
      {!isCollapsed && (
        <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
          {items.length === 0 ? (
            <div
              className={`p-10 text-center text-xs text-[#A3A3A3] border border-dashed rounded-xl transition-all ${
                isOver ? 'border-[#FFD60A] text-[#FFD60A] bg-[#FFD60A]/5' : 'border-white/10'
              }`}
            >
              {isOver ? 'Drop here to move' : `No inquiries in ${label}`}
            </div>
          ) : (
            sortedItems.map((inquiry) => (
              <BoardCard
                key={inquiry.id}
                inquiry={inquiry}
                onSelectInquiry={onSelectInquiry}
                onStatusChange={onStatusChange}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const InquiryBoard: React.FC<InquiryBoardProps> = ({
  inquiries,
  onSelectInquiry,
  onStatusChange,
  isLoading,
}) => {
  const [activeInquiry, setActiveInquiry] = useState<Inquiry | null>(null);
  const [justResolved, setJustResolved] = useState<boolean>(false);

  // Column Sort Preferences
  const [columnSorts, setColumnSorts] = useState<Record<InquiryStatus, 'newest' | 'oldest'>>({
    New: 'newest',
    'In Progress': 'newest',
    Resolved: 'newest',
  });

  // Column Collapse Preferences
  const [collapsedCols, setCollapsedCols] = useState<Record<InquiryStatus, boolean>>({
    New: false,
    'In Progress': false,
    Resolved: false,
  });

  // dnd-kit sensors: pointer with 5px activation distance + keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const columns: { status: InquiryStatus; label: string; headerColor: string; dotColor: string }[] = [
    { status: 'New', label: 'New', headerColor: 'text-[#FFD60A]', dotColor: 'bg-[#FFD60A]' },
    { status: 'In Progress', label: 'In Progress', headerColor: 'text-[#FB923C]', dotColor: 'bg-[#FB923C]' },
    { status: 'Resolved', label: 'Resolved', headerColor: 'text-[#4ADE80]', dotColor: 'bg-[#4ADE80]' },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const inquiry = event.active.data.current?.inquiry as Inquiry;
    if (inquiry) {
      setActiveInquiry(inquiry);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveInquiry(null);

    if (!over) return;
    const targetStatus = over.id as InquiryStatus;
    const currentInquiry = active.data.current?.inquiry as Inquiry;

    if (!currentInquiry || currentInquiry.status === targetStatus) return;

    // Trigger resolved pulse animation if moving to Resolved
    if (targetStatus === 'Resolved') {
      setJustResolved(true);
      setTimeout(() => setJustResolved(false), 800);
    }

    try {
      await onStatusChange(currentInquiry.id, targetStatus);
    } catch {
      // Error handled with rollback toast in parent
    }
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 items-start">
        {columns.map((col) => {
          const items = inquiries.filter((item) => item.status === col.status);

          return (
            <BoardColumn
              key={col.status}
              status={col.status}
              label={col.label}
              headerColor={col.headerColor}
              dotColor={col.dotColor}
              items={items}
              onSelectInquiry={onSelectInquiry}
              onStatusChange={onStatusChange}
              sortOrder={columnSorts[col.status]}
              onToggleSort={() =>
                setColumnSorts((prev) => ({
                  ...prev,
                  [col.status]: prev[col.status] === 'newest' ? 'oldest' : 'newest',
                }))
              }
              isCollapsed={collapsedCols[col.status]}
              onToggleCollapse={() =>
                setCollapsedCols((prev) => ({
                  ...prev,
                  [col.status]: !prev[col.status],
                }))
              }
              isOver={false}
              hasJustResolved={col.status === 'Resolved' && justResolved}
            />
          );
        })}
      </div>

      {/* Lifted Drag Overlay */}
      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeInquiry ? (
          <BoardCard
            inquiry={activeInquiry}
            onSelectInquiry={() => {}}
            onStatusChange={async () => {}}
            isOverlay={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default InquiryBoard;
