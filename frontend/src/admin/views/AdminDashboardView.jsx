import React, { useState, useEffect, useMemo } from 'react';
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
  LayoutDashboard,
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight,
  Clock,
  ArrowUpRight,
  ShieldAlert,
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
  Legend,
} from 'recharts';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { UserEditModal } from '../modals/UserEditModal.jsx';

const CHART_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

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

  // Compute 100% Real Live Chart Data from Database Entities
  const realChartMetrics = useMemo(() => {
    // 1. Real Revenue Stream (grouped by date)
    const successPayments = payments.filter((p) => p.status === 'SUCCESS');
    const revenueMap = {};

    successPayments.forEach((p) => {
      const dateStr = p.createdAt ? p.createdAt.substring(0, 10) : '2026-08-28';
      revenueMap[dateStr] = (revenueMap[dateStr] || 0) + (p.amount || 0);
    });

    let revenueChartData = Object.entries(revenueMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue,
        amountFormatted: `₹${revenue.toLocaleString('en-IN')}`,
      }));

    if (revenueChartData.length === 0) {
      const totalRev = successPayments.reduce((s, p) => s + (p.amount || 0), 0);
      revenueChartData = [
        { date: 'Initial', revenue: 0, amountFormatted: '₹0' },
        { date: 'Today', revenue: totalRev, amountFormatted: `₹${totalRev.toLocaleString('en-IN')}` },
      ];
    }

    // 2. Real Application Status Breakdown
    const statusMap = {};
    applications.forEach((a) => {
      const st = a.status || 'SUBMITTED';
      statusMap[st] = (statusMap[st] || 0) + 1;
    });

    const statusChartData = Object.entries(statusMap).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
    }));

    // 3. Real Course Capacities & Enrollment Fill Rates
    const courseCapacityData = courses.map((c) => ({
      name: c.title.length > 20 ? c.title.substring(0, 18) + '...' : c.title,
      fullName: c.title,
      enrolled: c.enrolledCount || 0,
      capacity: c.capacity || 40,
      available: Math.max(0, (c.capacity || 40) - (c.enrolledCount || 0)),
      fillRate: Math.round(((c.enrolledCount || 0) / (c.capacity || 40)) * 100),
    }));

    // 4. Real Track Distribution
    const trackMap = {};
    courses.forEach((c) => {
      const cat = c.category || 'General';
      trackMap[cat] = (trackMap[cat] || 0) + (c.enrolledCount || 0);
    });

    const trackChartData = Object.entries(trackMap).map(([category, enrolled]) => ({
      category,
      enrolled,
    }));

    return {
      revenueChartData,
      statusChartData: statusChartData.length > 0 ? statusChartData : [{ name: 'SUBMITTED', value: 1 }],
      courseCapacityData,
      trackChartData,
      totalRealRevenue: successPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      totalSuccessfulTxns: successPayments.length,
    };
  }, [payments, applications, courses]);

  // Update Application Status
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

  // Delete Application
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

  // Delete Course
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

  // Toggle User Status
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

  // Toggle User Role
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

  // Issue Refund
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

  // Export CSV
  const handleExportCSV = () => {
    const token = localStorage.getItem('claxic_token');
    window.open(`/api/admin/applications/export?token=${token}`, '_blank');
  };

  const filteredApplications = applications.filter((a) => {
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchesSearch =
      (a.userName || '').toLowerCase().includes(appSearch.toLowerCase()) ||
      (a.userEmail || '').toLowerCase().includes(appSearch.toLowerCase()) ||
      (a.courseTitle || '').toLowerCase().includes(appSearch.toLowerCase()) ||
      (a.applicationNumber || '').toLowerCase().includes(appSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredUsers = users.filter((u) => {
    const matches =
      (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(userSearch.toLowerCase());
    return matches;
  });

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-purple-100 shadow-[0_10px_25px_-5px_rgba(147,51,234,0.15)] text-xs">
          <p className="font-bold text-slate-900">{label}</p>
          {payload.map((item, idx) => (
            <p key={idx} className="font-semibold" style={{ color: item.color || '#7c3aed' }}>
              {item.name}: {typeof item.value === 'number' && item.name?.toLowerCase().includes('revenue') ? `₹${item.value.toLocaleString('en-IN')}` : item.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-900 font-sans pb-16">
      
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Subtitle */}
            <div className="flex items-center gap-3">
              <img
                src="/logob.png"
                alt="Claxic"
                className="h-7 sm:h-8 w-auto object-contain"
              />
              <span className="hidden sm:inline-block text-[11px] font-bold text-purple-900 bg-purple-100/80 border border-purple-200 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                Admin Console
              </span>
            </div>

            {/* Quick Actions & Live Indicator */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Database Sync</span>
              </div>

              <button
                type="button"
                onClick={fetchAdminData}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Refresh Live Metrics"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => onOpenCourseModal && onOpenCourseModal(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-xs hover:shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-purple-300" />
                <span>New Course</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
            {[
              { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
              { id: 'applications', label: `Applications (${applications.length})`, icon: FileText },
              { id: 'courses', label: `Course Programs (${courses.length})`, icon: BookOpen },
              { id: 'financials', label: `Financials (${payments.length})`, icon: CreditCard },
              { id: 'users', label: `User Directory (${users.length})`, icon: Users },
              { id: 'audit', label: 'Security & Audit Logs', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchAdminData} className="underline hover:text-rose-950 font-bold">
              Retry
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: EXECUTIVE OVERVIEW & REAL LIVE CHARTS */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Real KPI Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              {/* Total Revenue */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Gross Tuition Revenue</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                  ₹{realChartMetrics.totalRealRevenue.toLocaleString('en-IN')}
                </h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{realChartMetrics.totalSuccessfulTxns} Confirmed Payments</span>
                </div>
              </div>

              {/* Total Applications */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Applicant Registrations</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {applications.length}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-semibold text-emerald-700">
                    {applications.filter((a) => a.status === 'CONFIRMED').length} Confirmed
                  </span>
                  <span>•</span>
                  <span>{applications.filter((a) => a.status === 'SUBMITTED').length} In Review</span>
                </div>
              </div>

              {/* Verified Candidates */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Registered Accounts</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {users.length}
                </h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{users.filter((u) => u.isVerified).length} Verified Email Profiles</span>
                </div>
              </div>

              {/* Active Programs & Seats */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Program Offerings</span>
                  <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {courses.length}
                </h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                  <span>
                    {courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0)} / {courses.reduce((sum, c) => sum + (c.capacity || 40), 0)} Total Seats Filled
                  </span>
                </div>
              </div>
            </div>

            {/* REAL LIVE GRAPHS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* 1. Real Revenue Stream Area Chart */}
              <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Live Revenue Growth & Transactions
                    </h3>
                    <p className="text-xs text-slate-500">
                      Real-time cumulative payment settlements directly from student transactions
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
                    Real Settlement Data
                  </span>
                </div>

                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={realChartMetrics.revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Gross Revenue"
                        stroke="#7c3aed"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRev)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. Real Application Status Donut */}
              <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">
                    Application Status Distribution
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Live candidate pipeline breakdown
                  </p>

                  <div className="h-48 sm:h-52 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={realChartMetrics.statusChartData}
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {realChartMetrics.statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  {realChartMetrics.statusChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-700">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      <span className="truncate">{item.name}: <strong className="text-slate-900">{item.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Course Enrollment vs Capacity Bar Chart */}
              <div className="lg:col-span-12 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Course Program Seat Fill Rate vs Capacity
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live seat enrollment progression across active cohort tracks
                    </p>
                  </div>
                </div>

                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={realChartMetrics.courseCapacityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="enrolled" name="Enrolled Seats" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="capacity" name="Max Capacity" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Recent Submissions Quick Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Recent Candidate Submissions
                </h3>
                <button
                  type="button"
                  onClick={() => handleTabChange('applications')}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Applications</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="pb-3">Candidate</th>
                      <th className="pb-3">Program Track</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Applied Date</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applications.slice(0, 5).map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 font-medium text-slate-900">
                          <p className="font-semibold">{app.userName}</p>
                          <p className="text-[11px] text-slate-500">{app.userEmail}</p>
                        </td>
                        <td className="py-3.5 text-slate-700">{app.courseTitle}</td>
                        <td className="py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              app.status === 'CONFIRMED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : app.status === 'SUBMITTED'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : app.status === 'UNDER_REVIEW'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-500">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppDetail(app);
                              setAdminNotesInput(app.adminNotes || '');
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                            title="Inspect Application"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: APPLICATION PIPELINE MANAGER */}
        {/* ========================================================= */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            
            {/* Search & Export Filters Header */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  placeholder="Search by name, email, or course..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 outline-none transition-all"
                />
              </div>

              {/* Status Filter Tabs & CSV Export */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  {['ALL', 'CONFIRMED', 'SUBMITTED', 'UNDER_REVIEW'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        statusFilter === st
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Application #</th>
                      <th className="py-3.5 px-4">Candidate Profile</th>
                      <th className="py-3.5 px-4">Course Program</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Submitted</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          No matching applications found.
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                            {app.applicationNumber || app.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-900">{app.userName}</p>
                            <p className="text-[11px] text-slate-500">{app.userEmail}</p>
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 font-medium">
                            {app.courseTitle}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                app.status === 'CONFIRMED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : app.status === 'SUBMITTED'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : app.status === 'UNDER_REVIEW'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAppDetail(app);
                                setAdminNotesInput(app.adminNotes || '');
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                              title="Review Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteApplication(app.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: COURSE CATALOG MANAGER */}
        {/* ========================================================= */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Course Catalog & Tracks
                </h2>
                <p className="text-xs text-slate-500">
                  Manage syllabus, pricing, cohort capacity, and custom banner imagery
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenCourseModal && onOpenCourseModal(null)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-xs hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-purple-300" />
                <span>Add New Course</span>
              </button>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Course Banner Photo */}
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={c.bannerImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'}
                        alt={c.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-slate-900 shadow-xs">
                          {c.status}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-950/80 backdrop-blur-md text-[11px] font-semibold text-purple-200">
                          {c.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {c.shortDescription}
                      </p>

                      {/* Capacity Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">
                          <span>Seat Enrollment</span>
                          <span>
                            {c.enrolledCount || 0} / {c.capacity || 40} ({Math.round(((c.enrolledCount || 0) / (c.capacity || 40)) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round(((c.enrolledCount || 0) / (c.capacity || 40)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                    <div className="font-mono font-bold text-sm text-slate-900">
                      ₹{(c.price || 0).toLocaleString('en-IN')}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenCourseModal && onOpenCourseModal(c)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit Photo & Info</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(c.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: FINANCIAL SETTLEMENTS & TAX RECEIPTS */}
        {/* ========================================================= */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Financial Transactions & Tax Invoices
                </h2>
                <p className="text-xs text-slate-500">
                  Inspect Razorpay payments, tax breakdown, and GST receipt invoices
                </p>
              </div>

              <div className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                Settled Total: ₹{realChartMetrics.totalRealRevenue.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Receipt / Order</th>
                      <th className="py-3.5 px-4">Candidate</th>
                      <th className="py-3.5 px-4">Course Program</th>
                      <th className="py-3.5 px-4">Gross Amount</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                          {p.receiptNumber || p.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900">{p.userName}</p>
                          <p className="text-[11px] text-slate-500">{p.userEmail}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 font-medium">
                          {p.courseTitle}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          ₹{(p.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              p.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onViewReceipt && onViewReceipt(p.id)}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold transition-colors cursor-pointer"
                          >
                            Tax Receipt
                          </button>

                          {p.status === 'SUCCESS' && (
                            <button
                              type="button"
                              onClick={() => handleIssueRefund(p.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 transition-colors cursor-pointer"
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
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: USER DIRECTORY & ACCESS CONTROL */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user by name, email, or role..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 outline-none transition-all"
                />
              </div>

              <div className="text-xs text-slate-500 font-semibold">
                Showing {filteredUsers.length} registered accounts
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Email Verification</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4 text-right">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleUserRole(u)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                            title="Click to toggle ADMIN/USER role"
                          >
                            {u.role}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.isVerified ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer ${
                              u.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Suspended'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserToEdit(u);
                              setIsUserEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                            title="Edit User Profile"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: AUDIT TRAIL */}
        {/* ========================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Security & Administrative Audit Logs
                </h2>
                <p className="text-xs text-slate-500">
                  Immutable event log recording all course changes, role updates, and admissions actions
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenEmailSandbox}
                className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-purple-600" />
                <span>Email Sandbox Dispatch Logs</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Event #</th>
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-4">Admin Operator</th>
                      <th className="py-3.5 px-4">Target Record</th>
                      <th className="py-3.5 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {log.id}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-purple-700 font-mono">
                          {log.action}
                        </td>
                        <td className="py-3.5 px-4 text-slate-900 font-medium">
                          {log.adminName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <span className="font-semibold text-slate-900">{log.targetType}</span>: {log.targetTitle || log.targetId}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Detail Modal for Selected Application */}
      {selectedAppDetail && (
        <Modal
          isOpen={Boolean(selectedAppDetail)}
          onClose={() => setSelectedAppDetail(null)}
          title={`Application Details: ${selectedAppDetail.applicationNumber || selectedAppDetail.id}`}
          subtitle={selectedAppDetail.courseTitle}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 text-slate-900 text-xs">
            
            {/* Candidate Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Applicant</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedAppDetail.userName}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Email</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedAppDetail.userEmail}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Current Status</p>
                <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px] mt-0.5">
                  {selectedAppDetail.status}
                </span>
              </div>
            </div>

            {/* Form Payload Details */}
            {selectedAppDetail.formData && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Submitted Application Data
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  {Object.entries(selectedAppDetail.formData).map(([k, v]) => (
                    <div key={k}>
                      <span className="font-semibold capitalize text-slate-900">{k.replace(/([A-Z])/g, ' $1')}:</span>{' '}
                      <span>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes & Status Updates */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Administrative Review Notes
              </label>
              <textarea
                rows={2}
                value={adminNotesInput}
                onChange={(e) => setAdminNotesInput(e.target.value)}
                placeholder="Enter evaluation notes or reason for approval/rejection..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl p-3 text-xs text-slate-900 outline-none"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateAppStatus(selectedAppDetail.id, 'APPROVED')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Approve Application
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAppStatus(selectedAppDetail.id, 'CONFIRMED')}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Mark Enrolled
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAppStatus(selectedAppDetail.id, 'REJECTED')}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Reject
                </button>
              </div>

              <Button variant="ghost" onClick={() => setSelectedAppDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* User Edit Modal */}
      {selectedUserToEdit && (
        <UserEditModal
          isOpen={isUserEditModalOpen}
          onClose={() => {
            setIsUserEditModalOpen(false);
            setSelectedUserToEdit(null);
          }}
          userToEdit={selectedUserToEdit}
          onSaved={() => {
            setIsUserEditModalOpen(false);
            setSelectedUserToEdit(null);
            fetchAdminData();
          }}
        />
      )}

    </div>
  );
};
