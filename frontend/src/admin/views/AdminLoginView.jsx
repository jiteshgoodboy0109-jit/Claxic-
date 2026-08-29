import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft,
  Terminal,
  Activity,
  KeyRound,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';

export const AdminLoginView = ({ onNavigate }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Recovery Mode
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Handle Admin Authentication - STRICTLY PASSWORD / SESSION BASED (NO GOOGLE AUTH)
  const handleAdminLoginSubmit = async (e) => {
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
        throw new Error(
          data.error || 'Administrative authentication failed. Access strictly restricted.'
        );
      }

      if (!data.user || data.user.role !== 'ADMIN') {
        throw new Error('Access denied: Account lacks required administrative privileges.');
      }

      login(data.token, data.user);
      if (onNavigate) onNavigate('admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Master Admin Filler for Rapid Dev & Audit
  const handleFillAdminCredentials = () => {
    setEmail('admin@claxic.edu');
    setPassword('Admin@123456');
  };

  // Handle Admin Password Reset
  const handleAdminResetSubmit = async (e) => {
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
      if (!res.ok) throw new Error(data.error || 'Admin password update failed.');

      setSuccessMsg('Administrative passphrase updated successfully! Please log in.');
      setIsRecoveryMode(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden font-sans">
      {/* High-Security Dark Ambience with Gold / Amber Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(245,158,11,0.08),rgba(15,23,42,0.95))]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Top Return Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('home')}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Public Portal</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800/80 text-amber-400 text-[11px] font-mono font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Admin Gateway</span>
          </div>
        </div>

        {/* Executive Card */}
        <div className="bg-slate-900/95 backdrop-blur-2xl border border-amber-900/40 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
          {/* Header Accent Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

          {/* Icon & Title */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border border-amber-700/60 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-900/20 relative">
              <ShieldCheck className="w-8 h-8" />
              <div className="absolute -bottom-1 -right-1 p-1 bg-slate-900 rounded-full border border-amber-700/60 text-amber-300">
                <Fingerprint className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">
                Executive Command Access
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Authorized platform administrators only. All authentication events and IP addresses are cryptographically signed and logged.
              </p>
            </div>
          </div>

          {/* Security Notice Tag */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/50 text-amber-300 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-mono text-[11px]">
              Strict Separation: Direct administrative credentials required.
            </span>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MAIN LOGIN FORM */}
          {!isRecoveryMode ? (
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase font-bold tracking-wider text-slate-300">
                  Administrator Identifier
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@claxic.edu"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white font-mono rounded-xl pl-10 pr-4 py-2.5 text-xs transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase font-bold tracking-wider text-slate-300">
                    Master Access Passphrase
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsRecoveryMode(true)}
                    className="text-[11px] font-mono text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    Emergency Recovery
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white font-mono rounded-xl pl-10 pr-10 py-2.5 text-xs transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
                className="py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20"
              >
                Authenticate Administrator
              </Button>

              {/* Quick Fill Admin Master Credentials */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleFillAdminCredentials}
                  className="text-[11px] font-mono text-amber-400 hover:text-amber-300 bg-amber-950/50 hover:bg-amber-900/50 px-3.5 py-1.5 rounded-lg border border-amber-800/60 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>⚡ 1-Click Load Master Admin (admin@claxic.edu)</span>
                </button>
              </div>
            </form>
          ) : (
            /* EMERGENCY RECOVERY FORM */
            <form onSubmit={handleAdminResetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase font-bold text-slate-300">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@claxic.edu"
                  className="w-full bg-slate-950/80 border border-slate-800 text-white font-mono rounded-xl px-3.5 py-2.5 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase font-bold text-slate-300">
                  Security Recovery Token
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value.trim())}
                  placeholder="6-digit reset token"
                  className="w-full bg-slate-950/80 border border-slate-800 text-white font-mono text-center rounded-xl px-3.5 py-2.5 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase font-bold text-slate-300">
                  New Admin Passphrase
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
                className="py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Update Admin Passphrase
              </Button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsRecoveryMode(false)}
                  className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
                >
                  Back to Admin Sign In
                </button>
              </div>
            </form>
          )}

          {/* Security Features Footer */}
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <Terminal className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
              <span className="text-[10px] font-mono text-slate-400 block">256-Bit TLS</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <Activity className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
              <span className="text-[10px] font-mono text-slate-400 block">Audit Log</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 mx-auto mb-1" />
              <span className="text-[10px] font-mono text-slate-400 block">Rate-Limited</span>
            </div>
          </div>
        </div>

        {/* Student Portal Switch Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('login')}
            className="text-xs font-medium text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            Are you a candidate / student? <span className="text-indigo-400 font-bold underline">Go to Student Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
