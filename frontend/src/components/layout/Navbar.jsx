import React, { useState, useEffect } from 'react';
import {
  FileText,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const Navbar = ({ currentView = 'home', onNavigate }) => {
  const { user, logout, openAuthModal } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNav = (view, payload = null) => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    if (onNavigate) {
      onNavigate(view, payload);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setIsUserMenuOpen(false);
    if (isUserMenuOpen) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  // Lock body scroll when mobile menu is open
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
      <header className="sticky top-0 z-40 bg-[#0B4F50] border-b border-[#083E40] shadow-md font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo (White Logo) & Main Navigation */}
          <div className="flex items-center gap-6 sm:gap-8">
            <button
              onClick={() => {
                if (user?.role === 'ADMIN') handleNav('admin');
                else if (user?.role === 'STAFF') handleNav('staff');
                else handleNav('home');
              }}
              className="flex items-center gap-2 focus:outline-none group cursor-pointer"
              aria-label="Claxic Home"
            >
              <img
                src="/logow.png"
                alt="Claxic"
                className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-102"
              />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-2">
              {/* 1. Student Dashboard (FIRST for logged in students) */}
              {user && user.role === 'USER' && (
                <button
                  type="button"
                  onClick={() => handleNav('student')}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'student' || currentView === 'dashboard'
                      ? 'text-white bg-teal-800 border border-teal-600 shadow-2xs'
                      : 'text-teal-100 hover:text-white hover:bg-teal-800/50 border border-transparent'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-teal-300" />
                  <span>Student Dashboard</span>
                </button>
              )}

              {/* Staff & Faculty Portal (FIRST for logged in staff) */}
              {user && user.role === 'STAFF' && (
                <button
                  type="button"
                  onClick={() => handleNav('staff')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'staff'
                      ? 'text-white bg-sky-900 border border-sky-400 shadow-2xs'
                      : 'text-sky-200 bg-sky-900/60 hover:bg-sky-900 border border-sky-600/60'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-sky-300" />
                  <span>Faculty Portal</span>
                </button>
              )}

              {/* Admin Console (FIRST for logged in admins) */}
              {user && user.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => handleNav('admin')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'admin'
                      ? 'text-white bg-amber-900 border border-amber-400 shadow-2xs'
                      : 'text-amber-200 bg-amber-900/60 hover:bg-amber-900 border border-amber-600/60'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Admin Console</span>
                </button>
              )}

              {/* 2. Apply Form & Programs (Public only, removed in Student Portal) */}
              {!user && (
                <button
                  type="button"
                  onClick={() => handleNav('home')}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'home'
                      ? 'text-white bg-teal-800 border border-teal-600 shadow-2xs'
                      : 'text-teal-100 hover:text-white hover:bg-teal-800/50 border border-transparent'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-teal-300" />
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
                      ? 'text-white bg-teal-800 border border-teal-600 shadow-2xs'
                      : 'text-teal-100 hover:text-white hover:bg-teal-800/50 border border-transparent'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-teal-300" />
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsUserMenuOpen(!isUserMenuOpen);
                    }}
                    className="flex items-center gap-2.5 p-1 pl-2.5 rounded-full bg-teal-900/80 border border-teal-700 hover:border-teal-500 transition-colors text-left cursor-pointer"
                  >
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-teal-500/50"
                    />
                    <div className="pr-1">
                      <span className="text-xs font-bold text-white block leading-none">
                        {user.name}
                      </span>
                      <span className="text-[10px] font-mono text-teal-300 block mt-0.5 font-bold">
                        {user.role === 'USER' ? 'STUDENT' : user.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-teal-300 pr-0.5" />
                  </button>

                  {isUserMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 mt-2 w-56 bg-white border border-[#E8E3DC] rounded-2xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95"
                    >
                      <div className="p-2.5 border-b border-[#F5F5F0] bg-[#FAFAF7] rounded-t-xl">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                          {user.role === 'USER' ? 'STUDENT' : user.role}
                        </span>
                      </div>

                      <div className="py-1">
                        {user.role === 'ADMIN' && (
                          <button
                            onClick={() => handleNav('admin')}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-[#FFF7E6] hover:text-[#D97706] rounded-xl flex items-center gap-2 transition-colors font-medium cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            Admin Console
                          </button>
                        )}
                        {user.role === 'STAFF' && (
                          <button
                            onClick={() => handleNav('staff')}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-700 rounded-xl flex items-center gap-2 transition-colors font-medium cursor-pointer"
                          >
                            <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                            Staff & Faculty Portal
                          </button>
                        )}
                        {user.role === 'USER' && (
                          <button
                            onClick={() => handleNav('student')}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-[#0B4F50] rounded-xl flex items-center gap-2 transition-colors font-medium cursor-pointer"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5 text-[#0B4F50]" />
                            Student Dashboard
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const role = user?.role;
                            logout();
                            if (role === 'ADMIN') handleNav('admin-login');
                            else if (role === 'STAFF') handleNav('staff-login');
                            else handleNav('home');
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors font-medium cursor-pointer mt-0.5"
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
                  className="px-4 py-2 text-xs font-bold text-teal-100 hover:text-white bg-teal-900/60 hover:bg-teal-800 border border-teal-700/60 rounded-full transition-all cursor-pointer"
                >
                  Student Login
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('register')}
                  className="px-5 py-2 text-xs font-bold text-[#0B4F50] bg-white hover:bg-teal-50 rounded-full shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
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
              className="p-2 rounded-xl bg-teal-900 border border-teal-700 text-white cursor-pointer"
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
            {/* Drawer Header with White Logo on Dark Background */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 bg-[#0B4F50] -mx-6 -mt-6 p-6 rounded-t-none">
              <img
                src="/logow.png"
                alt="Claxic"
                className="h-7 w-auto object-contain"
              />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-teal-800 transition-colors cursor-pointer"
                aria-label="Close Navigation Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links in Strict Order: 1st Dashboard, 2nd Apply Form, 3rd Course Catalog */}
            <nav className="flex flex-col gap-1.5">
              {/* 1. Student Dashboard (FIRST for logged in students) */}
              {user && user.role === 'USER' && (
                <button
                  onClick={() => handleNav('student')}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    currentView === 'student' || currentView === 'dashboard'
                      ? 'text-[#0B4F50] bg-[#eef7f7] border border-[#cbe4e4]'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-[#0B4F50]" />
                  <span>Student Dashboard</span>
                </button>
              )}

              {/* Staff & Faculty Portal */}
              {user && user.role === 'STAFF' && (
                <button
                  onClick={() => handleNav('staff')}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    currentView === 'staff'
                      ? 'text-sky-900 bg-sky-100 border border-sky-300'
                      : 'text-sky-800 bg-sky-50 hover:bg-sky-100'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-sky-700" />
                  <span>Staff & Faculty Portal</span>
                </button>
              )}

              {/* Admin Console */}
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

              {/* 2. Apply Form & Programs (Public only, removed in Student Portal) */}
              {!user && (
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

            {/* Dedicated 3-Role Portals Section in Mobile Drawer */}
            <div className="pt-3 border-t border-slate-100">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                Claxic Role Portals
              </span>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => handleNav('login')}
                  className="text-left px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Student Portal</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 bg-white px-1.5 py-0.5 rounded border border-emerald-200">STUDENT</span>
                </button>

                <button
                  onClick={() => handleNav('staff-login')}
                  className="text-left px-3.5 py-2 rounded-xl text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                    <span>Staff & Faculty Portal</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-sky-600 bg-white px-1.5 py-0.5 rounded border border-sky-200">STAFF</span>
                </button>

                <button
                  onClick={() => handleNav('admin-login')}
                  className="text-left px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Admin Console</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-600 bg-white px-1.5 py-0.5 rounded border border-amber-200">ADMIN</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Drawer User Status & Actions */}
          <div className="p-6 border-t border-slate-100 bg-[#f8fbfb]">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#cbe4e4]"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate font-mono">{user.email}</p>
                    <span className="inline-block text-[10px] font-mono font-bold uppercase text-[#0B4F50] mt-0.5">
                      {user.role === 'USER' ? 'STUDENT' : user.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const role = user?.role;
                    logout();
                    if (role === 'ADMIN') handleNav('admin-login');
                    else if (role === 'STAFF') handleNav('staff-login');
                    else handleNav('home');
                  }}
                  className="w-full py-2 px-3 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handleNav('login')}
                  className="w-full py-2.5 text-xs font-bold text-[#0B4F50] bg-white border border-[#cbe4e4] rounded-xl hover:bg-[#eef7f7] transition-colors cursor-pointer"
                >
                  Student Login
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="w-full py-2.5 text-xs font-bold text-white bg-[#0B4F50] hover:bg-[#073637] rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};
