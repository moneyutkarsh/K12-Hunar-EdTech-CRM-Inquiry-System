import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isAuthenticated, admin, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDashboard = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  return (
    <nav className="w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#FFD60A] text-[#0A0A0A] flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            H
          </div>
          <span className="font-semibold text-lg tracking-tight text-[#F5F5F5] group-hover:text-[#FFD60A] transition-colors">
            K12 Hunar <span className="text-[#FFD60A] font-light text-sm ml-1 px-1.5 py-0.5 rounded bg-[#FFD60A]/10 border border-[#FFD60A]/20">CRM</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/"
            className={`text-sm px-3.5 py-1.5 rounded-lg transition-colors ${
              location.pathname === '/'
                ? 'text-[#FFD60A] bg-white/5 font-medium'
                : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
            }`}
          >
            Submit Inquiry
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-lg border transition-all ${
                  isDashboard
                    ? 'bg-[#0A0A0A] text-[#FFD60A] border-[#FFD60A]/40 shadow-sm'
                    : 'text-[#A3A3A3] border-white/10 hover:text-[#F5F5F5]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[#FFD60A]" />
                <span>Dashboard</span>
              </Link>

              <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                <div className="text-right">
                  <p className="text-xs font-medium text-[#F5F5F5] leading-tight">{admin?.email}</p>
                  <p className="text-[10px] text-[#FFD60A]">Admin</p>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#A3A3A3] hover:text-[#F87171] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/admin/login"
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#F5F5F5] hover:text-[#FFD60A] transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-[#FFD60A]" />
              <span>Admin Login</span>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#0F0F0F] px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-[#F5F5F5] hover:bg-white/5"
          >
            Submit Inquiry
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#FFD60A] bg-white/5"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard ({admin?.email})
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm text-[#F87171] hover:bg-white/5"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#F5F5F5] hover:bg-white/5"
            >
              <Shield className="w-4 h-4 text-[#FFD60A]" />
              Admin Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
