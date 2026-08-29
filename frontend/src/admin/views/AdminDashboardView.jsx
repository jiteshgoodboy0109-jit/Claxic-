import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  DollarSign,
  FileText,
  Plus,
  Download,
  Mail,
  ShieldCheck,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Receipt,
  RotateCcw,
  KeyRound,
  CreditCard,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { UserEditModal } from '../modals/UserEditModal.jsx';

const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6'];

export const AdminDashboardView = ({
  initialTab = 'overview',
  onOpenCourseModal,
  onOpenEmailSandbox,
  onViewReceipt,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const [overviewData, setOverviewData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [appSearch, setAppSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Modals state
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState(null);

  const [selectedAppDetail, setSelectedAppDetail] = useState(null);
  const [adminNotesInput, setAdminNotesInput] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
    else if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `/admin?tab=${tab}`);
  };

  const fetchAdminData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('claxic_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [ovRes, crsRes, appRes, usrRes, auditRes, payRes] = await Promise.all([
        fetch('/api/admin/overview', { headers }),
        fetch('/api/admin/courses', { headers }),
        fetch('/api/admin/applications', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/audit-logs', { headers }),
        fetch('/api/admin/payments', { headers }),
      ]);

      if (ovRes.ok) setOverviewData(await ovRes.json());
      if (crsRes.ok) setCourses((await crsRes.json()).courses || []);
      if (appRes.ok) setApplications((await appRes.json()).applications || []);
      if (usrRes.ok) setUsers((await usrRes.json()).users || []);
      if (auditRes.ok) setAuditLogs((await auditRes.json()).auditLogs || []);
      if (payRes.ok) setPayments((await payRes.json()).payments || []);
    } catch (err) {
      setError('Failed loading administrator metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateAppStatus = async (appId, newStatus, customNotes) => {
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/admin/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: customNotes !== undefined ? customNotes : adminNotesInput,
        }),
      });

      if (res.ok) {
        fetchAdminData();
        if (selectedAppDetail && selectedAppDetail.id === appId) {
          setSelectedAppDetail((prev) => ({
            ...prev,
            status: newStatus,
            adminNotes: customNotes !== undefined ? customNotes : adminNotesInput,
          }));
        }
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (!window.confirm('Are you sure you want to permanently remove this application record?')) return;
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/admin/applications/${appId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAdminData();
        if (selectedAppDetail?.id === appId) setSelectedAppDetail(null);
      }
    } catch (e) {
      console.error('Failed to delete application:', e);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course program?')) return;
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error('Failed to toggle user status:', e);
    }
  };

  const handleToggleUserRole = async (user) => {
    try {
      const token = localStorage.getItem('claxic_token');
      const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error('Failed to toggle user role:', e);
    }
  };

  const handleIssueRefund = async (paymentId) => {
    const reason = prompt('Please enter the reason for issuing this refund:', 'Student request / cohort cancellation');
    if (!reason) return;

    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/admin/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        alert('Refund processed successfully. Student notification dispatched.');
        fetchAdminData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to process refund.');
      }
    } catch (e) {
      console.error('Refund processing error:', e);
    }
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('claxic_token');
    window.open(`/api/admin/applications/export?token=${token}`, '_blank');
  };

  const filteredApplications = applications.filter((a) => {
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchesSearch =
      a.userName.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.userEmail.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.applicationNumber.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.courseTitle.toLowerCase().includes(appSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.institution && u.institution.toLowerCase().includes(q)) ||
      (u.mobile && u.mobile.includes(q))
    );
  });

  // Financial Summary
  const totalGrossRevenue = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = payments
    .filter((p) => p.status === 'REFUNDED')
    .reduce((sum, p) => sum + (p.refundedAmount || p.amount), 0);

  const totalGstAmount = Math.round(totalGrossRevenue * (18 / 118));
  const netEducationRevenue = totalGrossRevenue - totalGstAmount;

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 font-sans text-slate-900 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="gold">EXECUTIVE ADMINISTRATOR CONSOLE</Badge>
            <span className="text-xs font-mono text-slate-500 font-semibold">Security v2.6</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-display uppercase tracking-tight mt-2">
            Executive Command Center
          </h1>
          <p className="text-xs text-slate-600 font-normal mt-1">
            Real-time enrollment analytics, course program catalog, student registry, email sandbox, and financial ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenEmailSandbox}
            leftIcon={<Mail className="w-4 h-4 text-indigo-600" />}
          >
            Email Sandbox
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenCourseModal(null)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Program
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 font-mono text-xs uppercase tracking-wider overflow-x-auto">
        <button
          onClick={() => handleTabChange('overview')}
          className={`pb-4 px-6 border-b-2 font-bold transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Analytics & Overview
        </button>

        <button
          onClick={() => handleTabChange('courses')}
          className={`pb-4 px-6 border-b-2 font-bold transition-colors whitespace-nowrap ${
            activeTab === 'courses'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Course Manager ({courses.length})
        </button>

        <button
          onClick={() => handleTabChange('applications')}
          className={`pb-4 px-6 border-b-2 font-bold transition-colors whitespace-nowrap ${
            activeTab === 'applications'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Student Applicants ({applications.length})
        </button>

        <button
          onClick={() => handleTabChange('users')}
          className={`pb-4 px-6 border-b-2 font-bold transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          User Registry ({users.length})
        </button>

        <button
          onClick={() => handleTabChange('payments')}
          className={`pb-4 px-6 border-b-2 font-bold transition-colors whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Financial Ledger ({payments.length})
        </button>
      </div>

      {/* Tab 1: Overview Analytics */}
      {activeTab === 'overview' && overviewData && (
        <div className="space-y-10">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-mono text-slate-500 uppercase font-semibold">Registered Candidates</span>
              <div className="text-3xl font-extrabold font-mono text-slate-900">
                {overviewData.totalUsers}
              </div>
              <span className="text-[10px] font-mono text-slate-500 block">
                {users.filter((u) => u.role === 'ADMIN').length} Admins • {users.filter((u) => u.role !== 'ADMIN').length} Students
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-mono text-slate-500 uppercase font-semibold">Total Applications</span>
              <div className="text-3xl font-extrabold font-mono text-slate-900">
                {overviewData.totalApplications}
              </div>
              <span className="text-[10px] font-mono text-slate-500 block">
                {overviewData.confirmedApplications} Confirmed • {overviewData.pendingApplications} Pending
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-mono text-slate-500 uppercase font-semibold">Active Programs</span>
              <div className="text-3xl font-extrabold font-mono text-slate-900">
                {overviewData.totalCourses}
              </div>
              <span className="text-[10px] font-mono text-slate-500 block">
                Across {overviewData.categoryDistribution?.length || 6} specialization tracks
              </span>
            </div>
          </div>

          {/* Revenue & Category Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-display uppercase">
                Revenue Growth Trend (INR)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overviewData.registrationsOverTime || []}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#4F46E5" fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-display uppercase">
                Category Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overviewData.categoryDistribution || []}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {(overviewData.categoryDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Course Manager */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 font-display uppercase">Course Catalog Administration</h2>
            <Button variant="primary" size="sm" onClick={() => onOpenCourseModal(null)} leftIcon={<Plus className="w-4 h-4" />}>
              Create New Program
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <div key={c.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="gold">{c.category}</Badge>
                    <Badge variant={c.status === 'PUBLISHED' ? 'success' : 'danger'}>{c.status}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-display uppercase">{c.title}</h3>
                  <p className="text-xs text-slate-600 font-mono">
                    Enrolled: {c.enrolledCount} / {c.capacity} Seats
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2">{c.shortDescription}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-slate-900">₹{c.price.toLocaleString('en-IN')}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onOpenCourseModal(c)} leftIcon={<Edit className="w-3.5 h-3.5" />}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteCourse(c.id)} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Student Applicants */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search applicant name, email, or app #..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 w-64"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-mono"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PAYMENT_PENDING">PAYMENT_PENDING</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<Download className="w-4 h-4" />}>
              Export Applicants CSV
            </Button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-mono text-slate-600 uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-4">App #</th>
                  <th className="p-4">Applicant Name</th>
                  <th className="p-4">Email / Mobile</th>
                  <th className="p-4">Course Program</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredApplications.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">{a.applicationNumber}</td>
                    <td className="p-4 font-semibold text-slate-900">{a.userName}</td>
                    <td className="p-4 text-slate-600">
                      <div>{a.userEmail}</div>
                      <div className="text-[10px] font-mono text-slate-500">{a.userMobile || a.formData?.mobile}</div>
                    </td>
                    <td className="p-4 font-medium">{a.courseTitle}</td>
                    <td className="p-4 font-mono font-bold text-slate-900">₹{a.coursePrice?.toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <Badge variant={a.status === 'CONFIRMED' ? 'success' : a.status === 'REJECTED' ? 'danger' : 'warning'}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedAppDetail(a);
                          setAdminNotesInput(a.adminNotes || '');
                        }}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-mono hover:bg-indigo-100 font-semibold"
                      >
                        Inspect
                      </button>
                      {a.status !== 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateAppStatus(a.id, 'CONFIRMED')}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-[11px] font-mono hover:bg-emerald-100 font-semibold"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteApplication(a.id)}
                        className="px-2 py-1 text-rose-600 hover:text-rose-800 rounded-lg text-[11px] font-mono"
                        title="Delete Application Record"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: User Registry */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <input
              type="text"
              placeholder="Search user name, email, or institution..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 w-80"
            />
            <span className="text-xs font-mono text-slate-500">
              Showing {filteredUsers.length} registered accounts
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-mono text-slate-600 uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Institution / Degree</th>
                  <th className="p-4">Enrolled Cohorts</th>
                  <th className="p-4 text-right">Total Spent</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-900 flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-xl object-cover border border-slate-200" />
                      <div>
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{u.email}</div>
                      </div>
                    </td>
                    <td className="p-4 font-mono">
                      <Badge variant={u.role === 'ADMIN' ? 'gold' : 'default'}>{u.role}</Badge>
                    </td>
                    <td className="p-4 font-mono">
                      <Badge variant={u.isActive !== false ? 'success' : 'error'}>
                        {u.isActive !== false ? 'ACTIVE' : 'DEACTIVATED'}
                      </Badge>
                    </td>
                    <td className="p-4 text-slate-600">{u.institution || 'N/A'} • {u.degree || 'N/A'}</td>
                    <td className="p-4 font-mono font-semibold">{u.enrolledCount} Cohorts</td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-600">₹{u.totalSpent?.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserToEdit(u);
                          setIsUserEditModalOpen(true);
                        }}
                        leftIcon={<Edit className="w-3 h-3" />}
                      >
                        Edit
                      </Button>
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`px-2.5 py-1 border rounded-lg text-[11px] font-mono font-semibold transition-colors ${
                          u.isActive !== false
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {u.isActive !== false ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Financial Ledger & Amount Details */}
      {activeTab === 'payments' && (
        <div className="space-y-8">
          {/* Amount Overview Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-mono text-slate-500 uppercase font-semibold">Gross Tax Invoiced</span>
              <div className="text-3xl font-extrabold font-mono text-slate-900">
                ₹{totalGrossRevenue.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] font-mono text-slate-500 block">Total fees collected</span>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-mono text-slate-500 uppercase font-semibold">Net Educational Revenue</span>
              <div className="text-3xl font-extrabold font-mono text-emerald-600">
                ₹{netEducationRevenue.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] font-mono text-slate-500 block">Excluding statutory GST</span>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-mono text-slate-500 uppercase font-semibold">GST Component (18%)</span>
              <div className="text-3xl font-extrabold font-mono text-amber-600">
                ₹{totalGstAmount.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] font-mono text-slate-500 block">CGST 9% + SGST 9%</span>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-mono text-slate-500 uppercase font-semibold">Total Refunds Issued</span>
              <div className="text-3xl font-extrabold font-mono text-rose-600">
                ₹{totalRefunded.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] font-mono text-slate-500 block">Disbursed to students</span>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-mono text-slate-600 uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-4">Receipt #</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Program</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4 font-mono text-right">Gross Fee</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-700">{p.receiptNumber}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{p.userName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{p.userEmail}</div>
                    </td>
                    <td className="p-4 font-medium">{p.courseTitle}</td>
                    <td className="p-4 font-mono uppercase text-[11px]">{p.method || 'RAZORPAY_UPI'}</td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">₹{p.amount.toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <Badge variant={p.status === 'SUCCESS' ? 'success' : p.status === 'REFUNDED' ? 'error' : 'warning'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => onViewReceipt(p.receiptNumber || p.id)}
                        className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-[11px] font-mono hover:bg-slate-200 font-semibold inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3 h-3 text-indigo-600" />
                        Invoice
                      </button>
                      {p.status === 'SUCCESS' && (
                        <button
                          onClick={() => handleIssueRefund(p.id)}
                          className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-mono hover:bg-rose-100 font-semibold"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {selectedUserToEdit && (
        <UserEditModal
          isOpen={isUserEditModalOpen}
          onClose={() => {
            setIsUserEditModalOpen(false);
            setSelectedUserToEdit(null);
          }}
          user={selectedUserToEdit}
          onSaved={fetchAdminData}
        />
      )}

      {/* Application Inspection Modal */}
      {selectedAppDetail && (
        <Modal
          isOpen={Boolean(selectedAppDetail)}
          onClose={() => setSelectedAppDetail(null)}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 font-sans">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                  Application Inspector
                </span>
                <h2 className="text-xl font-bold text-slate-900 font-display uppercase tracking-tight mt-1">
                  #{selectedAppDetail.applicationNumber} — {selectedAppDetail.userName}
                </h2>
              </div>
              <Badge variant={selectedAppDetail.status === 'CONFIRMED' ? 'success' : 'warning'}>
                {selectedAppDetail.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-mono text-slate-500 uppercase font-semibold">Course Program</span>
                <p className="font-bold text-slate-900 text-sm">{selectedAppDetail.courseTitle}</p>
                <p className="font-mono text-slate-600">Fee: ₹{selectedAppDetail.coursePrice?.toLocaleString('en-IN')}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-mono text-slate-500 uppercase font-semibold">Contact & Batch</span>
                <p className="font-semibold text-slate-900">{selectedAppDetail.userEmail}</p>
                <p className="font-mono text-slate-600">{selectedAppDetail.userMobile || selectedAppDetail.formData?.mobile}</p>
                <p className="text-slate-500">Batch: {selectedAppDetail.formData?.batch || 'Weekend Evening'}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-mono text-slate-500 uppercase font-semibold">Academic Background</span>
              <p className="text-slate-800">
                <strong className="text-slate-900">Institution:</strong> {selectedAppDetail.formData?.institution || 'N/A'}
              </p>
              <p className="text-slate-800">
                <strong className="text-slate-900">Degree & Year:</strong> {selectedAppDetail.formData?.degree || 'N/A'} ({selectedAppDetail.formData?.yearOfStudy || 'N/A'})
              </p>
            </div>

            {selectedAppDetail.formData?.sop && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-mono text-slate-500 uppercase font-semibold">Statement of Purpose (SOP)</span>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedAppDetail.formData.sop}</p>
              </div>
            )}

            {/* Admin Notes & Status Update */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold">
                Admin Review Notes
              </label>
              <textarea
                rows={2}
                value={adminNotesInput}
                onChange={(e) => setAdminNotesInput(e.target.value)}
                placeholder="Add verification comments or internal reviewer notes..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateAppStatus(selectedAppDetail.id, 'CONFIRMED', adminNotesInput)}
                  >
                    Confirm & Enroll
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateAppStatus(selectedAppDetail.id, 'UNDER_REVIEW', adminNotesInput)}
                  >
                    Mark Under Review
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleUpdateAppStatus(selectedAppDetail.id, 'REJECTED', adminNotesInput)}
                  >
                    Reject Application
                  </Button>
                </div>

                <Button variant="outline" size="sm" onClick={() => setSelectedAppDetail(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
