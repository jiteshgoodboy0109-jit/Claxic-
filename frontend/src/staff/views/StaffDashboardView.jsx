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
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

// Elegant 3-bar hamburger icon that smoothly morphs into a close 'X'
const HamburgerIcon = ({ isOpen, className = 'w-5 h-5' }) => (
  <div className={`relative flex flex-col justify-center items-center gap-[5px] ${className}`}>
    <span
      className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out origin-center ${
        isOpen ? 'rotate-45 translate-y-[7px]' : ''
      }`}
    />
    <span
      className={`w-5 h-0.5 bg-current rounded-full transition-all duration-200 ease-in-out ${
        isOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
      }`}
    />
    <span
      className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out origin-center ${
        isOpen ? '-rotate-45 -translate-y-[7px]' : ''
      }`}
    />
  </div>
);

export const StaffDashboardView = ({ initialTab = 'overview', onNavigate }) => {
  const { user, logout } = useAuth();

  // Sidebar & Layout State (with local persistence)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('claxic_staff_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
      return false;
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab === 'projects' ? 'overview' : initialTab);

  // Sync sidebar collapsed preference with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('claxic_staff_sidebar_collapsed', isSidebarCollapsed ? 'true' : 'false');
    } catch {}
  }, [isSidebarCollapsed]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab === 'projects' ? 'overview' : initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tabId) => {
    const target = tabId === 'projects' ? 'overview' : tabId;
    setActiveTab(target);
    if (onNavigate) {
      onNavigate(`staff/${target}`);
    } else {
      window.history.pushState(null, '', `/staff/${target}`);
    }
  };

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
    topics: '',
    summary: '',
    materialTitle: '',
    materialUrl: '',
    quizQuestion: '',
    quizOption0: '',
    quizOption1: '',
    quizOption2: '',
    quizOption3: '',
    quizCorrect: 0,
    quizExplanation: '',
    status: 'PUBLISHED',
  });
  const [isSavingClass, setIsSavingClass] = useState(false);

  // Student Progress & Attendance Tracking State
  const [studentProgressList, setStudentProgressList] = useState([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);



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
  // Course Management (Create & Settings Editor) State
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    category: 'Engineering',
    duration: '10 Days',
    dailyReleaseTime: '09:00',
    shortDescription: '',
    price: 0,
    capacity: 40,
    instructor: '',
  });
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  // Course-Specific Applications (Students who applied for selected course) State
  const [isCourseAppsModalOpen, setIsCourseAppsModalOpen] = useState(false);
  const [courseAppsList, setCourseAppsList] = useState([]);
  const [isLoadingCourseApps, setIsLoadingCourseApps] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [appSearch, setAppSearch] = useState('');
  const [appFilterStatus, setAppFilterStatus] = useState('ALL');
  const [studentSearch, setStudentSearch] = useState('');

  const formatReleaseTime = (timeStr) => {
    if (!timeStr) return '9:00 AM';
    const parts = String(timeStr).split(':');
    let hour = parseInt(parts[0], 10);
    const minute = parts[1] ? parts[1].padStart(2, '0') : '00';
    if (isNaN(hour)) return '9:00 AM';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  };

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

      if (
        overRes?.status === 401 ||
        courseRes?.status === 401 ||
        appRes?.status === 401 ||
        studRes?.status === 401 ||
        annRes?.status === 401
      ) {
        logout();
        if (onNavigate) onNavigate('staff-login');
        return;
      }
      if (
        overRes?.status === 403 ||
        courseRes?.status === 403 ||
        appRes?.status === 403 ||
        studRes?.status === 403 ||
        annRes?.status === 403
      ) {
        if (onNavigate) onNavigate('student');
        return;
      }

      let loadedCourses = [];
      if (courseRes?.ok) {
        const data = await courseRes.json();
        loadedCourses = data.courses || [];
        setCourses(loadedCourses);
        if (loadedCourses.length > 0 && !selectedCourseId) {
          const firstCourseId = loadedCourses[0].id;
          setSelectedCourseId(firstCourseId);
          fetchClassesForCourse(firstCourseId);
        }
      }
      if (overRes?.ok) {
        const data = await overRes.json();
        setMetrics(data.metrics || {});
      }
      if (appRes?.ok) {
        const data = await appRes.json();
        setApplications(data.applications || []);
      }
      if (studRes?.ok) {
        const data = await studRes.json();
        setStudents(data.students || []);
      }
      if (annRes?.ok) {
        const data = await annRes.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (e) {
      console.error('Staff portal fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Student Progress for Course
  const fetchStudentProgress = async (courseId) => {
    setIsLoadingProgress(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const targetId = courseId || selectedCourseId || 'ALL';
      const res = await fetch(`/api/staff/courses/${targetId}/students/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudentProgressList(data.students || []);
      }
    } catch (err) {
      console.error('Fetch student progress error:', err);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  // When selectedCourseId changes, reload classes and progress
  useEffect(() => {
    if (selectedCourseId) {
      fetchClassesForCourse(selectedCourseId);
      fetchStudentProgress(selectedCourseId);
    }
  }, [selectedCourseId]);

  // When active tab changes to progress, refresh data
  useEffect(() => {
    if (activeTab === 'progress' && selectedCourseId) {
      fetchStudentProgress(selectedCourseId);
    }
  }, [activeTab]);

  // Fetch Students Applied for Selected Course
  const fetchCourseApplications = async (courseId) => {
    if (!courseId) return;
    setIsLoadingCourseApps(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/staff/courses/${courseId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCourseAppsList(data.applications || []);
      }
    } catch (err) {
      console.error('Fetch course applications error:', err);
    } finally {
      setIsLoadingCourseApps(false);
    }
  };

  // Open Modal for Create Course
  const handleOpenNewCourseModal = () => {
    setCourseToEdit(null);
    setCourseForm({
      title: '',
      category: 'Engineering',
      duration: '10 Days',
      dailyReleaseTime: '09:00',
      shortDescription: '',
      price: 0,
      capacity: 40,
      instructor: user?.name || 'Claxic Faculty',
    });
    setIsCourseModalOpen(true);
  };

  // Open Modal for Edit Course Settings
  const handleOpenEditCourseModal = (course) => {
    if (!course) return;
    setCourseToEdit(course);
    setCourseForm({
      title: course.title || '',
      category: course.category || 'Engineering',
      duration: course.duration || '10 Days',
      dailyReleaseTime: course.dailyReleaseTime || '09:00',
      shortDescription: course.shortDescription || course.description || '',
      price: course.price || 0,
      capacity: course.capacity || 40,
      instructor: typeof course.instructor === 'object' ? course.instructor?.name : (course.instructor || user?.name || ''),
    });
    setIsCourseModalOpen(true);
  };

  // Save / Update Course
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.title.trim()) {
      alert('Course title is required.');
      return;
    }
    setIsSavingCourse(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const isEditing = !!courseToEdit;
      const url = isEditing ? `/api/staff/courses/${courseToEdit.id}` : `/api/staff/courses`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(courseForm),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(isEditing ? 'Course settings updated!' : 'New course created successfully!');
        setIsCourseModalOpen(false);
        await fetchStaffData();
        if (!isEditing && data.course?.id) {
          setSelectedCourseId(data.course.id);
          fetchClassesForCourse(data.course.id);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save course.');
      }
    } catch (err) {
      console.error('Save course error:', err);
      alert('Failed to save course.');
    } finally {
      setIsSavingCourse(false);
    }
  };

  // Open Modal for New Class
  const handleOpenNewClassModal = () => {
    setClassToEdit(null);
    const nextDayNum = classesList.length + 1;
    setClassForm({
      classNumber: nextDayNum,
      dayNumber: nextDayNum,
      title: `Day ${nextDayNum}: `,
      description: '',
      videoUrl: '',
      duration: '1 hr 30 mins',
      resourcesUrl: '',
      topics: '',
      summary: '',
      materialTitle: '',
      materialUrl: '',
      quizQuestion: '',
      quizOption0: '',
      quizOption1: '',
      quizOption2: '',
      quizOption3: '',
      quizCorrect: 0,
      quizExplanation: '',
      status: 'PUBLISHED',
    });
    setIsClassModalOpen(true);
  };

  // Open Modal for Edit Class
  const handleOpenEditClassModal = (cls) => {
    setClassToEdit(cls);
    const firstQuestion = cls.test?.questions?.[0] || null;
    setClassForm({
      classNumber: cls.classNumber || 1,
      dayNumber: cls.dayNumber || cls.classNumber || 1,
      title: cls.title || '',
      description: cls.description || '',
      videoUrl: cls.videoUrl || '',
      duration: cls.duration || '1 hr 30 mins',
      resourcesUrl: cls.resourcesUrl || '',
      topics: Array.isArray(cls.topics) ? cls.topics.join(', ') : (cls.topics || ''),
      summary: cls.summary || '',
      materialTitle: cls.learningMaterials?.[0]?.title || '',
      materialUrl: cls.learningMaterials?.[0]?.url || cls.resourcesUrl || '',
      quizQuestion: firstQuestion?.question || '',
      quizOption0: firstQuestion?.options?.[0] || '',
      quizOption1: firstQuestion?.options?.[1] || '',
      quizOption2: firstQuestion?.options?.[2] || '',
      quizOption3: firstQuestion?.options?.[3] || '',
      quizCorrect: firstQuestion?.correctIndex ?? 0,
      quizExplanation: firstQuestion?.explanation || '',
      status: cls.status || 'PUBLISHED',
    });
    setIsClassModalOpen(true);
  };

  // Save / Update Class Episode with Topics, Summary, Materials, and Test
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

      const payload = {
        classNumber: parseInt(classForm.classNumber, 10),
        dayNumber: parseInt(classForm.dayNumber || classForm.classNumber, 10),
        title: classForm.title.trim(),
        description: classForm.description.trim(),
        videoUrl: classForm.videoUrl.trim(),
        duration: classForm.duration.trim(),
        resourcesUrl: (classForm.resourcesUrl || classForm.materialUrl || '').trim(),
        topics: classForm.topics
          ? classForm.topics.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        summary: classForm.summary.trim(),
        learningMaterials: classForm.materialTitle
          ? [{ title: classForm.materialTitle.trim(), url: (classForm.materialUrl || classForm.resourcesUrl || '').trim() }]
          : (classToEdit?.learningMaterials || []),
        test: classForm.quizQuestion.trim()
          ? {
              id: classToEdit?.test?.id || `test_${Date.now()}`,
              title: `${classForm.title.trim()} Assessment`,
              passingScore: 70,
              questions: [
                {
                  id: 'q_1',
                  question: classForm.quizQuestion.trim(),
                  options: [
                    classForm.quizOption0.trim(),
                    classForm.quizOption1.trim(),
                    classForm.quizOption2.trim(),
                    classForm.quizOption3.trim(),
                  ].filter(Boolean),
                  correctIndex: parseInt(classForm.quizCorrect, 10) || 0,
                  explanation: classForm.quizExplanation.trim() || 'Correct architectural principle.',
                },
              ],
            }
          : (classToEdit?.test || null),
        status: classForm.status,
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(isEditing ? 'Class updated with topics & summary!' : 'New class published to course!');
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

  // Toggle Class Attendance for a Student
  const handleToggleAttendance = async (userId, classId, currentAttended) => {
    try {
      setIsMarkingAttendance(true);
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/staff/courses/${selectedCourseId || 'ALL'}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          classId,
          attended: !currentAttended,
        }),
      });
      if (res.ok) {
        showToast(!currentAttended ? 'Class attendance marked present.' : 'Attendance record updated.');
        fetchStudentProgress(selectedCourseId);
      }
    } catch (err) {
      console.error('Attendance toggle error:', err);
    } finally {
      setIsMarkingAttendance(false);
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
    { id: 'classes', label: 'Course Classes & Content', icon: Film, count: classesList.length },
    { id: 'progress', label: 'Student Progress & Attendance', icon: UserCheck, count: studentProgressList.length },
    { id: 'profile', label: 'Staff Profile', icon: User },
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
      {/* SIDE PANEL / SIDEBAR (Responsive & Collapsible with Morphing Nav) */}
      {/* ========================================================= */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#0F1E2E] border-r border-slate-800 flex flex-col justify-between select-none transition-[width,padding,transform] duration-300 ease-in-out will-change-[width] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          // Mobile state: slide in / out
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl w-72 p-5' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop state: expanded w-72 or collapsed icon rail w-20
          isSidebarCollapsed ? 'lg:w-20 lg:p-3' : 'lg:w-72 lg:p-5'
        }`}
      >
        <div className="space-y-6">
          {/* Sidebar Top: Logo & Morphing Hamburger Menu Toggle */}
          <div
            className={`flex items-center pb-3 border-b border-slate-800/80 transition-all duration-300 ${
              isSidebarCollapsed ? 'justify-center pt-1' : 'justify-between pt-1'
            }`}
          >
            {/* Logo + Portal Badge (smooth opacity & width transition) */}
            <div
              className={`flex items-center gap-2.5 cursor-pointer select-none transition-all duration-300 min-w-0 overflow-hidden ${
                isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-auto opacity-100'
              }`}
              onClick={() => handleTabChange('overview')}
              title="Staff Portal Overview"
            >
              <img
                src="/logow.png"
                alt="Claxic"
                className="h-7 sm:h-8 w-auto object-contain drop-shadow-xs shrink-0"
              />
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#38BDF8] border-l border-slate-700 pl-2 truncate whitespace-nowrap">
                Staff Portal
              </span>
            </div>

            {/* Hamburger Button with 3-Bar Morphing Icon */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileSidebarOpen(false);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              }}
              className={`rounded-xl bg-[#16293D] hover:bg-[#1E3A5F] text-[#38BDF8] hover:text-white transition-all duration-200 border border-slate-700/80 shadow-xs cursor-pointer flex items-center justify-center shrink-0 ${
                isSidebarCollapsed ? 'w-11 h-11 mx-auto' : 'p-2'
              }`}
              title={isSidebarCollapsed ? 'Expand Side Panel' : 'Collapse to Icon Bar'}
              aria-label="Toggle Side Panel"
            >
              <HamburgerIcon isOpen={window.innerWidth < 1024 ? true : !isSidebarCollapsed} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <div
              className={`transition-all duration-300 overflow-hidden ${
                isSidebarCollapsed ? 'h-0 opacity-0 pointer-events-none' : 'h-auto opacity-100 mb-2'
              }`}
            >
              <p className="px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                Academic Directorate
              </p>
            </div>

            <nav className="space-y-1.5">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      handleTabChange(item.id);
                      if (window.innerWidth < 1024) setIsMobileSidebarOpen(false);
                    }}
                    className={`rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer relative group flex items-center ${
                      isSidebarCollapsed
                        ? `w-11 h-11 mx-auto justify-center ${
                            isActive
                              ? 'bg-[#1E3A5F] text-[#38BDF8] font-bold border border-[#38BDF8]/40 shadow-sm ring-1 ring-[#38BDF8]/20'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          }`
                        : `w-full justify-between px-3.5 py-2.5 ${
                            isActive
                              ? 'bg-[#16293D] text-[#38BDF8] font-bold border-l-4 border-[#38BDF8] shadow-xs'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                          }`
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                      <Icon
                        className={`transition-transform duration-200 group-hover:scale-110 shrink-0 ${
                          isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'
                        } ${isActive ? 'text-[#38BDF8]' : 'text-slate-400 group-hover:text-white'}`}
                      />
                      <span
                        className={`transition-all duration-200 truncate whitespace-nowrap ${
                          isSidebarCollapsed
                            ? 'opacity-0 max-w-0 pointer-events-none'
                            : 'opacity-100 max-w-xs'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {/* Count Pill when Expanded */}
                    {!isSidebarCollapsed && item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 transition-opacity duration-200 ${
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
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#38BDF8] ring-2 ring-[#0F1E2E] animate-pulse" />
                    )}

                    {/* Floating Tooltip in Collapsed Mode (Desktop only) */}
                    {isSidebarCollapsed && (
                      <span className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-[#0F1E2E] text-white text-xs font-semibold tracking-wide shadow-2xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 translate-x-1 group-hover:translate-x-0 hidden lg:flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.count !== undefined && item.count > 0 && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#38BDF8] text-[#0F1E2E]">
                            {item.count}
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Bottom: User Profile & Sign Out */}
        <div className="space-y-3 pt-4 border-t border-slate-800/80">
          {/* Expanded Profile Card vs Collapsed Profile Icon */}
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 transition-all duration-200">
              <div className="w-9 h-9 rounded-full bg-[#1E3A5F] text-[#38BDF8] text-xs font-bold flex items-center justify-center border border-[#38BDF8]/30 shrink-0">
                {(user?.name || 'F')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="block text-xs font-bold text-white truncate whitespace-nowrap">
                  {user?.name || 'Faculty Member'}
                </span>
                <span className="block text-[11px] text-[#38BDF8] truncate font-mono whitespace-nowrap">
                  {user?.degree || 'Lead Instructor'}
                </span>
              </div>
            </div>
          ) : (
            /* Collapsed Profile Icon with Floating Tooltip */
            <div className="relative group flex justify-center">
              <div
                className="w-11 h-11 mx-auto rounded-xl bg-[#1E3A5F] text-[#38BDF8] text-sm font-bold flex items-center justify-center border border-[#38BDF8]/30 cursor-default shadow-xs transition-transform duration-200 group-hover:scale-105"
              >
                {(user?.name || 'F')[0].toUpperCase()}
              </div>
              <span className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-[#0F1E2E] text-white text-xs font-semibold tracking-wide shadow-2xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 translate-x-1 group-hover:translate-x-0 hidden lg:block">
                {user?.name || 'Faculty Member'} ({user?.degree || 'Instructor'})
              </span>
            </div>
          )}

          {/* Sign Out Button */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => {
                logout();
                if (onNavigate) onNavigate('staff-login');
              }}
              className={`rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 text-xs font-semibold flex items-center justify-center border border-slate-700/80 transition-all cursor-pointer ${
                isSidebarCollapsed ? 'w-11 h-11 mx-auto' : 'w-full py-2 px-3 gap-2'
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Sign Out</span>}
            </button>
            {isSidebarCollapsed && (
              <span className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-[#0F1E2E] text-rose-400 text-xs font-semibold tracking-wide shadow-2xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 translate-x-1 group-hover:translate-x-0 hidden lg:block">
                Sign Out
              </span>
            )}
          </div>
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
              className="lg:hidden p-2 rounded-xl bg-[#F4F8F8] hover:bg-slate-200/80 text-[#0F1E2E] transition-colors border border-[#CBD5E1] cursor-pointer shadow-2xs shrink-0 flex items-center justify-center"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <HamburgerIcon isOpen={isMobileSidebarOpen} className="w-5 h-5 text-[#0F1E2E]" />
            </button>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-[#0F1E2E] font-display truncate">
                {activeTab === 'overview' && 'Faculty Executive Overview'}
                {activeTab === 'classes' && 'Course Classes & Episodes Curriculum'}
                {activeTab === 'progress' && 'Student Progress & Attendance Tracking'}
                {activeTab === 'profile' && 'Staff Faculty Profile & Credentials'}
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Upload Class</span>
              </button>
            )}

            {activeTab === 'announcements' && (
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('announcement-title-input');
                  if (input) input.focus();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">New Notice</span>
              </button>
            )}

            {/* Clean Faculty Staff Identity Pill */}
            <div className="flex items-center gap-2 sm:gap-2.5 pl-1.5 sm:pl-2 pr-2.5 sm:pr-3 py-1 rounded-2xl bg-[#F4F8F8] border border-[#CBD5E1] shadow-2xs">
              <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#0F1E2E] text-white text-xs font-bold shrink-0 shadow-xs">
                {(user?.name || user?.email || 'F').charAt(0).toUpperCase()}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-emerald-500 border-2 border-white rounded-full"
                  title="Faculty Member Active"
                />
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight min-w-0">
                <span className="text-xs font-bold text-[#0F1E2E] truncate max-w-[130px] md:max-w-[180px]">
                  {user?.name || 'Faculty Staff'}
                </span>
                <span
                  className="text-[10px] font-medium text-slate-500 truncate max-w-[130px] md:max-w-[180px]"
                  title={user?.email}
                >
                  {user?.email}
                </span>
              </div>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#0284C7]/10 text-[#0284C7] uppercase tracking-wider shrink-0 border border-[#0284C7]/20">
                Staff
              </span>
            </div>
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
                      onClick={() => handleTabChange('classes')}
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
                      onClick={() => handleTabChange('evaluations')}
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
                            handleTabChange('evaluations');
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
                      onClick={() => handleTabChange('announcements')}
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
                <div className="p-5 rounded-2xl bg-sky-50/80 border border-sky-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs text-sky-950 shadow-2xs">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-sky-200/80 text-sky-800 flex items-center justify-center shrink-0 shadow-2xs">
                      <Tv className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-[#0F1E2E]">{currentSelectedCourse.title}</span>
                        <span className="px-2.5 py-0.5 rounded-md bg-[#0F1E2E] text-white text-[10px] font-mono font-bold">
                          {currentSelectedCourse.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 flex-wrap text-slate-600 text-[11px]">
                        <span>Duration: <strong className="text-slate-800">{currentSelectedCourse.duration || '10 Days'}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Daily Release: {formatReleaseTime(currentSelectedCourse.dailyReleaseTime || '09:00')}</span>
                        </span>
                        <span>•</span>
                        <span className="text-slate-500 font-mono">
                          (Unlocks day-by-day based on each student's start date)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        fetchCourseApplications(currentSelectedCourse.id);
                        setIsCourseAppsModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-900 border border-sky-300 font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Users className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span>Applied Students</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditCourseModal(currentSelectedCourse)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Sliders className="w-3.5 h-3.5 text-slate-600" />
                      <span>Course Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenNewCourseModal}
                      className="px-3 py-1.5 rounded-xl bg-[#0284C7] hover:bg-sky-700 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ New Course</span>
                    </button>
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
                    .sort((a, b) => (a.dayNumber || a.classNumber || 0) - (b.dayNumber || b.classNumber || 0))
                    .map((cls, idx) => (
                      <div
                        key={cls.id || idx}
                        className="bg-white border border-[#CBD5E1] rounded-[22px] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-3">
                          {/* Card Top: Class # Badge & Status */}
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-full bg-[#0F1E2E] text-white text-[10px] font-mono font-bold tracking-wider">
                              DAY {cls.dayNumber || cls.classNumber || idx + 1} • CLASS {cls.classNumber || idx + 1}
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
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {cls.description || 'Lecture video and supplementary material for this class module.'}
                          </p>

                          {/* Class-wise Topics */}
                          {cls.topics && cls.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {cls.topics.map((t, tidx) => (
                                <span key={tidx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-medium">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Post-Class Summary: What was taught */}
                          {cls.summary && (
                            <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100/90 text-[11px] text-teal-950 leading-relaxed">
                              <span className="font-bold text-[#0B4F50] block text-[10px] uppercase font-mono tracking-wider mb-0.5">
                                What Was Taught (Post-Class Summary)
                              </span>
                              <p className="line-clamp-3">{cls.summary}</p>
                            </div>
                          )}

                          {/* Class Quiz / Test Indicator */}
                          {cls.test && (
                            <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-sky-50 border border-sky-100 text-sky-900 font-medium">
                              <span className="flex items-center gap-1.5">
                                <CheckSquare className="w-3.5 h-3.5 text-[#0284C7]" />
                                <span className="font-bold truncate max-w-[180px]">{cls.test.title || 'Class Assessment'}</span>
                              </span>
                              <span className="font-mono text-[10px] font-bold text-[#0284C7] shrink-0">
                                Pass: {cls.test.passingScore || 70}%
                              </span>
                            </div>
                          )}
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

                          {(cls.resourcesUrl || (cls.learningMaterials && cls.learningMaterials.length > 0)) && (
                            <div className="space-y-1">
                              {cls.resourcesUrl && (
                                <a
                                  href={cls.resourcesUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full py-1.5 px-3 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-[11px] text-slate-700 font-medium transition-colors"
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <FileCode className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                                    <span className="truncate">Class Resources / Slides</span>
                                  </span>
                                  <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                                </a>
                              )}
                              {cls.learningMaterials && cls.learningMaterials.map((mat, midx) => (
                                <a
                                  key={midx}
                                  href={mat.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full py-1 px-3 rounded-lg bg-teal-50/50 hover:bg-teal-50 border border-teal-100 flex items-center justify-between text-[10px] text-teal-900 font-semibold transition-colors"
                                >
                                  <span className="truncate">📎 {mat.title || 'Learning Material'}</span>
                                  <ExternalLink className="w-3 h-3 text-teal-500 shrink-0" />
                                </a>
                              ))}
                            </div>
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
                              <span className="text-[11px]">Edit / Summary</span>
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

              {/* Enhanced Class Upload / Edit Modal */}
              {isClassModalOpen && (
                <div className="fixed inset-0 bg-[#0F1E2E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                  <div className="bg-white border border-[#CBD5E1] rounded-[24px] p-6 sm:p-7 max-w-2xl w-full space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <h4 className="text-base font-bold text-[#0F1E2E] font-display">
                          {classToEdit ? 'Edit Class & Update Post-Class Summary' : 'Upload New Class Episode & Content'}
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
                      {/* Section 1: Basic info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Class / Day #</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={classForm.classNumber}
                            onChange={(e) => setClassForm({ ...classForm, classNumber: e.target.value })}
                            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] font-mono focus:bg-white focus:border-[#0F1E2E] outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Class Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Class 1: Architecture Overview & Setup"
                            value={classForm.title}
                            onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] focus:bg-white focus:border-[#0F1E2E] outline-none font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Video Stream / Lecture URL</label>
                          <input
                            type="url"
                            placeholder="https://www.youtube.com/... or Vimeo / MP4"
                            value={classForm.videoUrl}
                            onChange={(e) => setClassForm({ ...classForm, videoUrl: e.target.value })}
                            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] font-mono focus:bg-white focus:border-[#0F1E2E] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Class Duration</label>
                          <input
                            type="text"
                            placeholder="e.g. 1 hr 30 mins"
                            value={classForm.duration}
                            onChange={(e) => setClassForm({ ...classForm, duration: e.target.value })}
                            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] focus:bg-white focus:border-[#0F1E2E] outline-none"
                          />
                        </div>
                      </div>

                      {/* Section 2: Class-wise Topics */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                          <span>Class Topics Taught (Comma-separated)</span>
                          <span className="text-[10px] text-slate-400 font-mono">e.g. Raft Consensus, Leader Election, Log Replication</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Topic 1, Topic 2, Topic 3"
                          value={classForm.topics}
                          onChange={(e) => setClassForm({ ...classForm, topics: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] focus:bg-white focus:border-[#0F1E2E] outline-none"
                        />
                      </div>

                      {/* Section 3: Post-Class Summary (What was taught) */}
                      <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-1.5">
                        <label className="block font-bold text-[#0B4F50] flex items-center justify-between">
                          <span>Post-Class Summary: What Was Taught *</span>
                          <span className="text-[10px] font-mono text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded">
                            Updated After Class
                          </span>
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Record key topics covered, architecture patterns demonstrated, student questions answered, and core takeaways..."
                          value={classForm.summary}
                          onChange={(e) => setClassForm({ ...classForm, summary: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-[#0F1E2E] placeholder-slate-400 focus:border-[#0B4F50] outline-none leading-relaxed"
                        />
                      </div>

                      {/* Section 4: Learning Materials */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Learning Material Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Lecture Slides & Code Repo"
                            value={classForm.materialTitle}
                            onChange={(e) => setClassForm({ ...classForm, materialTitle: e.target.value })}
                            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] focus:bg-white focus:border-[#0F1E2E] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Learning Material Download / GitHub URL</label>
                          <input
                            type="url"
                            placeholder="https://github.com/... or Google Drive PDF"
                            value={classForm.materialUrl}
                            onChange={(e) => setClassForm({ ...classForm, materialUrl: e.target.value })}
                            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] font-mono focus:bg-white focus:border-[#0F1E2E] outline-none"
                          />
                        </div>
                      </div>

                      {/* Section 5: Class Test / Quiz Builder */}
                      <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block font-bold text-sky-950 flex items-center gap-1.5">
                            <CheckSquare className="w-4 h-4 text-[#0284C7]" />
                            <span>Conduct Test / Quiz for this Class</span>
                          </label>
                          <span className="text-[10px] font-mono font-bold text-[#0284C7] bg-sky-100 px-2 py-0.5 rounded">
                            Auto-Graded
                          </span>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Question</label>
                          <input
                            type="text"
                            placeholder="e.g. Which Raft RPC is used to maintain leader heartbeat and append entries?"
                            value={classForm.quizQuestion}
                            onChange={(e) => setClassForm({ ...classForm, quizQuestion: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-[#0F1E2E] focus:border-[#0284C7] outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-slate-600 font-medium mb-0.5">Option A</label>
                            <input
                              type="text"
                              placeholder="Option A text"
                              value={classForm.quizOption0}
                              onChange={(e) => setClassForm({ ...classForm, quizOption0: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[#0F1E2E] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-medium mb-0.5">Option B</label>
                            <input
                              type="text"
                              placeholder="Option B text"
                              value={classForm.quizOption1}
                              onChange={(e) => setClassForm({ ...classForm, quizOption1: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[#0F1E2E] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-medium mb-0.5">Option C</label>
                            <input
                              type="text"
                              placeholder="Option C text"
                              value={classForm.quizOption2}
                              onChange={(e) => setClassForm({ ...classForm, quizOption2: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[#0F1E2E] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-medium mb-0.5">Option D</label>
                            <input
                              type="text"
                              placeholder="Option D text"
                              value={classForm.quizOption3}
                              onChange={(e) => setClassForm({ ...classForm, quizOption3: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[#0F1E2E] outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">Correct Option</label>
                            <select
                              value={classForm.quizCorrect}
                              onChange={(e) => setClassForm({ ...classForm, quizCorrect: parseInt(e.target.value, 10) })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[#0F1E2E] font-semibold outline-none"
                            >
                              <option value={0}>Option A is Correct</option>
                              <option value={1}>Option B is Correct</option>
                              <option value={2}>Option C is Correct</option>
                              <option value={3}>Option D is Correct</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">Explanation / Hint</label>
                            <input
                              type="text"
                              placeholder="Why this answer is correct..."
                              value={classForm.quizExplanation}
                              onChange={(e) => setClassForm({ ...classForm, quizExplanation: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[#0F1E2E] outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <label className="font-bold text-slate-700">Status:</label>
                          <select
                            value={classForm.status}
                            onChange={(e) => setClassForm({ ...classForm, status: e.target.value })}
                            className="px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] font-mono focus:bg-white outline-none"
                          >
                            <option value="PUBLISHED">PUBLISHED (Students can watch & learn)</option>
                            <option value="DRAFT">DRAFT (Hidden)</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsClassModalOpen(false)}
                            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingClass}
                            className="px-5 py-2 rounded-xl bg-[#0F1E2E] hover:bg-slate-800 text-white font-bold cursor-pointer disabled:opacity-50"
                          >
                            {isSavingClass ? 'Saving...' : classToEdit ? 'Save Changes' : 'Publish Class'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 2.5: STUDENT PROGRESS & ATTENDANCE TRACKER                      */}
          {/* =================================================================== */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              {/* Header & Course Selector Bar */}
              <div className="bg-white border border-[#CBD5E1] rounded-[24px] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0284C7] uppercase font-mono">
                    <UserCheck className="w-4 h-4" />
                    <span>Student Performance & Attendance Registry</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#0F1E2E]">Cohort Progress & Attendance Tracking</h3>
                  <p className="text-xs text-slate-500">
                    Monitor individual student learning velocity, mark class attendance, inspect test results, and track completion progress.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600 shrink-0">Course:</label>
                  <select
                    value={selectedCourseId || ''}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-bold text-[#0F1E2E] py-2 px-3 rounded-xl outline-none focus:border-[#0F1E2E] transition-all cursor-pointer"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Progress Table */}
              <div className="bg-white border border-[#CBD5E1] rounded-[22px] overflow-hidden shadow-xs">
                {isLoadingProgress ? (
                  <div className="p-12 text-center text-xs text-slate-500 font-medium">
                    Loading student cohort progress records...
                  </div>
                ) : studentProgressList.length === 0 ? (
                  <div className="p-12 text-center space-y-2">
                    <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-bold text-[#0F1E2E]">No enrolled students found for this program</h4>
                    <p className="text-xs text-slate-500">
                      Students will appear here automatically when they apply or confirm admission.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto [scrollbar-width:thin]">
                    <table className="w-full text-left text-xs min-w-[760px]">
                      <thead className="bg-[#F8FAFC] text-slate-700 uppercase text-[10px] font-mono border-b border-[#CBD5E1]">
                        <tr>
                          <th className="py-3.5 px-4 font-bold">Enrolled Student</th>
                          <th className="py-3.5 px-4 font-bold">Start Date</th>
                          <th className="py-3.5 px-4 font-bold">Course Progress</th>
                          <th className="py-3.5 px-4 font-bold">Class Attendance</th>
                          <th className="py-3.5 px-4 font-bold">Quizzes / Tests</th>
                          <th className="py-3.5 px-4 font-bold">Final Project</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {studentProgressList.map((st) => (
                          <tr key={st.userId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-[#0F1E2E]">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#0F1E2E] text-white text-xs font-bold flex items-center justify-center shrink-0">
                                  {(st.userName || 'S')[0].toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{st.userName}</div>
                                  <div className="text-[11px] text-slate-500 font-mono font-normal">{st.userEmail}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono text-slate-700 text-[11px]">
                              {st.startDate}
                            </td>

                            <td className="py-3.5 px-4 min-w-[140px]">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-[#0F1E2E] font-mono">{st.progressPercent}%</span>
                                  <span className="text-slate-500">{st.completedClassesCount} / {st.totalClasses} classes</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full bg-[#0284C7] rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, st.progressPercent)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="space-y-1.5">
                                <div className="font-bold text-[#0F1E2E] text-[11px]">
                                  {st.attendanceCount} Classes Attended
                                </div>
                                <div className="flex items-center gap-1">
                                  {classesList.slice(0, 5).map((cls, cIdx) => {
                                    const isAtt = (st.attendanceRecords || []).some(
                                      (att) => att.classId === cls.id && att.attended
                                    );
                                    return (
                                      <button
                                        key={cls.id || cIdx}
                                        type="button"
                                        disabled={isMarkingAttendance}
                                        onClick={() => handleToggleAttendance(st.userId, cls.id, isAtt)}
                                        title={`Click to toggle Class ${cls.classNumber || cIdx + 1} Attendance (${isAtt ? 'Attended' : 'Absent'})`}
                                        className={`w-6 h-6 rounded-md text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                                          isAtt
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                                        }`}
                                      >
                                        C{cls.classNumber || cIdx + 1}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {st.testResults && st.testResults.length > 0 ? (
                                <div className="space-y-0.5">
                                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-mono font-bold">
                                    Avg: {Math.round(st.testResults.reduce((sum, tr) => sum + (tr.score || 0), 0) / st.testResults.length)}%
                                  </span>
                                  <div className="text-[10px] text-slate-500">
                                    {st.testResults.filter(t => t.passed).length} / {st.testResults.length} passed
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">No tests taken</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              {st.finalProject ? (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  st.finalProject.status === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : st.finalProject.status === 'CHANGES_REQUESTED'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}>
                                  {st.finalProject.status}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-mono">Not Submitted</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* =================================================================== */}
          {/* TAB 3: ASSIGNED COURSES & SYLLABI                                   */}
          {/* =================================================================== */}
          {activeTab === 'courses' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0F1E2E]">Assigned Academic Programs & Syllabi</h3>
                  <p className="text-xs text-slate-500">Configure course durations, daily release times, and manage modular curriculums.</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenNewCourseModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F1E2E] hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 text-[#38BDF8]" />
                  <span>+ Create New Course</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((c) => (
                  <div key={c.id} className="bg-white border border-[#CBD5E1] rounded-[22px] p-6 space-y-4 shadow-xs hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#0284C7] bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200 font-bold">
                            {c.category} • {c.level || 'Professional'}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>{formatReleaseTime(c.dailyReleaseTime || '09:00')} Daily</span>
                          </span>
                        </div>
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

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourseId(c.id);
                          fetchClassesForCourse(c.id);
                          setActiveTab('classes');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#0F1E2E] hover:text-white text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Manage Classes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourseId(c.id);
                          fetchCourseApplications(c.id);
                          setIsCourseAppsModalOpen(true);
                        }}
                        className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284C7] border border-sky-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        title="View Applied Students"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Students</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditCourseModal(c)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                        title="Course Settings"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                      id="announcement-title-input"
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

          {/* =================================================================== */}
          {/* TAB: STAFF PROFILE & CREDENTIALS                                   */}
          {/* =================================================================== */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl space-y-6">
              {/* Profile Overview Card */}
              <div className="bg-white border border-[#CBD5E1] rounded-[22px] p-6 sm:p-8 shadow-xs relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 pb-6 border-b border-slate-100">
                  <div className="w-20 h-20 rounded-2xl bg-[#0F1E2E] text-white text-2xl font-bold flex items-center justify-center border-2 border-[#38BDF8]/40 shadow-md shrink-0">
                    {(user?.name || user?.email || 'F')[0].toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-xl font-bold text-[#0F1E2E] tracking-tight">
                        {user?.name || 'Faculty Member'}
                      </h2>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified Staff Member
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-[#0284C7]">
                      {user?.degree || 'Lead Course Faculty & Systems Instructor'}
                    </p>

                    <p className="text-xs text-slate-500 font-mono">
                      Official ID: {user?.id ? user.id.slice(0, 16) : 'STF-FACULTY-CORE'}
                    </p>
                  </div>
                </div>

                {/* Profile Key Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-mono uppercase font-bold text-slate-400 block">
                      Staff Email Address
                    </span>
                    <span className="text-xs font-semibold text-[#0F1E2E] flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#0284C7]" />
                      {user?.email || 'staff@claxic.edu'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-mono uppercase font-bold text-slate-400 block">
                      Assigned Department / Institute
                    </span>
                    <span className="text-xs font-semibold text-[#0F1E2E] flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-[#0284C7]" />
                      {user?.institution || 'Advanced Computing & Engineering Faculty'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-mono uppercase font-bold text-slate-400 block">
                      Faculty Mentorship & Office Hours
                    </span>
                    <span className="text-xs font-semibold text-[#0F1E2E] flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
                      Mon - Thu, 4:00 PM - 6:00 PM IST (Virtual Room)
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-mono uppercase font-bold text-slate-400 block">
                      Role Authentication & Access
                    </span>
                    <span className="text-xs font-semibold text-[#0F1E2E] flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-[#0284C7]" />
                      STAFF Role (Authenticated via Staff Portal)
                    </span>
                  </div>
                </div>

                {/* Assigned Courses Section */}
                <div className="pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#0284C7]" />
                    <span>Assigned Courses & Curriculum</span>
                  </h4>
                  <div className="space-y-2">
                    {courses.length > 0 ? (
                      courses.map((course) => (
                        <div
                          key={course.id}
                          className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#0F1E2E] block">{course.title}</span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {course.category} • {course.durationWeeks} Weeks • {course.level || 'Intermediate'}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0284C7]/10 text-[#0284C7] font-mono">
                            {course.enrolledCount || 0} Enrolled
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                        Lead Faculty for all enrolled cohort courses.
                      </div>
                    )}
                  </div>
                </div>

                {/* Privacy & Student Integration Notice */}
                <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-950 mb-0.5">Faculty Profile Visibility Note</p>
                    <p className="text-amber-800">
                      Your staff profile is integrated directly into the enrolled student's Course Learning Hub so students can see their assigned faculty lead and access scheduled office hours. To protect academic privacy, staff profiles are never published as a public or general directory.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODAL: CREATE / EDIT COURSE & SETTINGS                              */}
          {/* =================================================================== */}
          {isCourseModalOpen && (
            <div className="fixed inset-0 bg-[#0F1E2E]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white border border-[#CBD5E1] rounded-[28px] p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0284C7]">
                      Academic Curriculum Architecture
                    </span>
                    <h4 className="text-base font-bold text-[#0F1E2E]">
                      {courseToEdit ? 'Edit Course Settings' : 'Create New Course Program'}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCourseModalOpen(false)}
                    className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Course Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Distributed Cloud Architecture & Kubernetes"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] focus:bg-white focus:border-[#0F1E2E] outline-none font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category</label>
                      <select
                        value={courseForm.category}
                        onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] font-semibold outline-none"
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="AI & Full Stack">AI & Full Stack</option>
                        <option value="Cloud & DevOps">Cloud & DevOps</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Course Duration *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 10 Days, 12 Weeks, 30 Days"
                        value={courseForm.duration}
                        onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] font-semibold outline-none"
                      />
                    </div>
                  </div>

                  {/* Daily Lecture Release Time configuration */}
                  <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200/80 space-y-1.5">
                    <label className="block font-bold text-[#0B4F50] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#0B4F50]" />
                        <span>Daily Lecture Release Time *</span>
                      </span>
                      <span className="text-[10px] font-mono text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded font-bold">
                        Individual Day-by-Day Release
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="time"
                        required
                        value={courseForm.dailyReleaseTime}
                        onChange={(e) => setCourseForm({ ...courseForm, dailyReleaseTime: e.target.value })}
                        className="px-3 py-2 bg-white border border-teal-300 rounded-xl text-[#0F1E2E] font-mono font-bold text-sm outline-none focus:border-[#0B4F50]"
                      />
                      <span className="text-[11px] text-teal-900 leading-snug">
                        Every day's video and test automatically unlocks at this scheduled time based on each student's individual start date.
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Program Overview / Summary</label>
                    <textarea
                      rows={3}
                      placeholder="Describe what students will learn, project outcomes, and curriculum milestones..."
                      value={courseForm.shortDescription}
                      onChange={(e) => setCourseForm({ ...courseForm, shortDescription: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] placeholder-slate-400 focus:bg-white focus:border-[#0F1E2E] outline-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Seat Capacity</label>
                      <input
                        type="number"
                        min="1"
                        value={courseForm.capacity}
                        onChange={(e) => setCourseForm({ ...courseForm, capacity: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tuition Fee (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={courseForm.price}
                        onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Lead Instructor</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Sarah Jenkins"
                        value={courseForm.instructor}
                        onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F1E2E] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsCourseModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCourse}
                      className="px-5 py-2.5 rounded-xl bg-[#0F1E2E] hover:bg-slate-800 text-white font-bold cursor-pointer disabled:opacity-50"
                    >
                      {isSavingCourse ? 'Saving Course...' : courseToEdit ? 'Update Course Settings' : 'Create Course'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODAL: VIEW STUDENTS APPLIED FOR SELECTED COURSE                     */}
          {/* =================================================================== */}
          {isCourseAppsModalOpen && (
            <div className="fixed inset-0 bg-[#0F1E2E]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white border border-[#CBD5E1] rounded-[28px] p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0284C7]">
                      Cohort Admission Registry
                    </span>
                    <h4 className="text-base font-bold text-[#0F1E2E]">
                      Students Applied for {currentSelectedCourse?.title || 'Selected Course'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {courseAppsList.length} applicant{courseAppsList.length === 1 ? '' : 's'} registered for this program schedule.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCourseAppsModalOpen(false)}
                    className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isLoadingCourseApps ? (
                  <div className="p-12 text-center text-xs text-slate-500 font-medium">
                    Loading applied students list...
                  </div>
                ) : courseAppsList.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <Users className="w-10 h-10 text-slate-300 mx-auto" />
                    <h5 className="text-sm font-bold text-slate-800">No applicants yet</h5>
                    <p className="text-xs text-slate-500">
                      No students have applied for this specific program yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courseAppsList.map((app) => (
                      <div
                        key={app.id}
                        className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-white hover:shadow-xs transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0F1E2E] text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {(app.studentName || app.userName || 'S')[0].toUpperCase()}
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block text-sm">
                              {app.studentName || app.userName}
                            </span>
                            <span className="text-slate-500 font-mono text-[11px] block">
                              {app.studentEmail || app.userEmail} {app.studentPhone ? `• ${app.studentPhone}` : ''}
                            </span>
                            <div className="flex items-center gap-2 pt-0.5">
                              <span className="text-[10px] font-mono text-slate-500">
                                App #: <strong className="text-slate-700">{app.applicationNumber || app.id.slice(0, 10)}</strong>
                              </span>
                              <span>•</span>
                              <span className="text-[10px] font-mono text-[#0B4F50] font-semibold">
                                Start Date: {app.formData?.startDate || app.createdAt?.split('T')[0] || 'Day 1'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 sm:self-center">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                              app.status === 'CONFIRMED' || app.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCourseAppsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-[#0F1E2E] text-white font-bold text-xs cursor-pointer hover:bg-slate-800 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
