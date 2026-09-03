import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  FileText,
  CreditCard,
  User as UserIcon,
  Calendar,
  Clock,
  ExternalLink,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Edit,
  Save,
  Bell,
  ArrowRight,
  Camera,
  Upload,
  Trash2,
  Lock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const StudentDashboardView = ({
  initialTab = 'courses',
  onBrowseCourses,
  onViewReceipt,
  onSelectCourse,
}) => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  const [applications, setApplications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Edit Form state
  const fileInputRef = useRef(null);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileMobile, setProfileMobile] = useState(user?.mobile || '');
  const [profileInstitution, setProfileInstitution] = useState(user?.institution || '');
  const [profileDegree, setProfileDegree] = useState(user?.degree || '');
  const [profileYear, setProfileYear] = useState(user?.yearOfStudy || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarData, setAvatarData] = useState(user?.avatar || '');
  const [hasPhotoChanged, setHasPhotoChanged] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveMsg, setProfileSaveMsg] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Synchronize when user auth state updates
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileMobile(user.mobile || '');
      setProfileInstitution(user.institution || '');
      setProfileDegree(user.degree || '');
      setProfileYear(user.yearOfStudy || '');
      setAvatarPreview(user.avatar || '');
      setAvatarData(user.avatar || '');
      setHasPhotoChanged(false);
    }
  }, [user]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const [appRes, payRes] = await Promise.all([
        fetch('/api/user/applications', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/user/payments', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (appRes.ok) {
        const appData = await appRes.json();
        setApplications(appData.applications || []);
      }
      if (payRes.ok) {
        const payData = await payRes.json();
        setPayments(payData.payments || []);
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Client-side image compression and scaling
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Photo file picker handler
  const handlePhotoFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please upload a valid image file (PNG, JPG, or WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image file size exceeds 5MB limit.');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setAvatarPreview(compressedDataUrl);
      setAvatarData(compressedDataUrl);
      setHasPhotoChanged(true);
      setProfileError(null);
    } catch (err) {
      setProfileError('Failed to process image file. Please try another image.');
    }
  };

  // Remove photo handler
  const handleRemovePhoto = () => {
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profileName || user?.name || 'Student')}`;
    setAvatarPreview(defaultAvatar);
    setAvatarData(defaultAvatar);
    setHasPhotoChanged(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save profile and avatar changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveMsg(null);
    setProfileError(null);

    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileName.trim(),
          mobile: profileMobile.trim(),
          institution: profileInstitution.trim(),
          degree: profileDegree.trim(),
          yearOfStudy: profileYear.trim(),
          avatar: avatarData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile changes.');

      updateUser(data.user);
      setHasPhotoChanged(false);
      setProfileSaveMsg('Profile and photo updated successfully!');
      setTimeout(() => setProfileSaveMsg(null), 4000);
    } catch (err) {
      setProfileError(err.message || 'Failed to save profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
    else if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `/dashboard?tab=${tab}`);
  };

  const confirmedApps = applications.filter((a) => a.status === 'CONFIRMED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 font-sans text-slate-900 bg-[#f6fafa] min-h-screen">
      {/* Student Identity Header */}
      <div className="p-8 rounded-[32px] bg-white border border-[#d8ecec] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Header Avatar with Direct Edit Tooltip */}
          <div
            onClick={() => handleTabChange('profile')}
            className="relative group cursor-pointer shrink-0"
            title="Click to edit profile & photo"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name}
              onError={(e) => {
                e.target.src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(user?.name || 'Student');
              }}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#d8ecec] shadow-sm transition-transform duration-150 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[#0B4F50]/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Camera className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{user?.name}</h1>
              {user?.isVerified && (
                <Badge variant="success" size="sm">Verified Account</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{user?.email}</p>
            <p className="text-xs text-slate-600 mt-1 font-normal">
              {user?.institution || 'Institution Unspecified'} • {user?.degree || 'Student Member'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="px-5 py-3 rounded-2xl bg-[#f2f7f7] border border-[#d8ecec] text-center">
            <span className="text-xl font-bold text-[#0B4F50] block">{confirmedApps.length}</span>
            <span className="text-[11px] text-slate-500 font-semibold">Enrolled Cohorts</span>
          </div>
          <div className="px-5 py-3 rounded-2xl bg-[#f2f7f7] border border-[#d8ecec] text-center">
            <span className="text-xl font-bold text-[#0B4F50] block">{payments.length}</span>
            <span className="text-[11px] text-slate-500 font-semibold">Tax Invoices</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#d8ecec] text-xs font-semibold uppercase tracking-wider overflow-x-auto">
        <button
          onClick={() => handleTabChange('courses')}
          className={`pb-4 px-6 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'courses'
              ? 'border-[#0B4F50] text-[#0B4F50]'
              : 'border-transparent text-slate-500 hover:text-[#0B4F50]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Enrolled Cohorts ({confirmedApps.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('applications')}
          className={`pb-4 px-6 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'applications'
              ? 'border-[#0B4F50] text-[#0B4F50]'
              : 'border-transparent text-slate-500 hover:text-[#0B4F50]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Applications ({applications.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('billing')}
          className={`pb-4 px-6 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'billing'
              ? 'border-[#0B4F50] text-[#0B4F50]'
              : 'border-transparent text-slate-500 hover:text-[#0B4F50]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Invoices & Payments ({payments.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('profile')}
          className={`pb-4 px-6 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'border-[#0B4F50] text-[#0B4F50]'
              : 'border-transparent text-slate-500 hover:text-[#0B4F50]'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Student Profile</span>
        </button>
      </div>

      {/* Tab 1: Enrolled Courses */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {confirmedApps.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-[32px] border border-[#d8ecec] space-y-4">
              <Award className="w-12 h-12 text-[#0B4F50]/50 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">No Enrolled Cohorts Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore our accredited engineering masterclasses and bootcamps to get started.
              </p>
              <button
                onClick={onBrowseCourses}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#0B4F50] hover:bg-[#073637] transition-all cursor-pointer"
              >
                Browse Masterclasses
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {confirmedApps.map((app) => (
                <div
                  key={app.id}
                  className="p-6 rounded-[28px] bg-white border border-[#d8ecec] shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#0B4F50] bg-[#eef7f7] px-2.5 py-1 rounded-full font-bold">
                        Confirmed Cohort
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        App #{app.id.slice(0, 8)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {app.courseTitle}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Enrolled on {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => onSelectCourse && onSelectCourse(app.courseId)}
                      className="text-xs font-bold text-[#0B4F50] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Course Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {app.paymentReceiptNumber && (
                      <button
                        onClick={() => onViewReceipt && onViewReceipt(app.paymentReceiptNumber)}
                        className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Receipt #{app.paymentReceiptNumber}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Applications */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          <div className="border border-[#d8ecec] rounded-[28px] overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f2f7f7] font-mono text-[#0B4F50] uppercase text-[11px] border-b border-[#d8ecec]">
                <tr>
                  <th className="p-4">Application ID</th>
                  <th className="p-4">Program</th>
                  <th className="p-4">Applied Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Tuition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-[#f8fbfb] transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">{app.id}</td>
                    <td className="p-4 font-semibold text-slate-900">{app.courseTitle}</td>
                    <td className="p-4 font-mono text-slate-600">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          app.status === 'CONFIRMED'
                            ? 'success'
                            : app.status === 'DRAFT'
                            ? 'neutral'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {app.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-[#0B4F50]">
                      ₹{(app.totalFee || app.courseFee || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Billing & Invoices */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="border border-[#d8ecec] rounded-[28px] overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f2f7f7] font-mono text-[#0B4F50] uppercase text-[11px] border-b border-[#d8ecec]">
                <tr>
                  <th className="p-4">Receipt #</th>
                  <th className="p-4">Course Program</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f8fbfb] transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                    <td className="p-4 font-semibold text-slate-900">{p.courseTitle}</td>
                    <td className="p-4 font-mono text-slate-600">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-slate-600">{p.paymentMethod || 'Razorpay Gateway'}</td>
                    <td className="p-4 text-right font-mono font-bold text-[#0B4F50]">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => onViewReceipt(p.receiptNumber)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0B4F50] bg-[#eef7f7] hover:bg-[#e2f0f0] border border-[#cbe4e4] transition-colors cursor-pointer"
                      >
                        View Tax Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Profile Settings & Photo Upload */}
      {activeTab === 'profile' && (
        <div className="max-w-4xl mx-auto">
          
          {/* Main Profile Info & Photo Form */}
          <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#d8ecec] shadow-xs space-y-6">
            
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display">
                Student Profile Information
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Manage your academic identity and verified profile picture
              </p>
            </div>

            {profileSaveMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSaveMsg}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {/* Profile Photo Upload & Preview Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-5 sm:p-6 rounded-[24px] bg-[#f2f7f7] border border-[#d8ecec]">
              <div className="relative group mx-auto sm:mx-0 shrink-0">
                <img
                  src={avatarPreview || user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={profileName || user?.name || 'Student Profile'}
                  onError={(e) => {
                    e.target.src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(profileName || user?.name || 'Student');
                  }}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-[#d8ecec] transition-all"
                />
                
                {/* Floating Camera / Edit Icon Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload / Change profile photo"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0B4F50] hover:bg-[#073637] active:bg-[#052627] text-white flex items-center justify-center shadow-md border-2 border-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
                  aria-label="Upload profile photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 space-y-2.5 text-center sm:text-left">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Student Profile Photo</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    PNG, JPG, or WEBP (Square format recommended, max 5MB)
                  </p>
                </div>

                {/* Photo Action Buttons */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoFileSelected}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-slate-50 text-[#0B4F50] border border-[#d8ecec] hover:border-[#0B4F50]/40 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{hasPhotoChanged ? 'Change Selection' : 'Upload New Photo'}</span>
                  </button>

                  {(avatarPreview || user?.avatar) && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>

                {hasPhotoChanged && (
                  <div className="text-[11px] text-teal-800 bg-teal-50 border border-teal-200/80 rounded-lg px-2.5 py-1 inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                    <span>Photo preview ready — remember to click <strong>Save Profile Changes</strong> below.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Fields Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 rounded-full px-4 py-2.5 text-sm text-slate-900 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={profileMobile}
                    onChange={(e) => setProfileMobile(e.target.value)}
                    placeholder="Enter mobile number"
                    className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 rounded-full px-4 py-2.5 text-sm text-slate-900 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Year / Status
                  </label>
                  <input
                    type="text"
                    value={profileYear}
                    onChange={(e) => setProfileYear(e.target.value)}
                    placeholder="e.g. 3rd Year, Current"
                    className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 rounded-full px-4 py-2.5 text-sm text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Institution / Org
                  </label>
                  <input
                    type="text"
                    value={profileInstitution}
                    onChange={(e) => setProfileInstitution(e.target.value)}
                    placeholder="e.g. Verified Google Student / College"
                    className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 rounded-full px-4 py-2.5 text-sm text-slate-900 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Degree / Field
                  </label>
                  <input
                    type="text"
                    value={profileDegree}
                    onChange={(e) => setProfileDegree(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 rounded-full px-4 py-2.5 text-sm text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-[#0B4F50] hover:bg-[#073637] active:bg-[#052627] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}
    </div>
  );
};
