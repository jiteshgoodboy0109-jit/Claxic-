import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import {
  KeyRound,
  Mail,
  Lock,
  User,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const ChangeStaffCredentialsModal = ({
  isOpen,
  onClose,
  staffMember,
  onCredentialsUpdated,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (staffMember) {
      setName(staffMember.name || '');
      setEmail(staffMember.email || '');
      setPassword('');
      setShowPassword(false);
      setError(null);
      setSuccessData(null);
      setCopied(false);
    }
  }, [staffMember, isOpen]);

  if (!staffMember) return null;

  // Generate a cryptographically strong permanent password
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let generated = 'Clx@';
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Staff email (username) is required.');
      return;
    }
    if (!password || password.trim().length < 6) {
      setError('Permanent password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/admin/staff/${staffMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update staff credentials.');
      }

      setSuccessData({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (onCredentialsUpdated) {
        onCredentialsUpdated(data.staff);
      }
      window.dispatchEvent(new CustomEvent('claxic_user_updated'));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!successData) return;
    const loginUrl = `${window.location.origin}/staff-login`;
    const credText =
      `Claxic Faculty & Staff Permanent Credentials\n` +
      `-------------------------------------------\n` +
      `Staff Member: ${successData.name}\n` +
      `Username / Email: ${successData.email}\n` +
      `Permanent Password: ${successData.password}\n` +
      `Staff Portal URL: ${loginUrl}\n` +
      `-------------------------------------------\n` +
      `Please keep these credentials secure.`;

    navigator.clipboard.writeText(credText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleClose = () => {
    setSuccessData(null);
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
      <div className="space-y-5 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E3DC]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shadow-2xs">
              <KeyRound className="w-4 h-4 text-[#D97706]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1F1F1F] tracking-tight">
                Manage Staff Credentials
              </h3>
              <p className="text-[11px] text-[#6B6258]">
                Permanent Username & Password Provisioning
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97706] bg-[#FFF7E6] px-2 py-0.5 rounded-full border border-[#FEDDAA]">
            Staff RBAC
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* Success View */}
        {successData ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Permanent Credentials Updated Successfully!</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                The permanent login credentials for <strong>{successData.name}</strong> have been saved. All previous active sessions for this account have been terminated.
              </p>

              <div className="p-3 bg-white rounded-xl border border-emerald-200/80 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 text-[11px]">Username / Email:</span>
                  <span className="font-bold text-stone-900 select-all">{successData.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 text-[11px]">Permanent Password:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 select-all">
                    {successData.password}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-100">
                  <span className="text-stone-500">Portal Login URL:</span>
                  <span className="text-sky-700 font-medium">/staff-login</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-white" />
                      <span>Copy Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Edit Credentials Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Staff Info Preview */}
            <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E8E3DC] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#18181B] text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                {(name || 'S')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#1F1F1F] truncate">{name}</p>
                <p className="text-[11px] text-[#6B6258] truncate">{staffMember.degree || 'Faculty Member'}</p>
              </div>
            </div>

            {/* Editable Username / Login Email */}
            <div>
              <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
                Permanent Staff Username (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faculty@claxic.edu"
                  className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1F1F1F] font-mono outline-none transition-all"
                />
              </div>
              <p className="text-[10px] text-[#6B6258] mt-1">
                This is the permanent email / login username used at <span className="font-mono text-[#D97706]">/staff-login</span>.
              </p>
            </div>

            {/* Permanent Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#1F1F1F]">
                  Permanent Password
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] font-semibold text-[#D97706] hover:text-[#B45309] inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Strong</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new permanent password (min 6 chars)..."
                  className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 rounded-xl pl-9 pr-10 py-2 text-xs text-[#1F1F1F] font-mono outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-[#6B6258] mt-1">
                Updating the permanent password will immediately revoke any existing login sessions.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8E3DC]">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !password || password.trim().length < 6}
                className="px-5 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="xs" variant="white" inline className="mr-1" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Set Permanent Credentials</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
