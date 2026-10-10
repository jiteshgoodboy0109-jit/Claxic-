import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import {
  UserCheck,
  Mail,
  Lock,
  Building,
  GraduationCap,
  Shield,
  Phone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  UserPlus,
  ExternalLink,
  BookOpen,
  Search,
  ArrowRight,
} from 'lucide-react';

export const AppointStaffModal = ({
  isOpen,
  onClose,
  onStaffAppointed,
  existingUsers = [],
  courses = [],
}) => {
  const [mode, setMode] = useState('EXISTING'); // 'EXISTING' or 'NEW'
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STAFF');
  const [department, setDepartment] = useState('Department of Computer Science & Engineering');
  const [designation, setDesignation] = useState('Lead Faculty Instructor');
  const [mobile, setMobile] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [isVerified, setIsVerified] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Filter existing users that can be appointed (non-staff, or all students/users)
  const candidateUsers = existingUsers.filter((u) => {
    if (!u) return false;
    const matchesSearch =
      !userSearchTerm.trim() ||
      (u.name && u.name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearchTerm.toLowerCase()));
    return matchesSearch && u.role !== 'STAFF';
  });

  const handleSelectExistingUser = (uId) => {
    setSelectedUserId(uId);
    const found = existingUsers.find((u) => u.id === uId);
    if (found) {
      setName(found.name || '');
      setEmail(found.email || '');
      setMobile(found.mobile ? found.mobile.replace(/\+91\s*/, '') : '');
      setDepartment(found.institution || 'Department of Computer Science & Engineering');
      setDesignation(found.degree || 'Lead Faculty Instructor');
      setPassword(''); // Blank means keep existing password
    }
  };

  const handleToggleCourse = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  // Generate strong random password
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let generated = 'Clx@';
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
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

  const handleReset = () => {
    setSelectedUserId('');
    setUserSearchTerm('');
    setName('');
    setEmail('');
    setPassword('');
    setRole('STAFF');
    setDepartment('Department of Computer Science & Engineering');
    setDesignation('Lead Faculty Instructor');
    setMobile('');
    setSelectedCourses([]);
    setIsVerified(true);
    setIsActive(true);
    setError(null);
    setSuccessData(null);
    setCopied(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please provide the faculty member Name and Email.');
      return;
    }
    if (mode === 'NEW' && (!password || password.length < 6)) {
      setError('Password must be at least 6 characters long for new staff accounts.');
      return;
    }
    if (mobile && mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password ? password.trim() : undefined,
          role: 'STAFF',
          institution: department.trim(),
          degree: designation.trim(),
          mobile: mobile ? `+91 ${mobile.trim()}` : '',
          assignedCourseIds: selectedCourses,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to appoint staff member.');
      }

      setSuccessData({
        user: data.staff,
        tempPassword: password ? password : '(Retained existing account password)',
        allottedCourses: data.staff?.allottedCourses || [],
      });

      if (onStaffAppointed) {
        onStaffAppointed(data.staff);
      }
      window.dispatchEvent(new CustomEvent('claxic_user_updated'));
      window.dispatchEvent(new CustomEvent('claxic_staff_updated'));
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
      `Claxic Academic Faculty Portal Access\n` +
      `------------------------------------\n` +
      `Name: ${successData.user.name}\n` +
      `Role: ${successData.user.role}\n` +
      `Email (Username): ${successData.user.email}\n` +
      `Password: ${successData.tempPassword}\n` +
      `Allotted Courses: ${successData.allottedCourses.length} course(s)\n` +
      `Portal Login: ${loginUrl}\n` +
      `------------------------------------\n` +
      `Please use your permanent faculty credentials to sign in.`;

    navigator.clipboard.writeText(credText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E3DC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1F1F1F] tracking-tight font-display">
                Appoint Academic Faculty & Staff
              </h2>
              <p className="text-xs text-[#6B6258]">
                Authorize new faculty instructors or promote existing users to Staff role
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FFF7E6] text-[#D97706] border border-[#FEDDAA]">
            Staff RBAC
          </span>
        </div>

        {/* Mode Selector Tabs (Appoint Existing vs Create New) */}
        {!successData && (
          <div className="flex rounded-xl bg-[#F5F2EB] p-1 border border-[#E8E3DC]">
            <button
              type="button"
              onClick={() => {
                setMode('EXISTING');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'EXISTING'
                  ? 'bg-white text-[#D97706] shadow-xs'
                  : 'text-[#6B6258] hover:text-[#1F1F1F]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Appoint Existing Registered User</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('NEW');
                setSelectedUserId('');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'NEW'
                  ? 'bg-white text-[#D97706] shadow-xs'
                  : 'text-[#6B6258] hover:text-[#1F1F1F]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Staff Account</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Success Confirmation Card */}
        {successData ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Faculty Appointment Successfully Confirmed!</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                <strong>{successData.user.name}</strong> has been appointed with <strong>STAFF</strong> privileges.
                Their account can now sign in via the Staff Portal and manage their allotted courses.
              </p>

              {/* Credential Slip */}
              <div className="bg-white/90 border border-emerald-200/80 rounded-xl p-3.5 space-y-2 font-mono text-xs text-slate-800 shadow-2xs">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-sans">Official Email:</span>
                  <span className="font-bold text-stone-900">{successData.user.email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-sans">Staff Password:</span>
                  <span className="font-bold text-[#D97706] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {successData.tempPassword}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-sans">Allotted Courses:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {successData.allottedCourses.length} Course(s) Allotted
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Staff Portal URL:</span>
                  <a
                    href="/staff-login"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-amber-600 underline flex items-center gap-1"
                  >
                    <span>/staff-login</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copy Credentials Slip</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100/50 text-xs font-bold transition-all cursor-pointer"
                >
                  Appoint Another Member
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E8E3DC]">
              <Button
                variant="primary"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Main Creation Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mode 1: Appoint Existing User Selector */}
            {mode === 'EXISTING' && (
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1F1F1F]">
                    Select Registered User / Student to Appoint as Faculty <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-[#6B6258] font-medium">
                    {candidateUsers.length} eligible accounts
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#82684D] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search candidate by name or email..."
                    className="w-full bg-white border border-[#E8E3DC] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#1F1F1F] outline-none"
                  />
                </div>

                <select
                  value={selectedUserId}
                  onChange={(e) => handleSelectExistingUser(e.target.value)}
                  className="w-full bg-white border border-[#E8E3DC] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 rounded-xl p-2.5 text-xs text-[#1F1F1F] font-semibold outline-none cursor-pointer"
                >
                  <option value="">-- Choose a user to promote to Staff --</option>
                  {candidateUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - Current role: {u.role || 'USER'}
                    </option>
                  ))}
                </select>

                {selectedUserId && (
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selected user account found. Their student data and ID will be securely preserved.</span>
                  </p>
                )}
              </div>
            )}

            {/* Row 1: Name & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#6B6258] mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-[#82684D] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Alan Turing / Sarah Jenkins"
                    className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1F1F1F] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6258] mb-1">
                  Designated Role <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-[#82684D] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    readOnly
                    value="STAFF (Faculty & Course Instructor)"
                    className="w-full bg-[#F5F2EB]/60 border border-[#E8E3DC] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1F1F1F] font-bold outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#6B6258] mb-1">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#82684D] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    readOnly={mode === 'EXISTING' && Boolean(selectedUserId)}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="faculty@claxic.edu"
                    className={`w-full border border-[#E8E3DC] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1F1F1F] font-mono outline-none transition-all ${
                      mode === 'EXISTING' && selectedUserId
                        ? 'bg-[#F5F2EB]/60 cursor-not-allowed'
                        : 'bg-[#FAFAF7] focus:bg-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#6B6258]">
                    {mode === 'EXISTING' ? 'Set New Password (Optional)' : 'Permanent Password *'}
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-bold text-[#D97706] hover:text-[#B45309] flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto Generate</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#82684D] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={mode === 'NEW'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'EXISTING' ? 'Leave blank to keep existing password' : 'Minimum 6 characters'}
                    className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 rounded-xl pl-9 pr-8 py-2 text-xs text-[#1F1F1F] font-mono outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Row 3: Department & Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#6B6258] mb-1">
                  Academic Department / Faculty Wing
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-[#82684D] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Dept of Computing & AI"
                    className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1F1F1F] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6258] mb-1">
                  Designation / Academic Title
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-[#82684D] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Lead Instructor / Senior Evaluator"
                    className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1F1F1F] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Mobile & Initial Course Allotments */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6B6258] mb-1 flex items-center justify-between">
                  <span>Faculty Mobile (Optional)</span>
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
                    placeholder="10-digit mobile"
                    className="w-full bg-transparent px-3 py-2 text-xs text-[#1F1F1F] outline-none font-mono placeholder:font-sans placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Course Allotment Checklist */}
              {courses.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#1F1F1F] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Allot Courses Immediately (Optional)</span>
                    </label>
                    <span className="text-[11px] text-[#6B6258]">
                      {selectedCourses.length} selected
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-[#E8E3DC] bg-[#FAFAF7] p-2 space-y-1">
                    {courses.map((course) => {
                      const isChecked = selectedCourses.includes(course.id);
                      return (
                        <label
                          key={course.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all text-xs ${
                            isChecked
                              ? 'bg-amber-500/10 border border-amber-500/30 font-bold text-[#1F1F1F]'
                              : 'hover:bg-white text-[#6B6258]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCourse(course.id)}
                              className="w-3.5 h-3.5 rounded text-[#D97706] focus:ring-[#D97706] accent-[#D97706]"
                            />
                            <span>{course.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#82684D]">
                            {course.category || 'General'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E3DC]">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <button
                type="submit"
                disabled={isLoading || (mode === 'EXISTING' && !name)}
                className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="xs" variant="white" inline />
                    <span>Appointing...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {mode === 'EXISTING' ? 'Promote & Appoint as Staff' : 'Appoint New Staff Member'}
                    </span>
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
