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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Main Navigation */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-2xs group-hover:bg-slate-800 transition-colors">
                C
              </div>
              <div className="text-left">
                <span className="text-lg font-extrabold tracking-tight text-slate-900 block uppercase leading-none font-display">
                  CLAXIC
                </span>
                <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block mt-0.5 font-medium">
                  Academic Portal
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => onNavigate('home')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  currentView === 'home'
                    ? 'text-slate-900 bg-slate-100 border border-slate-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Apply Form & Programs
              </button>

              <button
                onClick={() => onNavigate('courses')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  currentView === 'courses' || currentView === 'course-detail'
                    ? 'text-slate-900 bg-slate-100 border border-slate-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Course Catalog
              </button>

              {/* Student Portal Quick Link for logged in students */}
              {user && user.role !== 'ADMIN' && (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                    currentView === 'dashboard'
                      ? 'text-indigo-900 bg-indigo-50 border border-indigo-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  My Dashboard
                </button>
              )}

              {/* Admin Access Button - STRICTLY VISIBLE ONLY TO AUTHENTICATED ADMINS */}
              {user && user.role === 'ADMIN' && (
                <button
                  onClick={() => onNavigate('admin')}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 ${
                    currentView === 'admin'
                      ? 'text-amber-900 bg-amber-100 border border-amber-300'
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
          <div className="hidden lg:flex items-center gap-4">
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
                    className="flex items-center gap-2.5 p-1 pl-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors text-left"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-md object-cover border border-slate-200"
                    />
                    <div className="hidden xl:block pr-1">
                      <span className="text-xs font-bold text-slate-900 block leading-none">
                        {user.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block mt-0.5 font-semibold">
                        {user.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 pr-0.5" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1.5 animate-in fade-in zoom-in-95">
                      <div className="p-2 border-b border-slate-100">
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
                            className="w-full text-left px-2.5 py-1.5 text-xs text-amber-900 hover:bg-amber-50 rounded-md flex items-center gap-2 font-medium"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                            Admin Console
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onNavigate('dashboard');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-2 font-medium"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-slate-700" />
                            Student Portal
                          </button>
                        )}
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                            onNavigate('home');
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50 rounded-md flex items-center gap-2 transition-colors font-medium"
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate('register')}
                >
                  Register
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700"
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
