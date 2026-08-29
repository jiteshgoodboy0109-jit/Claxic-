import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileMobile, setProfileMobile] = useState(user?.mobile || '');
  const [profileInstitution, setProfileInstitution] = useState(user?.institution || '');
  const [profileDegree, setProfileDegree] = useState(user?.degree || '');
  const [profileYear, setProfileYear] = useState(user?.yearOfStudy || '');
  const [profileSaveMsg, setProfileSaveMsg] = useState(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password.');
      setPasswordSuccess(data.message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileName,
          mobile: profileMobile,
          institution: profileInstitution,
          degree: profileDegree,
          yearOfStudy: profileYear,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        updateUser(data.user);
        setIsEditingProfile(false);
        setProfileSaveMsg('Profile updated successfully.');
        setTimeout(() => setProfileSaveMsg(null), 4000);
      }
    } catch (e) {
      console.error(e);
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
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={user?.name}
            onError={(e) => {
              e.target.src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(user?.name || 'Student');
            }}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#d8ecec] shadow-sm"
          />
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
          onClick={() => handleTabChange('payments')}
          className={`pb-4 px-6 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'payments'
              ? 'border-[#0B4F50] text-[#0B4F50]'
              : 'border-transparent text-slate-500 hover:text-[#0B4F50]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Receipts ({payments.length})</span>
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
          <span>Account Profile</span>
        </button>
      </div>

      {/* Tab 1: Enrolled Cohorts */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {confirmedApps.length === 0 ? (
            <div className="py-16 text-center bg-white border border-[#d8ecec] rounded-[32px] space-y-4 shadow-xs">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">No Confirmed Enrollments Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
                Explore our accredited engineering programs and register to secure your seat.
              </p>
              <button
                onClick={onBrowseCourses}
                className="px-6 py-2.5 bg-[#0B4F50] text-white rounded-full font-bold text-xs shadow-xs hover:bg-[#073637] cursor-pointer"
              >
                Browse Course Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {confirmedApps.map((app) => (
                <div
                  key={app.id}
                  className="p-6 rounded-[28px] bg-white border border-[#d8ecec] shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="gold">ENROLLED</Badge>
                      <span className="text-[11px] font-mono text-slate-500 font-semibold">
                        App #{app.applicationNumber}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {app.courseTitle}
                    </h3>
                  </div>

                  <div className="pt-4 border-t border-[#f2f7f7] flex items-center justify-between">
                    <div className="text-xs text-slate-600">
                      Fee Paid: <strong className="text-[#0B4F50]">₹{app.coursePrice.toLocaleString('en-IN')}</strong>
                    </div>
                    <button
                      onClick={() => onViewReceipt(app.id)}
                      className="px-4 py-1.5 rounded-full text-xs font-bold text-[#0B4F50] bg-[#eef7f7] hover:bg-[#e2f0f0] border border-[#cbe4e4] transition-colors cursor-pointer"
                    >
                      View Receipt
                    </button>
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
                  <th className="p-4">Application #</th>
                  <th className="p-4">Course Program</th>
                  <th className="p-4">Submitted On</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {applications.map((a) => (
                  <tr key={a.id} className="hover:bg-[#f8fbfb] transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">{a.applicationNumber}</td>
                    <td className="p-4 font-semibold text-slate-900">{a.courseTitle}</td>
                    <td className="p-4 font-mono text-slate-600">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          a.status === 'CONFIRMED'
                            ? 'success'
                            : a.status === 'PAYMENT_PENDING' || a.status === 'SUBMITTED'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {a.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-[#0B4F50]">
                      ₹{a.coursePrice.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Payments */}
      {activeTab === 'payments' && (
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

      {/* Tab 4: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl p-8 rounded-[32px] bg-white border border-[#d8ecec] shadow-xs space-y-6">
          {profileSaveMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSaveMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                Full Legal Name
              </label>
              <input
                type="text"
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
                  className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 rounded-full px-4 py-2.5 text-sm text-slate-900 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0B4F50] hover:bg-[#073637] text-white font-bold text-xs rounded-full shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
