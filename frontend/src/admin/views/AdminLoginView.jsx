import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const AdminLoginView = ({ onNavigate }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Recovery / Forgot Password State
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState('request'); // 'request' | 'reset'
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('claxic_admin_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Handle Admin Authentication
  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Basic email format check
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid administrative email address.');
      return;
    }
    if (!password) {
      setError('Please enter your administrator password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || 'Authentication failed. Please verify your admin credentials.'
        );
      }

      if (!data.user || data.user.role !== 'ADMIN') {
        throw new Error('Access restricted: Account lacks administrative privileges.');
      }

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('claxic_admin_remember_email', email.trim());
      } else {
        localStorage.removeItem('claxic_admin_remember_email');
      }

      login(data.token, data.user);
      if (onNavigate) onNavigate('admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password Request
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request password reset.');

      setSuccessMsg('Reset code generated! Check your email or enter your code below.');
      if (data.devToken) {
        setResetToken(data.devToken);
      }
      setRecoveryStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset Confirmation
  const handleResetConfirm = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!resetToken || !newPassword) {
      setError('Please provide the reset code and new password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          token: resetToken.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset failed.');

      setSuccessMsg('Password updated successfully! You can now sign in.');
      setIsRecoveryMode(false);
      setRecoveryStep('request');
      setPassword('');
      setNewPassword('');
      setResetToken('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Fast Fill for Admin Dev & Testing
  const handleFillAdminCredentials = () => {
    setEmail('admin@claxic.edu');
    setPassword('Admin@123456');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f8f7fc] text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative font-sans overflow-hidden [perspective:1400px]">
      
      {/* --- Inject mobile/tablet keyframe + responsive overrides --- */}
      <style>{`
        @keyframes adminFormSlideUp {
          0% { opacity: 0; transform: translateY(32px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes adminFormFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes adminLockPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 20px 35px -8px rgba(147,51,234,0.18), 0 6px 16px -4px rgba(0,0,0,0.04); }
          50% { transform: scale(1.06); box-shadow: 0 28px 50px -8px rgba(147,51,234,0.28), 0 8px 24px -4px rgba(0,0,0,0.06); }
        }
        @keyframes adminGlowRing {
          0% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 0.7; transform: scale(1.05); }
          100% { opacity: 0.3; transform: scale(0.9); }
        }
        /* Mobile form card: lifted with shadow */
        @media (max-width: 1023px) {
          .admin-login-form-card {
            animation: adminFormSlideUp 0.6s ease-out both;
            margin-top: -28px;
            position: relative;
            z-index: 20;
            border-radius: 24px 24px 20px 20px;
            box-shadow:
              0 -8px 40px -6px rgba(147, 51, 234, 0.18),
              0 32px 64px -12px rgba(76, 29, 149, 0.22),
              0 16px 32px -8px rgba(0, 0, 0, 0.10),
              0 0 0 1px rgba(255, 255, 255, 0.9) inset;
          }
          .admin-login-form-card::before {
            content: '';
            position: absolute;
            top: -3px;
            left: 20%;
            right: 20%;
            height: 3px;
            border-radius: 3px;
            background: linear-gradient(90deg, transparent, rgba(147,51,234,0.5), transparent);
          }
        }
        /* Tablet (md) form card */
        @media (min-width: 640px) and (max-width: 1023px) {
          .admin-login-form-card {
            margin-top: -36px;
            border-radius: 28px;
            box-shadow:
              0 -12px 50px -6px rgba(147, 51, 234, 0.2),
              0 40px 80px -16px rgba(76, 29, 149, 0.24),
              0 20px 40px -10px rgba(0, 0, 0, 0.12),
              0 0 0 1px rgba(255, 255, 255, 0.95) inset;
          }
        }
        /* Desktop: no special treatment (uses the grid layout) */
        @media (min-width: 1024px) {
          .admin-login-form-card {
            margin-top: 0;
            border-radius: 0;
            box-shadow: none;
            animation: none;
          }
          .admin-login-form-card::before {
            display: none;
          }
        }
      `}</style>

      {/* --- HEAVY 3D BACKGROUND PERSPECTIVE & AMBIENT SYSTEM --- */}
      
      {/* 3D Isometric / Perspective Grid Plane */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(147, 51, 234, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(147, 51, 234, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, #000 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, #000 30%, transparent 100%)',
        }}
      />

      {/* 3D Deep Glowing Ambient Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-purple-400/20 via-indigo-300/15 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-gradient-to-tl from-purple-500/20 via-pink-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating 3D Glass Geometric Sphere (Top Right) — hidden on small mobile */}
      <div 
        className="absolute top-12 right-12 lg:right-28 w-20 h-20 sm:w-28 sm:h-28 rounded-full pointer-events-none hidden sm:block"
        style={{
          background: 'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.95), rgba(233, 213, 255, 0.5) 40%, rgba(168, 85, 247, 0.3) 75%, rgba(126, 34, 206, 0.25) 100%)',
          boxShadow: 'inset -6px -8px 16px rgba(107, 33, 168, 0.3), inset 6px 6px 12px rgba(255, 255, 255, 0.9), 0 25px 50px -12px rgba(147, 51, 234, 0.25)',
          transform: 'translateZ(60px) rotate(12deg)',
        }}
      />

      {/* Floating 3D Glass Torus / Ring (Bottom Left) */}
      <div 
        className="absolute bottom-10 left-10 lg:left-24 w-28 h-28 sm:w-36 sm:h-36 rounded-full pointer-events-none hidden sm:block"
        style={{
          border: '14px solid rgba(216, 180, 254, 0.35)',
          background: 'transparent',
          boxShadow: 'inset 0 4px 10px rgba(255, 255, 255, 0.8), inset 0 -4px 10px rgba(147, 51, 234, 0.3), 0 30px 60px -15px rgba(126, 34, 206, 0.25)',
          transform: 'rotateX(55deg) rotateY(-20deg) rotateZ(25deg)',
        }}
      />

      {/* Small 3D Floating Pearl (Top Left) */}
      <div 
        className="absolute top-28 left-20 w-12 h-12 rounded-full pointer-events-none hidden lg:block"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #ffffff, #e9d5ff 45%, #c084fc 80%, #7e22ce 100%)',
          boxShadow: 'inset -3px -4px 8px rgba(88, 28, 135, 0.4), inset 3px 3px 6px #ffffff, 0 15px 30px -5px rgba(147, 51, 234, 0.3)',
        }}
      />

      {/* --- HEAVY 3D ELEVATED TWO-COLUMN CARD --- */}
      <div 
        className="w-full max-w-4xl bg-white/95 backdrop-blur-xl border border-white/80 rounded-2xl sm:rounded-3xl overflow-visible lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 my-4 transition-all duration-300"
        style={{
          boxShadow: `
            0 40px 100px -20px rgba(76, 29, 149, 0.22),
            0 25px 50px -15px rgba(0, 0, 0, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.95) inset,
            0 1px 3px rgba(0, 0, 0, 0.05)
          `,
          transform: 'translateZ(20px)',
        }}
      >
        
        {/* LEFT COLUMN: BRANDING & MINIMAL 3D ART */}
        <div className="lg:col-span-5 p-8 sm:p-10 lg:p-12 bg-gradient-to-b from-[#faf8fe] via-[#f6f2fd] to-[#efe9fc] border-b-0 lg:border-r border-purple-100/70 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[260px] sm:min-h-[300px] lg:min-h-[480px] rounded-t-2xl sm:rounded-t-3xl lg:rounded-none">
          
          {/* Top-Left Organic Curved Soft Ambient Shape */}
          <div className="absolute -top-10 -left-10 w-36 h-36 bg-purple-300/30 rounded-full blur-xl pointer-events-none" />
          
          {/* Top-Right Clean Dot Grid Motif (4x5 dots) */}
          <div className="absolute top-7 right-7 pointer-events-none opacity-60">
            <svg width="64" height="72" viewBox="0 0 64 72" fill="none">
              <pattern id="ref-dot-pattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="1.75" fill="#a855f7" opacity="0.4" />
              </pattern>
              <rect width="64" height="72" fill="url(#ref-dot-pattern)" />
            </svg>
          </div>

          {/* Bottom Concentric Arc Contour */}
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full border border-white/80 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none" />

          {/* Animated Glow Ring behind lock card (mobile/tablet only) */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full pointer-events-none lg:hidden"
            style={{
              background: 'radial-gradient(circle, rgba(147,51,234,0.15), transparent 70%)',
              animation: 'adminGlowRing 3s ease-in-out infinite',
            }}
          />

          {/* Central Content Stack */}
          <div className="relative z-10 flex flex-col items-center space-y-6 sm:space-y-8 my-auto">
            {/* Logo & Spaced Subtitle */}
            <div className="space-y-2.5">
              <img
                src="/logob.png"
                alt="Claxic"
                className="h-9 sm:h-10 w-auto object-contain mx-auto drop-shadow-xs"
              />
              <p className="text-[11px] sm:text-xs font-semibold text-slate-800 uppercase tracking-[0.3em]">
                Admin Panel
              </p>
            </div>

            {/* Elevated 3D Floating Lock Card — with breathing animation on mobile */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-md flex items-center justify-center relative"
              style={{
                boxShadow: `
                  0 20px 35px -8px rgba(147, 51, 234, 0.18),
                  0 6px 16px -4px rgba(0, 0, 0, 0.04),
                  inset 0 2px 4px rgba(255, 255, 255, 0.95),
                  inset 0 -1px 2px rgba(147, 51, 234, 0.1)
                `,
                border: '1px solid rgba(255, 255, 255, 0.9)',
                animation: 'adminLockPulse 3s ease-in-out infinite',
              }}
            >
              <Lock className="w-7 h-7 sm:w-9 sm:h-9 text-purple-600 stroke-[1.8]" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN & RECOVERY FORM — "page up" elevated card on mobile/tablet */}
        <div className="admin-login-form-card lg:col-span-7 p-6 sm:p-8 lg:p-11 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-5 sm:space-y-6">
            
            {/* Header Text */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-purple-600 tracking-wider uppercase block">
                {isRecoveryMode ? 'Password Recovery' : 'Welcome Back'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {isRecoveryMode ? 'Reset Credentials' : 'Admin Login'}
              </h2>
              <p className="text-xs text-slate-500">
                {isRecoveryMode
                  ? 'Follow the steps to regain administrative access'
                  : 'Please sign in to continue'}
              </p>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {!isRecoveryMode ? (
              <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@claxic.edu"
                      className="w-full bg-white border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Options Row: Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 font-medium">Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryMode(true);
                      setRecoveryStep('request');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Button with Subtle Purple Glow on Hover */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-slate-950 hover:bg-black text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_0_25px_rgba(147,51,234,0.35)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Login</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* RECOVERY / FORGOT PASSWORD FLOW */
              <div className="space-y-4">
                {recoveryStep === 'request' ? (
                  <form onSubmit={handleForgotRequest} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-700">
                        Admin Account Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@claxic.edu"
                          className="w-full bg-white border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-slate-950 hover:bg-black text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_0_25px_rgba(147,51,234,0.35)] cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'Sending Code...' : 'Send Reset Code'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetConfirm} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-700">
                        Reset Code
                      </label>
                      <input
                        type="text"
                        required
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="w-full bg-white border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-700">
                        New Passphrase (Min 8 characters)
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-white border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-slate-950 hover:bg-black text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_0_25px_rgba(147,51,234,0.35)] cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'Updating...' : 'Set New Password'}
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryMode(false);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-900 font-medium py-1 transition-colors cursor-pointer"
                >
                  ← Back to Admin Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
