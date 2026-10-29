import React, { Component, Suspense, lazy, useState, useEffect } from 'react';

// Lazy-load WebThreads so WebGL initialization is isolated
const WebThreads = lazy(() => import('../WebThreads'));

// Pure CSS Fallback in case WebGL2 is unsupported or context fails
const CssWebThreadsFallback: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#050505]"
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 50%, rgba(255, 214, 10, 0.18) 0%, rgba(245, 158, 11, 0.08) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255, 214, 10, 0.04) 40px, rgba(255, 214, 10, 0.04) 42px)',
        }}
      />
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
            threadCount={4}
            speed={0.1}
            frequency={1.8}
            spread={0.1}
            taper={0.6}
            position={0.62}
            pinch={0.5}
            nodes={1}
            glow={0.012}
            falloff={0.8}
            thickness={0.85}
            brightness={0.32}
            opacity={0.4}
            depth={0.05}
            pulses={0.02}
            fade={0.35}
            grain={0.02}
            mouseInteraction={true}
            mouseStrength={0.25}
            pulseOnClick={true}
            dpr={1.5}
            className="w-full h-full"
          />
        </Suspense>
      </WebThreadsErrorBoundary>
      {/* Soft vignette overlay to ensure text contrast and clean dark ambiance */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/80" />
    </aside>
  );
};

export default WebThreadsBackground;
