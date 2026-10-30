import React from 'react';
import GoldenAeroShards from './GoldenAeroShards';

interface AppBackgroundProps {
  isDashboard?: boolean;
}

export const AppBackground: React.FC<AppBackgroundProps> = ({ isDashboard = false }) => {
  if (isDashboard) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 overflow-hidden bg-[#050505] pointer-events-none"
      >
        <div className="absolute inset-0 bg-[#050505]/85 backdrop-blur-[2px]" />
      </div>
    );
  }

  return <GoldenAeroShards />;
};

export default AppBackground;
