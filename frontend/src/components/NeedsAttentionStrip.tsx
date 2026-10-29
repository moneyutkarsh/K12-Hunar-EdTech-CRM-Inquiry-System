import React from 'react';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface NeedsAttentionStripProps {
  count: number;
  onReview: () => void;
}

export const NeedsAttentionStrip: React.FC<NeedsAttentionStripProps> = ({
  count,
  onReview,
}) => {
  if (count === 0) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 my-3 text-xs">
        <div className="flex items-center gap-2 text-[#4ADE80]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium text-[#F5F5F5]">All caught up</span>
          <span className="text-[#A3A3A3] hidden sm:inline">— No new inquiries waiting over 24 hours</span>
        </div>
        <span className="text-[11px] text-[#A3A3A3]">Response time on target</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#FFD60A]/10 border border-[#FFD60A]/30 my-3 text-xs relative overflow-hidden group">
      <div className="flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-[#FFD60A] animate-ping" />
        <AlertCircle className="w-4 h-4 text-[#FFD60A] shrink-0" />
        <div>
          <span className="font-bold text-[#FFD60A]">
            {count} {count === 1 ? 'inquiry needs' : 'inquiries need'} attention
          </span>
          <span className="text-[#A3A3A3] ml-2 hidden sm:inline">
            Waiting in "New" state for more than 24 hours
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onReview}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFD60A] hover:bg-[#FFE14D] text-[#0A0A0A] font-bold text-xs transition-all shadow-sm cursor-pointer"
      >
        <span>Review</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default NeedsAttentionStrip;
