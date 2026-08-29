import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  School,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ExternalLink,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const AuthModal = () => {
  const { authModalState, closeAuthModal, login } = useAuth();
  const [mode, setMode] = useState(authModalState.mode || 'login');

  useEffect(() => {
    if (authModalState.isOpen) {
      setMode(authModalState.mode || 'login');
      setError(null);
      setSuccessMsg(null);
      setIsGoogleConnectOpen(false);
      setShowCloudSetupHelp(false);
    }
  }, [authModalState]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verifyTokenInput, setVerifyTokenInput] = useState('');

  // Automatic Google Connection State
  const [isGoogleConnectOpen, setIsGoogleConnectOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [showCloudSetupHelp, setShowCloudSetupHelp] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleLogin = async (e) => {
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
        throw new Error(data.error || 'Failed to sign in.');
      }

      login(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Administrative sign-in failed.');
      }

      login(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Administrator authentication failed. Check credentials or role.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          password,
          institution: institution.trim(),
          degree: degree.trim(),
          yearOfStudy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      if (data.verificationToken) {
        setVerifyTokenInput(data.verificationToken);
      }
      setSuccessMsg(data.message || 'Registration complete! Please enter your verification code.');
      login(data.token, data.user);
      setMode('verify');
    } catch (err) {
      setError(err.message || 'Unable to complete registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyTokenInput.trim(), email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed.');

      setSuccessMsg(data.message || 'Email successfully verified!');
      setTimeout(() => closeAuthModal(), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please provide your email address to resend the code.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend code.');

      setSuccessMsg(data.message || 'Verification code resent!');
      if (data.verificationTokenPreview) {
        setVerifyTokenInput(data.verificationTokenPreview);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
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
      if (!res.ok) throw new Error(data.error || 'Failed to request reset.');

      setSuccessMsg(data.message);
      if (data.resetTokenPreview) {
        setResetToken(data.resetTokenPreview);
        setMode('reset');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken.trim(), newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset failed.');

      setSuccessMsg(data.message);
      setTimeout(() => setMode('login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Automatic Google Authentication Dispatcher
  const executeAutoGoogleConnect = async (profilePayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profilePayload,
          isAdminPortal: mode === 'admin-login',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
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
            setIsGoogleConnectOpen(true);
          }
        });
        return;
      } catch (e) {
        console.warn('Google prompt fallback:', e);
      }
    }
    // Automatically open instant Google connection panel
    setIsGoogleConnectOpen(true);
  };

  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) {
      setError('Please provide your Google email address.');
      return;
    }
    const derivedName = customGoogleName.trim() || customGoogleEmail.split('@')[0].replace(/[._]/g, ' ');
    executeAutoGoogleConnect({
      email: customGoogleEmail.trim(),
      name: derivedName,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(derivedName)}`,
    });
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (
      authModalState.isOpen &&
      (mode === 'login' || mode === 'register' || mode === 'admin-login') &&
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
          const btnElement = document.getElementById('googleSignInDiv');
          if (btnElement && window.google?.accounts?.id) {
            btnElement.innerHTML = '';
            window.google.accounts.id.renderButton(btnElement, {
              theme: mode === 'admin-login' ? 'filled_black' : 'outline',
              size: 'large',
              width: 380,
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            });
          }
        }, 60);

        return () => clearTimeout(timer);
      } catch (e) {
        console.warn('Google Identity Services initialization warning:', e);
      }
    }
  }, [authModalState.isOpen, mode]);

  return (
    <Modal
      isOpen={authModalState.isOpen}
      onClose={closeAuthModal}
      maxWidth={mode === 'admin-login' ? 'max-w-md' : 'max-w-md'}
    >
      <div className="space-y-6 font-sans">
        {/* Automatic Google Connection Subview */}
        {isGoogleConnectOpen ? (
          <div className="space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsGoogleConnectOpen(false);
                  setShowCloudSetupHelp(false);
                  setShowCustomGoogleInput(false);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Sign In
              </button>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-xs font-semibold text-slate-800">Google Fast Connect</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {mode === 'admin-login' ? 'Administrator Google Sign In' : 'Sign in with Google'}
              </h3>
              <p className="text-xs text-slate-500">
                Choose an account or enter your Google address to automatically connect
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1-Click Instant Google Accounts */}
            <div className="space-y-2">
              {mode === 'admin-login' ? (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    executeAutoGoogleConnect({
                      email: 'admin@claxic.edu',
                      name: 'Platform Administrator',
                      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
                    })
                  }
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-900 bg-white hover:bg-slate-50 transition-all text-left group cursor-pointer shadow-xs"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-sm shadow-xs border border-slate-700">
                    AD
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      Platform Administrator
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate">admin@claxic.edu</div>
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    ADMIN
                  </span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      executeAutoGoogleConnect({
                        email: 'alex.student@gmail.com',
                        name: 'Alex Morgan',
                        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop',
                      })
                    }
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-600 bg-white hover:bg-indigo-50/40 transition-all text-left group cursor-pointer shadow-xs"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop"
                      alt="Alex Morgan"
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                        Alex Morgan
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 truncate">alex.student@gmail.com</div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Student</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      executeAutoGoogleConnect({
                        email: 'priya.patel@gmail.com',
                        name: 'Priya Patel',
                        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
                      })
                    }
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-600 bg-white hover:bg-indigo-50/40 transition-all text-left group cursor-pointer shadow-xs"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop"
                      alt="Priya Patel"
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                        Priya Patel
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 truncate">priya.patel@gmail.com</div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Student</span>
                  </button>
                </>
              )}
            </div>

            {/* Use Another Google Account Toggle */}
            <div className="pt-1">
              {!showCustomGoogleInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomGoogleInput(true)}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer transition-all bg-slate-50 hover:bg-slate-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Use another Google account</span>
                </button>
              ) : (
                <form onSubmit={handleCustomGoogleSubmit} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800">Enter Your Google Account Details</div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 mb-1">
                      Google Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 mb-1">
                      Full Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={customGoogleName}
                      onChange={(e) => setCustomGoogleName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    size="sm"
                    isLoading={isLoading}
                  >
                    Automatically Connect & Sign In
                  </Button>
                </form>
              )}
            </div>

            {/* Optional Google Cloud OAuth Console Setup Info Drawer */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCloudSetupHelp(!showCloudSetupHelp)}
                className="w-full text-center text-[11px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
              >
                {showCloudSetupHelp ? 'Hide Google Cloud Setup Info' : 'Google Cloud OAuth 2.0 Credentials Guide'}
              </button>

              {showCloudSetupHelp && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    To connect via official Google Identity prompt, add your Client ID to <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-900">frontend/.env</code>:
                  </p>
                  <div className="p-2 rounded bg-slate-900 text-slate-100 font-mono text-[10px] select-all break-all">
                    VITE_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
                  </div>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline font-semibold"
                  >
                    Open Google Cloud Console <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Header Branding */}
            <div className="text-center space-y-2">
              {mode === 'admin-login' ? (
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-amber-400 font-bold text-xl shadow-md border border-slate-700">
                  <ShieldCheck className="w-6 h-6 text-amber-400" />
                </div>
              ) : (
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-slate-900 text-white font-bold text-xl shadow-2xs">
                  C
                </div>
              )}

              <h2 className="text-2xl font-bold text-slate-900 font-display tracking-tight uppercase">
                {mode === 'admin-login' && 'Administrator Portal'}
                {mode === 'login' && 'Sign In to Claxic'}
                {mode === 'register' && 'Create Academic Profile'}
                {mode === 'verify' && 'Verify Email Address'}
                {mode === 'forgot' && 'Reset Password'}
                {mode === 'reset' && 'Enter Reset Code'}
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                {mode === 'admin-login'
                  ? 'Restricted executive access for platform directors & managers.'
                  : 'Access your course dashboards, lab sessions, and verifiable credentials.'}
              </p>
            </div>

            {/* Feedback Alerts */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Student Tab Switcher */}
            {(mode === 'login' || mode === 'register') && (
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
                <button
                  onClick={() => setMode('login')}
                  className={`py-1.5 rounded-md transition-all cursor-pointer ${mode === 'login'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                  Student Sign In
                </button>
                <button
                  onClick={() => setMode('register')}
                  className={`py-1.5 rounded-md transition-all cursor-pointer ${mode === 'register'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                  Register
                </button>
              </div>
            )}

            {/* Dedicated Admin Portal Form */}
            {mode === 'admin-login' && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-2 text-xs text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Only verified administrator credentials with ADMIN privileges can enter.</span>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@claxic.edu"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Admin Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                >
                  Sign In as Administrator
                </Button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs text-slate-500 hover:text-slate-900 underline font-medium cursor-pointer"
                  >
                    Return to Student Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Regular Student Login Form */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                >
                  Sign In to Academic Profile
                </Button>
              </form>
            )}

            {/* Registration Form */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ada@oxford.edu"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                      Mobile
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                      Institution
                    </label>
                    <input
                      type="text"
                      required
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="MIT / IIT / Oxford"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                      Degree & Year
                    </label>
                    <input
                      type="text"
                      required
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      placeholder="B.Tech CS / 3rd Yr"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 chars"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                >
                  Complete Registration
                </Button>
              </form>
            )}

            {mode === 'verify' && (
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="registered@email.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    value={verifyTokenInput}
                    onChange={(e) => setVerifyTokenInput(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm font-mono tracking-widest text-center text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                >
                  Verify Account
                </Button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="text-slate-600 hover:text-slate-900 underline font-semibold cursor-pointer"
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-slate-600 hover:text-slate-900 underline font-semibold cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="registered@email.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                >
                  Send Reset Code
                </Button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-center text-xs text-slate-600 hover:text-slate-900 underline pt-2 font-semibold cursor-pointer"
                >
                  Back to Sign In
                </button>
              </form>
            )}

            {mode === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    6-Digit Reset Code
                  </label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm font-mono tracking-widest text-center text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                >
                  Update Password
                </Button>
              </form>
            )}

            {/* Permanent, Instant Automatic Google Authentication Section */}
            {(mode === 'login' || mode === 'register' || mode === 'admin-login') && (
              <div className="pt-2">
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-mono">
                    <span className="bg-white px-2.5 text-slate-500 font-semibold">Or continue with</span>
                  </div>
                </div>

                {/* Official Google Identity Services Button Container */}
                <div id="googleSignInDiv" className="w-full flex justify-center py-1" />
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
