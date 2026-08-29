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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#d8ecec] shadow-2xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Main Navigation */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 focus:outline-none group cursor-pointer"
              aria-label="Claxic Home"
            >
              <img
                src="/logob.png"
                alt="Claxic"
                className="h-6 sm:h-7 w-auto object-contain transition-transform group-hover:scale-102"
              />
            </button>

            {/* Desktop Navigation Links - Always Show Apply Form */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  currentView === 'home'
                    ? 'text-[#0B4F50] bg-[#eef7f7] border border-[#cbe4e4] shadow-2xs'
                    : 'text-slate-700 hover:text-[#0B4F50] hover:bg-[#f2f7f7] border border-transparent'
                }`}
              >
                Apply Form & Programs
              </button>

              <button
                type="button"
                onClick={() => onNavigate('courses')}
                className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  currentView === 'courses' || currentView === 'course-detail'
                    ? 'text-[#0B4F50] bg-[#eef7f7] border border-[#cbe4e4] shadow-2xs'
                    : 'text-slate-700 hover:text-[#0B4F50] hover:bg-[#f2f7f7] border border-transparent'
                }`}
              >
                Course Catalog
              </button>

              {/* Student Portal Quick Link for logged in students */}
              {user && user.role !== 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    currentView === 'dashboard'
                      ? 'text-[#0B4F50] bg-[#eef7f7] border border-[#cbe4e4] shadow-2xs'
                      : 'text-slate-700 hover:text-[#0B4F50] hover:bg-[#f2f7f7] border border-transparent'
                  }`}
                >
                  My Dashboard
                </button>
              )}

              {/* Admin Access Button - STRICTLY VISIBLE ONLY TO AUTHENTICATED ADMINS */}
              {user && user.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
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
            </nav>
          </div>

          {/* Right Controls */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'ADMIN' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigate('admin')}
                    leftIcon={<ShieldCheck className="w-4 h-4" />}
                  >
                    Admin Dashboard
                  </Button>
                )}

                {/* User Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2.5 p-1 pl-2.5 rounded-full bg-[#f2f7f7] border border-[#d8ecec] hover:border-[#b4dede] transition-colors text-left cursor-pointer"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-[#cbe4e4]"
                    />
                    <div className="hidden xl:block pr-1">
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
                            onClick={() => {
                              onNavigate('admin');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-[#eef7f7] hover:text-[#0B4F50] rounded-xl flex items-center gap-2 transition-colors font-medium cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-[#0B4F50]" />
                            Executive Dashboard
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onNavigate('dashboard');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-[#eef7f7] hover:text-[#0B4F50] rounded-xl flex items-center gap-2 transition-colors font-medium cursor-pointer"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5 text-[#0B4F50]" />
                            Student Dashboard
                          </button>
                        )}

                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                            onNavigate('home');
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
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 text-xs font-bold text-[#0B4F50] hover:text-[#073637] bg-[#eef7f7] hover:bg-[#e2f0f0] border border-[#cbe4e4] rounded-full transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B4F50] hover:bg-[#073637] rounded-full shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-[#eef7f7] border border-[#cbe4e4] text-[#0B4F50]"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => {
                onNavigate('home');
                setIsMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 rounded-md text-xs font-bold uppercase text-slate-800 hover:bg-slate-100"
            >
              Apply Form & Programs
            </button>

            <button
              onClick={() => {
                onNavigate('courses');
                setIsMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 rounded-md text-xs font-bold uppercase text-slate-800 hover:bg-slate-100"
            >
              Course Catalog
            </button>

            {user && user.role !== 'ADMIN' && (
              <button
                onClick={() => {
                  onNavigate('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 rounded-md text-xs font-bold uppercase text-indigo-900 bg-indigo-50 border border-indigo-200 flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-700" />
                Student Portal
              </button>
            )}

            {user && user.role === 'ADMIN' && (
              <button
                onClick={() => {
                  onNavigate('admin');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 rounded-md text-xs font-mono font-bold uppercase text-amber-900 bg-amber-50 border border-amber-200 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Open Admin Dashboard
              </button>
            )}

            {!user ? (
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    onNavigate('login');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    onNavigate('register');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Register
                </Button>
              </div>
            ) : (
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                  onNavigate('home');
                }}
                className="text-left px-3 py-2 rounded-md text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
