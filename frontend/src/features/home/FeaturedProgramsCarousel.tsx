import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  MapPin,
  Globe,
  Layers,
  ExternalLink,
  Share2,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowRight,
} from 'lucide-react';
import {
  getActivePrograms,
  formatProgramDate,
  getProgramDateTile,
  formatCountdownText,
  type Program,
  type ProgramMode,
} from './programs';

interface FeaturedProgramsCarouselProps {
  className?: string;
}

export const FeaturedProgramsCarousel: React.FC<FeaturedProgramsCarouselProps> = ({ className = '' }) => {
  const [programs] = useState<Program[]>(() => getActivePrograms());
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [clickPauseUntil, setClickPauseUntil] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });

  // Drag suppression tracking
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  // Check reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Auto-advance timer with smooth segmented progress
  const AUTO_ADVANCE_MS = 6000;

  useEffect(() => {
    if (programs.length <= 1) return;

    let accumulated = 0;

    const interval = setInterval(() => {
      const now = Date.now();
      const isFrozen = isPaused || isHovered || isFocused || now < clickPauseUntil;

      if (!isFrozen) {
        accumulated += 100;
        const pct = Math.min(100, (accumulated / AUTO_ADVANCE_MS) * 100);
        setProgressPercent(pct);

        if (accumulated >= AUTO_ADVANCE_MS) {
          accumulated = 0;
          setProgressPercent(0);
          setActiveIndex((prev) => (prev + 1) % programs.length);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [programs.length, isPaused, isHovered, isFocused, clickPauseUntil, activeIndex]);

  const pauseAfterClick = useCallback(() => {
    setClickPauseUntil(Date.now() + 2500);
    setProgressPercent(0);
  }, []);

  const handlePrev = () => {
    pauseAfterClick();
    setActiveIndex((prev) => (prev - 1 + programs.length) % programs.length);
  };

  const handleNext = () => {
    pauseAfterClick();
    setActiveIndex((prev) => (prev + 1) % programs.length);
  };

  const handleShare = async (e: React.MouseEvent, prog: Program) => {
    e.preventDefault();
    e.stopPropagation();
    pauseAfterClick();

    if (navigator.share) {
      try {
        await navigator.share({
          title: prog.title,
          text: `Check out ${prog.title} on K12 Hunar:`,
          url: prog.officialUrl,
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // fall through to clipboard
        } else {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(prog.officialUrl);
      toast.success('Official link copied to clipboard!');
    } catch {
      toast.error('Could not copy link to clipboard');
    }
  };

  // Pointer event handlers to suppress click when dragging/swiping
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    const elapsed = Date.now() - pointerStartRef.current.time;

    if (dx > 6 || dy > 6 || (elapsed > 250 && (dx > 3 || dy > 3))) {
      isDraggingRef.current = true;
    }

    // Parallax code offset on active card (throttled by rAF)
    if (!prefersReducedMotion && animFrameRef.current === null) {
      const rect = e.currentTarget.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;

      animFrameRef.current = requestAnimationFrame(() => {
        setPointerOffset({ x: -normX * 8, y: -normY * 8 });
        animFrameRef.current = null;
      });
    }
  };

  const handlePointerUp = () => {
    setTimeout(() => {
      pointerStartRef.current = null;
      isDraggingRef.current = false;
    }, 50);
  };

  const handleCardClick = (index: number, e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    pauseAfterClick();

    // If clicking a non-active card, only bring it to center, DO NOT navigate
    if (index !== activeIndex) {
      e.preventDefault();
      e.stopPropagation();
      setActiveIndex(index);
    }
  };

  const getModeIcon = (mode: ProgramMode) => {
    switch (mode) {
      case 'Offline':
        return <MapPin className="w-4 h-4 text-[#FFD60A] shrink-0" aria-hidden="true" />;
      case 'Online':
        return <Globe className="w-4 h-4 text-[#38BDF8] shrink-0" aria-hidden="true" />;
      case 'Hybrid':
      default:
        return <Layers className="w-4 h-4 text-[#A78BFA] shrink-0" aria-hidden="true" />;
    }
  };

  const getCategoryColor = (category: string) => {
    if (category.toLowerCase().includes('science') || category.toLowerCase().includes('tech')) {
      return '#38BDF8';
    }
    return '#FFD60A';
  };

  // If no active programs remain, hide section entirely
  if (programs.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Featured Programs and Competitions"
      className={`relative w-full rounded-3xl p-6 sm:p-8 bg-[#09090D] border border-white/[0.06] overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setPointerOffset({ x: 0, y: 0 });
      }}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={() => setIsFocused(false)}
    >
      {/* Calm Stage Backdrop: Top Faint Cone of Light & Ground Shadow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 65% 45% at 50% 0%, rgba(255, 214, 10, 0.05) 0%, transparent 75%)',
        }}
        aria-hidden="true"
      />

      {/* Static SVG Grain Texture Overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <filter id="cardStageNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#cardStageNoise)" />
      </svg>

      {/* Header Row: Eyebrow + Unified Controls (Prev, Pager, Next, Pause/Play) */}
      <div className="relative z-20 flex items-center justify-between mb-8 pb-4 border-b border-white/[0.06]">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-[#FFD60A] uppercase font-semibold block mb-1">
            Featured Programs
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-[#F5F5F5]">
            Competitions &amp; Fellowships
          </h2>
        </div>

        {/* Sleek Prev / Next Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-white/70 hover:text-[#FFD60A] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFD60A] active:scale-95 shadow-sm"
            aria-label="Previous featured program"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-white/70 hover:text-[#FFD60A] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFD60A] active:scale-95 shadow-sm"
            aria-label="Next featured program"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Depth Carousel Container & Stage */}
      <div
        className="relative min-h-[500px] flex items-center justify-center perspective-[1200px] select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Soft Elliptical Ground Shadow under Active Card */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[340px] sm:w-[380px] h-8 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 0.75) 0%, rgba(255, 214, 10, 0.06) 50%, transparent 80%)',
            filter: 'blur(16px)',
          }}
          aria-hidden="true"
        />

        {programs.map((prog, idx) => {
          const isActive = idx === activeIndex;
          const isPrev = (idx + 1) % programs.length === activeIndex;
          const isNext = (activeIndex + 1) % programs.length === idx;
          const dateTile = getProgramDateTile(prog.startsAt);
          const countdownText = formatCountdownText(prog.startsAt);
          const programCode = prog.code || prog.slug.toUpperCase().slice(0, 4);
          const accentColor = getCategoryColor(prog.displayCategory);

          // Position and 3D transform for Depth Carousel
          let transformStyle: string;
          let zIndex = 10;
          let opacity = 0;
          let pointerEvents: 'auto' | 'none' = 'none';

          if (isActive) {
            transformStyle = 'translateX(0%) translateZ(0px) scale(1)';
            zIndex = 30;
            opacity = 1;
            pointerEvents = 'auto';
          } else if (isNext) {
            transformStyle = 'translateX(26%) translateZ(-90px) rotateY(-8deg) scale(0.92)';
            zIndex = 20;
            opacity = 0.5;
            pointerEvents = 'auto';
          } else if (isPrev) {
            transformStyle = 'translateX(-26%) translateZ(-90px) rotateY(8deg) scale(0.92)';
            zIndex = 20;
            opacity = 0.5;
            pointerEvents = 'auto';
          } else {
            transformStyle = 'translateX(0%) translateZ(-160px) scale(0.85)';
            zIndex = 10;
            opacity = 0;
          }

          return (
            <div
              key={prog.slug}
              onClick={(e) => handleCardClick(idx, e)}
              style={{
                transform: transformStyle,
                zIndex,
                opacity,
                pointerEvents,
              }}
              className={`group absolute top-0 w-full max-w-[400px] transition-all duration-500 ease-out ${
                isActive ? 'cursor-default' : 'cursor-pointer hover:opacity-75'
              }`}
            >
              {/* Dedicated invisible button covering inactive card for recentering */}
              {!isActive && (
                <button
                  type="button"
                  onClick={(e) => handleCardClick(idx, e)}
                  aria-label={`Show ${prog.title}`}
                  className="absolute inset-0 z-40 w-full h-full bg-transparent border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFD60A]"
                />
              )}

              {/* Card Container (Clean 1px border, surface #0E0E0E to #121212, single faint top-left highlight) */}
              <article
                className={`relative rounded-[20px] overflow-hidden transition-all duration-300 ease-out flex flex-col justify-between ${
                  isActive
                    ? 'bg-gradient-to-b from-[#131317] to-[#0E0E12] border border-white/[0.08] shadow-[0_20px_45px_rgba(0,0,0,0.85)] hover:-translate-y-[3px]'
                    : 'bg-[#101014] border border-white/[0.05] filter blur-[1px]'
                }`}
              >
                {/* Single Faint Top-Left Inner Highlight Border */}
                <div
                  className="absolute inset-0 rounded-[20px] pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 20%, transparent 60%)',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    padding: '1px',
                  }}
                  aria-hidden="true"
                />

                {/* ============================================================== */}
                {/* A) POSTER (16:9, ~190-200px tall, overflow hidden, decorative) */}
                {/* ============================================================== */}
                <div
                  aria-hidden="true"
                  className="relative h-48 w-full overflow-hidden bg-[#0A0A0E] border-b border-white/[0.07]"
                >
                  {/* Technical 24px Grid Lines with Faint Tint */}
                  <div
                    className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                      `,
                      backgroundSize: '24px 24px',
                      opacity: isActive ? 0.75 : 0.4,
                    }}
                  />

                  {/* Top & Left Ruler Tick Marks */}
                  <div className="absolute top-0 left-0 right-0 h-2 flex justify-between px-1 opacity-25">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="w-[1px] h-1.5 bg-white" />
                    ))}
                  </div>
                  <div className="absolute top-0 bottom-0 left-0 w-2 flex flex-col justify-between py-1 opacity-25">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-[1px] w-1.5 bg-white" />
                    ))}
                  </div>

                  {/* Architectural Typographic Code Watermark */}
                  <div
                    className="absolute right-3 top-10 select-none pointer-events-none transition-transform duration-300 ease-out"
                    style={{
                      transform: isActive
                        ? `translate(${pointerOffset.x}px, ${pointerOffset.y}px)`
                        : 'none',
                    }}
                  >
                    <span
                      className="font-black text-[88px] sm:text-[98px] leading-none font-sans tracking-tighter select-none"
                      style={{
                        backgroundImage:
                          'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        WebkitTextStroke: '1px rgba(255, 255, 255, 0.10)',
                      }}
                    >
                      {programCode}
                    </span>
                  </div>

                  {/* Top-Left Category & Code Badge */}
                  <div className="absolute top-3.5 left-4 z-10 flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: accentColor }}
                      aria-hidden="true"
                    />
                    <span className="text-[11px] font-sans uppercase tracking-wider text-white/70 font-medium">
                      {prog.displayCategory}
                    </span>
                    <span className="text-white/20 select-none text-xs">/</span>
                    <span className="font-mono text-[11px] font-bold tracking-wider text-[#FFD60A] bg-[#FFD60A]/10 border border-[#FFD60A]/20 px-1.5 py-0.5 rounded">
                      {programCode}
                    </span>
                  </div>

                  {/* Top-Right Share Button (Visible only on active card; 36px icon in 44px hit target) */}
                  {isActive && (
                    <div className="absolute top-2.5 right-3 z-20">
                      <button
                        type="button"
                        onClick={(e) => handleShare(e, prog)}
                        className="w-11 h-11 flex items-center justify-center rounded-full text-white/50 hover:text-[#FFD60A] hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFD60A]"
                        aria-label={`Share official link for ${prog.title}`}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Lower-Left DATE TILE (Solid brand yellow #FFD60A, black text, 14px radius, ~84x96px) */}
                  <div className="absolute bottom-3 left-4 z-10 w-[84px] h-[92px] rounded-[14px] bg-[#FFD60A] text-[#0A0A0A] p-2 flex flex-col justify-between items-center shadow-lg">
                    <span className="text-[10px] font-sans font-bold tracking-widest uppercase">
                      {dateTile.weekday}
                    </span>
                    <span className="text-4xl font-sans font-bold leading-none tracking-tight">
                      {dateTile.day}
                    </span>
                    <span className="text-[11px] font-sans font-bold tracking-wider uppercase">
                      {dateTile.month}
                    </span>
                  </div>

                  {/* Bottom-Right Countdown Text (Plain text; Inter 12px, muted #A3A3A3, tabular-nums; NO chip, NO glow) */}
                  {isActive && (
                    <div className="absolute bottom-3.5 right-4 z-10">
                      <span className="text-xs font-sans tabular-nums text-[#A3A3A3]">
                        {countdownText}
                      </span>
                    </div>
                  )}
                </div>

                {/* ============================================================== */}
                {/* B) DETAILS & ACTIONS                                           */}
                {/* ============================================================== */}
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Title (Space Grotesk 600, 22px, line-height 1.2, text-wrap: balance, max 3 lines) */}
                  <h3 className="text-[20px] sm:text-[22px] font-semibold font-sans text-[#F5F5F5] group-hover:text-white transition-colors leading-[1.2] line-clamp-3">
                    <a
                      href={prog.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={isActive ? 0 : -1}
                      onClick={(e) => {
                        if (!isActive || isDraggingRef.current) {
                          e.preventDefault();
                        }
                      }}
                      className="focus:outline-none focus:ring-2 focus:ring-[#FFD60A] rounded-sm after:absolute after:inset-0 after:z-10"
                    >
                      {prog.title}
                      <span className="sr-only"> (opens in a new tab on k12hunar.com)</span>
                    </a>
                  </h3>

                  {/* Details List & Actions (Visible ONLY on active card; completely hidden on inactive cards) */}
                  {isActive && (
                    <>
                      {/* 3-Row Definition List with Hairline Dividers */}
                      <dl className="space-y-2.5 pt-1 text-sm border-t border-white/[0.07]">
                        {/* 1. WHEN Row */}
                        <div className="flex items-baseline justify-between pt-2.5 border-b border-white/[0.07] pb-2.5">
                          <dt className="text-[11px] font-sans uppercase tracking-wider text-[#9A9A9A] font-medium">
                            When
                          </dt>
                          <dd className="text-right text-[#E5E5E5] font-sans text-[13px] sm:text-[14px]">
                            <time dateTime={prog.startsAt}>{formatProgramDate(prog.startsAt)}</time>
                          </dd>
                        </div>

                        {/* 2. WHERE Row */}
                        <div className="flex items-center justify-between border-b border-white/[0.07] pb-2.5">
                          <dt className="text-[11px] font-sans uppercase tracking-wider text-[#9A9A9A] font-medium">
                            Where
                          </dt>
                          <dd className="flex items-center gap-1.5 text-right text-[#E5E5E5] font-sans text-[13px] sm:text-[14px]">
                            {getModeIcon(prog.mode)}
                            <span>{prog.venueLabel}</span>
                          </dd>
                        </div>

                        {/* 3. ENTRY Row */}
                        <div className="flex items-center justify-between pb-1">
                          <dt className="text-[11px] font-sans uppercase tracking-wider text-[#9A9A9A] font-medium">
                            Entry
                          </dt>
                          <dd className="flex items-center gap-1.5 text-[#E5E5E5] font-sans text-[13px] sm:text-[14px]">
                            <Check className="w-4 h-4 text-[#4ADE80]" aria-hidden="true" />
                            <span>{prog.isFree ? 'Free' : 'Ticketed'}</span>
                          </dd>
                        </div>
                      </dl>

                      {/* C) ACTIONS ROW */}
                      <div className="relative z-20 pt-2 flex items-center justify-between gap-3">
                        {/* Primary Outbound Button: Solid yellow #FFD60A, black text, 48px height, ~60% width */}
                        <a
                          href={prog.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          tabIndex={isActive ? 0 : -1}
                          aria-label={`View and apply for ${prog.title} on k12hunar.com (opens in a new tab)`}
                          onClick={(e) => {
                            if (!isActive || isDraggingRef.current) {
                              e.preventDefault();
                            }
                            pauseAfterClick();
                          }}
                          className="btn-shine-effect flex-1 max-w-[62%] h-12 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] text-[#0A0A0A] font-sans font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFD60A] focus:ring-offset-2 focus:ring-offset-[#0E0E12] active:scale-[0.98]"
                        >
                          <span>View &amp; Apply</span>
                          <ExternalLink className="w-4 h-4" aria-hidden="true" />
                          <span className="sr-only"> (opens in a new tab on k12hunar.com)</span>
                        </a>

                        {/* Secondary Ghost Link: Plain text link with arrow */}
                        <Link
                          to={`/inquiry?category=${encodeURIComponent(prog.inquiryCategory)}&topic=${encodeURIComponent(prog.slug)}`}
                          tabIndex={isActive ? 0 : -1}
                          onClick={pauseAfterClick}
                          className="text-sm font-sans text-[#E5E5E5] hover:text-[#FFD60A] hover:underline flex items-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFD60A] py-2"
                        >
                          <span>Ask about this</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                      </div>

                      {/* Footer Caption: 11px, #9A9A9A (AA contrast compliant) */}
                      <div className="relative z-20 text-[11px] font-sans text-[#9A9A9A] text-left pt-1">
                        <span>Opens k12hunar.com in a new tab</span>
                      </div>
                    </>
                  )}
                </div>
              </article>
            </div>
          );
        })}
      </div>

      {/* Under Carousel: Segmented Progress Indicator (Pill shape, 28px inactive, 56px active) */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {programs.map((prog, i) => {
          const isCurrent = i === activeIndex;

          return (
            <button
              key={prog.slug}
              type="button"
              onClick={() => {
                pauseAfterClick();
                setActiveIndex(i);
              }}
              aria-label={`Go to program ${i + 1}: ${prog.title}`}
              className="h-11 flex items-center justify-center px-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFD60A] rounded-full"
            >
              <div
                className={`relative h-2 rounded-full overflow-hidden transition-all duration-300 ${
                  isCurrent ? 'w-14 bg-white/15' : 'w-7 bg-white/10 hover:bg-white/20'
                }`}
              >
                {/* Active Progress Fill */}
                {isCurrent && (
                  <div
                    className="absolute inset-y-0 left-0 bg-[#FFD60A] rounded-full transition-transform ease-linear"
                    style={{
                      width: '100%',
                      transform: prefersReducedMotion
                        ? 'scaleX(1)'
                        : `scaleX(${progressPercent / 100})`,
                      transformOrigin: 'left',
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Short Single-Line Disclaimer */}
      <p className="mt-3 text-center text-xs font-sans text-[#9A9A9A]">
        Dates are indicative. Confirm on the official page.
      </p>
    </section>
  );
};

export default FeaturedProgramsCarousel;
