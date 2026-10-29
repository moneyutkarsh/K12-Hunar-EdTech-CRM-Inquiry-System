import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  ArrowRightLeft,
  Flame,
  UserPlus,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  ExternalLink,
  Filter,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

interface ActivityItem {
  id: string;
  inquiryId: string;
  action: string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  inquiry: {
    id: string;
    referenceCode: string;
    name: string;
    email: string;
    category: string;
    userType: string;
    status: string;
    priority: string;
  };
}

type ActionFilter = 'all' | 'status' | 'priority' | 'assigned' | 'notes';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) {
    const min = Math.floor(diffSec / 60);
    return `${min}m ago`;
  }
  if (diffSec < 86400) {
    const hrs = Math.floor(diffSec / 3600);
    return `${hrs}h ago`;
  }
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupActivitiesByDate(items: ActivityItem[]): { label: string; items: ActivityItem[] }[] {
  const groups: { [key: string]: ActivityItem[] } = {};
  const now = new Date();
  const todayStr = now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const startOfWeek = new Date();
  startOfWeek.setDate(now.getDate() - 7);

  items.forEach((item) => {
    const itemDate = new Date(item.createdAt);
    let label = 'Older';

    if (itemDate.toDateString() === todayStr) {
      label = 'Today';
    } else if (itemDate.toDateString() === yesterdayStr) {
      label = 'Yesterday';
    } else if (itemDate >= startOfWeek) {
      label = 'Earlier this week';
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(item);
  });

  const order = ['Today', 'Yesterday', 'Earlier this week', 'Older'];
  return order.filter((label) => groups[label] && groups[label].length > 0).map((label) => ({
    label,
    items: groups[label],
  }));
}

export const AdminActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActionFilter>('all');

  const fetchActivities = useCallback(
    async (filter: ActionFilter, cursor: string | null = null, append: boolean = false) => {
      try {
        if (!append) setIsLoading(true);
        else setIsLoadingMore(true);

        const params: any = { limit: 20 };
        if (filter !== 'all') params.action = filter;
        if (cursor) params.cursor = cursor;

        const res = await api.get('/activity', { params });
        const newItems = res.data?.data || [];
        const pagination = res.data?.pagination || {};

        setItems((prev) => (append ? [...prev, ...newItems] : newItems));
        setNextCursor(pagination.nextCursor || null);
        setHasMore(Boolean(pagination.hasMore));
      } catch (err: any) {
        toast.error('Failed to load activity logs.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchActivities(activeFilter, null, false);
  }, [activeFilter, fetchActivities]);

  const handleFilterChange = (filter: ActionFilter) => {
    if (filter === activeFilter) return;
    setActiveFilter(filter);
  };

  const handleLoadMore = () => {
    if (!hasMore || !nextCursor || isLoadingMore) return;
    fetchActivities(activeFilter, nextCursor, true);
  };

  const handleNavigateToDrawer = (inquiryId: string) => {
    navigate(`/admin?drawer=${inquiryId}`);
  };

  const renderActionBadge = (action: string) => {
    switch (action) {
      case 'status_changed':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#FFD60A]/10 text-[#FFD60A] border border-[#FFD60A]/20 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
        );
      case 'priority_changed':
        return (
          <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" />
          </div>
        );
      case 'assigned':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4" />
          </div>
        );
      case 'note_added':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      case 'created':
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center shrink-0">
            <PlusCircle className="w-4 h-4" />
          </div>
        );
    }
  };

  const renderActionContent = (item: ActivityItem) => {
    const actorName = item.actor?.name || (item.actor ? item.actor.email.split('@')[0] : 'Public Portal');
    const refCode = item.inquiry.referenceCode;
    const inquiryName = item.inquiry.name;

    switch (item.action) {
      case 'status_changed':
        return (
          <div>
            <p className="text-xs text-[#F5F5F5] leading-relaxed">
              <span className="font-semibold text-white">{actorName}</span> changed{' '}
              <span className="font-mono text-[11px] text-[#FFD60A]">{refCode}</span> status from{' '}
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-[#A3A3A3]">
                {item.fromValue || 'None'}
              </span>{' '}
              to{' '}
              <span
                className={`px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold ${
                  item.toValue === 'Resolved'
                    ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30'
                    : item.toValue === 'In Progress'
                    ? 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/30'
                    : 'bg-[#FFD60A]/10 text-[#FFD60A] border border-[#FFD60A]/30'
                }`}
              >
                {item.toValue}
              </span>
            </p>
          </div>
        );

      case 'priority_changed':
        return (
          <div>
            <p className="text-xs text-[#F5F5F5] leading-relaxed">
              <span className="font-semibold text-white">{actorName}</span> updated priority from{' '}
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-[#A3A3A3]">
                {item.fromValue || 'Normal'}
              </span>{' '}
              to{' '}
              <span
                className={`px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold ${
                  item.toValue === 'Urgent'
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : item.toValue === 'High'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-white/10 text-[#F5F5F5] border border-white/10'
                }`}
              >
                {item.toValue}
              </span>
            </p>
          </div>
        );

      case 'assigned':
        return (
          <div>
            <p className="text-xs text-[#F5F5F5] leading-relaxed">
              <span className="font-semibold text-white">{actorName}</span> assigned lead to{' '}
              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold text-[11px]">
                {item.toValue}
              </span>
            </p>
          </div>
        );

      case 'note_added':
        return (
          <div className="space-y-1.5">
            <p className="text-xs text-[#F5F5F5] leading-relaxed">
              <span className="font-semibold text-white">{actorName}</span> recorded an internal note:
            </p>
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs text-[#A3A3A3] italic">
              "{item.toValue}"
            </div>
          </div>
        );

      case 'created':
      default:
        return (
          <div>
            <p className="text-xs text-[#F5F5F5] leading-relaxed">
              New inquiry submitted for{' '}
              <span className="font-semibold text-white">{inquiryName}</span> ({item.inquiry.category})
            </p>
          </div>
        );
    }
  };

  const groupedTimeline = groupActivitiesByDate(items);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-[#FFD60A] transition-colors border border-white/5"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFD60A]/10 border border-[#FFD60A]/20 text-[#FFD60A] flex items-center justify-center shadow-lg shadow-[#FFD60A]/5">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] font-display">System Audit & Activity Feed</h1>
              <p className="text-xs text-[#A3A3A3]">
                Full chronological ledger of inquiry status changes, priorities, assignments, and notes
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchActivities(activeFilter, null, false)}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#A3A3A3] hover:text-white transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs text-[#737373] pr-2 border-r border-white/10 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>

        {(
          [
            { id: 'all', label: 'All Activities' },
            { id: 'status', label: 'Status Changes' },
            { id: 'priority', label: 'Priority Updates' },
            { id: 'assigned', label: 'Lead Assignments' },
            { id: 'notes', label: 'Internal Notes' },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => handleFilterChange(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border ${
              activeFilter === f.id
                ? 'bg-[#FFD60A] text-[#0A0A0A] border-[#FFD60A] font-semibold shadow-md shadow-[#FFD60A]/10'
                : 'bg-white/5 text-[#A3A3A3] border-white/5 hover:bg-white/10 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline Section */}
      {isLoading ? (
        <div className="glass-card p-12 text-center text-[#A3A3A3]">
          <Activity className="w-8 h-8 text-[#FFD60A] mx-auto mb-3 animate-pulse" />
          <h3 className="text-base font-semibold text-[#F5F5F5] mb-1">Loading activity timeline...</h3>
          <p className="text-xs text-[#737373]">Fetching latest event entries from database</p>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-12 text-center text-[#A3A3A3]">
          <Clock className="w-8 h-8 text-[#737373] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#F5F5F5] mb-1">No activity events found</h3>
          <p className="text-xs text-[#737373] max-w-sm mx-auto">
            {activeFilter === 'all'
              ? 'Activity records will automatically accumulate as inquiries are triaged and updated.'
              : 'No activities match the current filter criteria. Try selecting "All Activities".'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedTimeline.map((group) => (
            <div key={group.label} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FFD60A] font-mono">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[11px] text-[#737373]">{group.items.length} events</span>
              </div>

              <div className="space-y-2.5">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="glass-card p-4 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {renderActionBadge(item.action)}

                      <div className="space-y-1.5 flex-1 min-w-0">
                        {renderActionContent(item)}

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#737373]">
                          {/* Inquiry Pill */}
                          <button
                            type="button"
                            onClick={() => handleNavigateToDrawer(item.inquiryId)}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 hover:bg-[#FFD60A]/10 text-[#A3A3A3] hover:text-[#FFD60A] border border-white/5 transition-colors font-mono font-medium"
                          >
                            <span>{item.inquiry.referenceCode}</span>
                            <span className="text-white/40">•</span>
                            <span className="font-sans font-normal truncate max-w-[120px]">{item.inquiry.name}</span>
                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                          </button>

                          <span>•</span>
                          <span title={new Date(item.createdAt).toLocaleString()}>
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* View Inquiry Action */}
                    <button
                      type="button"
                      onClick={() => handleNavigateToDrawer(item.inquiryId)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 group-hover:bg-[#FFD60A] text-[#A3A3A3] group-hover:text-[#0A0A0A] border border-white/10 group-hover:border-[#FFD60A] text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 self-end sm:self-center"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#F5F5F5] hover:text-[#FFD60A] transition-all disabled:opacity-50 inline-flex items-center gap-2 shadow-sm"
              >
                {isLoadingMore ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#FFD60A] border-t-transparent rounded-full animate-spin" />
                    <span>Loading Older Activities...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Activities</span>
                    <Clock className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminActivityPage;
