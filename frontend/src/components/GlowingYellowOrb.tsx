import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface GlowingYellowOrbProps {
  className?: string;
  size?: number;
}

export const GlowingYellowOrb: React.FC<GlowingYellowOrbProps> = ({
  className = '',
  size = 440,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Subtle interactive 3D mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(Math.max(-0.6, Math.min(0.6, x)));
      mouseY.set(Math.max(-0.6, Math.min(0.6, y)));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        perspective: 1000,
      }}
    >
      {/* 1. Deep Atmospheric Radial Aura (Outer Warm Glow) */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(255, 214, 10, 0.22) 0%, rgba(245, 158, 11, 0.10) 38%, rgba(255, 214, 10, 0.02) 62%, transparent 72%)',
          filter: 'blur(36px)',
          animationDuration: '4s',
          transform: 'scale(1.15)',
        }}
      />

      {/* 2. Secondary Intense Core Glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 0.75,
          height: size * 0.75,
          background: 'radial-gradient(circle, rgba(255, 230, 92, 0.2) 0%, rgba(255, 214, 10, 0.12) 40%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* 3. Interactive Floating 3D Orb Ring */}
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          y: [-8, 8, -8],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative w-full h-full flex items-center justify-center"
      >
        {/* Animated Rotating Light Crest */}
        <div className="relative w-full h-full flex items-center justify-center animate-[spin_24s_linear_infinite]">
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full"
            style={{
              filter: 'drop-shadow(0 0 16px rgba(255, 214, 10, 0.75)) drop-shadow(0 0 32px rgba(255, 214, 10, 0.4))',
            }}
          >
            <defs>
              {/* Outer Edge Gradient - Rich Gold with White Specular Peak */}
              <linearGradient id="orbRimGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#CA8A04" stopOpacity="0.4" />
                <stop offset="35%" stopColor="#EAB308" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#FFD60A" stopOpacity="1" />
                <stop offset="88%" stopColor="#FEF9C3" stopOpacity="1" />
                <stop offset="96%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#FFFBEB" stopOpacity="0.9" />
              </linearGradient>

              {/* Inner Soft Gradient */}
              <linearGradient id="orbInnerGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
                <stop offset="25%" stopColor="#FFD60A" stopOpacity="0.7" />
                <stop offset="70%" stopColor="#B45309" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#78350F" stopOpacity="0.1" />
              </linearGradient>

              {/* Glowing Rim Blur Filter */}
              <filter id="orbBloom" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Specular Flare Blur */}
              <filter id="flareBloom" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Base Deep Glow Ring */}
            <circle
              cx="200"
              cy="200"
              r="150"
              fill="none"
              stroke="#FFD60A"
              strokeWidth="6"
              opacity="0.3"
              style={{ filter: 'blur(8px)' }}
            />

            {/* Secondary Ambient Rim */}
            <circle
              cx="200"
              cy="200"
              r="150"
              fill="none"
              stroke="url(#orbInnerGrad)"
              strokeWidth="5"
              opacity="0.75"
              filter="url(#orbBloom)"
            />

            {/* Primary Sharp Glowing Rim */}
            <circle
              cx="200"
              cy="200"
              r="150"
              fill="none"
              stroke="url(#orbRimGrad)"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Bright Specular Crescent Flare on Upper-Right Arc */}
            <path
              d="M 200 50 A 150 150 0 0 1 350 200"
              fill="none"
              stroke="#FFFDF0"
              strokeWidth="6"
              strokeLinecap="round"
              filter="url(#flareBloom)"
              opacity="0.95"
            />

            {/* Intense Pure-White Hotspot Core on Crest */}
            <path
              d="M 235 55 A 150 150 0 0 1 325 115"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="4.5"
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 0 6px #FFFFFF) drop-shadow(0 0 14px #FEF08A)',
              }}
            />

            {/* Subtle Inner Glow Shadow */}
            <circle
              cx="200"
              cy="200"
              r="146"
              fill="none"
              stroke="#FFD60A"
              strokeWidth="1.5"
              opacity="0.5"
            />
          </svg>
        </div>

        {/* 4. Center Pitch-Dark Core with Inner Rim Illumination */}
        <div
          className="absolute rounded-full pointer-events-none flex items-center justify-center"
          style={{
            width: size * 0.72,
            height: size * 0.72,
            background: 'radial-gradient(circle, #050505 82%, rgba(255, 214, 10, 0.08) 100%)',
            boxShadow: 'inset 0 0 24px rgba(255, 214, 10, 0.15)',
          }}
        />
      </motion.div>
    </div>
  );
};

export default GlowingYellowOrb;
