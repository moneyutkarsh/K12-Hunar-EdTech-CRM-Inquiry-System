import React, { Component, Suspense, lazy, useState, useEffect } from 'react';

// Lazy-load WebThreads so WebGL initialization is isolated
const WebThreads = lazy(() => import('../WebThreads'));

// Luminous SVG Fallback so hyperthreads remain visible during initialization or in environments without WebGL
const CssWebThreadsFallback: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#050505]"
    >
      {/* Ambient golden core glow */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 50%, rgba(255, 214, 10, 0.08) 0%, rgba(245, 158, 11, 0.02) 45%, transparent 70%)',
        }}
      />

      {/* Elegant SVG woven hyperthread array */}
      <svg
        className="absolute inset-0 w-full h-full opacity-25"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <defs>
          <linearGradient id="threadGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD60A" stopOpacity="0.05" />
            <stop offset="30%" stopColor="#FFD60A" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#FFE885" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="threadGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D97706" stopOpacity="0.02" />
            <stop offset="35%" stopColor="#F59E0B" stopOpacity="0.3" />
            <stop offset="65%" stopColor="#FFD60A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.02" />
          </linearGradient>
          <filter id="threadGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Sinusoidal woven ribbon curves */}
        <path
          d="M -100 450 C 300 260, 500 640, 720 450 C 940 260, 1140 640, 1540 450"
          fill="none"
          stroke="url(#threadGrad1)"
          strokeWidth="3.5"
          filter="url(#threadGlow)"
        />
        <path
          d="M -100 480 C 280 620, 520 280, 720 480 C 920 680, 1160 280, 1540 480"
          fill="none"
          stroke="url(#threadGrad2)"
          strokeWidth="2.5"
          filter="url(#threadGlow)"
        />
        <path
          d="M -100 430 C 320 330, 480 570, 720 430 C 960 290, 1120 570, 1540 430"
          fill="none"
          stroke="url(#threadGrad1)"
          strokeWidth="2"
          opacity="0.85"
        />
        <path
          d="M -100 465 C 260 540, 540 360, 720 465 C 900 570, 1180 360, 1540 465"
          fill="none"
          stroke="url(#threadGrad2)"
          strokeWidth="1.8"
          opacity="0.75"
        />
        <path
          d="M -100 450 C 360 380, 440 520, 720 450 C 1000 380, 1080 520, 1540 450"
          fill="none"
          stroke="#FFFDF0"
          strokeWidth="1.2"
          opacity="0.9"
        />
      </svg>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebThreadsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    // Graceful fallback to CSS
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const WebThreadsBackground: React.FC = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  // Check WebGL2 support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance' });
      setIsSupported(Boolean(gl));
    } catch {
      setIsSupported(false);
    }
  }, []);

  if (isSupported === false) {
    return <CssWebThreadsFallback />;
  }

  return (
    <aside
      aria-hidden="true"
      className="fixed inset-0 pointer-events-auto overflow-hidden z-0 bg-[#050505]"
    >
      <WebThreadsErrorBoundary fallback={<CssWebThreadsFallback />}>
        <Suspense fallback={<CssWebThreadsFallback />}>
          <WebThreads
            colors={['#FFD60A', '#F59E0B', '#D97706']}
            coreColor="#FFFDF0"
            backgroundColor="#050505"
            threadCount={8}
            speed={0.2}
            frequency={3.2}
            spread={0.2}
            taper={0.9}
            position={0.5}
            pinch={0.5}
            nodes={1}
            glow={0.025}
            falloff={0.65}
            thickness={1.1}
            brightness={0.7}
            opacity={0.8}
            depth={0.15}
            pulses={0.08}
            fade={0.15}
            grain={0.03}
            mouseInteraction={true}
            mouseStrength={0.4}
            pulseOnClick={true}
            dpr={1.5}
            className="w-full h-full"
          />
        </Suspense>
      </WebThreadsErrorBoundary>
      {/* Delicate vignette overlay that preserves thread luminescence while protecting text contrast */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#050505]/60 via-transparent to-[#050505]/50" />
    </aside>
  );
};

export default WebThreadsBackground;
