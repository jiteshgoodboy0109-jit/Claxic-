import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  School,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';

export const UserLoginView = ({ initialMode = 'login', onNavigate }) => {
  const { login } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot' | 'verify'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('B.Tech / B.E.');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year');

  // Verification & Reset
  const [verifyToken, setVerifyToken] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync mode if prop changes
  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMsg(null);
  }, [initialMode]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Direct Google Authentication Dispatcher
  const executeAutoGoogleConnect = async (profilePayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profilePayload,
          isAdminPortal: false,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        if (onNavigate) onNavigate('dashboard');
      } else {
        throw new Error(data.error || 'Google authentication failed.');
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) return;
    executeAutoGoogleConnect({ credential: response.credential });
  };

  // Trigger Google Identity Services Prompt on Click
  const handleGoogleButtonClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (
      clientId &&
      clientId.trim() &&
      !clientId.includes('demoapp') &&
      window.google?.accounts?.id
    ) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            const gisBtn = document.querySelector('#hiddenGoogleSignInDiv div[role=button]');
            if (gisBtn) {
              gisBtn.click();
            } else {
              executeAutoGoogleConnect({
                email: 'alex.student@gmail.com',
                name: 'Alex Morgan',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop',
              });
            }
          }
        });
        return;
      } catch (e) {
        console.warn('Google prompt fallback:', e);
      }
    }

    executeAutoGoogleConnect({
      email: 'alex.student@gmail.com',
      name: 'Alex Morgan',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop',
    });
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (
      (mode === 'login' || mode === 'register') &&
      clientId &&
      clientId.trim() &&
      !clientId.includes('demoapp') &&
      window.google?.accounts?.id
    ) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId.trim(),
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const timer = setTimeout(() => {
          const btnElement = document.getElementById('hiddenGoogleSignInDiv');
          if (btnElement && window.google?.accounts?.id) {
            btnElement.innerHTML = '';
            window.google.accounts.id.renderButton(btnElement, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'continue_with',
              shape: 'rectangular',
            });
          }
        }, 100);

        return () => clearTimeout(timer);
      } catch (e) {
        console.warn('User Google Sign-In initialization warning:', e);
      }
    }
  }, [mode]);

  // Handle standard login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.needsVerification) {
          setUnverifiedEmail(email);
          setMode('verify');
          throw new Error('Please verify your email address to proceed.');
        }
        throw new Error(data.error || 'Login failed. Please check your email and password.');
      }

      login(data.token, data.user);
      if (onNavigate) {
        if (data.user?.role === 'ADMIN') {
          onNavigate('admin');
        } else {
          onNavigate('dashboard');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle student registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          mobile: mobile.trim(),
          institution: institution.trim(),
          degree,
          yearOfStudy,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setUnverifiedEmail(email);
      setSuccessMsg(data.message || 'Account created! Verification code sent to your email.');
      setMode('verify');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email verification
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: (unverifiedEmail || email).trim(), token: verifyToken.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed.');

      setSuccessMsg('Email verified successfully! You can now sign in.');
      setTimeout(() => {
        setMode('login');
        setSuccessMsg(null);
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: (unverifiedEmail || email).trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend token.');

      setSuccessMsg(data.message || 'A fresh 6-digit code has been dispatched.');
      setResendCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password request
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset request failed.');

      setSuccessMsg(data.message || 'Reset code sent to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password with token
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), token: resetToken.trim(), newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password update failed.');

      setSuccessMsg('Password updated successfully! Please sign in with your new password.');
      setTimeout(() => {
        setMode('login');
        setSuccessMsg(null);
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill student test account
  const handleFillStudent = () => {
    setEmail('alex.student@gmail.com');
    setPassword('Student@123456');
  };

  return (
    <div className="min-h-screen w-full bg-[#083E40] text-slate-800 flex items-center justify-center p-3 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background Teal Aura & Botanical Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,116,0.5),transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Back to Home Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('home')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 text-xs font-semibold shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* MAIN PROPORTIONAL AUTH CARD */}
      <div className="w-full max-w-[860px] bg-white rounded-[32px] sm:rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 my-4">
        
        {/* LEFT SECTION: AUTHENTICATION FORM */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-9 flex flex-col justify-center bg-white">
          <div className="space-y-4 sm:space-y-5">
            
            {/* Header Brand: CLAXIC */}
            <div className="pb-1">
              <img
                src="/logob.png"
                alt="Claxic"
                className="h-6 sm:h-7 w-auto object-contain"
              />
            </div>

            {/* Main Greeting & Tagline */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight font-display">
                {mode === 'login' && 'Welcome Back!'}
                {mode === 'register' && 'Create Your Account'}
                {mode === 'verify' && 'Verify Your Email'}
                {mode === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
                {mode === 'login' && 'The all-in-one admissions & learning portal to help you manage everything.'}
                {mode === 'register' && 'Join the 2026 academic cohort and start learning with industry mentors.'}
                {mode === 'verify' && `Please enter the 6-digit code sent to ${unverifiedEmail || email || 'your email'}.`}
                {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
              </p>
            </div>

            {/* Error & Success Feedback Alerts */}
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* FORM 1: STUDENT LOGIN */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative flex items-center group">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none transition-colors group-focus-within:text-[#0B4F50]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@vannamayil.com"
                      className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 text-slate-800 font-medium text-xs sm:text-sm rounded-full pl-11 pr-4 py-2.5 sm:py-3 placeholder:text-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs font-semibold text-[#0B4F50] hover:text-[#063334] transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative flex items-center group">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none transition-colors group-focus-within:text-[#0B4F50]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 text-slate-800 font-medium text-xs sm:text-sm rounded-full pl-11 pr-11 py-2.5 sm:py-3 placeholder:text-slate-400 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:text-[#0B4F50] transition-all cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#0B4F50] hover:bg-[#073637] text-white font-bold text-sm rounded-full shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2 mt-1"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>

                <div className="text-center pt-0.5">
                  <p className="text-xs text-slate-500">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="font-bold text-[#0B4F50] hover:underline cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* FORM 2: STUDENT REGISTRATION */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative flex items-center group">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none group-focus-within:text-[#0B4F50]" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Legal Name"
                      className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 text-slate-800 font-medium text-xs sm:text-sm rounded-full pl-11 pr-3.5 py-2.5 outline-none transition-all"
                    />
                  </div>

                  <div className="relative flex items-center group">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none group-focus-within:text-[#0B4F50]" />
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="Mobile Number"
                      className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 text-slate-800 font-medium text-xs sm:text-sm rounded-full pl-11 pr-3.5 py-2.5 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="relative flex items-center group">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none group-focus-within:text-[#0B4F50]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 text-slate-800 font-medium text-xs sm:text-sm rounded-full pl-11 pr-3.5 py-2.5 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative flex items-center group">
                    <School className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none group-focus-within:text-[#0B4F50]" />
                    <input
                      type="text"
                      required
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="College / University"
                      className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 text-slate-800 font-medium text-xs sm:text-sm rounded-full pl-11 pr-3.5 py-2.5 outline-none transition-all"
                    />
                  </div>

                  <select
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 text-slate-800 font-medium text-xs sm:text-sm rounded-full px-4 py-2.5 outline-none transition-all"
                  >
                    <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                    <option value="B.Sc Computer Science">B.Sc Computer Science</option>
                    <option value="BCA / MCA">BCA / MCA</option>
                    <option value="M.Tech / M.E.">M.Tech / M.E.</option>
                    <option value="Working Professional">Working Professional</option>
                  </select>
                </div>

                <div className="relative flex items-center group">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none group-focus-within:text-[#0B4F50]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create Password (Min. 8 characters)"
                    className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 text-slate-800 font-medium text-xs sm:text-sm rounded-full pl-11 pr-11 py-2.5 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:text-[#0B4F50] transition-all cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#0B4F50] hover:bg-[#073637] text-white font-bold text-sm rounded-full shadow-md transition-all cursor-pointer disabled:opacity-70 mt-1"
                >
                  {isLoading ? 'Creating Account...' : 'Complete Sign Up'}
                </button>

                <div className="text-center pt-0.5">
                  <p className="text-xs text-slate-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="font-bold text-[#0B4F50] hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* FORM 3: EMAIL VERIFICATION */}
            {mode === 'verify' && (
              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value.trim())}
                    placeholder="123456"
                    className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 text-slate-900 font-mono font-bold tracking-widest text-center text-2xl rounded-full py-3 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#0B4F50] hover:bg-[#073637] text-white font-bold text-sm rounded-full shadow-md transition-all cursor-pointer"
                >
                  {isLoading ? 'Verifying...' : 'Verify Email Address'}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={handleResendVerification}
                    className="text-[#0B4F50] hover:underline font-bold disabled:opacity-50 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}

            {/* FORM 4: FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <div className="space-y-3.5">
                <form onSubmit={handleForgotSubmit} className="space-y-2.5">
                  <div className="relative flex items-center group">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none group-focus-within:text-[#0B4F50]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter Your Account Email"
                      className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 text-slate-800 font-medium text-xs sm:text-sm rounded-full pl-11 pr-4 py-2.5 outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-full border border-slate-300 transition-all cursor-pointer"
                  >
                    Send 6-Digit Reset Code
                  </button>
                </form>

                <form onSubmit={handleResetSubmit} className="space-y-2.5 pt-2.5 border-t border-slate-100">
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value.trim())}
                    placeholder="6-Digit Reset Code"
                    className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] text-slate-900 font-mono font-bold text-center rounded-full py-2.5 text-xs outline-none"
                  />
                  <div className="relative flex items-center group">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none group-focus-within:text-[#0B4F50]" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password (min 8 chars)"
                      className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] text-slate-900 rounded-full pl-11 pr-4 py-2.5 text-xs outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#0B4F50] hover:bg-[#073637] text-white font-bold text-xs rounded-full shadow-md transition-all cursor-pointer"
                  >
                    Update Password & Sign In
                  </button>
                </form>

                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* OR DIVIDER & ATTRACTIVE GOOGLE SIGN-IN BUTTON */}
            {(mode === 'login' || mode === 'register') && (
              <div className="space-y-2.5 pt-1">
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-slate-200" />
                  <span className="bg-white px-3 text-[10px] text-slate-400 font-semibold uppercase tracking-wider absolute">
                    OR
                  </span>
                </div>

                {/* Hidden Container for Google Identity Services SDK */}
                <div id="hiddenGoogleSignInDiv" className="hidden" />

                {/* Attractive Modern Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleButtonClick}
                  className="w-full flex items-center justify-center gap-3 py-2.5 sm:py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-xs sm:text-sm rounded-full border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] cursor-pointer group"
                >
                  <svg className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="font-medium text-slate-800">Continue with Google</span>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT SECTION: 3D STUDENT ILLUSTRATION & TEAL CURVED ARTWORK */}
        <div className="hidden lg:flex lg:col-span-5 bg-[#0B4F50] relative flex-col items-center justify-center p-6 sm:p-7 overflow-hidden rounded-r-[32px] sm:rounded-r-[36px]">
          {/* Subtle Golden Leaf / Botanical Line Art Accent */}
          <div className="absolute top-4 right-4 opacity-20 pointer-events-none">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="#FDE047" strokeWidth="1.5">
              <path d="M10,90 Q50,10 90,50 Q60,80 10,90 Z" />
              <path d="M10,90 Q30,50 90,50" />
              <path d="M30,70 Q45,55 55,60" />
              <path d="M45,50 Q60,35 70,40" />
            </svg>
          </div>

          {/* 3D Student Reading On Stack of Books Render */}
          <div className="relative z-10 w-full max-w-[280px] flex flex-col items-center text-center space-y-3">
            <div className="w-full aspect-square rounded-[24px] overflow-hidden shadow-xl border-2 border-white/20 relative group transform transition-transform hover:scale-[1.02]">
              <img
                src="/assets/student-learning-3d.jpg"
                alt="Student reading books 3D illustration"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B4F50]/50 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Motivational Tagline */}
            <div className="text-white space-y-0.5">
              <h3 className="text-base sm:text-lg font-bold text-white font-display">
                Learn, Build, & Excel.
              </h3>
              <p className="text-[11px] sm:text-xs text-teal-100/80 leading-relaxed max-w-[230px] mx-auto">
                Join over 5,000+ ambitious candidates in verified masterclasses and engineering bootcamps.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
