import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  Copy,
  Check,
  Award,
  BookOpen,
  Music,
  Clock,
} from 'lucide-react';

export const SampleTrackerPreviewCard: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1); // 1 = Received, 2 = In review
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  // 6-second gentle loop alternating between Received & In review (paused on reduced motion)
  useEffect(() => {
    if (prefersReduced) {
      setStep(2);
      return;
    }

    const interval = setInterval(() => {
      setStep((prev) => (prev === 1 ? 2 : 1));
    }, 6000);

    return () => clearInterval(interval);
  }, [prefersReduced]);

  // Pointer move 3D tilt with RAF throttling (disabled on touch & reduced motion)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReduced || !cardRef.current) return;

    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Max 6 degrees tilt
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      setTilt({ x: rotateX, y: rotateY });
    });
  };

  const handleMouseLeave = () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    setTilt({ x: 0, y: 0 });
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText('KH-8F3K2Q4M');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative w-full max-w-[440px] mx-auto select-none"
      style={{ perspective: 1000 }}
      aria-label="Sample inquiry tracker preview"
      role="region"
    >
      {/* Background yellow radial glow focal point */}
      <div
        className="absolute -inset-4 bg-gradient-to-tr from-[#FFD60A]/20 via-[#FB923C]/10 to-transparent rounded-3xl blur-2xl -z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Floating Category Chips (Desktop only, staggered float, shifts with parallax) */}
      <div
        className="hidden lg:block absolute -top-5 -left-6 z-20 pointer-events-none"
        aria-hidden="true"
        style={{
          transform: prefersReduced
            ? undefined
            : `translate(${tilt.y * -0.8}px, ${tilt.x * -0.8}px)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        <div
          className="glass-card px-3 py-1.5 rounded-full flex items-center gap-1.5 border-[#FFD60A]/40 shadow-lg bg-[#050505]/70 backdrop-blur-xl text-xs font-semibold text-[#FFD60A]"
          style={{
            animation: prefersReduced
              ? 'none'
              : 'float-chip-1 6s ease-in-out infinite alternate',
          }}
        >
          <Award className="w-3.5 h-3.5 text-[#FFD60A]" />
          <span>Scholarships</span>
        </div>
      </div>

      <div
        className="hidden lg:block absolute -bottom-4 -left-4 z-20 pointer-events-none"
        aria-hidden="true"
        style={{
          transform: prefersReduced
            ? undefined
            : `translate(${tilt.y * -0.6}px, ${tilt.x * -0.6}px)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        <div
          className="glass-card px-3 py-1.5 rounded-full flex items-center gap-1.5 border-[#60A5FA]/40 shadow-lg bg-[#050505]/70 backdrop-blur-xl text-xs font-semibold text-[#60A5FA]"
          style={{
            animation: prefersReduced
              ? 'none'
              : 'float-chip-2 7s ease-in-out infinite alternate 1s',
          }}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span>Admissions</span>
        </div>
      </div>

      <div
        className="hidden lg:block absolute top-1/2 -right-6 z-20 pointer-events-none"
        aria-hidden="true"
        style={{
          transform: prefersReduced
            ? undefined
            : `translate(${tilt.y * -0.7}px, ${tilt.x * -0.7}px)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        <div
          className="glass-card px-3 py-1.5 rounded-full flex items-center gap-1.5 border-[#FB923C]/40 shadow-lg bg-[#050505]/70 backdrop-blur-xl text-xs font-semibold text-[#FB923C]"
          style={{
            animation: prefersReduced
              ? 'none'
              : 'float-chip-3 5.5s ease-in-out infinite alternate 0.5s',
          }}
        >
          <Music className="w-3.5 h-3.5 text-[#FB923C]" />
          <span>Concerts</span>
        </div>
      </div>

      {/* Main Glass Tracker Preview Card */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="glass-card rounded-2xl p-6 border-[#FFD60A]/30 glow-yellow-sm bg-[#0A0A0A]/85 backdrop-blur-2xl transition-transform duration-150 ease-out relative overflow-hidden"
        style={{
          transform: prefersReduced
            ? undefined
            : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Subtle decorative inner corner shine */}
        <div
          className="absolute -top-12 -right-12 w-28 h-28 bg-[#FFD60A]/10 rounded-full blur-xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[#FFD60A] tracking-wider px-2 py-0.5 rounded-md bg-[#FFD60A]/10 border border-[#FFD60A]/20">
              KH-8F3K2Q4M
            </span>
            <button
              onClick={handleCopy}
              className="p-1 rounded text-[#A3A3A3] hover:text-[#FFD60A] hover:bg-white/5 transition-colors"
              title="Copy reference code"
              aria-label="Copy reference code"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFD60A]/10 text-[#FFD60A] border border-[#FFD60A]/30">
              Scholarship
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/10 text-[#A3A3A3] border border-white/15">
              Sample preview
            </span>
          </div>
        </div>

        {/* 3-Step Animated Stepper */}
        <div className="py-2 mb-5">
          <div className="relative flex items-center justify-between">
            {/* Progress Track Line */}
            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-white/10 -z-0" />
            <div
              className="absolute top-1/2 left-4 -translate-y-1/2 h-0.5 bg-[#FFD60A] transition-all duration-700 ease-out -z-0"
              style={{
                width: step === 1 ? '10%' : step === 2 ? '50%' : '100%',
              }}
            />

            {/* Step 1: Received */}
            <div className="flex flex-col items-center gap-1.5 z-10">
              <div className="w-7 h-7 rounded-full bg-[#FFD60A] text-[#0A0A0A] flex items-center justify-center font-bold text-xs shadow-sm">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold text-[#F5F5F5]">Received</span>
            </div>

            {/* Step 2: In review */}
            <div className="flex flex-col items-center gap-1.5 z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  step >= 2
                    ? 'bg-[#FFD60A] text-[#0A0A0A] ring-4 ring-[#FFD60A]/30 animate-pulse'
                    : 'bg-[#171717] text-[#A3A3A3] border border-white/15'
                }`}
              >
                {step >= 2 ? <Clock className="w-3.5 h-3.5" /> : '2'}
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  step >= 2 ? 'text-[#FFD60A]' : 'text-[#A3A3A3]'
                }`}
              >
                In review
              </span>
            </div>

            {/* Step 3: Resolved */}
            <div className="flex flex-col items-center gap-1.5 z-10">
              <div className="w-7 h-7 rounded-full bg-[#171717] text-[#A3A3A3] border border-white/15 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <span className="text-[11px] font-semibold text-[#A3A3A3]">Resolved</span>
            </div>
          </div>
        </div>

        {/* Live Detail Rows */}
        <div className="space-y-2.5 pt-3 border-t border-white/10 text-xs">
          <div className="flex items-center justify-between text-[#A3A3A3]">
            <span>Submitted</span>
            <span className="font-medium text-[#F5F5F5]">12 minutes ago</span>
          </div>
          <div className="flex items-center justify-between text-[#A3A3A3]">
            <span>Estimated response</span>
            <span className="font-medium text-[#FFD60A]">Within 24 hours</span>
          </div>
          <div className="flex items-center justify-between text-[#A3A3A3] pt-1 border-t border-white/5">
            <span>Reviewing Counselor</span>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[#FFD60A]/20 text-[#FFD60A] flex items-center justify-center text-[10px] font-bold border border-[#FFD60A]/30">
                PS
              </div>
              <span className="font-medium text-[#F5F5F5]">Priya Sharma (Lead)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleTrackerPreviewCard;
