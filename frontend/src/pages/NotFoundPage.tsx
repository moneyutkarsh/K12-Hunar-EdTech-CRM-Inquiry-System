import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 text-center">
      <div className="glass-card p-10 max-w-md w-full border border-white/10">
        <div className="w-14 h-14 rounded-2xl bg-[#FFD60A]/10 border border-[#FFD60A]/30 flex items-center justify-center text-[#FFD60A] mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-[#F5F5F5] mb-2">404</h1>
        <h2 className="text-lg font-semibold text-[#FFD60A] mb-3">Page Not Found</h2>
        <p className="text-xs text-[#A3A3A3] mb-6">
          The page you requested does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] text-[#0A0A0A] font-bold text-xs transition-colors shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Public Form</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
