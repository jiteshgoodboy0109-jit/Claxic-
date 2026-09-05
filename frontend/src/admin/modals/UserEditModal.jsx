import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import {
  User as UserIcon,
  Mail,
  Phone,
  School,
  GraduationCap,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  ShieldCheck,
  Clock,
  Save,
} from 'lucide-react';

export const UserEditModal = ({ isOpen, onClose, user, userToEdit, onSaved }) => {
  const targetUser = userToEdit || user;

  // Clean to exactly 10 digits
  const extract10DigitMobile = (val) => {
    if (!val) return '';
    let digits = String(val).replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return digits.slice(1);
    }
    if (digits.length > 10) {
      return digits.slice(-10);
    }
    return digits;
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [role, setRole] = useState('USER');
  const [isActive, setIsActive] = useState(true);
  const [isVerified, setIsVerified] = useState(true);

  // Direct Password Reset Sub-panel
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

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

  useEffect(() => {
    if (targetUser) {
      setName(targetUser.name || '');
      setEmail(targetUser.email || '');
      setMobile(extract10DigitMobile(targetUser.mobile));
      setInstitution(targetUser.institution || '');
      setDegree(targetUser.degree || '');
      setYearOfStudy(targetUser.yearOfStudy || '');
      setRole(targetUser.role || 'USER');
      setIsActive(targetUser.isActive !== false);
      setIsVerified(Boolean(targetUser.isVerified));
      setNewPassword('');
      setError(null);
      setSuccessMsg(null);
      setResetSuccess(null);
      setShowPasswordReset(false);
    }
  }, [targetUser, isOpen]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!targetUser) return;
    if (mobile && mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          mobile: mobile ? `+91 ${mobile.trim()}` : '',
          institution: institution.trim(),
          degree: degree.trim(),
          yearOfStudy: yearOfStudy.trim(),
          role,
          isActive,
          isVerified,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user profile.');

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    if (!targetUser || !newPassword) return;
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setIsResettingPassword(true);
    setError(null);
    setResetSuccess(null);

    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/admin/users/${targetUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');

      setResetSuccess(`Password successfully reset for ${targetUser.name}. Previous sessions revoked.`);
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!targetUser) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-5 font-sans">
        
        {/* User Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E8E3DC] gap-3">
          <div className="flex items-center gap-3">
            <img
              src={targetUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
              alt={targetUser.name}
              className="w-12 h-12 rounded-2xl object-cover border border-[#E8E3DC] shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1F1F1F] tracking-tight font-display">
                  {targetUser.name}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                    role === 'ADMIN'
                      ? 'bg-[#FFF7E6] text-[#D97706] border border-[#FEDDAA]'
                      : role === 'STAFF'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {role}
                </span>
              </div>
              <p className="text-xs text-[#6B6258] font-mono mt-0.5">
                {targetUser.email} • ID: {targetUser.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D97706] bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Verification</span>
              </span>
            )}
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {resetSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{resetSuccess}</span>
          </div>
        )}

        {/* Main User Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          
          {/* Section 1: Personal & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6258]">
              Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#6B6258] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#82684D] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Candidate Name"
                    className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1F1F1F] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6258] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#82684D] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1F1F1F] outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6258] mb-1 flex items-center justify-between">
                  <span>Mobile Number</span>
                  {mobile && (
                    <span className={`text-[10px] font-mono font-bold ${mobile.length === 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {mobile.length === 10 ? '✓ 10 Digits' : `${mobile.length}/10`}
                    </span>
                  )}
                </label>
                <div className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus-within:bg-white focus-within:border-[#F59E0B] focus-within:ring-2 focus-within:ring-[#F59E0B]/20 rounded-xl flex items-center overflow-hidden transition-all">
                  <div className="flex items-center gap-1 pl-3 pr-2.5 py-2 border-r border-[#E8E3DC] select-none shrink-0 bg-[#F5F2EB]/60 text-slate-800 font-mono font-bold text-xs">
                    <span className="text-xs">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobile}
                    onChange={handleMobileChange}
                    placeholder="Enter 10-digit mobile"
                    className="w-full bg-transparent px-3 py-2 text-xs text-[#1F1F1F] outline-none font-mono placeholder:font-sans placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6258] mb-1">
                  College / Institution
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-[#82684D] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Stanford / IIT Madras"
                    className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1F1F1F] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Academic Program & Degree */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#6B6258] mb-1">
                Degree / Qualification
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-[#82684D] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science"
                  className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1F1F1F] outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6B6258] mb-1">
                Year of Study / Graduation
              </label>
              <input
                type="text"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                placeholder="e.g. 4th Year / 2026 Batch"
                className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 rounded-xl px-3 py-2 text-xs text-[#1F1F1F] outline-none transition-all"
              />
            </div>
          </div>

          {/* Section 3: Role & Security Governance */}
          <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E8E3DC] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6258] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Role & Permission Governance</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#6B6258] mb-1">
                  Access Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E8E3DC] rounded-xl px-3 py-2 text-xs font-mono font-semibold text-[#1F1F1F] focus:outline-none focus:border-[#F59E0B] cursor-pointer"
                >
                  <option value="USER">USER (Student Academic Portal)</option>
                  <option value="STAFF">STAFF (Faculty & Instruction)</option>
                  <option value="ADMIN">ADMIN (Executive Command)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B6258] mb-1">
                  Account Status
                </label>
                <select
                  value={isActive ? 'true' : 'false'}
                  onChange={(e) => setIsActive(e.target.value === 'true')}
                  className="w-full bg-[#FFFFFF] border border-[#E8E3DC] rounded-xl px-3 py-2 text-xs font-mono font-semibold text-[#1F1F1F] focus:outline-none focus:border-[#F59E0B] cursor-pointer"
                >
                  <option value="true">Active (Full Access)</option>
                  <option value="false">Suspended (Blocked)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B6258] mb-1">
                  Verification
                </label>
                <select
                  value={isVerified ? 'true' : 'false'}
                  onChange={(e) => setIsVerified(e.target.value === 'true')}
                  className="w-full bg-[#FFFFFF] border border-[#E8E3DC] rounded-xl px-3 py-2 text-xs font-mono font-semibold text-[#1F1F1F] focus:outline-none focus:border-[#F59E0B] cursor-pointer"
                >
                  <option value="true">Verified (Confirmed)</option>
                  <option value="false">Pending Verification</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Direct Admin Password Override */}
          <div className="p-4 rounded-2xl bg-[#FFF7E6]/70 border border-[#FEDDAA] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#D97706]">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Admin Password Override</span>
              </div>

              <button
                type="button"
                onClick={() => setShowPasswordReset(!showPasswordReset)}
                className="text-xs font-semibold text-[#D97706] hover:text-[#B45309] underline underline-offset-2 cursor-pointer"
              >
                {showPasswordReset ? 'Hide Password Reset' : 'Change User Password'}
              </button>
            </div>

            {showPasswordReset && (
              <div className="pt-2 space-y-2 animate-in fade-in">
                <p className="text-[11px] text-[#6B6258]">
                  Setting a new password will immediately revoke all current active login sessions for this account.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative w-full">
                    <Lock className="w-3.5 h-3.5 text-[#82684D] absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new 8+ char password..."
                      className="w-full bg-white border border-[#E8E3DC] focus:border-[#F59E0B] rounded-xl pl-8 pr-3 py-2 text-xs text-[#1F1F1F] font-mono outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAdminResetPassword}
                    disabled={isResettingPassword || newPassword.length < 8}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 whitespace-nowrap transition-colors"
                  >
                    {isResettingPassword ? 'Updating...' : 'Set Password'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E3DC]">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {isLoading ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};