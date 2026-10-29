/**
 * GridScan Real Props from @react-bits/GridScan-TS-TW:
 * - linesColor?: string; (Color of background grid lines)
 * - scanColor?: string; (Color of the animated scanning beam and glow)
 * - cells?: number; (Number of grid subdivisions, default: 8)
 * - lineThickness?: number; (Grid line stroke thickness, default: 1)
 * - lineStyle?: 'solid' | 'dashed' | 'dotted'; (Line rendering style)
 * - depth?: number; (Perspective 3D room depth, default: 3)
 * - depthFade?: number; (Fade-out intensity with distance, default: 0.6)
 * - parallax?: number; (Parallax response to pointer/gyro, default: 1)
 * - points?: boolean; (Whether grid line intersection dots render, default: true)
 * - reflection?: number; (Floor/surface reflection coefficient, default: 0.35)
 * - shading?: number; (Ambient shading falloff, default: 0.7)
 * - scanDirection?: 'forward' | 'backward' | 'pingpong'; (Beam sweep direction)
 * - scanDuration?: number; (Duration of scan sweep in seconds, default: 2.4)
 * - scanDelay?: number; (Delay between sweeps in seconds, default: 1.6)
 * - scanWidth?: number; (Width of the scanning beam, default: 1)
 * - trail?: number; (Luminescence trail persistence, default: 0.5)
 * - glow?: number; (Bloom glow strength, default: 0.6)
 * - autoScan?: boolean; (Whether the scan beam moves automatically, default: true)
 * - interactive?: boolean; (Whether pointer interaction triggers rays, default: true)
 * - clickEffect?: 'ping' | 'scan' | 'none'; (Click feedback animation)
 * - enableGyro?: boolean; (Mobile gyroscope tracking, default: false)
 * - intro?: boolean; (Camera zoom-in intro on mount, default: true)
 * - lightMode?: boolean; (Light theme toggle, default: false)
 * - dpr?: number; (Device pixel ratio multiplier, capped at 1.5)
 * - className?: string;
 * - style?: CSSProperties;
 *
 * Imported Libraries & Versions:
 * - react: ^19.0.0
 * (Self-contained WebGL2 GLSL pipeline; no three.js / postprocessing required)
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

// Lazy-load WebGL GridScan component in its own isolated chunk
const LazyGridScan = lazy(() => import('../GridScan'));

/**
 * Tuned Theme Configuration (Section 2)
 * Black and yellow brand colors calibrated for subtle ambiance without compromising text readability.
 */
export const GRID_SCAN_THEME = {
  // Deep obsidian base: #050505
  // Grid lines: dark, desaturated amber-yellow texture (#423402) at very low opacity
  linesColor: '#423402',
  // Scan beam and glow: brand yellow #FFD60A with soft luminous falloff
  scanColor: '#FFD60A',
  // Spatial subdivision cells
  cells: 8,
  lineThickness: 1.0,
  lineStyle: 'solid' as const,
  // 3D perspective depth and distance fade
  depth: 2.8,
  depthFade: 0.75,
  // Gentle ambient parallax response (disabled on touch devices)
  parallax: 0.35,
  points: true,
  reflection: 0.15,
  shading: 0.0,
  // Scanning sweep parameters
  scanDirection: 'pingpong' as const,
  scanDuration: 3.2,
  scanDelay: 1.8,
  scanWidth: 1.1,
  trail: 0.45,
  // Controlled glow to protect text sharpness
  glow: 0.4,
  autoScan: true,
  interactive: true,
  clickEffect: 'ping' as const,
  enableGyro: false,
  intro: false,
  lightMode: false,
  // Cap DPR at 1.5 for smooth 60fps performance and low thermal footprint
  dpr: 1.5,
};

/**
 * Pure CSS Background Fallback (Section 4)
 * Approximates the look with dark base, faint yellow grid (repeating-linear-gradient),
 * and soft radial yellow glow near the top. Zero layout shift.
 */
export const CssGridFallback: React.FC = () => {
  return (
    <div
      className="absolute inset-0 bg-[#050505]"
      style={{
        backgroundImage: `
          radial-gradient(circle 600px at 50% -10%, rgba(255, 214, 10, 0.08), transparent 70%),
          linear-gradient(to right, rgba(255, 214, 10, 0.035) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 214, 10, 0.035) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 48px 48px, 48px 48px',
      }}
      aria-hidden="true"
    />
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
 * WebGL Error Boundary (Section 4)
 * Silently catches WebGL context loss or shader errors and falls back to the CSS background.
 */
class GridScanErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[GridScanBackground] WebGL error caught, falling back to CSS background:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function checkWebGL2Support(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

interface GridScanBackgroundProps {
  settingOverride?: BackgroundSetting;
  isOverlayOpen?: boolean;
}

export const GridScanBackground: React.FC<GridScanBackgroundProps> = ({
  settingOverride,
  isOverlayOpen = false,
}) => {
  const [setting, setSetting] = useState<BackgroundSetting>(getStoredBackgroundSetting);
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState<boolean>(true);
  const [canvasReady, setCanvasReady] = useState<boolean>(false);

  // Sync setting override if provided
  useEffect(() => {
    if (settingOverride) {
      setSetting(settingOverride);
    }
  }, [settingOverride]);

  // Listen to storage changes and custom events
  useEffect(() => {
    const handleStorage = () => {
      setSetting(getStoredBackgroundSetting());
    };
    const handleCustomChange = (e: any) => {
      if (e.detail?.setting) {
        setSetting(e.detail.setting);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('k12-bg-setting-changed', handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('k12-bg-setting-changed', handleCustomChange);
    };
  }, []);

  // Listen to viewport resizing, reduced-motion changes, and visibility
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotion = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotion);

    const handleVisibility = () => setIsDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);

    setIsTouchDevice(
      'ontouchstart' in window || navigator.maxTouchPoints > 0
    );

    return () => {
      window.removeEventListener('resize', handleResize);
      motionQuery.removeEventListener('change', handleMotion);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Evaluate decision logic
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

  // Fade canvas in smoothly over 400ms when ready
  useEffect(() => {
    if (shouldRenderWebGL) {
      const timer = setTimeout(() => setCanvasReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      setCanvasReady(false);
    }
  }, [shouldRenderWebGL]);

  // Pause rendering when document hidden or modal-level overlay (drawer, command palette) is active
  const shouldPause = !isDocumentVisible || isOverlayOpen;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none select-none overflow-hidden bg-[#050505]"
    >
      {/* 1. Base CSS Grid Fallback (Always rendered instantly without layout shift) */}
      <CssGridFallback />

      {/* 2. WebGL GridScan Canvas Layer (Lazy-loaded, only rendered when capable and enabled) */}
      {shouldRenderWebGL && !shouldPause && (
        <div
          className={`absolute inset-0 transition-opacity duration-400 ease-in-out ${
            canvasReady ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <GridScanErrorBoundary fallback={<CssGridFallback />}>
            <Suspense fallback={<CssGridFallback />}>
              <LazyGridScan
                linesColor={GRID_SCAN_THEME.linesColor}
                scanColor={GRID_SCAN_THEME.scanColor}
                cells={GRID_SCAN_THEME.cells}
                lineThickness={GRID_SCAN_THEME.lineThickness}
                lineStyle={GRID_SCAN_THEME.lineStyle}
                depth={GRID_SCAN_THEME.depth}
                depthFade={GRID_SCAN_THEME.depthFade}
                parallax={isTouchDevice ? 0 : GRID_SCAN_THEME.parallax}
                points={GRID_SCAN_THEME.points}
                reflection={GRID_SCAN_THEME.reflection}
                shading={GRID_SCAN_THEME.shading}
                scanDirection={GRID_SCAN_THEME.scanDirection}
                scanDuration={GRID_SCAN_THEME.scanDuration}
                scanDelay={GRID_SCAN_THEME.scanDelay}
                scanWidth={GRID_SCAN_THEME.scanWidth}
                trail={GRID_SCAN_THEME.trail}
                glow={GRID_SCAN_THEME.glow}
                autoScan={GRID_SCAN_THEME.autoScan}
                interactive={!isTouchDevice}
                clickEffect={GRID_SCAN_THEME.clickEffect}
                enableGyro={false}
                intro={GRID_SCAN_THEME.intro}
                lightMode={GRID_SCAN_THEME.lightMode}
                dpr={GRID_SCAN_THEME.dpr}
                className="w-full h-full"
              />
            </Suspense>
          </GridScanErrorBoundary>
        </div>
      )}

      {/* 3. Readability & Layering Enhancements (Section 3) */}
      {/* (a) Radial Vignette darkening the corners and edges */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 90% 80% at 50% 30%, transparent 30%, rgba(5, 5, 5, 0.85) 100%)',
        }}
      />

      {/* (b) Vertical Mask: strongest in top 40% (greeting, cards), fading smoothly down toward table */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(5, 5, 5, 0.15) 0%, rgba(5, 5, 5, 0.5) 35%, rgba(5, 5, 5, 0.85) 70%, #050505 100%)',
        }}
      />

      {/* (c) Flat semi-transparent dark overlay (60%) ensuring WCAG AA contrast for text and badges */}
      <div className="absolute inset-0 bg-[#050505]/60" />
    </div>
  );
};

export default GridScanBackground;
