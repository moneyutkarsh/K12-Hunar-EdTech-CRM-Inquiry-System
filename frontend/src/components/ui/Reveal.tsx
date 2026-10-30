import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
}

/**
 * Shared Reveal Component (Phase 7)
 * Respects prefers-reduced-motion: instantly displays if motion is reduced.
 * Smooth 240-320ms cubic-bezier ease-out entrance.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  duration = 0.28,
  yOffset = 16,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // Standard crisp ease-out
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
