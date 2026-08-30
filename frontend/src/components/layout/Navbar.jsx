import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  User as UserIcon,
  ShieldCheck,
  Bell,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  FileText,
  CreditCard,
  Menu,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';

export const Navbar = ({ currentView, onNavigate }) => {
  const { user, logout, openAuthModal } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close menus when navigation occurs
  const handleNav = (view) => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    if (onNavigate) onNavigate(view);
  };

  // Prevent scrolling when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#d8ecec] shadow-2xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Main Navigation */}
          <div className="flex items-center gap-6 sm:gap-8">
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-2 focus:outline-none group cursor-pointer"
              aria-label="Claxic Home"
            >
              <img
                src="/logob.png"
                alt="Claxic"
                className="h-6 sm:h-7 w-auto object-contain transition-transform group-hover:scale-102"
              />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-2">
              {/* 1. Dashboard (FIRST for logged in users) */}
              {user && user.role !== 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => handleNav('dashboard')}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'dashboard'
                      ? 'text-[#0B4F50] bg-[#eef7f7] border border-[#cbe4e4] shadow-2xs'
                      : 'text-slate-700 hover:text-[#0B4F50] hover:bg-[#f2f7f7] border border-transparent'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#0B4F50]" />
                  <span>My Dashboard</span>
                </button>
              )}

              {/* Admin Console (FIRST for logged in admins) */}
              {user && user.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => handleNav('admin')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'admin'
                      ? 'text-amber-900 bg-amber-100 border border-amber-300 shadow-2xs'
                      : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Admin Console</span>
                </button>
              )}

              {/* 2. Apply Form & Programs (Hidden for Admin) */}
              {user?.role !== 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => handleNav('home')}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'home'
                      ? 'text-[#0B4F50] bg-[#eef7f7] border border-[#cbe4e4] shadow-2xs'
                      : 'text-slate-700 hover:text-[#0B4F50] hover:bg-[#f2f7f7] border border-transparent'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-[#0B4F50]" />
                  <span>Apply Form & Programs</span>
                </button>
              )}

              {/* 3. Course Details / Catalog (Hidden for Admin) */}
              {user?.role !== 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => handleNav('courses')}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'courses' || currentView === 'course-detail'
                      ? 'text-[#0B4F50] bg-[#eef7f7] border border-[#cbe4e4] shadow-2xs'
                      : 'text-slate-700 hover:text-[#0B4F50] hover:bg-[#f2f7f7] border border-transparent'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#0B4F50]" />
                  <span>Course Catalog</span>
                </button>
              )}
            </nav>
          </div>

          {/* Right Controls (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* User Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2.5 p-1 pl-2.5 rounded-full bg-[#f2f7f7] border border-[#d8ecec] hover:border-[#b4dede] transition-colors text-left cursor-pointer"
                  >
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-[#cbe4e4]"
                    />
                    <div className="pr-1">
                      <span className="text-xs font-bold text-slate-900 block leading-none">
                        {user.name}
                      </span>
                      <span className="text-[10px] font-mono text-[#0B4F50] block mt-0.5 font-bold">
                        {user.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 pr-0.5" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-[#d8ecec] rounded-2xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95">
                      <div className="p-2.5 border-b border-[#eef7f7] bg-[#f8fbfb] rounded-t-xl">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">{user.email}</p>
                      </div>

                      <div className="py-1">
                        {user.role === 'ADMIN' ? (
                          <button
                            onClick={() => handleNav('admin')}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-[#eef7f7] hover:text-[#0B4F50] rounded-xl flex items-center gap-2 transition-colors font-medium cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-[#0B4F50]" />
                            Executive Dashboard
                          </button>
                        ) : (
                          <button
                            onClick={() => handleNav('dashboard')}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-[#eef7f7] hover:text-[#0B4F50] rounded-xl flex items-center gap-2 transition-colors font-medium cursor-pointer"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5 text-[#0B4F50]" />
                            Student Dashboard
                          </button>
                        )}

                        <button
                          onClick={() => {
                            logout();
                            handleNav('home');
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors font-medium cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleNav('login')}
                  className="px-4 py-2 text-xs font-bold text-[#0B4F50] hover:text-[#073637] bg-[#eef7f7] hover:bg-[#e2f0f0] border border-[#cbe4e4] rounded-full transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('register')}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B4F50] hover:bg-[#073637] rounded-full shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-[#eef7f7] border border-[#cbe4e4] text-[#0B4F50] cursor-pointer"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* --- SLEEK SLIDE-IN MOBILE SIDE DRAWER (Outside header to avoid any clipping) --- */}
    {isMobileMenuOpen && (
      <div className="fixed inset-0 z-[9999] md:hidden">
        {/* Backdrop Overlay */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Slide-in Drawer Panel */}
        <div
          className="fixed inset-y-0 left-0 w-[290px] sm:w-[320px] h-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-300"
          style={{
            backgroundColor: '#ffffff',
          }}
        >
          {/* Top: Logo + Nav links */}
          <div className="p-6 space-y-5">
            {/* Drawer Header with Logo & Close Button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <img
                src="/logob.png"
                alt="Claxic"
                className="h-6 w-auto object-contain"
              />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close Navigation Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links in Strict Order: 1st Dashboard, 2nd Apply Form, 3rd Course Catalog */}
            <nav className="flex flex-col gap-1.5">
              {/* 1. Dashboard / Admin Console (FIRST for logged in users) */}
              {user && user.role !== 'ADMIN' && (
                <button
                  onClick={() => handleNav('dashboard')}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    currentView === 'dashboard'
                      ? 'text-[#0B4F50] bg-[#eef7f7] border border-[#cbe4e4]'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-[#0B4F50]" />
                  <span>My Dashboard</span>
                </button>
              )}

              {user && user.role === 'ADMIN' && (
                <button
                  onClick={() => handleNav('admin')}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    currentView === 'admin'
                      ? 'text-amber-900 bg-amber-100 border border-amber-300'
                      : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Admin Console</span>
                </button>
              )}

              {/* 2. Apply Form & Programs (Hidden for Admin) */}
              {user?.role !== 'ADMIN' && (
                <button
                  onClick={() => handleNav('home')}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    currentView === 'home'
                      ? 'text-[#0B4F50] bg-[#eef7f7] border border-[#cbe4e4]'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#0B4F50]" />
                  <span>Apply Form & Programs</span>
                </button>
              )}

              {/* 3. Course Catalog (Hidden for Admin) */}
              {user?.role !== 'ADMIN' && (
                <button
                  onClick={() => handleNav('courses')}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    currentView === 'courses' || currentView === 'course-detail'
                      ? 'text-[#0B4F50] bg-[#eef7f7] border border-[#cbe4e4]'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-[#0B4F50]" />
                  <span>Course Catalog</span>
                </button>
              )}
            </nav>
          </div>

          {/* Bottom: Profile Card + Sign Out / Auth Buttons */}
          <div className="p-6 pt-0 space-y-3">
            <div className="border-t border-slate-100 pt-4 space-y-3">
              {!user ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleNav('login')}
                    className="w-full py-2.5 text-xs font-bold text-[#0B4F50] bg-[#eef7f7] border border-[#cbe4e4] rounded-xl transition-all text-center cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('register')}
                    className="w-full py-2.5 text-xs font-bold text-white bg-[#0B4F50] hover:bg-[#073637] rounded-xl shadow-xs transition-all text-center cursor-pointer"
                  >
                    Register
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Profile Card at Bottom */}
                  <div className="p-3.5 rounded-2xl bg-[#f2f7f7] border border-[#d8ecec] flex items-center gap-3">
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#0B4F50]/30"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-500 truncate font-mono">{user.email}</p>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-mono font-bold text-[#0B4F50] bg-white border border-[#cbe4e4] mt-1">
                        {user.role}
                      </span>
                    </div>
                  </div>
                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      logout();
                      handleNav('home');
                    }}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer border border-rose-100"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
};
