import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { DegreeSelect } from '../../components/ui/DegreeSelect.jsx';
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
  Eye,
  EyeOff,
  Copy,
  Check,
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

  // Password State & Visibility
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [copiedCurrent, setCopiedCurrent] = useState(false);

  const [showPasswordReset, setShowPasswordReset] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
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

  const handleCopyCurrentPassword = () => {
    if (!currentPassword) return;
    navigator.clipboard.writeText(currentPassword);
    setCopiedCurrent(true);
    setTimeout(() => setCopiedCurrent(false), 2000);
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let generated = 'Clx@';
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    setShowNewPassword(true);
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
      setCurrentPassword(targetUser.currentPassword || '');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setCopiedCurrent(false);
      setNewPassword('');
      setError(null);
      setSuccessMsg(null);
      setResetSuccess(null);
      setShowPasswordReset(true);
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

      window.dispatchEvent(new CustomEvent('claxic_user_updated'));
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

      const finalPass = data.currentPassword || newPassword;
      setCurrentPassword(finalPass);
      if (targetUser) targetUser.currentPassword = finalPass;
      setResetSuccess(`Password successfully updated! "${finalPass}" is now saved as the permanent final password.`);
      setNewPassword('');
      window.dispatchEvent(new CustomEvent('claxic_user_updated'));
      if (onSaved) onSaved();
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
              <DegreeSelect
                value={degree}
                onChange={setDegree}
                placeholder="Search Indian degrees or enter field..."
                rounded="rounded-xl"
              />
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

          {/* Section 4: Admin Password Override & Credentials */}
          <div className="p-4 rounded-2xl bg-[#FFF7E6]/70 border border-[#FEDDAA] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#D97706]">
                <KeyRound className="w-4 h-4 text-[#D97706]" />
                <span className="text-sm font-bold">Admin Password Override</span>
              </div>

              <button
                type="button"
                onClick={() => setShowPasswordReset(!showPasswordReset)}
                className="text-xs font-semibold text-[#D97706] hover:text-[#B45309] underline underline-offset-2 cursor-pointer"
              >
                {showPasswordReset ? 'Hide Password Settings' : 'Manage Password'}
              </button>
            </div>

            {showPasswordReset && (
              <div className="space-y-3 pt-1 animate-in fade-in">
                {/* 1. CURRENT ACTIVE PASSWORD (VISIBLE WITH EYE TOGGLE & QUICK COPY) */}
                <div className="bg-white/95 border border-[#FEDDAA] rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#82684D] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Current Active Password</span>
                    </label>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Password
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword || '••••••••'}
                        readOnly
                        className="w-full bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl pl-3.5 pr-10 py-2 text-xs font-mono font-bold text-[#1F1F1F] outline-none select-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer transition-colors"
                        title={showCurrentPassword ? 'Hide Current Password' : 'Show Current Password'}
                        aria-label={showCurrentPassword ? 'Hide Current Password' : 'Show Current Password'}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCurrentPassword}
                      disabled={!currentPassword}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FFF7E6] border border-[#E8E3DC] hover:border-[#FEDDAA] text-[#1F1F1F] hover:text-[#D97706] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 shrink-0 shadow-2xs"
                      title="Copy Current Password"
                    >
                      {copiedCurrent ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#82684D]">
                    This is the student/user's currently active password. Click the eye icon to view or unmask it.
                  </p>
                </div>

                {/* 2. SET NEW FINAL PASSWORD */}
                <div className="bg-white/95 border border-[#FEDDAA] rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#82684D] flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Set New Final Password</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] font-bold text-[#D97706] hover:text-[#B45309] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                      <span>Generate Strong</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Lock className="w-3.5 h-3.5 text-[#82684D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new 8+ char password..."
                        className="w-full bg-[#FAFAF7] focus:bg-white border border-[#E8E3DC] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/15 rounded-xl pl-8.5 pr-10 py-2 text-xs text-[#1F1F1F] font-mono outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer transition-colors"
                        title={showNewPassword ? 'Hide New Password' : 'Show New Password'}
                        aria-label={showNewPassword ? 'Hide New Password' : 'Show New Password'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAdminResetPassword}
                      disabled={isResettingPassword || newPassword.length < 8}
                      className="px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 active:scale-[0.99]"
                    >
                      {isResettingPassword ? (
                        <>
                          <LoadingSpinner size="xs" variant="white" inline />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Set Final Password</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[10px] text-[#6B6258] leading-relaxed">
                    Setting a new password will revoke previous active sessions. This new password will become their permanent final password for future logins.
                  </p>
                </div>

                {/* Success Banner */}
                {resetSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{resetSuccess}</span>
                  </div>
                )}
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
                <>
                  <LoadingSpinner size="xs" variant="white" inline />
                  <span>Saving...</span>
                </>
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