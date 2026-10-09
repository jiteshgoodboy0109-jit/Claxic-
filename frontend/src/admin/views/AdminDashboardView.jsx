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
  Menu,
  X,
  Layers,
  ExternalLink,
  LogOut,
  Home,
  Bell,
  ChevronDown,
  Check,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
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
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { NotificationBell } from '../../components/notifications/NotificationBell.jsx';
import { UserEditModal } from '../modals/UserEditModal.jsx';
import { AppointStaffModal } from '../modals/AppointStaffModal.jsx';
import { ManageAllotmentsModal } from '../modals/ManageAllotmentsModal.jsx';
import { ChangeStaffCredentialsModal } from '../modals/ChangeStaffCredentialsModal.jsx';
import {
  exportApplicationsPDF,
  exportApplicationDossierPDF,
  exportUsersPDF,
  exportCoursesPDF,
  exportFinancialsPDF,
  exportExecutiveOverviewPDF,
  exportAuditLogsPDF,
} from '../../utils/adminPdfGenerator.js';

const CHART_COLORS = ['#ea580c', '#f97316', '#fb923c', '#d97706', '#f59e0b', '#b45309'];

export const AdminDashboardView = ({
  initialTab = 'overview',
  onOpenCourseModal,
  onOpenEmailSandbox,
  onViewReceipt,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const [overviewData, setOverviewData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [allotmentsList, setAllotmentsList] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [appSearch, setAppSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [allotmentSearch, setAllotmentSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  // Modals state
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [isAppointStaffModalOpen, setIsAppointStaffModalOpen] = useState(false);
  const [isManageAllotmentsModalOpen, setIsManageAllotmentsModalOpen] = useState(false);
  const [selectedStaffForAllotment, setSelectedStaffForAllotment] = useState(null);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [selectedStaffForCredentials, setSelectedStaffForCredentials] = useState(null);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState(null);
  const [activeUserMenuId, setActiveUserMenuId] = useState(null);

  const [selectedAppDetail, setSelectedAppDetail] = useState(null);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [isUpdatingAppStatus, setIsUpdatingAppStatus] = useState(false);
  const [statusToast, setStatusToast] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [overviewChartTab, setOverviewChartTab] = useState('yearly');
  const [selectedYearFilter, setSelectedYearFilter] = useState('CURRENT');

  const { user, logout } = useAuth();

  // Close active dropdowns on window click
  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveUserMenuId(null);
    };
    window.addEventListener('click', handleDocumentClick);
    return () => window.removeEventListener('click', handleDocumentClick);
  }, []);

  const navSections = [
    {
      title: 'Analytics & Core',
      items: [
        { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
        { id: 'applications', label: 'Applications', icon: FileText, count: applications.length },
        { id: 'courses', label: 'Course Catalog', icon: BookOpen, count: courses.length },
      ],
    },
    {
      title: 'Operations & People',
      items: [
        { id: 'staff', label: 'Faculty Directorate', icon: ShieldCheck, count: staffList.length },
        { id: 'allotments', label: 'Course Allotments', icon: Layers, count: allotmentsList.length },
        { id: 'financials', label: 'Financial Settlements', icon: CreditCard, count: payments.filter((p) => p.status === 'SUCCESS').length },
        { id: 'users', label: 'Account Directory', icon: Users, count: users.filter((u) => u.role === 'USER').length },
      ],
    },
    {
      title: 'System Directorate',
      items: [
        { id: 'audit', label: 'Audit Security Trail', icon: ShieldAlert },
      ],
    },
  ];

  const allNavItems = navSections.flatMap((s) => s.items);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
    setIsSidebarCollapsed(true);
    const semanticTab = tab === 'financials' ? 'payments' : tab;
    if (onNavigate) {
      onNavigate(`admin/${semanticTab}`);
    } else {
      window.history.pushState(null, '', `/admin/${semanticTab}`);
    }
  };

  const fetchAdminData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('claxic_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [ovRes, crsRes, appRes, usrRes, auditRes, payRes, stfRes, allotRes] = await Promise.all([
        fetch('/api/admin/overview', { headers }),
        fetch('/api/admin/courses', { headers }),
        fetch('/api/admin/applications', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/audit-logs', { headers }),
        fetch('/api/admin/payments', { headers }),
        fetch('/api/admin/staff', { headers }),
        fetch('/api/admin/allotments', { headers }),
      ]);

      if (ovRes.status === 401 || crsRes.status === 401 || appRes.status === 401 || usrRes.status === 401) {
        if (logout) logout();
        if (onNavigate) onNavigate('admin-login');
        return;
      }

      if (ovRes.status === 403 || usrRes.status === 403) {
        setError('Access forbidden: Administrator privileges required.');
        return;
      }

      if (ovRes.ok) setOverviewData(await ovRes.json());
      if (crsRes.ok) setCourses((await crsRes.json()).courses || []);
      if (appRes.ok) setApplications((await appRes.json()).applications || []);
      if (usrRes.ok) setUsers((await usrRes.json()).users || []);
      if (auditRes.ok) setAuditLogs((await auditRes.json()).auditLogs || []);
      if (payRes.ok) setPayments((await payRes.json()).payments || []);
      if (stfRes?.ok) setStaffList((await stfRes.json()).staff || []);
      if (allotRes?.ok) setAllotmentsList((await allotRes.json()).allotments || []);
    } catch (err) {
      setError('Failed loading administrator metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();

    const handleDataUpdated = () => {
      fetchAdminData();
    };

    window.addEventListener('claxic_course_updated', handleDataUpdated);
    window.addEventListener('claxic_user_updated', handleDataUpdated);
    return () => {
      window.removeEventListener('claxic_course_updated', handleDataUpdated);
      window.removeEventListener('claxic_user_updated', handleDataUpdated);
    };
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
    const courseCapacityData = courses.map((c) => {
      const courseApps = applications.filter(
        (a) => a.courseId === c.id || (a.courseTitle && a.courseTitle.toLowerCase() === c.title.toLowerCase())
      ).length;
      return {
        name: c.title.length > 18 ? c.title.substring(0, 16) + '...' : c.title,
        fullName: c.title,
        capacity: c.capacity || 40,
        applications: Math.max(courseApps, c.enrolledCount || 0),
        enrolled: c.enrolledCount || 0,
        available: Math.max(0, (c.capacity || 40) - (c.enrolledCount || 0)),
        fillRate: Math.round(((c.enrolledCount || 0) / (c.capacity || 40)) * 100),
      };
    });

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

    // 5. Dynamic 12-Month Cohort Growth Analysis (Past Year vs YTD Current Year)
    const now = new Date();
    const currentYear = now.getFullYear();
    const pastYear = currentYear - 1;
    const currentMonthIdx = now.getMonth(); // 0 = Jan, 8 = Sep

    const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthFull = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Compute monthly candle metrics directly from real applications in state
    const computeMonthlyCandles = (targetYear, maxMonth) => {
      return Array.from({ length: maxMonth + 1 }, (_, m) => {
        const monthApps = applications.filter((a) => {
          if (!a.createdAt) return false;
          const d = new Date(a.createdAt);
          return d.getFullYear() === targetYear && d.getMonth() === m;
        });

        const applied = monthApps.length;
        const admitted = monthApps.filter(
          (a) => a.status === 'CONFIRMED' || a.status === 'APPROVED'
        ).length;
        const enrolled = monthApps.filter((a) => a.status === 'CONFIRMED').length;

        return {
          month: monthShort[m],
          fullMonth: monthFull[m],
          year: targetYear,
          applied,
          admitted,
          enrolled,
          acceptanceRate: applied > 0 ? Math.round((admitted / applied) * 100) : 0,
          enrollmentRate: admitted > 0 ? Math.round((enrolled / admitted) * 100) : 0,
        };
      });
    };

    // Past Year: complete 12 months (January through December)
    const pastYearMonthlyData = overviewData?.monthlyCohortGrowth?.pastYearData?.length === 12
      ? overviewData.monthlyCohortGrowth.pastYearData
      : computeMonthlyCandles(pastYear, 11);

    // Current Year: strictly up to current month (no future months!)
    const currentYearMonthlyData = overviewData?.monthlyCohortGrowth?.currentYearData?.length === (currentMonthIdx + 1)
      ? overviewData.monthlyCohortGrowth.currentYearData
      : computeMonthlyCandles(currentYear, currentMonthIdx);

    return {
      revenueChartData,
      statusChartData: statusChartData.length > 0 ? statusChartData : [{ name: 'SUBMITTED', value: 1 }],
      courseCapacityData,
      trackChartData,
      currentYear,
      pastYear,
      currentMonthIdx,
      monthShort,
      monthFull,
      pastYearMonthlyData,
      currentYearMonthlyData,
      totalRealRevenue: successPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      totalSuccessfulTxns: successPayments.length,
    };
  }, [payments, applications, courses, overviewData]);

  // Update Application Status
  const handleUpdateAppStatus = async (appId, newStatus, customNotes) => {
    setIsUpdatingAppStatus(true);
    setStatusToast(null);
    try {
      const token = localStorage.getItem('claxic_token');
      const notesToSend = customNotes !== undefined ? customNotes : adminNotesInput;
      const res = await fetch(`/api/admin/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: notesToSend,
          reviewNotes: notesToSend,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Immediately reflect in UI applications list
        setApplications((prev) =>
          prev.map((a) =>
            a.id === appId
              ? { ...a, status: newStatus, adminNotes: notesToSend, reviewNotes: notesToSend }
              : a
          )
        );
        if (selectedAppDetail && selectedAppDetail.id === appId) {
          setSelectedAppDetail((prev) => ({
            ...prev,
            status: newStatus,
            adminNotes: notesToSend,
            reviewNotes: notesToSend,
          }));
        }
        setStatusToast({
          type: 'success',
          message: `Application marked as ${newStatus} successfully!`,
        });
        setTimeout(() => setStatusToast(null), 3500);
        fetchAdminData();
      } else {
        alert(data.error || 'Failed to update application status.');
      }
    } catch (e) {
      console.error('Failed to update status:', e);
      alert('Network error while updating application status.');
    } finally {
      setIsUpdatingAppStatus(false);
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
      if (res.ok) {
        fetchAdminData();
        window.dispatchEvent(new CustomEvent('claxic_course_updated'));
      }
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
      if (res.ok) {
        fetchAdminData();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to toggle user status.');
      }
    } catch (e) {
      console.error('Failed to toggle user status:', e);
    }
  };

  // Set specific user role
  const handleSetUserRole = async (targetUser, newRole) => {
    setActiveUserMenuId(null);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/admin/users/${targetUser.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        fetchAdminData();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to set user role.');
      }
    } catch (e) {
      console.error('Failed to set user role:', e);
    }
  };

  // Toggle user email verification status
  const handleToggleUserVerification = async (targetUser) => {
    setActiveUserMenuId(null);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/admin/users/${targetUser.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isVerified: !targetUser.isVerified }),
      });
      if (res.ok) {
        fetchAdminData();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to toggle verification.');
      }
    } catch (e) {
      console.error('Failed to toggle verification:', e);
    }
  };

  // Delete User Account
  const handleDeleteUser = async (targetUser) => {
    setActiveUserMenuId(null);
    if (!targetUser || !targetUser.id) return;
    if (user?.id === targetUser.id) {
      alert('You cannot delete your own active administrator account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user "${targetUser.name}" (${targetUser.email})? This action cannot be undone.`)) {
      return;
    }
    try {
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user.');
        fetchAdminData();
      }
    } catch (e) {
      console.error('Failed to delete user:', e);
      fetchAdminData();
    }
  };

  // Toggle Staff status (active / suspended)
  const handleToggleStaffStatus = async (staffMember) => {
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/admin/staff/${staffMember.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !staffMember.isActive }),
      });
      if (res.ok) {
        fetchAdminData();
        setStatusToast(`Staff member status changed to ${!staffMember.isActive ? 'Active' : 'Suspended'}`);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to update staff status.');
      }
    } catch (e) {
      console.error('Failed to toggle staff status:', e);
    }
  };

  // Revoke Staff Member (sever allotments and delete account)
  const handleRevokeStaff = async (staffMember) => {
    if (!window.confirm(`Are you sure you want to revoke staff privileges for "${staffMember.name}" (${staffMember.email})? All course allotments will be severed.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/admin/staff/${staffMember.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        fetchAdminData();
        setStatusToast(`Revoked staff appointment for ${staffMember.name}`);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to revoke staff access.');
      }
    } catch (e) {
      console.error('Failed to revoke staff:', e);
    }
  };

  const handleOpenAllotmentsForStaff = (staffMember) => {
    setSelectedStaffForAllotment(staffMember);
    setIsManageAllotmentsModalOpen(true);
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
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'APPROVED'
        ? a.status === 'APPROVED' || a.status === 'CONFIRMED'
        : a.status === statusFilter);
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

  // Dynamic Year Filtered Monthly Data for Recharts
  const displayedMonthlyData = useMemo(() => {
    if (selectedYearFilter === 'PAST') {
      return realChartMetrics.pastYearMonthlyData || [];
    }
    return realChartMetrics.currentYearMonthlyData || [];
  }, [realChartMetrics.pastYearMonthlyData, realChartMetrics.currentYearMonthlyData, selectedYearFilter]);

  // Selected Year Summary Statistics
  const selectedYearSummary = useMemo(() => {
    const isPast = selectedYearFilter === 'PAST';
    const data = isPast ? (realChartMetrics.pastYearMonthlyData || []) : (realChartMetrics.currentYearMonthlyData || []);
    const year = isPast ? realChartMetrics.pastYear : realChartMetrics.currentYear;
    const totalApplied = data.reduce((sum, d) => sum + (d.applied || 0), 0);
    const totalAdmitted = data.reduce((sum, d) => sum + (d.admitted || 0), 0);
    const totalEnrolled = data.reduce((sum, d) => sum + (d.enrolled || 0), 0);
    const label = isPast
      ? '12 Months (Complete Year)'
      : `Jan – ${realChartMetrics.monthShort[realChartMetrics.currentMonthIdx]} (YTD Live)`;

    return {
      year,
      isPast,
      totalApplied,
      totalAdmitted,
      totalEnrolled,
      label,
    };
  }, [realChartMetrics, selectedYearFilter]);

  // Custom Clean Tooltip for Recharts
  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const itemData = payload[0]?.payload;
      const isMonthlyChart = Boolean(itemData?.fullMonth);
      const title = isMonthlyChart
        ? `${itemData.fullMonth} ${itemData.year}`
        : (itemData?.fullName || label);

      return (
        <div className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-xl p-3.5 shadow-lg text-xs space-y-2 z-50 min-w-[210px]">
          <div className="border-b border-[#EEEAE4] pb-1.5 flex items-center justify-between">
            <span className="font-bold text-[#1F1F1F] font-display text-xs">
              {title}
            </span>
            {isMonthlyChart && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FAFAF7] text-[#82684D] border border-[#E8E3DC]">
                Monthly Cohort
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {payload.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-[#6B6258]">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color || item.fill || '#F59E0B' }}
                  />
                  <span className="font-medium">{item.name}</span>
                </span>
                <span className="font-mono font-bold text-[#1F1F1F]">
                  {typeof item.value === 'number'
                    ? item.value.toLocaleString('en-IN')
                    : item.value}
                </span>
              </div>
            ))}

            {isMonthlyChart && itemData?.acceptanceRate !== undefined && (
              <div className="pt-1.5 border-t border-[#EEEAE4] flex items-center justify-between text-[10px] text-[#6B6258]">
                <span>Acceptance Rate:</span>
                <span className="font-mono font-bold text-[#D97706]">{itemData.acceptanceRate}%</span>
              </div>
            )}
            {isMonthlyChart && itemData?.enrollmentRate !== undefined && (
              <div className="flex items-center justify-between text-[10px] text-[#6B6258]">
                <span>Enrollment Conversion:</span>
                <span className="font-mono font-bold text-[#059669]">{itemData.enrollmentRate}%</span>
              </div>
            )}

            {!isMonthlyChart && itemData?.fillRate !== undefined && (
              <div className="pt-1.5 border-t border-[#EEEAE4] flex items-center justify-between text-[10px] text-[#D97706] font-semibold">
                <span>Occupancy Rate</span>
                <span>{itemData.fillRate}% Filled</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1F1F1F] font-sans flex flex-col lg:flex-row antialiased selection:bg-[#FFF7E6] selection:text-[#D97706]">

      {/* ========================================================= */}
      {/* 1. MOBILE TOP NAVIGATION BAR (< lg) */}
      {/* ========================================================= */}
      <div className="lg:hidden bg-[#18181B] border-b border-stone-800 px-3 sm:px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 cursor-pointer transition-colors"
            aria-label="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src="/logo.png" alt="Claxic" className="h-6 w-auto object-contain" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FBBF24] bg-[#F59E0B]/15 px-2.5 py-0.5 rounded-full border border-[#F59E0B]/35">
            Admin Console
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAdminData}
            className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#F59E0B]' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => onOpenCourseModal && onOpenCourseModal(null)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Course</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MOBILE SIDEBAR DRAWER OVERLAY */}
      {/* ========================================================= */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 w-[280px] sm:w-72 max-w-[85vw] bg-[#18181B] border-r border-stone-800 text-stone-300 flex flex-col z-50 shadow-2xl p-5 justify-between animate-in slide-in-from-left duration-200">
            <div className="space-y-6 overflow-y-auto no-scrollbar flex-1">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                  <img src="/logo.png" alt="Claxic" className="h-6 w-auto object-contain" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FBBF24] bg-[#F59E0B]/15 px-2.5 py-0.5 rounded-full border border-[#F59E0B]/35">
                    Admin Console
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer transition-colors"
                  aria-label="Close Sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Sections */}
              {navSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-2 px-2">
                    {section.title}
                  </p>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          handleTabChange(item.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#222329] border border-[#F59E0B]/35 text-white font-bold shadow-[0_2px_12px_rgba(245,158,11,0.14)]'
                            : 'text-stone-400 hover:text-white hover:bg-stone-800/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isActive && (
                            <span className="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-[#FBBF24] to-[#D97706] shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0" />
                          )}
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#FBBF24]' : 'text-stone-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.count !== undefined && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-[#F59E0B] text-black shadow-xs' : 'bg-stone-800 text-stone-300 border border-stone-700'
                          }`}>
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Sidebar Bottom */}
            <div className="pt-4 border-t border-stone-800 space-y-3">
              {onOpenEmailSandbox && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenEmailSandbox();
                    setIsMobileSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Email Sandbox</span>
                </button>
              )}
              {logout && (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMobileSidebarOpen(false);
                    if (onNavigate) onNavigate('admin-login');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/40 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. DESKTOP STICKY SIDEBAR (Collapsible: w-72 or w-20) */}
      {/* ========================================================= */}
      <aside className={`hidden lg:flex lg:flex-col bg-[#18181B] border-r border-stone-800 text-stone-300 min-h-screen sticky top-0 h-screen shrink-0 z-30 justify-between select-none transition-[width,padding] duration-200 ease-in-out will-change-[width] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
        isSidebarCollapsed ? 'w-20 p-3' : 'w-72 p-5'
      }`}>
        <div className="flex-1 overflow-y-auto space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Brand Header with Hamburger Button */}
          <div className={`flex items-center pb-4 border-b border-stone-800 ${
            isSidebarCollapsed ? 'justify-center' : 'justify-between'
          }`}>
            {!isSidebarCollapsed ? (
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src="/logo.png" alt="Claxic" className="h-6 w-auto object-contain shrink-0" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FBBF24] bg-[#F59E0B]/15 px-2.5 py-0.5 rounded-full border border-[#F59E0B]/35 truncate">
                    Admin Console
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                  title="Collapse Sidebar"
                  aria-label="Collapse Sidebar"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer flex items-center justify-center w-full"
                title="Expand Sidebar"
                aria-label="Expand Sidebar"
              >
                <Menu className="w-5 h-5 text-[#F59E0B]" />
              </button>
            )}
          </div>

          {/* Grouped Navigation */}
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isSidebarCollapsed && (
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1.5 px-2.5">
                  {section.title}
                </p>
              )}
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        handleTabChange(item.id);
                        setIsSidebarCollapsed(true);
                      }}
                      title={isSidebarCollapsed ? `${item.label} (${item.count !== undefined ? item.count : ''})` : undefined}
                      className={`w-full flex items-center transition-all cursor-pointer ${
                        isSidebarCollapsed
                          ? `justify-center p-2.5 rounded-xl ${
                              isActive
                                ? 'bg-[#222329] text-[#FBBF24] font-bold border border-[#F59E0B]/35 shadow-[0_2px_10px_rgba(245,158,11,0.2)]'
                                : 'text-stone-400 hover:text-white hover:bg-stone-800'
                            }`
                          : `justify-between px-3.5 py-2.5 text-xs rounded-xl ${
                              isActive
                                ? 'bg-[#222329] border border-[#F59E0B]/35 text-white font-bold shadow-[0_2px_12px_rgba(245,158,11,0.14)]'
                                : 'text-stone-400 hover:text-white hover:bg-stone-800/70 font-medium'
                            }`
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {!isSidebarCollapsed && isActive && (
                          <span className="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-[#FBBF24] to-[#D97706] shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0" />
                        )}
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#FBBF24]' : 'text-stone-400'}`} />
                        {!isSidebarCollapsed && <span>{item.label}</span>}
                      </div>
                      {!isSidebarCollapsed && item.count !== undefined && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-[#F59E0B] text-black shadow-xs' : 'bg-stone-800 text-stone-300 border border-stone-700'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Sidebar Footer Actions & Admin Profile */}
        <div className="pt-4 border-t border-stone-800 space-y-3">
          {onOpenEmailSandbox && (
            <button
              type="button"
              onClick={onOpenEmailSandbox}
              title={isSidebarCollapsed ? "Email Sandbox" : undefined}
              className={`w-full flex items-center justify-center rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-200 text-xs font-semibold transition-colors cursor-pointer ${
                isSidebarCollapsed ? 'p-2.5' : 'gap-2 py-2 px-3'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-[#F59E0B]" />
              {!isSidebarCollapsed && <span>Email Sandbox</span>}
            </button>
          )}

          {/* Admin User Info Card */}
          <div className={`rounded-xl bg-stone-900 border border-stone-800 flex items-center shadow-xs ${
            isSidebarCollapsed ? 'justify-center p-2' : 'justify-between p-3'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 font-bold text-xs flex items-center justify-center">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-stone-900" />
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
                  <p className="text-[10px] text-stone-400 truncate font-mono">{user?.email || 'admin@claxic.edu'}</p>
                </div>
              )}
            </div>

            {!isSidebarCollapsed && (
              <div className="flex items-center gap-1">
                {logout && (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      if (onNavigate) onNavigate('admin-login');
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 4. MAIN CONTENT WORKSPACE */}
      {/* ========================================================= */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header Workspace Bar */}
        <header className="bg-[#FFFFFF] border-b border-[#E8E3DC] px-6 sm:px-10 py-4 sticky top-0 z-20 flex items-center justify-between gap-4">
          {/* Breadcrumb Title */}
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#6B6258] uppercase tracking-wider">
              <span>Directorate</span>
              <ChevronRight className="w-3 h-3 text-[#A89076]" />
              <span className="text-[#D97706] capitalize font-bold">
                {activeTab === 'audit' ? 'Audit' : activeTab === 'staff' ? 'Staff Directorate' : activeTab === 'allotments' ? 'Course Allotments' : activeTab}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#1F1F1F] tracking-tight mt-0.5">
              {activeTab === 'overview' && 'Executive Overview & Live Metrics'}
              {activeTab === 'applications' && `Candidate Applications Registry (${applications.length})`}
              {activeTab === 'courses' && `Accredited Course Offerings (${courses.length})`}
              {activeTab === 'staff' && `Faculty & Staff Directorate (${staffList.length})`}
              {activeTab === 'allotments' && `Course Allotments Matrix (${allotmentsList.length})`}
              {activeTab === 'financials' && 'Financial Settlements & Transactions'}
              {activeTab === 'users' && `Account Directory (${users.filter((u) => u.role === 'USER').length})`}
              {activeTab === 'audit' && 'System Security & Audit Trail'}
            </h1>
          </div>

          {/* Right Header Bar - Notification Bell & Quick Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <NotificationBell onNavigate={onNavigate} />
          </div>
        </header>

        {/* 4. MAIN CONTENT AREA */}
        <main className="p-3.5 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 flex-1 min-w-0">

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchAdminData} className="underline hover:text-rose-950 font-bold cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: EXECUTIVE OVERVIEW & REAL LIVE CHARTS */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">

            {/* Overview Header & PDF Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div>
                <h2 className="text-base font-bold text-[#1F1F1F] tracking-tight">
                  Executive Performance Dashboard
                </h2>
                <p className="text-xs text-[#6B6258] mt-0.5">
                  Real-time admissions telemetry, gross revenue settlements, cohort capacity, and course yields
                </p>
              </div>

              <button
                type="button"
                onClick={() => exportExecutiveOverviewPDF({ overviewData, courses, applications, users, payments })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white border border-stone-700/80 text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                title="Download complete executive overview report in official PDF format"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Download Executive PDF</span>
              </button>
            </div>

            {/* Real KPI Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">

              {/* 1. Program Offerings */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleTabChange('courses')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTabChange('courses');
                  }
                }}
                className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#F59E0B] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group select-none text-left"
                title="Click to view and manage Program Offerings"
              >
                <div className="flex items-center justify-between text-[#6B6258] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6258] group-hover:text-[#D97706] transition-colors flex items-center gap-1.5">
                    <span>Program Offerings</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#D97706]" />
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#FFF7E6] text-[#D97706] border border-[#FEDDAA] flex items-center justify-center group-hover:bg-[#F59E0B] group-hover:text-white transition-all shadow-2xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] tracking-tight font-mono group-hover:text-[#D97706] transition-colors">
                  {courses.length}
                </h3>
                <div className="mt-2.5 flex items-center justify-between text-xs text-[#6B6258] font-medium pt-2 border-t border-[#F0EBE3]">
                  <span>
                    {courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0)} / {courses.reduce((sum, c) => sum + (c.capacity || 40), 0)} Total Seats Filled
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#D97706] opacity-90 group-hover:translate-x-0.5 transition-transform">
                    View Catalog <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* 2. Registered Accounts */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleTabChange('users')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTabChange('users');
                  }
                }}
                className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#F59E0B] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group select-none text-left"
                title="Click to view Account Directory and registered accounts"
              >
                <div className="flex items-center justify-between text-[#6B6258] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6258] group-hover:text-[#D97706] transition-colors flex items-center gap-1.5">
                    <span>Registered Accounts</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#D97706]" />
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#FFF7E6] text-[#D97706] border border-[#FEDDAA] flex items-center justify-center group-hover:bg-[#F59E0B] group-hover:text-white transition-all shadow-2xs">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] tracking-tight font-mono group-hover:text-[#D97706] transition-colors">
                  {users.length}
                </h3>
                <div className="mt-2.5 flex items-center justify-between text-xs text-[#6B6258] font-medium pt-2 border-t border-[#F0EBE3]">
                  <div className="flex items-center gap-1.5 text-xs text-[#16A34A] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>{users.filter((u) => u.isVerified).length} Verified Email Profiles</span>
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#D97706] opacity-90 group-hover:translate-x-0.5 transition-transform">
                    View Directory <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* 3. Applicant Registrations */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleTabChange('applications')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTabChange('applications');
                  }
                }}
                className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#F59E0B] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group select-none text-left"
                title="Click to view and review Applicant Registrations"
              >
                <div className="flex items-center justify-between text-[#6B6258] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6258] group-hover:text-[#D97706] transition-colors flex items-center gap-1.5">
                    <span>Applicant Registrations</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#D97706]" />
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#FFF7E6] text-[#D97706] border border-[#FEDDAA] flex items-center justify-center group-hover:bg-[#F59E0B] group-hover:text-white transition-all shadow-2xs">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] tracking-tight font-mono group-hover:text-[#D97706] transition-colors">
                  {applications.length}
                </h3>
                <div className="mt-2.5 flex items-center justify-between text-xs text-[#6B6258] font-medium pt-2 border-t border-[#F0EBE3]">
                  <div className="flex items-center gap-2 text-xs text-[#6B6258]">
                    <span className="font-semibold text-[#D97706]">
                      {applications.filter((a) => a.status === 'CONFIRMED' || a.status === 'APPROVED').length} Approved
                    </span>
                    <span>•</span>
                    <span>{applications.filter((a) => a.status === 'SUBMITTED').length} In Review</span>
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#D97706] opacity-90 group-hover:translate-x-0.5 transition-transform">
                    Review All <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

            </div>

            {/* REAL LIVE GRAPHS SECTION - Year-by-Year Student Applications */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Interactive Dual-Mode Growth & Capacity Bar Chart */}
              <div className="lg:col-span-12 bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)] relative overflow-hidden">

                {/* Header with Switcher Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#1F1F1F] tracking-tight">
                        {overviewChartTab === 'yearly'
                          ? (selectedYearFilter === 'PAST'
                              ? `Past Year (${realChartMetrics.pastYear}) Monthly Applications & Admissions`
                              : `Current Year (${realChartMetrics.currentYear}) Monthly Applications & Admissions`)
                          : 'Program Seat Capacity & Applications Breakdown'}
                      </h3>
                    </div>
                    <p className="text-xs text-[#6B6258] mt-0.5">
                      {overviewChartTab === 'yearly'
                        ? (selectedYearFilter === 'PAST'
                            ? `Complete 12-month historical cohort performance (January – December ${realChartMetrics.pastYear})`
                            : `Year-to-date monthly cohort performance up to current month (January – ${realChartMetrics.monthFull[realChartMetrics.currentMonthIdx]} ${realChartMetrics.currentYear})`)
                        : 'Course-by-course breakdown comparing total seat capacity, candidate applications, and enrolled students'}
                    </p>
                  </div>

                  {/* Header Actions: Clean Past/Current Year Dropdown & Two-Tab Switcher */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {overviewChartTab === 'yearly' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#6B6258] hidden sm:inline">Cohort Year:</span>
                        <select
                          value={selectedYearFilter}
                          onChange={(e) => setSelectedYearFilter(e.target.value)}
                          className="bg-[#FAFAF7] border border-[#E8E3DC] hover:border-[#FEDDAA] focus:border-[#F59E0B] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1F1F1F] outline-none transition-colors cursor-pointer"
                        >
                          <option value="CURRENT">Current Year ({realChartMetrics.currentYear})</option>
                          <option value="PAST">Past Year ({realChartMetrics.pastYear})</option>
                        </select>
                      </div>
                    )}

                    {/* Two-Tab Segmented Switcher */}
                    <div className="flex items-center gap-1.5 bg-[#FAFAF7] border border-[#E8E3DC] p-1 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setOverviewChartTab('yearly')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          overviewChartTab === 'yearly'
                            ? 'bg-[#F59E0B] text-white shadow-xs font-bold'
                            : 'text-[#6B6258] hover:text-[#1F1F1F]'
                        }`}
                      >
                        Monthly Analysis
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverviewChartTab('capacity')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          overviewChartTab === 'capacity'
                            ? 'bg-[#F59E0B] text-white shadow-xs font-bold'
                            : 'text-[#6B6258] hover:text-[#1F1F1F]'
                        }`}
                      >
                        Seats vs Applications
                      </button>
                    </div>
                  </div>
                </div>

                {/* Selected Year Summary Stat Cards (when on Monthly Analysis tab) */}
                {overviewChartTab === 'yearly' && (
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-5">
                    <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E8E3DC]/80 flex flex-col justify-between">
                      <span className="text-[11px] font-semibold text-[#6B6258] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                        Total Applications
                      </span>
                      <span className="text-base sm:text-lg font-bold text-[#1F1F1F] font-mono mt-0.5">
                        {selectedYearSummary.totalApplied.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E8E3DC]/80 flex flex-col justify-between">
                      <span className="text-[11px] font-semibold text-[#6B6258] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FBBF24]" />
                        Admissions Confirmed
                      </span>
                      <span className="text-base sm:text-lg font-bold text-[#1F1F1F] font-mono mt-0.5">
                        {selectedYearSummary.totalAdmitted.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E8E3DC]/80 flex flex-col justify-between">
                      <span className="text-[11px] font-semibold text-[#6B6258] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FEDDAA]" />
                        Active Enrollments
                      </span>
                      <span className="text-base sm:text-lg font-bold text-[#1F1F1F] font-mono mt-0.5">
                        {selectedYearSummary.totalEnrolled.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Render Selected Bar Chart */}
                <div className="h-72 sm:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {overviewChartTab === 'yearly' ? (
                      <BarChart
                        data={displayedMonthlyData}
                        margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                        barGap={3}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEEAE4" vertical={false} />
                        <XAxis
                          dataKey="month"
                          stroke="#6B6258"
                          fontSize={11}
                          fontWeight={600}
                          tickLine={false}
                          axisLine={{ stroke: '#E8E3DC' }}
                        />
                        <YAxis
                          stroke="#82684D"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `${val}`}
                        />
                        <Tooltip
                          content={<CustomChartTooltip />}
                          cursor={{ fill: 'rgba(245, 158, 11, 0.08)', rx: 8 }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }}
                          formatter={(value) => <span className="text-[#1F1F1F] font-semibold text-xs ml-1 mr-3">{value}</span>}
                        />
                        <Bar
                          dataKey="applied"
                          name="Student Applications"
                          fill="#F59E0B"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={selectedYearFilter === 'PAST' ? 18 : 26}
                        />
                        <Bar
                          dataKey="admitted"
                          name="Admissions Confirmed"
                          fill="#FBBF24"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={selectedYearFilter === 'PAST' ? 18 : 26}
                        />
                        <Bar
                          dataKey="enrolled"
                          name="Active Cohort Enrollments"
                          fill="#FEDDAA"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={selectedYearFilter === 'PAST' ? 18 : 26}
                        />
                      </BarChart>
                    ) : (
                      <BarChart
                        data={realChartMetrics.courseCapacityData}
                        margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
                        barGap={8}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEEAE4" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="#6B6258"
                          fontSize={11}
                          fontWeight={600}
                          tickLine={false}
                          axisLine={{ stroke: '#E8E3DC' }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis
                          stroke="#82684D"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `${val}`}
                        />
                        <Tooltip
                          content={<CustomChartTooltip />}
                          cursor={{ fill: 'rgba(245, 158, 11, 0.08)', rx: 8 }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '11px', paddingTop: '28px' }}
                          formatter={(value) => <span className="text-[#1F1F1F] font-semibold text-xs ml-1 mr-3">{value}</span>}
                        />
                        <Bar
                          dataKey="capacity"
                          name="Total Seat Capacity"
                          fill="#F59E0B"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={40}
                        />
                        <Bar
                          dataKey="applications"
                          name="Candidate Applications"
                          fill="#FBBF24"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={40}
                        />
                        <Bar
                          dataKey="enrolled"
                          name="Enrolled Seats"
                          fill="#FEDDAA"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Submissions Quick Table */}
            <div className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#1F1F1F] tracking-tight">
                  Recent Candidate Submissions
                </h3>
                <button
                  type="button"
                  onClick={() => handleTabChange('applications')}
                  className="text-xs font-semibold text-[#D97706] hover:text-[#B45309] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>View All Applications</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto [scrollbar-width:thin]">
                <table className="w-full text-left text-xs min-w-[620px]">
                  <thead>
                    <tr className="border-b border-[#E8E3DC] text-[#6B6258] font-semibold uppercase tracking-wider">
                      <th className="pb-3">Candidate</th>
                      <th className="pb-3">Program Track</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Applied Date</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEAE4]">
                    {applications.slice(0, 5).map((app) => (
                      <tr key={app.id} className="hover:bg-[#FFF9EF] transition-colors">
                        <td className="py-3.5 font-medium text-[#1F1F1F]">
                          <p className="font-bold">{app.userName}</p>
                          <p className="text-[11px] text-[#6B6258]">{app.userEmail}</p>
                        </td>
                        <td className="py-3.5 text-[#1F1F1F]">{app.courseTitle}</td>
                        <td className="py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              app.status === 'CONFIRMED' || app.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : app.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : app.status === 'SUBMITTED'
                                    ? 'bg-[#FFF7E6] text-[#D97706] border-[#FEDDAA]'
                                    : app.status === 'UNDER_REVIEW'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-[#FAFAF7] text-[#6B6258] border-[#E8E3DC]'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-[#6B6258]">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppDetail(app);
                              setAdminNotesInput(app.adminNotes || '');
                            }}
                            className="p-1.5 rounded-lg text-[#6B6258] hover:text-[#D97706] hover:bg-[#FFF7E6] transition-colors cursor-pointer"
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
            <div className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4">

              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#82684D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  placeholder="Search by name, email, or course..."
                  className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/15 rounded-xl pl-9 pr-4 py-2 text-xs text-[#1F1F1F] outline-none transition-all"
                />
              </div>

              {/* Status Filter Tabs & CSV Export */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto">
                <div className="flex items-center bg-[#FAFAF7] border border-[#E8E3DC] p-1 rounded-xl text-xs font-semibold">
                  {['ALL', 'APPROVED', 'REJECTED', 'SUBMITTED', 'UNDER_REVIEW'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === st
                          ? 'bg-[#F59E0B] text-white shadow-xs font-bold'
                          : 'text-[#6B6258] hover:text-[#1F1F1F]'
                        }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => exportApplicationsPDF(filteredApplications, statusFilter)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white border border-stone-700/80 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    title="Download complete applications registry in official PDF format with Claxic logo"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download PDF Report</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFF7E6] hover:bg-[#FFF1D6] text-[#D97706] border border-[#FEDDAA] text-xs font-semibold transition-colors cursor-pointer"
                    title="Export raw CSV data"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="overflow-x-auto [scrollbar-width:thin]">
                <table className="w-full text-left text-xs min-w-[660px]">
                  <thead className="bg-[#FFF7E6] border-b border-[#E8E3DC] text-[#1F1F1F] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Application #</th>
                      <th className="py-3.5 px-4">Candidate Profile</th>
                      <th className="py-3.5 px-4">Course Program</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Submitted</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEAE4]">
                    {filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#6B6258]">
                          No matching applications found.
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-[#FFF9EF] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#D97706]">
                            {app.applicationNumber || app.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-[#1F1F1F]">{app.userName}</p>
                            <p className="text-[11px] text-[#6B6258]">{app.userEmail}</p>
                          </td>
                          <td className="py-3.5 px-4 text-[#1F1F1F] font-medium">
                            {app.courseTitle}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                app.status === 'CONFIRMED' || app.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : app.status === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : app.status === 'SUBMITTED'
                                      ? 'bg-[#FFF7E6] text-[#D97706] border-[#FEDDAA]'
                                      : app.status === 'UNDER_REVIEW'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-[#FAFAF7] text-[#6B6258] border-[#E8E3DC]'
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#6B6258] font-mono text-[11px]">
                            {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAppDetail(app);
                                setAdminNotesInput(app.adminNotes || '');
                              }}
                              className="p-1.5 rounded-lg text-[#6B6258] hover:text-[#D97706] hover:bg-[#FFF7E6] transition-colors cursor-pointer"
                              title="Review Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteApplication(app.id)}
                              className="p-1.5 rounded-lg text-[#6B6258] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
                <h2 className="text-base font-bold text-[#1F1F1F] tracking-tight">
                  Course Catalog & Tracks
                </h2>
                <p className="text-xs text-[#6B6258]">
                  Manage syllabus, pricing, cohort capacity, and custom banner imagery
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportCoursesPDF(courses)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white border border-stone-700/80 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Download accredited course catalog in official PDF format with Claxic logo"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download Catalog (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenCourseModal && onOpenCourseModal(null)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <span>Add New Course</span>
                </button>
              </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#F59E0B]/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Course Banner Photo */}
                    <div className="relative h-44 w-full bg-[#FAFAF7] overflow-hidden">
                      <img
                        src={c.bannerImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'}
                        alt={c.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-[11px] font-bold text-[#1F1F1F] shadow-xs border border-[#E8E3DC]">
                          {c.status}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#FFF7E6]/95 backdrop-blur-md text-[11px] font-bold text-[#D97706] border border-[#FEDDAA] shadow-xs">
                          {c.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-sm font-bold text-[#1F1F1F] tracking-tight leading-snug">
                        {c.title}
                      </h3>
                      <p className="text-xs text-[#6B6258] line-clamp-2 leading-relaxed">
                        {c.shortDescription}
                      </p>

                      {/* Capacity Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-[#6B6258] font-semibold">
                          <span>Seat Enrollment</span>
                          <span>
                            {c.enrolledCount || 0} / {c.capacity || 40} ({Math.round(((c.enrolledCount || 0) / (c.capacity || 40)) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#EEEAE4] overflow-hidden">
                          <div
                            className="h-full bg-[#F59E0B] rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round(((c.enrolledCount || 0) / (c.capacity || 40)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="px-5 py-3.5 bg-[#FAFAF7] border-t border-[#E8E3DC] flex items-center justify-between">
                    <div className="font-mono font-bold text-sm text-[#1F1F1F]">
                      {c.isFree || c.price === 0 ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs font-bold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          FREE
                        </span>
                      ) : (
                        `₹${(c.price || 0).toLocaleString('en-IN')}`
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenCourseModal && onOpenCourseModal(c)}
                        className="px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E8E3DC] hover:border-[#F59E0B] text-[#1F1F1F] hover:text-[#D97706] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3 text-[#D97706]" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(c.id)}
                        className="p-1.5 rounded-lg text-[#6B6258] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
        {/* TAB: FACULTY & STAFF DIRECTORATE                          */}
        {/* ========================================================= */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#82684D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Search staff by name, email, or department..."
                  className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/15 rounded-xl pl-9 pr-4 py-2 text-xs text-[#1F1F1F] outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsAppointStaffModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Appoint Faculty / Staff</span>
                </button>
              </div>
            </div>

            {/* KPI Summary Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E8E3DC] rounded-2xl p-4 shadow-xs">
                <span className="text-[11px] font-mono uppercase font-bold text-[#6B6258] block">Appointed Faculty</span>
                <span className="text-2xl font-bold font-mono text-[#1F1F1F] block mt-1">{staffList.length}</span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Active Directorate Accounts</span>
              </div>
              <div className="bg-white border border-[#E8E3DC] rounded-2xl p-4 shadow-xs">
                <span className="text-[11px] font-mono uppercase font-bold text-[#6B6258] block">Active Staff Members</span>
                <span className="text-2xl font-bold font-mono text-[#D97706] block mt-1">{staffList.filter(s => s.isActive).length}</span>
                <span className="text-[10px] text-stone-500 font-medium mt-1 block">Authorized for Portal Login</span>
              </div>
              <div className="bg-white border border-[#E8E3DC] rounded-2xl p-4 shadow-xs">
                <span className="text-[11px] font-mono uppercase font-bold text-[#6B6258] block">Total Course Allotments</span>
                <span className="text-2xl font-bold font-mono text-[#1F1F1F] block mt-1">{allotmentsList.length}</span>
                <span className="text-[10px] text-stone-500 font-medium mt-1 block">Active Program Bindings</span>
              </div>
            </div>

            {/* Staff Members Table */}
            <div className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="overflow-x-auto [scrollbar-width:thin]">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-[#FFF7E6] border-b border-[#E8E3DC] text-[#1F1F1F] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Faculty Member</th>
                      <th className="py-3.5 px-4">Department & Degree</th>
                      <th className="py-3.5 px-4">Course Allotments</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEAE4]">
                    {staffList
                      .filter((s) => {
                        const term = staffSearch.toLowerCase();
                        return (
                          (s.name || '').toLowerCase().includes(term) ||
                          (s.email || '').toLowerCase().includes(term) ||
                          (s.institution || '').toLowerCase().includes(term) ||
                          (s.degree || '').toLowerCase().includes(term)
                        );
                      })
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-[#FFF9EF] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#18181B] text-amber-300 font-bold flex items-center justify-center text-xs shrink-0">
                                {(s.name || s.email || 'S')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-[#1F1F1F] truncate">{s.name}</p>
                                <p className="text-[11px] text-[#6B6258] font-mono truncate">{s.email}</p>
                                {s.mobile && <p className="text-[10px] text-stone-500 font-mono">{s.mobile}</p>}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-[#6B6258]">
                            <p className="font-semibold text-[#1F1F1F]">{s.degree || 'Faculty Member'}</p>
                            <p className="text-[11px] text-stone-500">{s.institution || 'Department of Computer Science'}</p>
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleOpenAllotmentsForStaff(s)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFF7E6] text-[#D97706] border border-[#FEDDAA] hover:bg-[#FEDDAA]/50 transition-colors cursor-pointer"
                              title="Click to view and edit course allotments"
                            >
                              <Layers className="w-3 h-3" />
                              <span>{s.allotmentsCount || (s.allottedCourses || []).length} Allotted Courses</span>
                            </button>
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStaffStatus(s)}
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
                                s.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                              title="Click to toggle active / suspended status"
                            >
                              {s.isActive ? 'Active' : 'Suspended'}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStaffForCredentials(s);
                                setIsCredentialsModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                              title="Create or change permanent username & password"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-[#D97706]" />
                              <span>Password</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenAllotmentsForStaff(s)}
                              className="px-2.5 py-1 rounded-lg bg-[#FAFAF7] hover:bg-[#FFF7E6] text-[#D97706] border border-[#E8E3DC] font-semibold transition-colors cursor-pointer"
                              title="Manage course allotments"
                            >
                              Allot Courses
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserToEdit(s);
                                setIsUserEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-[#FAFAF7] hover:bg-stone-200 text-[#1F1F1F] border border-[#E8E3DC] transition-colors cursor-pointer inline-flex items-center"
                              title="Edit Staff Member"
                            >
                              <Edit className="w-3.5 h-3.5 text-[#6B6258]" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRevokeStaff(s)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer inline-flex items-center"
                              title="Revoke Staff Appointment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}

                    {staffList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center bg-white">
                          <ShieldCheck className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                          <p className="font-bold text-[#1F1F1F] text-sm">No Faculty Appointed Yet</p>
                          <p className="text-xs text-[#6B6258] mt-0.5 max-w-sm mx-auto">
                            Appoint faculty instructors and mentors to manage curriculum courses and evaluate candidate admissions.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsAppointStaffModalOpen(true)}
                            className="mt-4 px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Appoint First Faculty Member</span>
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: COURSE ALLOTMENTS MATRIX                             */}
        {/* ========================================================= */}
        {activeTab === 'allotments' && (
          <div className="space-y-6">
            <div className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#1F1F1F] tracking-tight">
                  Academic Curriculum Course Allotments
                </h2>
                <p className="text-xs text-[#6B6258] mt-0.5">
                  Explicitly bind faculty instructors to accredited courses. Staff members only manage allotted programs.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (staffList.length > 0) {
                    handleOpenAllotmentsForStaff(staffList[0]);
                  } else {
                    alert('Please appoint at least one staff member before managing course allotments.');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Allot Courses to Faculty</span>
              </button>
            </div>

            {/* Matrix of Courses & Appointed Faculty */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => {
                const assignedStaff = staffList.filter((s) =>
                  (s.allottedCourses || []).some((c) => (typeof c === 'string' ? c === course.id : c.id === course.id))
                );

                return (
                  <div
                    key={course.id}
                    className="bg-white border border-[#E8E3DC] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#FEDDAA] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-[#FFF7E6] text-[#D97706] border border-[#FEDDAA]">
                          {course.category}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500 font-semibold">
                          {course.duration || '10 Days'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#1F1F1F] mt-2 line-clamp-1">{course.title}</h4>
                      <p className="text-xs text-[#6B6258] mt-1 line-clamp-2 leading-relaxed">
                        {course.shortDescription || course.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#EEEAE4] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-600 text-[11px]">Assigned Faculty:</span>
                        <span className="font-mono text-xs font-bold text-[#D97706]">
                          {assignedStaff.length} Instructor{assignedStaff.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      {assignedStaff.length > 0 ? (
                        <div className="space-y-1.5">
                          {assignedStaff.map((staff) => (
                            <div
                              key={staff.id}
                              className="p-2 rounded-xl bg-[#FAFAF7] border border-[#E8E3DC] flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-full bg-[#18181B] text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {(staff.name || 'S')[0].toUpperCase()}
                                </div>
                                <span className="font-semibold text-[#1F1F1F] truncate">{staff.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenAllotmentsForStaff(staff)}
                                className="text-[10px] font-bold text-[#D97706] hover:underline shrink-0"
                              >
                                Edit
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-center justify-between">
                          <span>No faculty allotted yet</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (staffList.length > 0) {
                                handleOpenAllotmentsForStaff(staffList[0]);
                              } else {
                                setIsAppointStaffModalOpen(true);
                              }
                            }}
                            className="font-bold text-[#D97706] hover:underline"
                          >
                            + Allot
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
                <h2 className="text-base font-bold text-[#1F1F1F] tracking-tight">
                  Financial Transactions & Tax Invoices
                </h2>
                <p className="text-xs text-[#6B6258]">
                  Inspect Razorpay payments, tax breakdown, and GST receipt invoices
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => exportFinancialsPDF(payments)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white border border-stone-700/80 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Download complete financial audit and tax settlements report in official PDF format with Claxic logo"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download Audit (PDF)</span>
                </button>
                <div className="font-mono text-xs font-bold text-[#D97706] bg-[#FFF7E6] border border-[#FEDDAA] px-3.5 py-1.5 rounded-xl">
                  Settled Total: ₹{realChartMetrics.totalRealRevenue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="overflow-x-auto [scrollbar-width:thin]">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-[#FFF7E6] border-b border-[#E8E3DC] text-[#1F1F1F] font-bold uppercase tracking-wider">
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
                  <tbody className="divide-y divide-[#EEEAE4]">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FFF9EF] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#D97706]">
                          {p.receiptNumber || p.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#1F1F1F]">{p.userName}</p>
                          <p className="text-[11px] text-[#6B6258]">{p.userEmail}</p>
                        </td>
                        <td className="py-3.5 px-4 text-[#1F1F1F] font-medium">
                          {p.courseTitle}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#1F1F1F]">
                          ₹{(p.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${p.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#6B6258] font-mono text-[11px]">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onViewReceipt && onViewReceipt(p.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#FFF7E6] hover:bg-[#FFF1D6] text-[#D97706] border border-[#FEDDAA] font-semibold transition-colors cursor-pointer"
                          >
                            Tax Receipt
                          </button>

                          {p.status === 'SUCCESS' && (
                            <button
                              type="button"
                              onClick={() => handleIssueRefund(p.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] hover:bg-rose-50 text-[#6B6258] hover:text-rose-700 border border-[#E8E3DC] transition-colors cursor-pointer"
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
            <div className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#82684D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user by name, email, or role..."
                  className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/15 rounded-xl pl-9 pr-4 py-2 text-xs text-[#1F1F1F] outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-xs text-[#6B6258] font-medium">
                  Showing <strong className="text-[#1F1F1F]">{filteredUsers.length}</strong> registered accounts
                </div>
                <button
                  type="button"
                  onClick={() => setIsAppointStaffModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                  title="Directly appoint faculty instructors, evaluators, or administrators"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Appoint Faculty / Staff</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportUsersPDF(filteredUsers)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAFAF7] text-[#1F1F1F] border border-[#E8E3DC] text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                  title="Download user directory report in official PDF format with Claxic logo"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Download Users (PDF)</span>
                </button>
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="overflow-x-auto [scrollbar-width:thin]">
                <table className="w-full text-left text-xs min-w-[620px]">
                  <thead className="bg-[#FFF7E6] border-b border-[#E8E3DC] text-[#1F1F1F] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Student / Staff Profile</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Email Verification</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4 text-right">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEAE4]">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#FFF9EF] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-[#E8E3DC] shadow-2xs shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-[#1F1F1F] truncate">{u.name}</p>
                              <p className="text-[11px] text-[#6B6258] font-mono truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                              u.role === 'ADMIN'
                                ? 'bg-[#FFF7E6] text-[#D97706] border-[#FEDDAA]'
                                : u.role === 'STAFF'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {u.role === 'USER' ? 'STUDENT' : u.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleUserVerification(u)}
                            className="inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                            title="Click to toggle verification status"
                          >
                            {u.isVerified ? (
                              <span className="text-[#16A34A] font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="text-[#D97706] font-semibold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                                <span>Pending</span>
                              </span>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
                              u.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                            title="Click to toggle active/suspended status"
                          >
                            {u.isActive ? 'Active' : 'Suspended'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-block relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveUserMenuId(activeUserMenuId === u.id ? null : u.id);
                              }}
                              className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                                activeUserMenuId === u.id
                                  ? 'bg-[#FFF7E6] text-[#D97706] border-[#FEDDAA] ring-2 ring-[#FEDDAA]'
                                  : 'bg-[#FAFAF7] text-[#6B6258] border-[#E8E3DC] hover:text-[#D97706] hover:bg-[#FFF7E6] hover:border-[#FEDDAA]'
                              }`}
                              title="Edit User & Actions"
                            >
                              <Edit className="w-3.5 h-3.5 text-[#D97706]" />
                              <ChevronDown className={`w-3 h-3 text-[#82684D] transition-transform ${activeUserMenuId === u.id ? 'rotate-180 text-[#D97706]' : ''}`} />
                            </button>

                            {/* Dropdown Options Popover for Edit Symbol */}
                            {activeUserMenuId === u.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-1.5 w-60 bg-white border border-[#E8E3DC] rounded-2xl shadow-2xl z-50 p-1.5 text-left text-xs animate-in fade-in zoom-in-95"
                              >
                                <div className="px-3 py-2 border-b border-[#FAF7F2] bg-[#FAFAF7] rounded-xl mb-1">
                                  <p className="font-bold text-[#1F1F1F] truncate">{u.name}</p>
                                  <p className="text-[10px] text-[#6B6258] font-mono truncate">{u.email}</p>
                                </div>

                                <div className="space-y-0.5">
                                  {/* Primary Option: Edit Profile Modal */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveUserMenuId(null);
                                      setSelectedUserToEdit(u);
                                      setIsUserEditModalOpen(true);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[#1F1F1F] hover:bg-[#FFF7E6] hover:text-[#D97706] rounded-xl flex items-center gap-2 font-semibold transition-colors cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-[#D97706]" />
                                    <span>Edit Profile & Role</span>
                                  </button>

                                  {/* Quick Role Options */}
                                  <div className="pt-1.5 border-t border-[#FAF7F2]">
                                    <span className="block px-3 pb-1 text-[10px] uppercase font-mono font-bold text-[#6B6258]">
                                      Quick Change Role
                                    </span>
                                    
                                    <button
                                      type="button"
                                      disabled={u.role === 'USER'}
                                      onClick={() => handleSetUserRole(u, 'USER')}
                                      className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] font-medium transition-colors cursor-pointer ${
                                        u.role === 'USER'
                                          ? 'text-emerald-700 bg-emerald-50 font-bold'
                                          : 'text-[#6B6258] hover:bg-[#FAFAF7] hover:text-[#1F1F1F]'
                                      }`}
                                    >
                                      <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span>Student (USER)</span>
                                      </span>
                                      {u.role === 'USER' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={u.role === 'STAFF'}
                                      onClick={() => handleSetUserRole(u, 'STAFF')}
                                      className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] font-medium transition-colors cursor-pointer ${
                                        u.role === 'STAFF'
                                          ? 'text-sky-700 bg-sky-50 font-bold'
                                          : 'text-[#6B6258] hover:bg-[#FAFAF7] hover:text-[#1F1F1F]'
                                      }`}
                                    >
                                      <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                                        <span>Faculty (STAFF)</span>
                                      </span>
                                      {u.role === 'STAFF' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={u.role === 'ADMIN'}
                                      onClick={() => handleSetUserRole(u, 'ADMIN')}
                                      className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] font-medium transition-colors cursor-pointer ${
                                        u.role === 'ADMIN'
                                          ? 'text-amber-700 bg-amber-50 font-bold'
                                          : 'text-[#6B6258] hover:bg-[#FAFAF7] hover:text-[#1F1F1F]'
                                      }`}
                                    >
                                      <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span>Admin (ADMIN)</span>
                                      </span>
                                      {u.role === 'ADMIN' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                                    </button>
                                  </div>

                                  {/* Quick Status & Verification */}
                                  <div className="pt-1.5 border-t border-[#FAF7F2]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveUserMenuId(null);
                                        handleToggleUserStatus(u);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-[#1F1F1F] hover:bg-[#FAFAF7] rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer text-[11px]"
                                    >
                                      <Activity className="w-3.5 h-3.5 text-[#82684D]" />
                                      <span>{u.isActive ? 'Suspend Account' : 'Activate Account'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleToggleUserVerification(u)}
                                      className="w-full text-left px-3 py-1.5 text-[#1F1F1F] hover:bg-[#FAFAF7] rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer text-[11px]"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                                      <span>{u.isVerified ? 'Mark as Pending' : 'Mark as Verified'}</span>
                                    </button>
                                  </div>

                                  {/* Delete User Option */}
                                  <div className="pt-1.5 border-t border-[#FAF7F2]">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(u)}
                                      className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer text-[11px]"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                      <span>Delete User Account</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1F1F1F] tracking-tight">
                  Security & Administrative Audit Logs
                </h2>
                <p className="text-sm text-[#6B6258] mt-1">
                  Immutable event log recording all course changes, role updates, and admissions actions
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => exportAuditLogsPDF(auditLogs)}
                  className="px-3.5 py-2.5 rounded-xl border border-[#E8E3DC] bg-white hover:bg-[#FAF7F2] text-[#1F1F1F] hover:text-[#D97706] text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                  title="Download full immutable audit trail PDF"
                >
                  <FileText className="w-4 h-4 text-[#D97706]" />
                  <span>Download Audit Trail (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenEmailSandbox}
                  className="px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-white" />
                  <span>Email Sandbox Dispatch Logs</span>
                </button>
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="overflow-x-auto [scrollbar-width:thin]">
                <table className="w-full text-left text-xs min-w-[720px]">
                  <thead className="bg-[#FFF7E6] border-b border-[#E8E3DC] text-[#1F1F1F] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-4 px-5 whitespace-nowrap">Event #</th>
                      <th className="py-4 px-5 whitespace-nowrap">Action</th>
                      <th className="py-4 px-5 whitespace-nowrap">Admin Operator</th>
                      <th className="py-4 px-5 min-w-[280px]">Target Record</th>
                      <th className="py-4 px-5 text-right whitespace-nowrap min-w-[200px]">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEAE4]">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[#6B6258]">
                          No audit event records available.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => {
                        const isDestructive =
                          log.action?.includes('DELETE') ||
                          log.action?.includes('REJECT') ||
                          log.action?.includes('SUSPEND');
                        const isSuccess =
                          log.action?.includes('CREATE') ||
                          log.action?.includes('ENROLL') ||
                          log.action?.includes('CONFIRM') ||
                          log.action?.includes('APPROVE');

                        return (
                          <tr key={log.id} className="hover:bg-[#FFF9EF] transition-colors">
                            <td className="py-4 px-5 font-mono text-xs text-[#6B6258] whitespace-nowrap">
                              {log.id}
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border ${
                                  isDestructive
                                    ? 'bg-rose-50 text-[#DC2626] border-rose-200'
                                    : isSuccess
                                      ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                                      : 'bg-[#FFF7E6] text-[#D97706] border-[#FEDDAA]'
                                }`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap">
                              <p className="font-bold text-[#1F1F1F]">{log.adminName || 'System Admin'}</p>
                              <p className="text-[11px] text-[#6B6258] font-medium">(Admin)</p>
                            </td>
                            <td className="py-4 px-5 text-xs text-[#6B6258] leading-relaxed">
                              <span className="font-bold text-[#1F1F1F] uppercase tracking-wide">
                                {log.targetType}:
                              </span>{' '}
                              <span className="text-[#1F1F1F] font-medium">
                                {log.targetTitle || log.targetId}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right font-mono text-xs text-[#6B6258] whitespace-nowrap">
                              {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        );
                      })
                    )}
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
          <div className="space-y-6 text-[#1F1F1F] text-xs">

            {/* Candidate Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#FAFAF7] p-4 rounded-xl border border-[#E8E3DC]">
              <div>
                <p className="text-[11px] font-bold text-[#6B6258] uppercase">Applicant</p>
                <p className="font-bold text-[#1F1F1F] mt-0.5">{selectedAppDetail.userName}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#6B6258] uppercase">Email</p>
                <p className="font-bold text-[#1F1F1F] mt-0.5">{selectedAppDetail.userEmail}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#6B6258] uppercase">Current Status</p>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] mt-0.5 border ${
                    selectedAppDetail.status === 'CONFIRMED' || selectedAppDetail.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : selectedAppDetail.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : selectedAppDetail.status === 'UNDER_REVIEW'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-[#FFF7E6] text-[#D97706] border-[#FEDDAA]'
                  }`}
                >
                  {selectedAppDetail.status}
                </span>
              </div>
            </div>

            {/* Form Payload Details */}
            {selectedAppDetail.formData && (
              <div className="space-y-2">
                <h4 className="font-bold text-[#1F1F1F] uppercase tracking-wider text-[11px]">
                  Submitted Application Data
                </h4>
                <div className="bg-[#FAFAF7] p-4 rounded-xl border border-[#E8E3DC] grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#6B6258]">
                  {Object.entries(selectedAppDetail.formData).map(([k, v]) => (
                    <div key={k}>
                      <span className="font-bold capitalize text-[#1F1F1F]">{k.replace(/([A-Z])/g, ' $1')}:</span>{' '}
                      <span>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes & Status Updates */}
            <div className="space-y-2">
              <label className="block font-bold text-[#1F1F1F] uppercase tracking-wider text-[11px]">
                Administrative Review Notes
              </label>
              <textarea
                rows={2}
                value={adminNotesInput}
                onChange={(e) => setAdminNotesInput(e.target.value)}
                placeholder="Enter evaluation notes or reason for approval/rejection..."
                className="w-full bg-[#FAFAF7] border border-[#E8E3DC] focus:bg-white focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/15 rounded-xl p-3 text-xs text-[#1F1F1F] outline-none"
              />
            </div>

            {statusToast && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  statusToast.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span>{statusToast.message}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E8E3DC]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportApplicationDossierPDF(selectedAppDetail)}
                  className="px-3.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 font-semibold text-xs shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                  title="Download candidate official dossier with full submitted data as PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Download Dossier (PDF)</span>
                </button>
                <button
                  type="button"
                  disabled={isUpdatingAppStatus}
                  onClick={() => handleUpdateAppStatus(selectedAppDetail.id, 'APPROVED')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all flex items-center gap-1.5 text-white ${
                    selectedAppDetail.status === 'APPROVED' || selectedAppDetail.status === 'CONFIRMED'
                      ? 'bg-emerald-700 ring-2 ring-emerald-400'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isUpdatingAppStatus && (
                    <LoadingSpinner size="xs" variant="white" inline className="mr-1.5" />
                  )}
                  {selectedAppDetail.status === 'APPROVED' || selectedAppDetail.status === 'CONFIRMED' ? '✓ Approved' : 'Approve Application'}
                </button>
                <button
                  type="button"
                  disabled={isUpdatingAppStatus}
                  onClick={() => handleUpdateAppStatus(selectedAppDetail.id, 'REJECTED')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all flex items-center gap-1.5 text-white ${
                    selectedAppDetail.status === 'REJECTED'
                      ? 'bg-rose-700 ring-2 ring-rose-400'
                      : 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isUpdatingAppStatus && (
                    <LoadingSpinner size="xs" variant="white" inline className="mr-1.5" />
                  )}
                  {selectedAppDetail.status === 'REJECTED' ? '✓ Rejected' : 'Reject'}
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

      {/* Appoint Faculty & Staff Modal */}
      <AppointStaffModal
        isOpen={isAppointStaffModalOpen}
        onClose={() => setIsAppointStaffModalOpen(false)}
        onStaffAppointed={(newStaff) => {
          setIsAppointStaffModalOpen(false);
          fetchAdminData();
          setStatusToast(`Successfully appointed ${newStaff.name} as ${newStaff.role}`);
        }}
      />

      {/* Manage Course Allotments Modal */}
      {selectedStaffForAllotment && (
        <ManageAllotmentsModal
          isOpen={isManageAllotmentsModalOpen}
          onClose={() => {
            setIsManageAllotmentsModalOpen(false);
            setSelectedStaffForAllotment(null);
          }}
          staffMember={selectedStaffForAllotment}
          allCourses={courses}
          allStaff={staffList}
          allotmentsList={allotmentsList}
          onAllotmentsSaved={(updatedAllotments) => {
            setIsManageAllotmentsModalOpen(false);
            setSelectedStaffForAllotment(null);
            fetchAdminData();
            setStatusToast('Course allotments successfully updated.');
          }}
        />
      )}

      {/* Change Staff Permanent Credentials Modal */}
      {selectedStaffForCredentials && (
        <ChangeStaffCredentialsModal
          isOpen={isCredentialsModalOpen}
          onClose={() => {
            setIsCredentialsModalOpen(false);
            setSelectedStaffForCredentials(null);
          }}
          staffMember={selectedStaffForCredentials}
          onCredentialsUpdated={(updatedStaff) => {
            setIsCredentialsModalOpen(false);
            setSelectedStaffForCredentials(null);
            fetchAdminData();
            setStatusToast(`Permanent credentials updated for ${updatedStaff?.name || 'faculty member'}.`);
          }}
        />
      )}

      </div>
    </div>
  );
};
