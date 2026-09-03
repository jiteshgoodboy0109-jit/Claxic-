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

  // Google OAuth for Administrator
  const handleGoogleAdminLogin = async (payload) => {
    if (!payload) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          portalRole: 'ADMIN',
          isAdminPortal: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Google administrator authentication failed.');
      }

      if (!data.user || data.user.role !== 'ADMIN') {
        throw new Error('Access Denied: Account lacks administrator privileges.');
      }

      login(data.token, data.user);
      if (onNavigate) onNavigate('admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Google SSO Prompt for Admin
  const handleGoogleButtonClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // 1. Google OAuth2 Popup flow
    if (clientId && clientId.trim() && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId.trim(),
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              await handleGoogleAdminLogin({
                accessToken: tokenResponse.access_token,
              });
            } else if (tokenResponse && tokenResponse.error) {
              setError(`Google Sign-In error: ${tokenResponse.error}`);
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('OAuth2 popup error, attempting OneTap fallback:', err);
      }
    }

    // 2. Google OneTap fallback
    if (clientId && clientId.trim() && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId.trim(),
          callback: (res) => handleGoogleAdminLogin({ credential: res.credential }),
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('OneTap prompt error:', err);
      }
    }

    // 3. Fallback demo token
    handleGoogleAdminLogin({
      credential: 'demo_admin_google_sso_token_' + Math.random().toString(36).substring(2, 10),
    });
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
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative font-sans overflow-hidden [perspective:1400px]">
      
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
          0%, 100% { transform: scale(1); box-shadow: 0 20px 35px -8px rgba(249,115,22,0.18), 0 6px 16px -4px rgba(0,0,0,0.04); }
          50% { transform: scale(1.06); box-shadow: 0 28px 50px -8px rgba(249,115,22,0.28), 0 8px 24px -4px rgba(0,0,0,0.06); }
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
              0 -8px 40px -6px rgba(249, 115, 22, 0.12),
              0 32px 64px -12px rgba(120, 53, 15, 0.15),
              0 16px 32px -8px rgba(0, 0, 0, 0.08),
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
            background: rgba(249, 115, 22, 0.4);
          }
        }
        /* Tablet (md) form card */
        @media (min-width: 640px) and (max-width: 1023px) {
          .admin-login-form-card {
            margin-top: -36px;
            border-radius: 28px;
            box-shadow:
              0 -12px 50px -6px rgba(249, 115, 22, 0.15),
              0 40px 80px -16px rgba(120, 53, 15, 0.18),
              0 20px 40px -10px rgba(0, 0, 0, 0.10),
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

      {/* --- LIGHT BACKGROUND PERSPECTIVE SYSTEM --- */}
      
      {/* Perspective Grid Plane */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(245, 158, 11, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(245, 158, 11, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, #000 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, #000 30%, transparent 100%)',
        }}
      />

      {/* Soft Ambient Shapes */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FFF7E6] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-[#FFF1D6]/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#FAFAF7] rounded-full blur-[100px] pointer-events-none" />

      {/* --- ELEVATED TWO-COLUMN CARD --- */}
      <div 
        className="w-full max-w-4xl bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl sm:rounded-3xl overflow-visible lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 my-4 shadow-xl"
        style={{
          transform: 'translateZ(20px)',
        }}
      >
        
        {/* LEFT COLUMN: BRANDING */}
        <div className="lg:col-span-5 p-8 sm:p-10 lg:p-12 bg-[#FAFAF7] border-b-0 lg:border-r border-[#E8E3DC] flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[260px] sm:min-h-[300px] lg:min-h-[480px] rounded-t-2xl sm:rounded-t-3xl lg:rounded-none">
          
          {/* Top-Right Clean Dot Grid Motif */}
          <div className="absolute top-7 right-7 pointer-events-none opacity-60">
            <svg width="64" height="72" viewBox="0 0 64 72" fill="none">
              <pattern id="ref-dot-pattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="1.75" fill="#F59E0B" opacity="0.3" />
              </pattern>
              <rect width="64" height="72" fill="url(#ref-dot-pattern)" />
            </svg>
          </div>

          {/* Central Content Stack */}
          <div className="relative z-10 flex flex-col items-center space-y-6 sm:space-y-8 my-auto">
            {/* Logo & Spaced Subtitle (Clean Logo with No Background Container) */}
            <div className="space-y-2 text-center">
              <div
                className="inline-flex items-center justify-center transition-transform hover:scale-102 mx-auto select-none"
                title="Admin Console"
              >
                <img
                  src="/logow.png"
                  alt="Claxic"
                  className="h-8 sm:h-9 w-auto object-contain brightness-0 drop-shadow-2xs"
                />
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-[#D97706] uppercase tracking-[0.25em]">
                Admin Console
              </p>
            </div>

            {/* Elevated Lock Card */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-[#FFFFFF] border border-[#E8E3DC] shadow-md flex items-center justify-center relative"
              style={{
                animation: 'adminLockPulse 3s ease-in-out infinite',
              }}
            >
              <Lock className="w-7 h-7 sm:w-9 sm:h-9 text-[#F59E0B] stroke-[1.8]" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN & RECOVERY FORM */}
        <div className="admin-login-form-card lg:col-span-7 p-6 sm:p-8 lg:p-11 flex flex-col justify-center bg-[#FFFFFF]">
          <div className="max-w-md w-full mx-auto space-y-5 sm:space-y-6">
            
            {/* Header Text */}
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold text-[#D97706] tracking-wider uppercase block">
                {isRecoveryMode ? 'Password Recovery' : 'Welcome Back'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1F1F1F] tracking-tight font-display">
                {isRecoveryMode ? 'Reset Credentials' : 'Admin Login'}
              </h1>
              <p className="text-xs sm:text-sm text-[#82684D] leading-relaxed">
                {isRecoveryMode
                  ? 'Follow the steps to regain administrative access'
                  : 'Please sign in to continue'}
              </p>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {!isRecoveryMode ? (
              <div className="space-y-4">
                {/* Google SSO Button (Centered) */}
                <button
                  type="button"
                  onClick={handleGoogleButtonClick}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#FAFAF7] text-[#1F1F1F] border border-[#E8E3DC] hover:border-[#D0C7BC] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
                  </svg>
                  <span className="whitespace-nowrap font-medium">Continue with Google (Admin SSO)</span>
                </button>

                {/* Clean Balanced Straight Horizontal Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px bg-[#E8E3DC] flex-1" />
                  <span className="text-xs text-[#82684D] whitespace-nowrap font-medium select-none">
                    Or sign in with
                  </span>
                  <div className="h-px bg-[#E8E3DC] flex-1" />
                </div>

                <form onSubmit={handleAdminLoginSubmit} className="space-y-3.5">
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#6B6258]">
                      Administrator Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#82684D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@claxic.edu"
                        className="w-full bg-[#FAFAF7] border border-[#E8E3DC] hover:border-[#D0C7BC] focus:bg-white focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1F1F1F] placeholder:text-[#82684D]/50 outline-none transition-all duration-150"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#6B6258]">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#82684D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#FAFAF7] border border-[#E8E3DC] hover:border-[#D0C7BC] focus:bg-white focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/15 rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#1F1F1F] placeholder:text-[#82684D]/50 outline-none transition-all duration-150 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#82684D] hover:text-[#1F1F1F] p-0.5 transition-colors cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Options Row: Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-[#E8E3DC] text-[#F59E0B] focus:ring-[#F59E0B] accent-[#F59E0B] cursor-pointer"
                      />
                      <span className="text-xs text-[#6B6258] font-medium">Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setIsRecoveryMode(true);
                        setRecoveryStep('request');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-[#D97706] hover:text-[#B45309] font-medium hover:underline transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-1.5">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-[#F59E0B] hover:bg-[#D97706] active:bg-[#B45309] text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm hover:shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
              </div>
            ) : (
              /* RECOVERY / FORGOT PASSWORD FLOW */
              <div className="space-y-4">
                {recoveryStep === 'request' ? (
                  <form onSubmit={handleForgotRequest} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#6B6258]">
                        Admin Account Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#82684D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@claxic.edu"
                          className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/15 rounded-xl pl-10 pr-4 py-3 text-sm text-[#1F1F1F] outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'Sending Code...' : 'Send Reset Code'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetConfirm} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#6B6258]">
                        Reset Code
                      </label>
                      <input
                        type="text"
                        required
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/15 rounded-xl px-4 py-3 text-sm text-[#1F1F1F] outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#6B6258]">
                        New Passphrase (Min 8 characters)
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/15 rounded-xl px-4 py-3 text-sm text-[#1F1F1F] outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-xs cursor-pointer disabled:opacity-50"
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
                  className="w-full text-center text-xs text-[#6B6258] hover:text-[#1F1F1F] font-semibold py-1 transition-colors cursor-pointer"
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
