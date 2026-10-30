import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

export type RefineFrameStage = 'idle' | 'validating' | 'submitting' | 'ready' | 'error';

export interface RefineFrameProps {
  children: React.ReactNode;
  status?: RefineFrameStage;
  className?: string;
  labels?: Partial<Record<RefineFrameStage, string>>;
  showStatus?: boolean;
  sweep?: boolean;
  aspectRatio?: string;
  onRetry?: () => void;
  headerSlot?: React.ReactNode;
}

const DEFAULT_LABELS: Record<RefineFrameStage, string> = {
  idle: 'Secure Portal • Inquiries Open',
  validating: 'Validating Input...',
  submitting: 'Encrypting & Dispatching...',
  ready: 'Verified & Logged',
  error: 'Transmission Error',
};

export const RefineFrame: React.FC<RefineFrameProps> = ({
  children,
  status = 'idle',
  className = '',
  labels,
  showStatus = true,
  sweep = true,
  headerSlot,
}) => {
  const currentLabel = labels?.[status] || DEFAULT_LABELS[status];

  // Stage indicator icon & badge colors
  const getBadgeStyle = () => {
    switch (status) {
      case 'submitting':
      case 'validating':
        return {
          dotBg: 'bg-[#FFD60A]',
          text: 'text-[#FFD60A]',
          border: 'border-[#FFD60A]/40',
          bg: 'bg-[#FFD60A]/10',
          pulse: true,
          icon: <Loader2 className="w-3 h-3 animate-spin text-[#FFD60A]" />,
        };
      case 'ready':
        return {
          dotBg: 'bg-[#4ADE80]',
          text: 'text-[#4ADE80]',
          border: 'border-[#4ADE80]/40',
          bg: 'bg-[#4ADE80]/10',
          pulse: false,
          icon: <CheckCircle2 className="w-3 h-3 text-[#4ADE80]" />,
        };
      case 'error':
        return {
          dotBg: 'bg-[#F87171]',
          text: 'text-[#F87171]',
          border: 'border-[#F87171]/40',
          bg: 'bg-[#F87171]/10',
          pulse: false,
          icon: <AlertCircle className="w-3 h-3 text-[#F87171]" />,
        };
      case 'idle':
      default:
        return {
          dotBg: 'bg-[#FFD60A]',
          text: 'text-[#E5E5E5]',
          border: 'border-white/10',
          bg: 'bg-black/60',
          pulse: true,
          icon: <ShieldCheck className="w-3 h-3 text-[#FFD60A]" />,
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <div
      className={`relative rounded-3xl p-[1px] group transition-all duration-500 overflow-hidden ${className}`}
      style={{
        boxShadow:
          status === 'submitting' || status === 'validating'
            ? '0 0 50px -10px rgba(255, 214, 10, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.95)'
            : '0 0 35px -15px rgba(255, 214, 10, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.95)',
      }}
    >
      {/* Precision Base Perimeter Border */}
      <div
        className={`absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-700 ${
          status === 'submitting' || status === 'validating'
            ? 'opacity-100 bg-gradient-to-r from-[#FFD60A]/80 via-white/20 to-[#FFD60A]/80 animate-pulse'
            : 'opacity-60 bg-gradient-to-br from-white/15 via-white/5 to-[#FFD60A]/20 group-hover:opacity-100'
        }`}
      />

      {/* Sweep Luminous Beam Effect (clipped strictly to 1px perimeter by the opaque inner card) */}
      {sweep && (
        <div
          className={`absolute -inset-[100%] pointer-events-none z-0 ${
            status === 'submitting' || status === 'validating' ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'
          } transition-opacity duration-500`}
        >
          <div
            className={`w-full h-full ${
              status === 'submitting' || status === 'validating'
                ? 'animate-[spin_4s_linear_infinite]'
                : 'animate-[spin_10s_linear_infinite]'
            }`}
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg 280deg, rgba(255, 214, 10, 0.3) 320deg, #FFD60A 360deg)',
            }}
          />
        </div>
      )}

      {/* Inner Surface Card - Opaque Deep Obsidian (Zero bleed, crystal clear contrast) */}
      <div className="relative z-10 rounded-[calc(1.5rem-1px)] bg-[#0C0C12] overflow-hidden">
        {/* Subtle Ambient Radial Glow inside the card */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFD60A]/[0.03] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/[0.015] rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Top Refine Precision Bar */}
        <div className="relative z-20 flex items-center justify-between px-6 sm:px-8 pt-5 pb-3 border-b border-white/[0.06]">
          {/* Header Slot or Brand Indicator */}
          <div className="flex items-center gap-2">
            {headerSlot || (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FFD60A] shadow-[0_0_8px_#FFD60A]" />
                <span className="text-[11px] font-mono tracking-widest uppercase text-white/50">
                  HUNAR // REFINE-GATEWAY
                </span>
              </div>
            )}
          </div>

          {/* Micro Status Chip */}
          {showStatus && (
            <AnimatePresence mode="wait">
              <motion.div
                key={status + currentLabel}
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${badge.bg} ${badge.border} border text-xs font-medium backdrop-blur-md transition-colors`}
              >
                {badge.icon}
                <span className={`${badge.text} text-[11px] font-medium tracking-tight`}>
                  {currentLabel}
                </span>
                {badge.pulse && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD60A] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FFD60A]" />
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Precision Corner HUD Crosshairs */}
        <div className="absolute top-2.5 left-2.5 pointer-events-none z-20 select-none">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#FFD60A]/40">
            <path d="M0 0H8M0 0V8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="absolute top-2.5 right-2.5 pointer-events-none z-20 select-none">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#FFD60A]/40">
            <path d="M12 0H4M12 0V8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="absolute bottom-2.5 left-2.5 pointer-events-none z-20 select-none">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#FFD60A]/40">
            <path d="M0 12H8M0 12V4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="absolute bottom-2.5 right-2.5 pointer-events-none z-20 select-none">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#FFD60A]/40">
            <path d="M12 12H4M12 12V4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Content Container (Zero Layout Shift) */}
        <div className="relative z-10 w-full transition-all duration-300">
          {children}
        </div>
      </div>
    </div>
  );
};
