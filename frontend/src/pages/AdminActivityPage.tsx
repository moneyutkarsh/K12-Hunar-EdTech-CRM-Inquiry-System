import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowLeft } from 'lucide-react';

export const AdminActivityPage: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-[#FFD60A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFD60A]/10 text-[#FFD60A] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F5F5F5]">Activity Feed</h1>
              <p className="text-xs text-[#A3A3A3]">Complete audit timeline of inquiry and status events</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-12 text-center text-[#A3A3A3]">
        <Activity className="w-8 h-8 text-[#FFD60A] mx-auto mb-3 animate-pulse" />
        <h3 className="text-base font-semibold text-[#F5F5F5] mb-1">Audit Timeline</h3>
        <p className="text-xs max-w-sm mx-auto">
          Activity records are actively being tracked and will render in Phase N5.
        </p>
      </div>
    </div>
  );
};

export default AdminActivityPage;
