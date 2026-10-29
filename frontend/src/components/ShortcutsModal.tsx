import React, { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import {
  getStoredBackgroundSetting,
  setStoredBackgroundSetting,
  type BackgroundSetting,
} from '../utils/backgroundDecision';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Navigation' | 'Actions' | 'Drawer Workflow';
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['j'], description: 'Focus next row down in table', category: 'Navigation' },
  { keys: ['k'], description: 'Focus previous row up in table', category: 'Navigation' },
  { keys: ['Enter'], description: 'Open drawer for focused inquiry', category: 'Navigation' },
  { keys: ['x'], description: 'Toggle checkbox selection for row', category: 'Navigation' },
  { keys: ['/'], description: 'Focus global search bar', category: 'Actions' },
  { keys: ['⌘', 'K'], description: 'Toggle Actions Command Palette', category: 'Actions' },
  { keys: ['?'], description: 'Show / hide this shortcuts cheat-sheet', category: 'Actions' },
  { keys: ['j', 'k'], description: 'Navigate to Previous / Next inquiry', category: 'Drawer Workflow' },
  { keys: ['⌘', 'Enter'], description: 'Submit note immediately', category: 'Drawer Workflow' },
  { keys: ['Esc'], description: 'Close active drawer, modal, or selection', category: 'Drawer Workflow' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const [bgSetting, setBgSetting] = useState<BackgroundSetting>(getStoredBackgroundSetting);

  const handleBgChange = (mode: BackgroundSetting) => {
    setBgSetting(mode);
    setStoredBackgroundSetting(mode);
    window.dispatchEvent(
      new CustomEvent('k12-bg-setting-changed', { detail: { setting: mode } })
    );
    toast.success(`Background effects set to ${mode.toUpperCase()}`);
  };
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories: Array<'Navigation' | 'Actions' | 'Drawer Workflow'> = [
    'Navigation',
    'Actions',
    'Drawer Workflow',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFD60A]/10 border border-[#FFD60A]/20 flex items-center justify-center text-[#FFD60A]">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F5F5F5]">Keyboard Shortcuts</h2>
              <p className="text-xs text-[#A3A3A3]">Quick access navigation for power admins</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors"
            aria-label="Close shortcuts modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list grouped by category */}
        <div className="py-4 space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {categories.map((cat) => {
            const items = SHORTCUTS.filter((s) => s.category === cat);
            return (
              <div key={cat} className="space-y-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#FFD60A]">
                  {cat}
                </span>
                <div className="space-y-1.5">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors text-xs"
                    >
                      <span className="text-[#E5E5E5]">{item.description}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[11px] font-mono text-[#FFD60A] min-w-[20px] text-center"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Background Effects Settings (Section 5) */}
        <div className="py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#F5F5F5]">Background Effects</span>
            <span className="text-[10px] text-[#A3A3A3] hidden sm:inline">(GridScan WebGL)</span>
          </div>
          <div className="inline-flex rounded-lg bg-black/50 p-0.5 border border-white/10 text-[11px]">
            {(['auto', 'on', 'off'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleBgChange(mode)}
                className={`px-2.5 py-0.5 rounded font-medium capitalize transition-all cursor-pointer ${
                  bgSetting === mode
                    ? 'bg-[#FFD60A] text-[#0A0A0A] font-bold shadow-sm'
                    : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#A3A3A3]">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[#F5F5F5]">?</kbd> anywhere to toggle</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#F5F5F5] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;
