import React, { Suspense, lazy, useState, useEffect } from 'react';

// Lazy-load WebGL-intensive AeroShards component
const AeroShards = lazy(() => import('./AeroShards'));

interface AppBackgroundProps {
  isDashboard?: boolean;
}

export const AppBackground: React.FC<AppBackgroundProps> = ({ isDashboard = false }) => {
  const [shouldRenderWebGL, setShouldRenderWebGL] = useState<boolean>(false);

  useEffect(() => {
    // Accessibility: check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Performance: fallback on small/mobile devices under 640px width
    const isMobileDevice = window.innerWidth < 640;

    if (!prefersReducedMotion && !isMobileDevice) {
      setShouldRenderWebGL(true);
    }
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#050505]"
    >
      {/* 1. Radial gradient fallback (always present as base layer) */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(ellipse at 50% 15%, rgba(255, 214, 10, 0.15) 0%, rgba(5, 5, 5, 0.98) 75%)',
        }}
      />

      {/* 2. WebGL AeroShards with lazy loading & Suspense */}
      {shouldRenderWebGL && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isDashboard ? 'opacity-15' : 'opacity-100'
          }`}
        >
          <Suspense fallback={null}>
            <AeroShards
              backgroundColor="#050505"
              shardColor="#FFD60A"
              accentColor="#FACC15"
              material="glass"
              lightMode={false}
              placement="full"
              count={24}
              speed={0.7}
              glow={0.8}
              className="w-full h-full"
            />
          </Suspense>
        </div>
      )}

      {/* 3. Dashboard dim overlay (about 85% opacity so tables stay crisp and readable) */}
      {isDashboard && (
        <div className="absolute inset-0 bg-[#050505]/85 backdrop-blur-[2px]" />
      )}
    </div>
  );
};

export default AppBackground;
