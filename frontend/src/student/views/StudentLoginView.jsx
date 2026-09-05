import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Lock,
  Mail,
  Phone,
  School,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const StudentLoginView = ({ onNavigate, initialMode = 'login' }) => {
  const { login } = useAuth();

  // Mode: 'login' | 'register' | 'verify' | 'forgot'
  const [mode, setMode] = useState(initialMode || 'login');
  const [pendingCourse, setPendingCourse] = useState(null);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('claxic_pending_apply_course');
      if (raw) {
        setPendingCourse(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Failed to read pending course from session:', e);
    }
  }, []);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('B.Tech / B.E.');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year');

  // Verification & Reset Code State
  const [verifyToken, setVerifyToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Countdown timer for resend code
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Student Sign In Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError('Please enter a valid student email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (res.status === 403) {
        if (data.isUnverified) {
          setUnverifiedEmail(cleanEmail);
          setMode('verify');
          setError('Your email is not verified yet. Please enter the verification code.');
          return;
        }
        throw new Error(
          data.error || 'This account is not registered as a Student. Please use the Staff or Admin Login portal.'
        );
      }

      if (res.status === 401) {
        throw new Error('Invalid student email or password.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Unable to sign in. Please check your credentials.');
      }

      login(data.token, data.user);
      const pendingRaw = sessionStorage.getItem('claxic_pending_apply_course');
      if (!pendingRaw && onNavigate) onNavigate('student');
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMobileChange = (e) => {
    let digits = e.target.value.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    if (digits.length > 10) {
      digits = digits.slice(-10);
    }
    setMobile(digits);
  };

  // Student Account Registration Submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError('Please enter a valid student email address.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (mobile && mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          password,
          mobile: mobile ? `+91 ${mobile.trim()}` : '',
          institution: institution.trim(),
          degree,
          yearOfStudy,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      setUnverifiedEmail(cleanEmail);
      setMode('verify');
      setSuccessMsg(data.message || 'Account created! Please check your email for the verification code.');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Email Verification Submission
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const targetEmail = unverifiedEmail || email;
    if (!targetEmail || !verifyToken) {
      setError('Please enter both your email and the 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail.trim(), token: verifyToken.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed. Please check the code.');

      login(data.token, data.user);
      const pendingRaw = sessionStorage.getItem('claxic_pending_apply_course');
      if (!pendingRaw && onNavigate) onNavigate('student');
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Verification Code
  const handleResendVerification = async () => {
    const targetEmail = unverifiedEmail || email;
    if (!targetEmail) return;

    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend code.');

      setSuccessMsg('A new verification code has been sent to your email.');
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  // Forgot Password Request
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your student email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset request failed.');

      setSuccessMsg('Password recovery code dispatched to your email.');
    } catch (err) {
      setError(err.message || 'Password reset request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Reset Submission
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !resetToken || !newPassword) {
      setError('Please fill in all fields.');
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
          token: resetToken.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');

      setSuccessMsg('Password updated successfully! Please sign in with your new password.');
      setMode('login');
      setPassword('');
      setResetToken('');
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth for Students
  const handleGoogleStudentLogin = async (payload) => {
    if (!payload) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          portalRole: 'USER',
        }),
      });

      const data = await res.json();

      if (res.status === 403 || !res.ok) {
        throw new Error(data.error || 'Access denied. Please use the correct login portal.');
      }

      login(data.token, data.user);
      const pendingRaw = sessionStorage.getItem('claxic_pending_apply_course');
      if (!pendingRaw && onNavigate) onNavigate('student');
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleButtonClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // 1. Google OAuth2 Popup flow (most reliable across browsers & localhost)
    if (clientId && clientId.trim() && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId.trim(),
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              await handleGoogleStudentLogin({
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
          callback: (res) => handleGoogleStudentLogin({ credential: res.credential }),
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('OneTap prompt error:', err);
      }
    }

    // 3. Fallback demo token if offline or in preview
    handleGoogleStudentLogin({
      credential: 'demo_student_google_sso_token_' + Math.random().toString(36).substring(2, 10),
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#083E40] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased selection:bg-[#0B4F50]/20 selection:text-[#0B4F50]">
      
      {/* Centered Main Authentication Container */}
      <div className="w-full max-w-[920px] bg-[#FFFFFF] rounded-[24px] sm:rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.35)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative my-auto">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: AUTHENTICATION FORMS (CLEAN WHITE THEME)    */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 p-7 sm:p-9 lg:p-11 flex flex-col justify-center relative bg-[#FFFFFF]">
          
          <div className="max-w-[360px] w-full mx-auto space-y-5">
            

            {/* Pending Course Registration Notice */}
            {pendingCourse && (
              <div className="p-3 rounded-xl bg-[#eef7f7] border border-[#cbe4e4] text-[#0B4F50] text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                <span className="w-2 h-2 rounded-full bg-[#0B4F50] animate-pulse shrink-0" />
                <span className="leading-snug">
                  Sign in to continue your registration for <strong className="text-[#073637]">{pendingCourse.title}</strong>
                </span>
              </div>
            )}

            {/* Title & Subtitle */}
            <div className="space-y-1 text-left">
              <h1 className="text-2xl sm:text-[28px] font-bold text-[#111827] tracking-tight font-display">
                {mode === 'login' && 'Welcome Back!'}
                {mode === 'register' && 'Create Account'}
                {mode === 'verify' && 'Verify Your Email'}
                {mode === 'forgot' && 'Reset Password'}
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                {mode === 'login' && 'The all-in-one admissions & learning portal to help you manage everything.'}
                {mode === 'register' && 'Join Claxic masterclasses and build your engineering career.'}
                {mode === 'verify' && `Enter the 6-digit verification code sent to ${unverifiedEmail || email || 'your email'}`}
                {mode === 'forgot' && 'Enter your registered email to receive recovery instructions.'}
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
                <span className="font-medium leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* FORM 1: STUDENT SIGN IN */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                
                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Email Address
                  </label>
                  <div className="relative flex items-center group">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none group-focus-within:text-[#0B4F50] transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@vannamayil.com"
                      className="w-full bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-[#0B4F50] focus:ring-4 focus:ring-[#0B4F50]/10 text-slate-900 text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all duration-150 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-[#0B4F50] font-medium hover:underline transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative flex items-center group">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none group-focus-within:text-[#0B4F50] transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-[#0B4F50] focus:ring-4 focus:ring-[#0B4F50]/10 text-slate-900 text-xs sm:text-sm rounded-xl pl-10 pr-10 py-2.5 outline-none transition-all duration-150 font-mono placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-[#0B4F50] hover:bg-[#073637] active:bg-[#052627] text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm hover:shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </div>

                {/* Switch to Sign Up */}
                <div className="text-center pt-1 text-xs text-slate-600">
                  <span>Don't have an account? </span>
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
                </div>
              </form>
            )}

            {/* FORM 2: STUDENT REGISTRATION */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">Full Name</label>
                  <div className="relative flex items-center group">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none group-focus-within:text-[#0B4F50]" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-[#0B4F50] text-slate-900 text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">Email Address</label>
                  <div className="relative flex items-center group">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none group-focus-within:text-[#0B4F50]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@student.edu"
                      className="w-full bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-[#0B4F50] text-slate-900 text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative flex items-center bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 focus-within:bg-white focus-within:border-[#0B4F50] rounded-xl overflow-hidden transition-all">
                    <div className="flex items-center gap-1 pl-2.5 pr-2 py-2 border-r border-slate-200 select-none shrink-0 bg-slate-100/70 text-slate-800 font-mono font-bold text-xs">
                      <span className="text-xs">🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={mobile}
                      onChange={handleMobileChange}
                      placeholder="10-digit mobile"
                      className="w-full bg-transparent px-2.5 py-2 text-slate-900 text-xs font-mono outline-none placeholder:font-sans placeholder:text-slate-400"
                    />
                  </div>

                  <div className="relative flex items-center group">
                    <School className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 pointer-events-none group-focus-within:text-[#0B4F50]" />
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="College / Institution"
                      className="w-full bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-[#0B4F50] text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">Password</label>
                  <div className="relative flex items-center group">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none group-focus-within:text-[#0B4F50]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create Password (min 8 chars)"
                      className="w-full bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-[#0B4F50] text-slate-900 text-xs rounded-xl pl-10 pr-10 py-2 outline-none transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#0B4F50] hover:bg-[#073637] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>

                <div className="text-center pt-0.5 text-xs text-slate-600">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="font-bold text-[#0B4F50] hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

            {/* FORM 3: EMAIL VERIFICATION */}
            {mode === 'verify' && (
              <form onSubmit={handleVerifySubmit} className="space-y-3">
                <div className="relative flex items-center group">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none group-focus-within:text-[#0B4F50]" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value.trim())}
                    placeholder="Enter 6-Digit Code"
                    className="w-full bg-[#F8FAFC] border border-slate-200 focus:bg-white focus:border-[#0B4F50] text-slate-900 font-mono font-bold text-sm text-center tracking-widest rounded-xl py-2.5 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#0B4F50] hover:bg-[#073637] text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Confirm Code'}
                </button>

                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendCooldown > 0}
                    className="text-xs text-[#0B4F50] hover:underline font-bold disabled:opacity-50 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}

            {/* FORM 4: FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <div className="space-y-3">
                <form onSubmit={handleForgotSubmit} className="space-y-2">
                  <div className="relative flex items-center group">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none group-focus-within:text-[#0B4F50]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter Your Account Email"
                      className="w-full bg-[#F8FAFC] border border-slate-200 focus:bg-white focus:border-[#0B4F50] text-slate-900 text-xs rounded-xl pl-10 pr-4 py-2 outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
                  >
                    Send Reset Code
                  </button>
                </form>

                <form onSubmit={handleResetSubmit} className="space-y-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value.trim())}
                    placeholder="6-Digit Reset Code"
                    className="w-full bg-[#F8FAFC] border border-slate-200 focus:bg-white focus:border-[#0B4F50] text-slate-900 font-mono font-bold text-center rounded-xl py-2 text-xs outline-none"
                  />
                  <div className="relative flex items-center group">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none group-focus-within:text-[#0B4F50]" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password (min 8 chars)"
                      className="w-full bg-[#F8FAFC] border border-slate-200 focus:bg-white focus:border-[#0B4F50] text-slate-900 rounded-xl pl-10 pr-4 py-2 text-xs outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-[#0B4F50] hover:bg-[#073637] text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
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

            {/* Social Authentication: Google SSO (Clean matching reference) */}
            {mode === 'login' && (
              <div className="space-y-3 pt-0.5">
                <div className="flex items-center gap-3">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[11px] text-slate-400 whitespace-nowrap font-medium uppercase tracking-wider select-none">
                    OR
                  </span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleButtonClick}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium text-xs sm:text-sm rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs transition-all active:scale-[0.99] cursor-pointer group"
                >
                  <svg className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: 3D STUDENT ILLUSTRATION & TEAL ARTWORK     */}
        {/* ======================================================== */}
        <div className="hidden lg:flex lg:col-span-5 bg-[#0B4F50] relative flex-col items-center justify-between p-7 sm:p-8 overflow-hidden rounded-r-[24px] sm:rounded-r-[32px]">
          
          {/* Top Branding on Dark Teal Panel */}
          <div className="w-full flex items-center justify-between z-10">
            <img
              src="/logow.png"
              alt="Claxic"
              className="h-6 sm:h-7 w-auto object-contain drop-shadow-xs transition-transform duration-200 hover:scale-102"
            />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-200 bg-teal-900/60 px-2.5 py-1 rounded-full border border-teal-700/50">
              Admissions
            </span>
          </div>

          {/* Subtle Golden Leaf Accent */}
          <div className="absolute top-4 right-4 opacity-25 pointer-events-none">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="#FDE047" strokeWidth="1.5">
              <path d="M10,90 Q50,10 90,50 Q60,80 10,90 Z" />
              <path d="M10,90 Q30,50 90,50" />
              <path d="M30,70 Q45,55 55,60" />
              <path d="M45,50 Q60,35 70,40" />
            </svg>
          </div>

          {/* 3D Student Reading Render */}
          <div className="relative z-10 w-full max-w-[270px] flex flex-col items-center text-center space-y-3.5 my-auto py-3">
            <div className="w-full aspect-square rounded-[22px] overflow-hidden shadow-2xl border-2 border-white/20 relative group transform transition-transform hover:scale-[1.02]">
              <img
                src="/student-learning-3d.jpg"
                alt="Student reading books 3D illustration"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B4F50]/60 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Motivational Tagline */}
            <div className="text-white space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-white font-display">
                Learn, Build, & Excel.
              </h3>
              <p className="text-xs text-teal-100/80 leading-relaxed max-w-[240px] mx-auto">
                Join over 5,000+ ambitious candidates in verified masterclasses and engineering bootcamps.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export const UserLoginView = StudentLoginView;
