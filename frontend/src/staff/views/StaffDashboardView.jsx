import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Award,
  Search,
  Filter,
  LogOut,
  Send,
  Calendar,
  Layers,
  ChevronRight,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Sparkles,
  BarChart2,
  Bell,
  Video,
  PlusCircle,
  Star,
  Check,
  X,
  Menu,
  Sliders,
  Mail,
  ShieldCheck,
  Film,
  Play,
  Trash2,
  Edit3,
  Plus,
  Tv,
  CheckSquare,
  FileCode,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const StaffDashboardView = ({ onNavigate }) => {
  const { user, logout } = useAuth();

  // Sidebar & Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'classes' | 'courses' | 'evaluations' | 'grading' | 'announcements'

  // Data Metrics & Lists
  const [metrics, setMetrics] = useState({
    totalAssignedCourses: 0,
    totalEnrolledStudents: 0,
    pendingEvaluationsCount: 0,
    confirmedAdmissionsCount: 0,
  });
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Course Classes & Episode Management State
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [classesList, setClassesList] = useState([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState(null);
  const [classForm, setClassForm] = useState({
    classNumber: 1,
    title: '',
    description: '',
    videoUrl: '',
    duration: '1 hr 15 mins',
    resourcesUrl: '',
    status: 'PUBLISHED',
  });
  const [isSavingClass, setIsSavingClass] = useState(false);

  // Evaluation modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [evalNotes, setEvalNotes] = useState('');
  const [evalScore, setEvalScore] = useState(8);
  const [evalRecommendation, setEvalRecommendation] = useState('RECOMMENDED');
  const [isSavingEval, setIsSavingEval] = useState(false);

  // New Announcement state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState('NORMAL');
  const [isPostingAnn, setIsPostingAnn] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Search filters
  const [appSearch, setAppSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [appFilterStatus, setAppFilterStatus] = useState('ALL');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Classes for Selected Course
  const fetchClassesForCourse = async (courseId) => {
    if (!courseId) return;
    setIsLoadingClasses(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/staff/courses/${courseId}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClassesList(data.classes || []);
      }
    } catch (err) {
      console.error('Fetch classes error:', err);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // Fetch Staff Portal Data
  const fetchStaffData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [overRes, courseRes, appRes, studRes, annRes] = await Promise.all([
        fetch('/api/staff/overview', { headers }),
        fetch('/api/staff/courses', { headers }),
        fetch('/api/staff/applications', { headers }),
        fetch('/api/staff/students', { headers }),
        fetch('/api/staff/announcements', { headers }),
      ]);

      let loadedCourses = [];
      if (courseRes.ok) {
        const data = await courseRes.json();
        loadedCourses = data.courses || [];
        setCourses(loadedCourses);
        if (loadedCourses.length > 0 && !selectedCourseId) {
          const firstCourseId = loadedCourses[0].id;
          setSelectedCourseId(firstCourseId);
          fetchClassesForCourse(firstCourseId);
        }
      }
      if (overRes.ok) {
        const data = await overRes.json();
        setMetrics(data.metrics || {});
      }
      if (appRes.ok) {
        const data = await appRes.json();
        setApplications(data.applications || []);
      }
      if (studRes.ok) {
        const data = await studRes.json();
        setStudents(data.students || []);
      }
      if (annRes.ok) {
        const data = await annRes.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (e) {
      console.error('Staff portal fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  // When selectedCourseId changes, load classes
  useEffect(() => {
    if (selectedCourseId) {
      fetchClassesForCourse(selectedCourseId);
    }
  }, [selectedCourseId]);

  // Open Modal for New Class
  const handleOpenNewClassModal = () => {
    setClassToEdit(null);
    setClassForm({
      classNumber: classesList.length + 1,
      title: `Class ${classesList.length + 1}: `,
      description: '',
      videoUrl: '',
      duration: '1 hr 15 mins',
      resourcesUrl: '',
      status: 'PUBLISHED',
    });
    setIsClassModalOpen(true);
  };

  // Open Modal for Edit Class
  const handleOpenEditClassModal = (cls) => {
    setClassToEdit(cls);
    setClassForm({
      classNumber: cls.classNumber || 1,
      title: cls.title || '',
      description: cls.description || '',
      videoUrl: cls.videoUrl || '',
      duration: cls.duration || '1 hr 15 mins',
      resourcesUrl: cls.resourcesUrl || '',
      status: cls.status || 'PUBLISHED',
    });
    setIsClassModalOpen(true);
  };

  // Save / Update Class Episode
  const handleSaveClass = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !classForm.title.trim()) {
      alert('Please provide a class title.');
      return;
    }

    setIsSavingClass(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const isEditing = !!classToEdit;
      const url = isEditing
        ? `/api/staff/courses/${selectedCourseId}/classes/${classToEdit.id}`
        : `/api/staff/courses/${selectedCourseId}/classes`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(classForm),
      });

      if (res.ok) {
        showToast(isEditing ? 'Class episode updated successfully.' : 'New class episode published!');
        setIsClassModalOpen(false);
        fetchClassesForCourse(selectedCourseId);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save class episode.');
      }
    } catch (err) {
      console.error('Save class error:', err);
      alert('Failed to save class episode.');
    } finally {
      setIsSavingClass(false);
    }
  };

  // Delete Class Episode
  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class episode?')) return;

    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/staff/courses/${selectedCourseId}/classes/${classId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showToast('Class episode removed.');
        fetchClassesForCourse(selectedCourseId);
      } else {
        alert('Failed to delete class episode.');
      }
    } catch (err) {
      console.error('Delete class error:', err);
    }
  };

  // Submit Candidate Evaluation
  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setIsSavingEval(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/staff/applications/${selectedApp.id}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          staffNotes: evalNotes,
          interviewScore: parseInt(evalScore, 10),
          recommendation: evalRecommendation,
          newStatus: evalRecommendation === 'RECOMMENDED' ? 'APPROVED' : 'UNDER_REVIEW',
        }),
      });

      if (res.ok) {
        showToast('Candidate evaluation saved successfully.');
        setSelectedApp(null);
        fetchStaffData();
      } else {
        alert('Failed to save evaluation.');
      }
    } catch (err) {
      console.error('Save eval error:', err);
    } finally {
      setIsSavingEval(false);
    }
  };

  // Broadcast Announcement
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    setIsPostingAnn(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/staff/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: annTitle.trim(),
          content: annContent.trim(),
          priority: annPriority,
        }),
      });

      if (res.ok) {
        showToast('Announcement broadcasted to cohort students.');
        setAnnTitle('');
        setAnnContent('');
        fetchStaffData();
      } else {
        alert('Failed to post announcement.');
      }
    } catch (err) {
      console.error('Announcement post error:', err);
    } finally {
      setIsPostingAnn(false);
    }
  };

  const currentSelectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const filteredApps = applications.filter((a) => {
    const term = appSearch.toLowerCase();
    const matchesSearch =
      (a.userName || '').toLowerCase().includes(term) ||
      (a.userEmail || '').toLowerCase().includes(term) ||
      (a.courseTitle || '').toLowerCase().includes(term);

    if (appFilterStatus === 'ALL') return matchesSearch;
    if (appFilterStatus === 'PENDING') return matchesSearch && a.status === 'UNDER_REVIEW';
    if (appFilterStatus === 'APPROVED') return matchesSearch && (a.status === 'APPROVED' || a.status === 'CONFIRMED');
    return matchesSearch;
  });

  const filteredStudents = students.filter((s) => {
    const term = studentSearch.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term) ||
      (s.institution || '').toLowerCase().includes(term)
    );
  });

  const navigationItems = [
    { id: 'overview', label: 'Faculty Overview', icon: BarChart2 },
    { id: 'classes', label: 'Course Classes & Episodes', icon: Film, count: classesList.length },
    { id: 'courses', label: 'Assigned Programs', icon: BookOpen, count: courses.length },
    { id: 'evaluations', label: 'Candidate Reviews', icon: Layers, count: metrics.pendingEvaluationsCount },
    { id: 'grading', label: 'Student Cohort & Grades', icon: Users, count: students.length },
    { id: 'announcements', label: 'Cohort Notices', icon: Bell, count: announcements.length },
  ];

  return (
    <div className="min-h-screen bg-[#F4F8F8] text-slate-900 flex font-sans antialiased selection:bg-[#0F1E2E]/15 selection:text-[#0F1E2E]">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F1E2E] text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* MOBILE BACKDROP OVERLAY                                   */}
      {/* ========================================================= */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#0F1E2E]/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ========================================================= */}
      {/* SIDE PANEL / SIDEBAR (Responsive & Collapsible to Icon Mode) */}
      {/* ========================================================= */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#0F1E2E] border-r border-slate-800 flex flex-col justify-between select-none transition-[width,padding,transform] duration-300 ease-in-out will-change-[width] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          // Mobile state: slide in / out
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl w-72 p-5' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop state: expanded w-72 or collapsed icon rail w-[78px]
          isSidebarCollapsed ? 'lg:w-[78px] lg:p-3' : 'lg:w-72 lg:p-5'
        }`}
      >
        <div className="space-y-6">
          {/* Sidebar Top: Logo & Hamburger Menu Toggle */}
          <div
            className={`flex items-center pb-3 border-b border-slate-800/80 transition-all duration-300 ${
              isSidebarCollapsed ? 'justify-center pt-1' : 'justify-between pt-1'
            }`}
          >
            {/* When Expanded: Show Full Logo + Portal Badge */}
            {!isSidebarCollapsed && (
              <div
                className="flex items-center gap-2.5 cursor-pointer select-none transition-transform hover:scale-102 min-w-0"
                onClick={() => setActiveTab('overview')}
                title="Staff Portal Overview"
              >
                <img
                  src="/logow.png"
                  alt="Claxic"
                  className="h-7 sm:h-8 w-auto object-contain drop-shadow-xs shrink-0"
                />
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#38BDF8] border-l border-slate-700 pl-2 truncate">
                  Staff Portal
                </span>
              </div>
            )}

            {/* Hamburger Button (Collapse on Desktop / Close on Mobile) */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileSidebarOpen(false);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              }}
              className={`rounded-xl bg-[#16293D] hover:bg-[#1E3A5F] text-[#38BDF8] hover:text-white transition-all duration-200 border border-slate-700/80 shadow-xs cursor-pointer flex items-center justify-center shrink-0 group ${
                isSidebarCollapsed ? 'w-11 h-11 mx-auto' : 'p-2'
              }`}
              title={isSidebarCollapsed ? 'Expand Side Panel' : 'Collapse to Icon Bar'}
              aria-label="Toggle Side Panel"
            >
              <Menu
                className={`text-[#38BDF8] transition-transform duration-300 ${
                  isSidebarCollapsed
                    ? 'w-5 h-5 group-hover:rotate-90 group-hover:scale-110'
                    : 'w-4 h-4 group-hover:scale-110'
                }`}
              />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 transition-opacity duration-200">
                Academic Directorate
              </p>
            )}

            <nav className="space-y-1.5">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      if (window.innerWidth < 1024) setIsMobileSidebarOpen(false);
                    }}
                    title={isSidebarCollapsed ? `${item.label} (${item.count !== undefined ? item.count : ''})` : undefined}
                    className={`rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer relative group flex items-center ${
                      isSidebarCollapsed
                        ? 'w-11 h-11 mx-auto justify-center'
                        : 'w-full justify-between px-3.5 py-2.5'
                    } ${
                      isActive
                        ? 'bg-[#16293D] text-[#38BDF8] font-bold border-l-4 border-[#38BDF8] shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`transition-transform duration-200 group-hover:scale-110 ${
                          isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'
                        } ${isActive ? 'text-[#38BDF8]' : 'text-slate-400'}`}
                      />
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {/* Count Pill when Expanded */}
                    {!isSidebarCollapsed && item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                          isActive
                            ? 'bg-[#38BDF8] text-[#0F1E2E]'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}

                    {/* Glowing Notification Dot when in Collapsed Icon Mode */}
                    {isSidebarCollapsed && item.count !== undefined && item.count > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#38BDF8] ring-2 ring-[#0F1E2E]" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Bottom: User Profile & Sign Out */}
        <div className="space-y-3 pt-4 border-t border-slate-800/80">
          {/* Expanded Profile Card */}
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="w-9 h-9 rounded-full bg-[#1E3A5F] text-[#38BDF8] text-xs font-bold flex items-center justify-center border border-[#38BDF8]/30 shrink-0">
                {(user?.name || 'F')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-white truncate">
                  {user?.name || 'Faculty Member'}
                </span>
                <span className="block text-[11px] text-[#38BDF8] truncate font-mono">
                  {user?.degree || 'Lead Instructor'}
                </span>
              </div>
            </div>
          ) : (
            /* Collapsed Profile Icon */
            <div
              className="w-11 h-11 mx-auto rounded-xl bg-[#1E3A5F] text-[#38BDF8] text-sm font-bold flex items-center justify-center border border-[#38BDF8]/30 cursor-default"
              title={`${user?.name || 'Faculty Member'} (${user?.degree || 'Instructor'})`}
            >
              {(user?.name || 'F')[0].toUpperCase()}
            </div>
          )}

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={() => {
              logout();
              if (onNavigate) onNavigate('staff-login');
            }}
            title={isSidebarCollapsed ? 'Sign Out' : undefined}
            className={`rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 text-xs font-semibold flex items-center justify-center border border-slate-700/80 transition-all cursor-pointer ${
              isSidebarCollapsed ? 'w-11 h-11 mx-auto' : 'w-full py-2 px-3 gap-2'
            }`}
          >
            <LogOut className={`${isSidebarCollapsed ? 'w-4 h-4' : 'w-4 h-4'}`} />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA                                         */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#CBD5E1] px-3.5 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between shadow-2xs gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Button (Only on mobile screens < 1024px) */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#F4F8F8] hover:bg-slate-200/80 text-[#0F1E2E] transition-colors border border-[#CBD5E1] cursor-pointer shadow-2xs shrink-0"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-[#0F1E2E] font-display truncate">
                {activeTab === 'overview' && 'Faculty Executive Overview'}
                {activeTab === 'classes' && 'Course Classes & Episodes Curriculum'}
                {activeTab === 'courses' && 'Assigned Academic Programs'}
                {activeTab === 'evaluations' && 'Candidate Application Reviews'}
                {activeTab === 'grading' && 'Student Cohorts & Gradebook'}
                {activeTab === 'announcements' && 'Cohort Broadcasts & Announcements'}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block truncate">
                Academic Curriculum & Candidate Evaluation Directorate
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {activeTab === 'classes' && (
              <button
                type="button"
                onClick={handleOpenNewClassModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Upload Class</span>
              </button>
            )}

            <a
              href="https://meet.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#0F1E2E] hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Video className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="hidden sm:inline">Live Class Room</span>
              <span className="sm:hidden text-[11px]">Live</span>
            </a>

            <div className="h-6 w-px bg-slate-200 hidden md:block" />

            <span className="text-xs text-slate-600 font-medium hidden lg:inline truncate max-w-[180px]">
              {user?.email}
            </span>
          </div>
        </header>

        {/* Tab Content Canvas */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-full overflow-x-hidden">

          {/* 1. TOP METRICS TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#CBD5E1] rounded-[20px] p-5 shadow-xs hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assigned Programs
                </span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center border border-sky-100">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F1E2E] font-mono">
                {metrics.totalAssignedCourses || courses.length}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Live active cohorts</p>
            </div>

            <div className="bg-white border border-[#CBD5E1] rounded-[20px] p-5 shadow-xs hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Enrolled Students
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F1E2E] font-mono">
                {metrics.totalEnrolledStudents || students.length}
              </h3>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">Active verified profiles</p>
            </div>

            <div className="bg-white border border-[#CBD5E1] rounded-[20px] p-5 shadow-xs hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Review Queue
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono">
                {metrics.pendingEvaluationsCount}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Pending candidate evaluations</p>
            </div>

            <div className="bg-white border border-[#CBD5E1] rounded-[20px] p-5 shadow-xs hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Confirmed Admissions
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F1E2E] font-mono">
                {metrics.confirmedAdmissionsCount}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Cohort capacity: {metrics.totalFilledSeats || 33} / {metrics.totalSeatsCapacity || 350}
              </p>
            </div>
          </div>

          {/* =================================================================== */}
          {/* TAB 1: OVERVIEW & FACULTY HUB                                       */}
          {/* =================================================================== */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Upcoming Lecture & Quick Actions */}
              <div className="lg:col-span-7 space-y-6">
                {/* Today's Live Class Banner with Staff Navy Background */}
                <div className="bg-[#0F1E2E] text-white border border-slate-800 rounded-[22px] p-6 relative overflow-hidden shadow-md">
                  <div className="flex items-center gap-2 text-[#38BDF8] text-xs font-mono font-bold mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>TODAY'S SCHEDULED LIVE LECTURE</span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Distributed Systems: Raft Consensus & Event-Driven Architecture
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-xl leading-relaxed">
                    Applied GenAI & Full-Stack System Architecture Cohort 2026. Live interactive lab and breakout rooms.
                  </p>

                  <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <a
                      href="https://meet.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-[0.99]"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Launch Faculty Meeting Room</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setActiveTab('classes')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 cursor-pointer transition-all"
                    >
                      <Film className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Manage Course Classes ({classesList.length})</span>
                    </button>
                  </div>
                </div>

                {/* Recent Candidate Submissions Quick Preview */}
                <div className="bg-white border border-[#CBD5E1] rounded-[22px] p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-[#0F1E2E]">
                        Recent Applications Awaiting Review
                      </h4>
                      <p className="text-xs text-slate-500">Student applications assigned to your faculty domain</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('evaluations')}
                      className="text-xs font-bold text-[#0284C7] hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {applications.slice(0, 4).map((app) => (
                      <div
                        key={app.id}
                        className="p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-slate-100/80 border border-slate-200 flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <div>
                          <span className="font-bold text-[#0F1E2E] block">{app.userName}</span>
                          <span className="text-slate-500 text-[11px]">{app.courseTitle} • {app.userEmail}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(app);
                            setEvalNotes(app.staffNotes || '');
                            setEvalScore(app.interviewScore || 8);
                            setActiveTab('evaluations');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#0F1E2E] text-white text-[11px] font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Evaluate
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Latest Announcements & Notices */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-[#CBD5E1] rounded-[22px] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#0F1E2E] flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#0284C7]" />
                      <span>Cohort Broadcasts</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveTab('announcements')}
                      className="text-xs font-bold text-[#0284C7] hover:underline"
                    >
                      + New Notice
                    </button>
                  </div>

                  <div className="space-y-3">
                    {announcements.slice(0, 3).map((ann) => (
                      <div key={ann.id} className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F1E2E] text-xs">{ann.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                        <span className="inline-block text-[10px] text-[#0284C7] font-semibold pt-1">
                          By {ann.authorName} ({ann.authorRole || 'Faculty'})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 2: COURSE CLASSES & EPISODES CURRICULUM UPLOADER                */}
          {/* =================================================================== */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              
              {/* Header & Course Selector Bar */}
              <div className="bg-white border border-[#CBD5E1] rounded-[24px] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0284C7] uppercase font-mono">
                    <Film className="w-4 h-4" />
                    <span>Curriculum Delivery Engine</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#0F1E2E]">Course Classes & Episodes (Class 1, Class 2...)</h3>
                  <p className="text-xs text-slate-500">
                    Upload, organize, and publish class videos, lecture slides, and sandbox repositories for students.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                  {/* Select Course dropdown */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="text-xs font-semibold text-slate-600 shrink-0">Course:</label>
                    <select
                      value={selectedCourseId || ''}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full sm:max-w-[280px] bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-bold text-[#0F1E2E] py-2 px-3 rounded-xl outline-none focus:border-[#0F1E2E] transition-all cursor-pointer truncate"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenNewClassModal}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F1E2E] hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 text-[#38BDF8]" />
                    <span>Upload New Class</span>
                  </button>
                </div>
              </div>

              {/* Course Info Banner */}
              {currentSelectedCourse && (
                <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-900">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-200/80 text-sky-800 flex items-center justify-center shrink-0">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block text-[#0F1E2E]">{currentSelectedCourse.title}</span>
                      <span className="text-slate-600 text-[11px]">
                        Category: {currentSelectedCourse.category} • {currentSelectedCourse.duration} • Level: {currentSelectedCourse.level}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-mono font-bold text-xs shrink-0">
                    <span className="px-2.5 py-1 bg-white border border-sky-200 rounded-lg text-[#0284C7]">
                      {classesList.length} Classes Uploaded
                    </span>
                  </div>
                </div>
              )}

              {/* Class Episodes List */}
              {isLoadingClasses ? (
                <div className="p-12 text-center text-xs text-slate-500 font-medium">
                  Loading class curriculum episodes...
                </div>
              ) : classesList.length === 0 ? (
                <div className="bg-white border border-[#CBD5E1] rounded-[24px] p-12 text-center space-y-3">
                  <Film className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-[#0F1E2E]">No classes uploaded yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Start publishing episodes (Class 1, Class 2, etc.) with video recordings and lecture notes for enrolled students.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenNewClassModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F1E2E] text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#38BDF8]" />
                    <span>Upload First Class</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {classesList
                    .sort((a, b) => (a.classNumber || 0) - (b.classNumber || 0))
                    .map((cls, idx) => (
                      <div
                        key={cls.id || idx}
                        className="bg-white border border-[#CBD5E1] rounded-[22px] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-3">
                          {/* Card Top: Class # Badge & Status */}
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-full bg-[#0F1E2E] text-white text-[10px] font-mono font-bold tracking-wider">
                              CLASS {cls.classNumber || idx + 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                cls.status === 'PUBLISHED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {cls.status || 'PUBLISHED'}
                            </span>
                          </div>

                          {/* Class Title */}
                          <h4 className="text-sm font-bold text-[#0F1E2E] leading-snug group-hover:text-[#0284C7] transition-colors">
                            {cls.title}
                          </h4>

                          {/* Class Description */}
                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                            {cls.description || 'Lecture video and supplementary material for this class module.'}
                          </p>
                        </div>

                        {/* Metadata & Actions */}
                        <div className="space-y-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                            <span className="flex items-center gap-1.5 font-mono text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{cls.duration || '60 mins'}</span>
                            </span>

                            {cls.videoUrl && (
                              <a
                                href={cls.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0284C7] hover:underline"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Watch Video</span>
                              </a>
                            )}
                          </div>

                          {cls.resourcesUrl && (
                            <a
                              href={cls.resourcesUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-1.5 px-3 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-[11px] text-slate-700 font-medium transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <FileCode className="w-3.5 h-3.5 text-[#0284C7]" />
                                <span className="truncate">Class Resources / Slides</span>
                              </span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          )}

                          {/* Action Buttons: Edit / Delete */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditClassModal(cls)}
                              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Edit Class Episode"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteClass(cls.id)}
                              className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Delete Class Episode"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Class Upload / Edit Modal */}
              {isClassModalOpen && (
                <div className="fixed inset-0 bg-[#0F1E2E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                  <div className="bg-white border border-[#CBD5E1] rounded-[24px] p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <h4 className="text-base font-bold text-[#0F1E2E] font-display">
                          {classToEdit ? 'Edit Class Episode' : 'Upload New Class Episode'}
                        </h4>
                        <p className="text-xs text-[#0284C7] font-medium truncate max-w-sm">
                          {currentSelectedCourse?.title}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsClassModalOpen(false)}
                        className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer rounded-lg hover:bg-slate-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Class / Episode #</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={classForm.classNumber}
                            onChange={(e) => setClassForm({ ...classForm, classNumber: e.target.value })}
                            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] font-mono focus:bg-white focus:border-[#0F1E2E] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Duration</label>
                          <input
                            type="text"
                            placeholder="e.g. 1 hr 15 mins"
                            value={classForm.duration}
                            onChange={(e) => setClassForm({ ...classForm, duration: e.target.value })}
                            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] focus:bg-white focus:border-[#0F1E2E] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Class Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Class 1: Course Overview & Developer Setup"
                          value={classForm.title}
                          onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] focus:bg-white focus:border-[#0F1E2E] outline-none font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Video Stream / Lecture URL</label>
                        <input
                          type="url"
                          placeholder="https://www.youtube.com/... or Vimeo / Google Drive / MP4"
                          value={classForm.videoUrl}
                          onChange={(e) => setClassForm({ ...classForm, videoUrl: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] font-mono focus:bg-white focus:border-[#0F1E2E] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Lecture Slides / Code Resources Link</label>
                        <input
                          type="url"
                          placeholder="https://github.com/... or Google Drive / PDF slides link"
                          value={classForm.resourcesUrl}
                          onChange={(e) => setClassForm({ ...classForm, resourcesUrl: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] font-mono focus:bg-white focus:border-[#0F1E2E] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Class Agenda / Description</label>
                        <textarea
                          rows={3}
                          placeholder="Key concepts covered, practical exercises, and homework instructions..."
                          value={classForm.description}
                          onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] placeholder-slate-400 focus:bg-white focus:border-[#0F1E2E] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Publish Status</label>
                        <select
                          value={classForm.status}
                          onChange={(e) => setClassForm({ ...classForm, status: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] font-mono focus:bg-white focus:border-[#0F1E2E] outline-none"
                        >
                          <option value="PUBLISHED">PUBLISHED (Students can watch immediately)</option>
                          <option value="DRAFT">DRAFT (Hidden from students)</option>
                        </select>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsClassModalOpen(false)}
                          className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingClass}
                          className="px-4 py-2.5 rounded-xl bg-[#0F1E2E] hover:bg-slate-800 text-white font-bold cursor-pointer disabled:opacity-50"
                        >
                          {isSavingClass ? 'Saving...' : classToEdit ? 'Save Changes' : 'Publish Class Episode'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 3: ASSIGNED COURSES & SYLLABI                                   */}
          {/* =================================================================== */}
          {activeTab === 'courses' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-[#0F1E2E]">Assigned Academic Programs & Syllabi</h3>
                <p className="text-xs text-slate-500">Explore cohort schedules, curriculum structure, and student capacities.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((c) => (
                  <div key={c.id} className="bg-white border border-[#CBD5E1] rounded-[22px] p-6 space-y-4 shadow-xs hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#0284C7] bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200 font-bold">
                          {c.category} • {c.level}
                        </span>
                        <h4 className="text-base font-bold text-[#0F1E2E] mt-2">{c.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{c.shortDescription}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#F8FAFC] border border-slate-100 text-center text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-medium">Duration</span>
                        <span className="font-bold text-[#0F1E2E] font-mono">{c.duration}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-medium">Enrolled</span>
                        <span className="font-bold text-emerald-700 font-mono">{c.enrolledCount || 0} Students</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-medium">Capacity</span>
                        <span className="font-bold text-[#0F1E2E] font-mono">{c.capacity || 40} Seats</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCourseId(c.id);
                        setActiveTab('classes');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#0F1E2E] hover:text-white text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Manage Classes & Episodes</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 4: CANDIDATE ACADEMIC EVALUATIONS                               */}
          {/* =================================================================== */}
          {activeTab === 'evaluations' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#0F1E2E]">Candidate Academic Evaluations</h3>
                  <p className="text-xs text-slate-500">Review student statements of purpose, conduct academic interviews, and submit admission recommendations.</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                      placeholder="Search candidate name..."
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#0F1E2E] placeholder-slate-400 focus:outline-none focus:border-[#0F1E2E] font-medium shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Applications Table */}
              <div className="bg-white border border-[#CBD5E1] rounded-[22px] overflow-hidden shadow-xs">
                <div className="overflow-x-auto [scrollbar-width:thin]">
                  <table className="w-full text-left text-xs min-w-[640px]">
                    <thead className="bg-[#F8FAFC] text-slate-700 uppercase text-[10px] font-mono border-b border-[#CBD5E1]">
                      <tr>
                        <th className="py-3.5 px-4 font-bold">Candidate Profile</th>
                        <th className="py-3.5 px-4 font-bold">Program Applied</th>
                        <th className="py-3.5 px-4 font-bold">Academic Background</th>
                        <th className="py-3.5 px-4 font-bold">Review Status</th>
                        <th className="py-3.5 px-4 text-right font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredApps.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-[#0F1E2E]">
                            <div>{app.userName}</div>
                            <div className="text-[11px] text-slate-500 font-mono font-normal">{app.userEmail}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 font-medium">{app.courseTitle}</td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {app.degree || 'B.Tech'} • {app.institution || 'University'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              app.status === 'CONFIRMED' || app.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApp(app);
                                setEvalNotes(app.staffNotes || '');
                                setEvalScore(app.interviewScore || 8);
                                setEvalRecommendation(app.recommendation || 'RECOMMENDED');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#0F1E2E] hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                              Review & Score
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Evaluation Modal */}
              {selectedApp && (
                <div className="fixed inset-0 bg-[#0F1E2E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                  <div className="bg-white border border-[#CBD5E1] rounded-[24px] p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <h4 className="text-base font-bold text-[#0F1E2E] font-display">
                          Evaluate: {selectedApp.userName}
                        </h4>
                        <p className="text-xs text-[#0284C7] font-medium">{selectedApp.courseTitle}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedApp(null)}
                        className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer rounded-lg hover:bg-slate-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Interview / Rubric Score (1 - 10)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={evalScore}
                          onChange={(e) => setEvalScore(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] font-mono focus:bg-white focus:border-[#0F1E2E] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Faculty Recommendation</label>
                        <select
                          value={evalRecommendation}
                          onChange={(e) => setEvalRecommendation(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] font-mono focus:bg-white focus:border-[#0F1E2E] outline-none"
                        >
                          <option value="RECOMMENDED">RECOMMENDED FOR ADMISSION</option>
                          <option value="NEEDS_REVIEW">NEEDS SECOND INTERVIEW</option>
                          <option value="REJECTED">DO NOT ADMIT</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Faculty Evaluation Notes</label>
                        <textarea
                          rows={3}
                          value={evalNotes}
                          onChange={(e) => setEvalNotes(e.target.value)}
                          placeholder="Enter candidate strengths, technical assessment feedback, and interview remarks..."
                          className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] placeholder-slate-400 focus:bg-white focus:border-[#0F1E2E] outline-none"
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedApp(null)}
                          className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingEval}
                          className="px-4 py-2.5 rounded-xl bg-[#0F1E2E] hover:bg-slate-800 text-white font-bold cursor-pointer disabled:opacity-50"
                        >
                          {isSavingEval ? 'Saving...' : 'Submit Faculty Review'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 5: STUDENT COHORT & GRADING                                     */}
          {/* =================================================================== */}
          {activeTab === 'grading' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#0F1E2E]">Student Cohort Roster</h3>
                  <p className="text-xs text-slate-500">View active enrolled students across your academic courses.</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search student by name..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#0F1E2E] placeholder-slate-400 focus:outline-none focus:border-[#0F1E2E] font-medium shadow-2xs"
                  />
                </div>
              </div>

              <div className="bg-white border border-[#CBD5E1] rounded-[22px] overflow-hidden shadow-xs">
                <div className="overflow-x-auto [scrollbar-width:thin]">
                  <table className="w-full text-left text-xs min-w-[580px]">
                    <thead className="bg-[#F8FAFC] text-slate-700 uppercase text-[10px] font-mono border-b border-[#CBD5E1]">
                      <tr>
                        <th className="py-3.5 px-4 font-bold">Student</th>
                        <th className="py-3.5 px-4 font-bold">Institution / Degree</th>
                        <th className="py-3.5 px-4 font-bold">Verification</th>
                        <th className="py-3.5 px-4 font-bold">Performance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-[#0F1E2E]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#0F1E2E] text-white text-xs font-bold flex items-center justify-center">
                                {(s.name || 'S')[0].toUpperCase()}
                              </div>
                              <div>
                                <div>{s.name}</div>
                                <div className="text-[11px] text-slate-500 font-mono font-normal">{s.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {s.institution || 'Verified Institute'} • {s.degree || 'Degree'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                              Verified
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[#0284C7] font-mono font-bold">92% Grade (A)</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 6: COHORT NOTICES & ANNOUNCEMENTS                               */}
          {/* =================================================================== */}
          {activeTab === 'announcements' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white border border-[#CBD5E1] rounded-[22px] p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-[#0F1E2E] flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#0284C7]" />
                  <span>Broadcast New Notice</span>
                </h3>

                <form onSubmit={handlePostAnnouncement} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Notice Title</label>
                    <input
                      type="text"
                      required
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g. Mid-term Capstone Project Submission Deadline"
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] placeholder-slate-400 focus:bg-white focus:border-[#0F1E2E] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Notice Priority</label>
                    <select
                      value={annPriority}
                      onChange={(e) => setAnnPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] font-mono focus:bg-white focus:border-[#0F1E2E] outline-none"
                    >
                      <option value="NORMAL">Standard Notice</option>
                      <option value="HIGH">High Priority (Urgent)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Announcement Body</label>
                    <textarea
                      rows={4}
                      required
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      placeholder="Write your cohort notice here..."
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] placeholder-slate-400 focus:bg-white focus:border-[#0F1E2E] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPostingAnn}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0F1E2E] hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isPostingAnn ? 'Broadcasting...' : 'Broadcast Notice to Students'}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 space-y-3">
                <h3 className="text-sm font-bold text-[#0F1E2E]">Broadcasted Notices</h3>
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-white border border-[#CBD5E1] rounded-[22px] p-5 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F1E2E] text-xs">{ann.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                    <div className="text-[10px] text-[#0284C7] pt-1 font-semibold">
                      Dispatched by {ann.authorName} ({ann.authorRole || 'Faculty'})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
