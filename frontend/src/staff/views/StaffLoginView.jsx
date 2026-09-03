import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const StaffLoginView = ({ onNavigate }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Load remembered email on mount if any
  useEffect(() => {
    const savedEmail = localStorage.getItem('claxic_staff_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // Standard Staff Form Submission
  const handleStaffLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError('Please enter a valid staff email address.');
      return;
    }
    if (!password) {
      setError('Please enter your staff account password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (res.status === 401) {
        throw new Error('Invalid staff email or password.');
      }

      if (res.status === 403) {
        throw new Error(
          data.error || 'This account is not registered as Staff. Please use the correct portal.'
        );
      }

      if (!res.ok) {
        if (data.error && data.error.toLowerCase().includes('inactive')) {
          throw new Error('Your staff account is currently inactive. Please contact an administrator.');
        }
        throw new Error(data.error || 'Unable to connect. Please try again.');
      }

      if (!data.user || data.user.role !== 'STAFF') {
        throw new Error('This account is not registered as Staff. Please use the correct portal.');
      }

      localStorage.setItem('claxic_staff_saved_email', cleanEmail);
      login(data.token, data.user);
      if (onNavigate) onNavigate('staff');
    } catch (err) {
      setError(err.message || 'Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth for Staff
  const handleGoogleStaffLogin = async (payload) => {
    if (!payload) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          portalRole: 'STAFF',
        }),
      });

      const data = await res.json();

      if (res.status === 403 || !res.ok) {
        throw new Error(
          data.error || 'Access denied. This account is not registered as Staff.'
        );
      }

      if (!data.user || data.user.role !== 'STAFF') {
        throw new Error('Access denied. This account is not registered as Staff.');
      }

      login(data.token, data.user);
      if (onNavigate) onNavigate('staff');
    } catch (err) {
      setError(err.message || 'Access denied. This account is not registered as Staff.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Google SSO Prompt
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
              await handleGoogleStaffLogin({
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
          callback: (res) => handleGoogleStaffLogin({ credential: res.credential }),
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
    handleGoogleStaffLogin({
      credential: 'demo_staff_google_sso_token_' + Math.random().toString(36).substring(2, 10),
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f8f8] flex items-center justify-center p-3 sm:p-5 lg:p-6 font-sans antialiased selection:bg-[#0F1E2E]/15 selection:text-[#0F1E2E]">
      
      {/* Centered Main Authentication Container */}
      <div className="w-full max-w-[880px] bg-[#FFFFFF] border border-[#CBD5E1] rounded-[24px] sm:rounded-[30px] shadow-[0_20px_50px_rgba(15,23,42,0.08)] hover:shadow-[0_25px_60px_rgba(15,23,42,0.12)] transition-all duration-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative my-auto">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: SLEEK DARK ACADEMIC STAFF ARTWORK AREA      */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 bg-[#0F1E2E] p-8 sm:p-10 lg:p-12 flex flex-col items-center justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800 min-h-[380px] lg:min-h-[560px]">
          
          {/* Top Left: Claxic Brand Logo (Large, Clean, No Pill Background) */}
          <div className="w-full flex items-center justify-start z-10">
            <div className="flex items-center gap-3 select-none">
              <img
                src="/logow.png"
                alt="Claxic"
                className="h-7 sm:h-8 lg:h-9 w-auto object-contain transition-transform duration-200 hover:scale-102"
              />
              <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-[#38BDF8] border-l border-slate-700/80 pl-3">
                Staff Portal
              </span>
            </div>
          </div>

          {/* Minimalist Flat Vector Illustration */}
          <div className="w-full max-w-[320px] my-auto py-6 flex items-center justify-center">
            <svg
              viewBox="0 0 400 340"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto drop-shadow-md"
            >
              {/* Subtle Ambient Glow */}
              <circle cx="200" cy="180" r="110" fill="#0284C7" opacity="0.08" filter="blur(30px)" />

              {/* Minimal Organic Background Accents */}
              <circle cx="95" cy="85" r="4.5" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
              <circle cx="340" cy="180" r="3.5" stroke="#38BDF8" strokeWidth="1.5" opacity="0.8" />
              <path d="M 60 140 Q 75 130 90 140 T 120 140" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
              <path d="M 60 190 Q 75 200 90 190 T 110 195" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />

              {/* Minimalist Wall Clock */}
              <circle cx="270" cy="90" r="24" stroke="#94A3B8" strokeWidth="2" fill="#16293D" />
              <path d="M 270 76 L 270 90 L 282 90" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

              {/* Base Platform Line */}
              <path d="M 50 280 L 350 280" stroke="#475569" strokeWidth="2" strokeLinecap="round" />

              {/* Left Pedestal Column (Patterned with luminous dots) */}
              <rect x="90" y="210" width="48" height="70" fill="#1E3A5F" rx="3" stroke="#334E68" strokeWidth="1" />
              <circle cx="102" cy="225" r="2" fill="#38BDF8" />
              <circle cx="118" cy="225" r="2" fill="#38BDF8" />
              <circle cx="126" cy="245" r="2" fill="#38BDF8" />
              <circle cx="106" cy="250" r="2" fill="#38BDF8" />
              <circle cx="116" cy="265" r="2" fill="#38BDF8" />

              {/* Central Main Platform Block */}
              <rect x="150" y="180" width="75" height="100" fill="#0369A1" rx="3" stroke="#0284C7" strokeWidth="1" />

              {/* Seated Staff Character */}
              {/* Hair */}
              <path
                d="M 170 115 C 160 100 175 80 195 85 C 210 90 215 105 205 120 C 190 118 180 125 170 115 Z"
                fill="#0F172A"
                stroke="#38BDF8"
                strokeWidth="1.5"
              />
              {/* Head */}
              <circle cx="198" cy="112" r="13" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />

              {/* Torso & Shirt with Luminous Pattern */}
              <path
                d="M 185 130 C 175 140 170 160 170 180 L 215 180 C 218 165 215 145 205 130 Z"
                fill="#0F172A"
                stroke="#38BDF8"
                strokeWidth="1.5"
              />
              {/* Bright White Collar & Dashes on Shirt */}
              <path d="M 180 148 L 188 144" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              <path d="M 195 155 L 202 152" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              <path d="M 182 168 L 190 165" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              <path d="M 200 172 L 208 168" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

              {/* Arms Typing on Laptop */}
              <path
                d="M 198 145 C 215 150 235 152 250 156"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 195 152 C 210 158 228 160 244 164"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Glowing Laptop (Cyan Screen) */}
              <path d="M 240 172 L 280 172 L 275 168 L 244 168 Z" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
              <path d="M 255 170 L 275 125 L 285 130 L 265 170 Z" fill="#38BDF8" stroke="#0F172A" strokeWidth="1.5" />

              {/* Legs Seated Comfortably */}
              <path
                d="M 185 180 C 185 195 190 210 210 215 C 225 218 240 230 245 260 L 225 262 C 220 240 205 230 190 225 C 175 220 170 200 170 180 Z"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="2"
              />

              {/* Shoes */}
              <path d="M 245 260 C 255 260 262 268 258 274 L 240 274 L 240 262 Z" fill="#38BDF8" stroke="#0F172A" strokeWidth="1" />
              <path d="M 215 250 C 220 250 226 256 224 262 L 208 262 L 210 252 Z" fill="#38BDF8" stroke="#0F172A" strokeWidth="1" />
            </svg>
          </div>

          {/* Bottom Academic Trust Notice */}
          <div className="flex items-center gap-2 text-center text-slate-300 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-[#38BDF8] shrink-0" />
            <span>Authorized Claxic Staff Access Directorate</span>
          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: CLEAN WHITE FORM WITH DARK NAVY ACCENT     */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 p-7 sm:p-9 lg:p-11 flex flex-col justify-center bg-[#FFFFFF]">
          <div className="max-w-[360px] w-full mx-auto space-y-5">

            {/* Header: Title & Subtitle */}
            <div className="text-left space-y-1">
              <h1 className="text-[26px] sm:text-[30px] font-bold text-[#0F1E2E] tracking-tight font-display">
                Staff Login
              </h1>
              <p className="text-xs sm:text-sm text-[#627D98] leading-relaxed">
                Enter your staff credentials to access your portal
              </p>
            </div>

            {/* Feedback Alerts */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            {/* Primary Login Form */}
            <form onSubmit={handleStaffLoginSubmit} className="space-y-3.5">
              
              {/* Input 1: Staff Email */}
              <div className="space-y-1.5 group">
                <label className="block text-xs font-semibold text-[#0F1E2E]/90 transition-colors duration-150 group-focus-within:text-[#0F1E2E]">
                  Staff Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#829AB1] group-focus-within:text-[#0F1E2E] transition-colors duration-150">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@claxic.edu"
                    className="w-full bg-[#FFFFFF] border border-[#CBD5E1] hover:border-[#0F1E2E]/50 focus:bg-white focus:border-[#0F1E2E] focus:ring-4 focus:ring-[#0F1E2E]/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0F1E2E] placeholder:text-[#94A3B8] outline-none transition-all duration-150"
                  />
                </div>
              </div>

              {/* Input 2: Password */}
              <div className="space-y-1.5 group">
                <label className="block text-xs font-semibold text-[#0F1E2E]/90 transition-colors duration-150 group-focus-within:text-[#0F1E2E]">
                  Account Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#829AB1] group-focus-within:text-[#0F1E2E] transition-colors duration-150">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#FFFFFF] border border-[#CBD5E1] hover:border-[#0F1E2E]/50 focus:bg-white focus:border-[#0F1E2E] focus:ring-4 focus:ring-[#0F1E2E]/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#0F1E2E] placeholder:text-[#94A3B8] outline-none transition-all duration-150 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#829AB1] hover:text-[#0F1E2E] transition-colors duration-150 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button (Dark Navy Accent #0F1E2E) */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#0F1E2E] hover:bg-[#182C40] active:bg-[#0A1521] text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm hover:shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In to Staff Portal</span>
                  )}
                </button>
              </div>
            </form>

            {/* Social Authentication: Google OAuth SSO for Staff */}
            <div className="space-y-3 pt-0.5">
              <div className="flex items-center gap-3">
                <div className="h-px bg-[#E2E8F0] flex-1" />
                <span className="text-xs text-[#627D98] whitespace-nowrap font-medium select-none">
                  Or sign in with
                </span>
                <div className="h-px bg-[#E2E8F0] flex-1" />
              </div>

              <button
                type="button"
                onClick={handleGoogleButtonClick}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#0F1E2E] border border-[#CBD5E1] hover:border-[#0F1E2E]/50 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
                </svg>
                <span className="whitespace-nowrap font-medium">Continue with Google</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
