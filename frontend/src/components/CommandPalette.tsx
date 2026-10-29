import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  LayoutDashboard,
  Kanban,
  LogOut,
  X,
  Keyboard,
  Sparkles,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionId: string, payload?: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [filterText, setFilterText] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'focus_search', label: 'Focus Search Bar', icon: Search, group: 'Navigation' },
    { id: 'view_table', label: 'Switch to Table View', icon: LayoutDashboard, group: 'Views' },
    { id: 'view_board', label: 'Switch to Pipeline Board', icon: Kanban, group: 'Views' },
    { id: 'export_csv', label: 'Export Current Inquiries as CSV', icon: Download, group: 'Actions' },
    { id: 'reset_filters', label: 'Clear & Reset All Filters', icon: RotateCcw, group: 'Actions' },
    { id: 'filter_cat_scholarship', label: 'Filter: Category -> Scholarship', icon: Filter, group: 'Category Filters', payload: 'Scholarship' },
    { id: 'filter_cat_concert', label: 'Filter: Category -> Concert', icon: Filter, group: 'Category Filters', payload: 'Concert' },
    { id: 'filter_cat_admission', label: 'Filter: Category -> Admission', icon: Filter, group: 'Category Filters', payload: 'Admission' },
    { id: 'filter_cat_general', label: 'Filter: Category -> General Query', icon: Filter, group: 'Category Filters', payload: 'General Query' },
    { id: 'filter_status_new', label: 'Filter: Status -> New', icon: Filter, group: 'Status Filters', payload: 'New' },
    { id: 'filter_status_progress', label: 'Filter: Status -> In Progress', icon: Filter, group: 'Status Filters', payload: 'In Progress' },
    { id: 'filter_status_resolved', label: 'Filter: Status -> Resolved', icon: Filter, group: 'Status Filters', payload: 'Resolved' },
    { id: 'toggle_bg_effects', label: 'Toggle Background Effects (Auto / On / Off)', icon: Sparkles, group: 'Settings' },
    { id: 'logout', label: 'Sign Out Admin Session', icon: LogOut, group: 'Session' },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0C0C0C] border border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp">
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="w-4 h-4 text-[#FFD60A]" />
          <input
            type="text"
            placeholder="Type a command or search actions..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-[#F5F5F5] placeholder-[#6B6B6B] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action list */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#A3A3A3]">
              No matching commands found.
            </div>
          ) : (
            filtered.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    onSelectAction(action.id, action.payload);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-left text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white/5 text-[#A3A3A3] group-hover:text-[#FFD60A] group-hover:bg-[#FFD60A]/10 transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-[#F5F5F5]">{action.label}</span>
                  </div>
                  <span className="text-[10px] text-[#6B6B6B] uppercase font-semibold">
                    {action.group}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 border-t border-white/10 bg-[#080808] flex items-center justify-between text-[11px] text-[#A3A3A3]">
          <span className="flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-[#FFD60A]" />
            <span>Navigation Shortcuts</span>
          </span>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[#F5F5F5]">Esc</kbd> close
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
