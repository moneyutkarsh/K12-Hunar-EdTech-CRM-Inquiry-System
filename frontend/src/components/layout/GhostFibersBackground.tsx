/**
 * GhostFibers Real Props from @react-bits/GhostFibers-TS-TW:
 * - glowColor?: string; (Luminous outer bloom color, e.g. brand yellow #FFD60A)
 * - lineColor?: string; (Primary fiber strand color, e.g. #FFD60A)
 * - secondaryColor?: string; (Secondary fiber gradient color, e.g. warm amber #FB923C)
 * - gradient?: 'depth' | 'along' | 'across'; (Color interpolation mode)
 * - speed?: number; (Fiber drift animation velocity, default: 0.5)
 * - scale?: number; (Overall spatial scale multiplier)
 * - rotation?: number; (Initial angular offset)
 * - rollSpeed?: number; (Secondary rotational roll speed)
 * - layers?: number; (Depth layers of fiber strands, default: 4)
 * - waves?: number; (Sine wave undulation frequency)
 * - twist?: number; (Torsional twist factor)
 * - threads?: number; (Number of sub-fiber strands per ribbon)
 * - volume?: number; (3D spatial depth dispersion)
 * - spread?: number; (Lateral dispersion across viewport)
 * - density?: number; (Fiber count multiplier; kept low for text readability)
 * - thickness?: number; (Fiber strand stroke width)
 * - flow?: number; (Directional vector flow speed)
 * - fiberStyle?: 'dots' | 'dashes' | 'lines'; (Strand drawing style)
 * - tips?: number; (End-cap feathering factor)
 * - foldGlow?: number; (Luminescence at curvature fold points)
 * - perspective?: number; (Camera field-of-view perspective)
 * - depthOfField?: number; (Bokeh depth-of-field blur radius)
 * - focusDepth?: number; (Focal plane distance from camera)
 * - particles?: number; (Ambient particulate floating dust count)
 * - sparkle?: number; (Glitter refraction intensity)
 * - glow?: number; (Post-processing bloom intensity)
 * - brightness?: number; (Global scene luminance)
 * - vignette?: number; (Built-in border falloff)
 * - grain?: number; (Film grain dither noise)
 * - mouseInteraction?: boolean; (Cursor deflection interactivity)
 * - hoverEffect?: 'focus' | 'part' | 'none'; (Behavior on pointer proximity)
 * - mouseStrength?: number; (Force vector on cursor hover)
 * - pulseOnClick?: boolean; (Ripple shockwave trigger on mouse click)
 * - intro?: boolean; (Camera dolly-in intro animation on mount)
 * - lightMode?: boolean; (Inverts color scheme for light themes)
 * - paused?: boolean; (Explicitly suspends WebGL draw loop and rAF)
 * - dpr?: number; (Device pixel ratio multiplier, capped at 1.5)
 *
 * Imported Libraries:
 * - react: ^19.3.1 (useEffect, useRef, useState, useMemo, lazy, Suspense, Component)
 * (Self-contained WebGL2 GLSL pipeline; zero webcam/camera tracking, zero three.js overhead)
 */

import React, {
  useState,
  useEffect,
  useMemo,
  Suspense,
  lazy,
  Component,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import {
  shouldUseWebGLBackground,
  getStoredBackgroundSetting,
  type BackgroundSetting,
  type BackgroundEnv,
} from '../../utils/backgroundDecision';

// Lazy-load WebGL GhostFibers component in its own isolated chunk
const LazyGhostFibers = lazy(() => import('../GhostFibers'));

/**
 * Tuned Theme Configuration (P1.2)
 * Brand yellow (#FFD60A) and warm amber (#FB923C) fibers over obsidian black (#050505).
 * Calibrated for serene ambient presence without obscuring hero typography.
 */
export const GHOST_FIBERS_THEME = {
  // Primary strand color: brand yellow
  lineColor: '#FFD60A',
  // Secondary color: warm amber glow
  secondaryColor: '#FB923C',
  // Outer bloom: golden yellow glow
  glowColor: '#FFD60A',
  // Gradient mapped along strand length
  gradient: 'along' as const,
  // Strand drawing style: clean luminous continuous lines
  fiberStyle: 'lines' as const,
  // Slow, calming drift velocity
  speed: 0.28,
  rollSpeed: 0.08,
  scale: 1.15,
  // Fiber strand structural density kept gentle and uncluttered
  density: 0.35,
  thickness: 1.0,
  layers: 3,
  threads: 24,
  waves: 3,
  twist: 0.8,
  volume: 1.2,
  spread: 1.4,
  // Controlled optical depth & bloom
  depthOfField: 0.25,
  focusDepth: 0.45,
  glow: 0.35,
  brightness: 0.85,
  foldGlow: 0.4,
  particles: 12,
  sparkle: 0.2,
  // Extremely low grain to preserve crisp typography
  grain: 0.015,
  vignette: 0.4,
  // Interaction parameters
  mouseInteraction: true,
  hoverEffect: 'part' as const,
  mouseStrength: 0.3,
  pulseOnClick: false,
  intro: false,
  lightMode: false,
  // Cap DPR at 1.5 for smooth 60fps performance and low thermal footprint
  dpr: 1.5,
};

/**
 * Pure CSS Background Fallback (P1.2)
 * Renders 4 diagonal blurred gradient streaks in brand yellow and amber with
 * slow transform-only drift. Zero layout shift, fully accessible, disabled on reduced-motion.
 */
export const CssGhostFibersFallback: React.FC = () => {
  return (
    <div
      className="absolute inset-0 bg-[#050505] overflow-hidden"
      aria-hidden="true"
    >
      {/* Ambient gradient streaks */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vh] rounded-full opacity-20 blur-[100px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 214, 10, 0.4) 0%, rgba(251, 146, 60, 0.15) 50%, transparent 70%)',
          animation: 'css-fiber-drift 18s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute top-[30%] -right-[15%] w-[55vw] h-[55vh] rounded-full opacity-15 blur-[120px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.35) 0%, rgba(255, 214, 10, 0.1) 60%, transparent 80%)',
          animation: 'css-fiber-drift-rev 22s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute -bottom-[10%] left-[20%] w-[50vw] h-[40vh] rounded-full opacity-10 blur-[110px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 214, 10, 0.3) 0%, transparent 70%)',
        }}
      />
      {/* Subtle diagonal pinstripe structure */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(45deg, rgba(255, 214, 10, 0.3) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * WebGL Error Boundary (P1.2)
 * Silently catches WebGL context loss or shader compile failures and falls back to CSS.
 */
class GhostFibersErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[GhostFibersBackground] WebGL error caught, using CSS fallback:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Helper to test WebGL2 support
 */
function checkWebGL2Support(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

interface GhostFibersBackgroundProps {
  /**
   * Ref or selector to observe for hero scrolling. When scrolled past,
   * rendering is paused and opacity dims to 25%.
   */
  heroElementId?: string;
}

export const GhostFibersBackground: React.FC<GhostFibersBackgroundProps> = ({
  heroElementId = 'home-hero-section',
}) => {
  const [setting, setSetting] = useState<BackgroundSetting>(getStoredBackgroundSetting);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [canvasReady, setCanvasReady] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Sync global settings across tabs and custom events
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'k12_background_setting') {
        setSetting(getStoredBackgroundSetting());
      }
    };
    const handleCustomChange = () => {
      setSetting(getStoredBackgroundSetting());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('k12-bg-setting-changed', handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('k12-bg-setting-changed', handleCustomChange);
    };
  }, []);

  // Viewport resize, motion preference, and visibility listeners
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    const handleMotion = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotion);

    const handleVisibility = () => setIsDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);

    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    return () => {
      window.removeEventListener('resize', handleResize);
      motionQuery.removeEventListener('change', handleMotion);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // IntersectionObserver on hero element to pause and dim once scrolled past
  useEffect(() => {
    const target = document.getElementById(heroElementId);
    if (!target || typeof IntersectionObserver === 'undefined') {
      setIsHeroVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [heroElementId]);

  // Evaluate decision logic using the shared heuristic
  const shouldRenderWebGL = useMemo(() => {
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : {};
    const env: BackgroundEnv = {
      setting,
      prefersReducedMotion,
      viewportWidth,
      hasWebGL2: checkWebGL2Support(),
      deviceMemory: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : undefined,
      hardwareConcurrency:
        typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : undefined,
      saveData: Boolean(nav.connection?.saveData),
    };

    return shouldUseWebGLBackground(env);
  }, [setting, prefersReducedMotion, viewportWidth]);

  // Smooth fade-in over 400ms without layout shift
  useEffect(() => {
    if (shouldRenderWebGL) {
      const timer = setTimeout(() => setCanvasReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      setCanvasReady(false);
    }
  }, [shouldRenderWebGL]);

  // Pause rendering when tab is hidden or hero is fully offscreen
  const isPaused = !isDocumentVisible || !isHeroVisible;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none select-none overflow-hidden bg-[#050505]"
    >
      {/* 1. Base CSS Fallback Layer (Always present for instant paint) */}
      <CssGhostFibersFallback />

      {/* 2. WebGL GhostFibers Canvas Layer (Lazy chunk, capped DPR, auto-paused) */}
      {shouldRenderWebGL && (
        <div
          className={`absolute inset-0 transition-all duration-500 ease-in-out ${
            canvasReady
              ? isHeroVisible
                ? 'opacity-100'
                : 'opacity-25'
              : 'opacity-0'
          }`}
        >
          <GhostFibersErrorBoundary fallback={<CssGhostFibersFallback />}>
            <Suspense fallback={<CssGhostFibersFallback />}>
              <LazyGhostFibers
                lineColor={GHOST_FIBERS_THEME.lineColor}
                secondaryColor={GHOST_FIBERS_THEME.secondaryColor}
                glowColor={GHOST_FIBERS_THEME.glowColor}
                gradient={GHOST_FIBERS_THEME.gradient}
                fiberStyle={GHOST_FIBERS_THEME.fiberStyle}
                speed={GHOST_FIBERS_THEME.speed}
                rollSpeed={GHOST_FIBERS_THEME.rollSpeed}
                scale={GHOST_FIBERS_THEME.scale}
                density={GHOST_FIBERS_THEME.density}
                thickness={GHOST_FIBERS_THEME.thickness}
                layers={GHOST_FIBERS_THEME.layers}
                threads={GHOST_FIBERS_THEME.threads}
                waves={GHOST_FIBERS_THEME.waves}
                twist={GHOST_FIBERS_THEME.twist}
                volume={GHOST_FIBERS_THEME.volume}
                spread={GHOST_FIBERS_THEME.spread}
                depthOfField={GHOST_FIBERS_THEME.depthOfField}
                focusDepth={GHOST_FIBERS_THEME.focusDepth}
                glow={GHOST_FIBERS_THEME.glow}
                brightness={GHOST_FIBERS_THEME.brightness}
                foldGlow={GHOST_FIBERS_THEME.foldGlow}
                particles={GHOST_FIBERS_THEME.particles}
                sparkle={GHOST_FIBERS_THEME.sparkle}
                grain={GHOST_FIBERS_THEME.grain}
                vignette={GHOST_FIBERS_THEME.vignette}
                mouseInteraction={!isTouchDevice && GHOST_FIBERS_THEME.mouseInteraction}
                hoverEffect={GHOST_FIBERS_THEME.hoverEffect}
                mouseStrength={GHOST_FIBERS_THEME.mouseStrength}
                pulseOnClick={false}
                intro={false}
                lightMode={false}
                paused={isPaused}
                dpr={GHOST_FIBERS_THEME.dpr}
                className="w-full h-full"
              />
            </Suspense>
          </GhostFibersErrorBoundary>
        </div>
      )}

      {/* 3. Readability Overlays (P1.2) */}
      {/* (a) Left-to-right scrim behind hero text */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to right, rgba(5, 5, 5, 0.85) 0%, rgba(5, 5, 5, 0.5) 45%, transparent 80%)',
        }}
      />

      {/* (b) Bottom vertical gradient fading into solid #050505 */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 40%, rgba(5, 5, 5, 0.6) 70%, #050505 100%)',
        }}
      />

      {/* (c) Radial perimeter vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 40%, transparent 50%, rgba(5, 5, 5, 0.8) 100%)',
        }}
      />
    </div>
  );
};

export default GhostFibersBackground;
