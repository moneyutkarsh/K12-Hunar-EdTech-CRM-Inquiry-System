import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Loader2, Server } from 'lucide-react';

export const ServerWakeBanner: React.FC = () => {
  const [isWaking, setIsWaking] = useState<boolean>(false);
  const [isServerReady, setIsServerReady] = useState<boolean>(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    // Trigger health check on app load
    const pingServer = async () => {
      timeoutId = setTimeout(() => {
        setIsWaking(true);
      }, 4000);

      try {
        await api.get('/health');
        setIsServerReady(true);
      } catch {
        // Retry once after 5s if sleeping
        setTimeout(async () => {
          try {
            await api.get('/health');
            setIsServerReady(true);
          } catch {
            // Handled by subsequent queries
          }
        }, 5000);
      } finally {
        clearTimeout(timeoutId);
        setIsWaking(false);
      }
    };

    if (!isServerReady) {
      pingServer();
    }

    return () => clearTimeout(timeoutId);
  }, [isServerReady]);

  if (!isWaking) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#171717]/95 border border-[#FFD60A]/40 text-xs text-[#F5F5F5] shadow-2xl backdrop-blur-md animate-fade-in"
    >
      <Loader2 className="w-3.5 h-3.5 text-[#FFD60A] animate-spin" />
      <Server className="w-3.5 h-3.5 text-[#FFD60A]" />
      <span>Waking up backend server on Render free tier, please wait...</span>
    </div>
  );
};

export default ServerWakeBanner;
