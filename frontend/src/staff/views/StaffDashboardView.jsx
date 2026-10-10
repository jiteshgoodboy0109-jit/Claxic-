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
  HelpCircle,
  Upload,
  Lock,
  KeyRound,
  Phone,
  Camera,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { NotificationBell } from '../../components/notifications/NotificationBell.jsx';



// Clean 3-bar hamburger icon (stays as 3 crisp parallel lines, never transforms to an 'X')
const HamburgerIcon = ({ className = 'w-5 h-5', barClassName = 'bg-current' }) => (
  <div className={`relative flex flex-col justify-center items-center gap-[4.5px] select-none ${className}`} aria-hidden="true">
    <span className={`w-4.5 h-[2px] ${barClassName} rounded-full transition-all duration-150`} />
    <span className={`w-4.5 h-[2px] ${barClassName} rounded-full transition-all duration-150`} />
    <span className={`w-4.5 h-[2px] ${barClassName} rounded-full transition-all duration-150`} />
  </div>
);

export const StaffDashboardView = ({ initialTab = 'overview', onNavigate }) => {
  const { user, logout, updateUser } = useAuth();

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
    setIsMobileSidebarOpen(false);
    setIsSidebarCollapsed(true);
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
    deliveryType: 'UPLOAD', // 'UPLOAD' | 'ONLINE'
    liveMeetingUrl: '',
    liveMeetingTime: '',
    liveMeetingInstructions: '',
    notesFile: null, // { fileName, fileType, fileSize, fileData }
  });
  const [isSavingClass, setIsSavingClass] = useState(false);

  // Local LMS Video Upload State
  const [videoFile, setVideoFile] = useState(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // Staff Profile & Photo State
  const [profileData, setProfileData] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    institution: user?.institution || '',
    degree: user?.degree || '',
    avatar: user?.avatar || '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedNoticeModal, setSelectedNoticeModal] = useState(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  // Student Progress & Attendance Tracking State
  const [studentProgressList, setStudentProgressList] = useState([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);

  // Photo file upload handler
  const handlePhotoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast('Image file size should be less than 3MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setProfileForm((prev) => ({ ...prev, avatar: dataUrl }));
      showToast('Profile photo loaded! Click "Save Profile Changes" to save.');
    };
    reader.readAsDataURL(file);
  };

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

  // Student Doubts & Clarifications State
  const [doubts, setDoubts] = useState([]);
  const [isLoadingDoubts, setIsLoadingDoubts] = useState(false);
  const [selectedDoubtForReply, setSelectedDoubtForReply] = useState(null);
  const [doubtReplyText, setDoubtReplyText] = useState('');
  const [isSubmittingDoubtReply, setIsSubmittingDoubtReply] = useState(false);
  const [doubtFilterStatus, setDoubtFilterStatus] = useState('ALL'); // 'ALL' | 'OPEN' | 'RESOLVED'
  const [doubtSearchTerm, setDoubtSearchTerm] = useState('');
  const [doubtCourseFilter, setDoubtCourseFilter] = useState('ALL');
  const [highlightedDoubtId, setHighlightedDoubtId] = useState(null);
  const [inlineReplyDoubtId, setInlineReplyDoubtId] = useState(null);
  const [inlineReplyTexts, setInlineReplyTexts] = useState({});
  const [submittingInlineId, setSubmittingInlineId] = useState(null);
  const [lastDoubtsSynced, setLastDoubtsSynced] = useState(null);

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

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  // Fetch Staff Profile with Allotted Courses Matrix
  const fetchStaffProfile = async () => {
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/staff/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfileData(data.profile);
          setProfileForm({
            name: data.profile.name || '',
            mobile: data.profile.mobile || '',
            institution: data.profile.institution || '',
            degree: data.profile.degree || '',
            avatar: data.profile.avatar || user?.avatar || '',
          });
        }
      }
    } catch (err) {
      console.error('Fetch staff profile error:', err);
    }
  };

  // Update Permitted Staff Profile Details (Role/Email/Allotments locked)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileFeedback(null);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/staff/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileFeedback({ type: 'success', message: 'Staff profile details & photo successfully updated!' });
        fetchStaffProfile();
        if (updateUser && data.profile) {
          updateUser({ ...user, ...data.profile });
        }
        showToast('Profile updated successfully.');
      } else {
        setProfileFeedback({ type: 'error', message: data.error || 'Failed to update profile.' });
      }
    } catch (err) {
      setProfileFeedback({ type: 'error', message: 'Network error updating profile.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Secure Staff Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordFeedback({ type: 'error', message: 'Current password and new password are required.' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordFeedback(null);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/staff/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordFeedback({ type: 'success', message: 'Password updated successfully! Other active sessions have been signed out.' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showToast('Password changed successfully.');
      } else {
        setPasswordFeedback({ type: 'error', message: data.error || 'Failed to change password.' });
      }
    } catch (err) {
      setPasswordFeedback({ type: 'error', message: 'Network error changing password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Detach and Remove Local LMS Video File from Lesson
  const handleDetachVideo = async (classId) => {
    if (!window.confirm('Are you sure you want to detach and delete this local LMS video file?')) return;
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/staff/courses/${selectedCourseId}/classes/${classId}/video`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Local video detached successfully.');
        setClassToEdit((prev) => (prev ? {
          ...prev,
          hasLocalVideo: false,
          videoId: null,
          videoOriginalName: null,
          videoSizeBytes: null,
        } : null));
        fetchClassesForCourse(selectedCourseId);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to detach video.');
      }
    } catch (err) {
      console.error('Detach video error:', err);
      alert('Network error while detaching video.');
    }
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

  // Fetch All Student Doubts
  const fetchDoubts = async (quiet = false) => {
    if (!quiet) setIsLoadingDoubts(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/staff/doubts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const incoming = data.doubts || [];
        setDoubts(incoming);
        setLastDoubtsSynced(new Date());
        return incoming;
      }
    } catch (err) {
      console.error('Fetch doubts error:', err);
    } finally {
      if (!quiet) setIsLoadingDoubts(false);
    }
    return [];
  };

  // Reply / Clarify Student Doubt (Modal)
  const handleReplyDoubt = async (e) => {
    e?.preventDefault();
    if (!selectedDoubtForReply || !doubtReplyText.trim()) return;
    setIsSubmittingDoubtReply(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/staff/doubts/${selectedDoubtForReply.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reply: doubtReplyText.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Clarification sent to student successfully! 🎉');
        setSelectedDoubtForReply(null);
        setDoubtReplyText('');
        await fetchDoubts();
        window.dispatchEvent(new CustomEvent('claxic_notifications_updated'));
      } else {
        showToast(data.error || 'Failed to submit clarification');
      }
    } catch (err) {
      showToast('Network error submitting clarification');
    } finally {
      setIsSubmittingDoubtReply(false);
    }
  };

  // Reply / Clarify Student Doubt (Inline Quick Reply)
  const handleReplyInlineDoubt = async (doubtId) => {
    const text = (inlineReplyTexts[doubtId] || '').trim();
    if (!text) {
      showToast('Please type a clarification reply for the student.');
      return;
    }
    setSubmittingInlineId(doubtId);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/staff/doubts/${doubtId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reply: text }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Clarification sent to student successfully! 🎉');
        setInlineReplyDoubtId(null);
        await fetchDoubts();
        window.dispatchEvent(new CustomEvent('claxic_notifications_updated'));
      } else {
        showToast(data.error || 'Failed to submit clarification');
      }
    } catch (err) {
      showToast('Network error submitting clarification');
    } finally {
      setSubmittingInlineId(null);
    }
  };

  // Delete / Dismiss Spam Doubt
  const handleDeleteDoubt = async (doubtId) => {
    if (!window.confirm('Are you sure you want to dismiss this student doubt?')) return;
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/staff/doubts/${doubtId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Doubt removed');
        fetchDoubts();
        window.dispatchEvent(new CustomEvent('claxic_notifications_updated'));
      }
    } catch (err) {
      showToast('Failed to delete doubt');
    }
  };

  // Fetch Staff Portal Data
  const fetchStaffData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [overRes, courseRes, appRes, studRes, annRes, dbtRes, profRes] = await Promise.all([
        fetch('/api/staff/overview', { headers }),
        fetch('/api/staff/courses', { headers }),
        fetch('/api/staff/applications', { headers }),
        fetch('/api/staff/students', { headers }),
        fetch('/api/staff/announcements', { headers }),
        fetch('/api/staff/doubts', { headers }),
        fetch('/api/staff/profile', { headers }),
      ]);

      if (
        overRes?.status === 401 ||
        courseRes?.status === 401 ||
        appRes?.status === 401 ||
        studRes?.status === 401 ||
        annRes?.status === 401 ||
        dbtRes?.status === 401 ||
        profRes?.status === 401
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
        annRes?.status === 403 ||
        dbtRes?.status === 403 ||
        profRes?.status === 403
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
      if (dbtRes?.ok) {
        const data = await dbtRes.json();
        setDoubts(data.doubts || []);
      }
      if (profRes?.ok) {
        const data = await profRes.json();
        if (data.profile) {
          setProfileData(data.profile);
          setProfileForm({
            name: data.profile.name || '',
            mobile: data.profile.mobile || '',
            institution: data.profile.institution || '',
            degree: data.profile.degree || '',
            avatar: data.profile.avatar || user?.avatar || '',
          });
        }
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

  // Live Doubts Synchronizer (Auto-Refresh on Doubts Tab)
  useEffect(() => {
    if (activeTab === 'doubts') {
      fetchDoubts();
      const interval = setInterval(() => {
        fetchDoubts(true);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Live Notification Auto-Update Listener
  useEffect(() => {
    const handleNotifUpdate = () => {
      if (activeTab === 'doubts') {
        fetchDoubts(true);
      }
    };
    window.addEventListener('claxic_notifications_updated', handleNotifUpdate);
    return () => window.removeEventListener('claxic_notifications_updated', handleNotifUpdate);
  }, [activeTab]);

  // Handle claxic_open_doubt Event: Direct Touch Navigation & Focus
  useEffect(() => {
    const handleOpenDoubtEvent = async (e) => {
      const { doubtId, courseId } = e.detail || {};
      setActiveTab('doubts');
      setDoubtFilterStatus('ALL');
      setDoubtCourseFilter('ALL');
      const latestDoubts = await fetchDoubts();
      if (doubtId) {
        setHighlightedDoubtId(doubtId);
        setInlineReplyDoubtId(doubtId);
        const target = latestDoubts.find((d) => d.id === doubtId);
        if (target) {
          setInlineReplyTexts((prev) => ({
            ...prev,
            [doubtId]: prev[doubtId] || target.reply || '',
          }));
        }
        setTimeout(() => {
          const el = document.getElementById(`doubt-card-${doubtId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-4', 'ring-[#F59E0B]', 'scale-[1.01]');
            setTimeout(() => {
              el.classList.remove('scale-[1.01]');
            }, 600);
          }
        }, 250);
      }
    };

    window.addEventListener('claxic_open_doubt', handleOpenDoubtEvent);
    return () => window.removeEventListener('claxic_open_doubt', handleOpenDoubtEvent);
  }, []);

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
      isFree: false,
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
    const courseIsFree = Boolean(course.isFree || Number(course.price) === 0);
    setCourseForm({
      title: course.title || '',
      category: course.category || 'Engineering',
      duration: course.duration || '10 Days',
      dailyReleaseTime: course.dailyReleaseTime || '09:00',
      shortDescription: course.shortDescription || course.description || '',
      isFree: courseIsFree,
      price: courseIsFree ? 0 : (course.price || 0),
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

  // Delete Allotted Course
  const handleDeleteCourse = async (courseId) => {
    const courseToDelete = courses.find((c) => c.id === courseId || c.slug === courseId);
    const courseName = courseToDelete ? courseToDelete.title : 'this course';
    if (!window.confirm(`Are you sure you want to permanently delete "${courseName}"? All curriculum classes, video lessons, and student enrollments will be completely removed.`)) {
      return;
    }
    try {
      setCourses((prev) => prev.filter((c) => c.id !== courseId && c.slug !== courseId));
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/staff/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast(`Course "${courseName}" has been permanently deleted.`);
        fetchStaffData();
        if (selectedCourseId === courseId) {
          setSelectedCourseId('');
        }
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete course.');
        fetchStaffData();
      }
    } catch (err) {
      console.error('Delete course error:', err);
      alert('Network error while deleting course.');
      fetchStaffData();
    }
  };

  // Open Modal for New Class
  const handleOpenNewClassModal = () => {
    setClassToEdit(null);
    setVideoFile(null);
    setIsUploadingVideo(false);
    setUploadProgressText('');
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
      deliveryType: 'UPLOAD',
      liveMeetingUrl: '',
      liveMeetingTime: '',
      liveMeetingInstructions: '',
      notesFile: null,
    });
    setIsClassModalOpen(true);
  };

  // Open Modal for Edit Class
  const handleOpenEditClassModal = (cls) => {
    setClassToEdit(cls);
    setVideoFile(null);
    setIsUploadingVideo(false);
    setUploadProgressText('');
    const firstQuestion = cls.test?.questions?.[0] || null;
    const existingFileNote = cls.learningMaterials?.find((m) => m.fileData || m.fileName) || null;
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
      deliveryType: cls.deliveryType || (cls.liveMeetingUrl ? 'ONLINE' : 'UPLOAD'),
      liveMeetingUrl: cls.liveMeetingUrl || '',
      liveMeetingTime: cls.liveMeetingTime || '',
      liveMeetingInstructions: cls.liveMeetingInstructions || '',
      notesFile: existingFileNote,
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

      // Build structured learning materials array supporting uploaded notes files (PDF, Word Doc, etc.)
      let materials = [];
      if (classForm.notesFile) {
        materials.push({
          title: (classForm.materialTitle || classForm.notesFile.fileName || 'Course Notes').trim(),
          fileName: classForm.notesFile.fileName,
          fileType: classForm.notesFile.fileType,
          fileSize: classForm.notesFile.fileSize,
          fileData: classForm.notesFile.fileData,
          url: (classForm.materialUrl || classForm.resourcesUrl || '').trim() || '#',
        });
      } else if (classForm.materialTitle.trim() || (classForm.materialUrl || classForm.resourcesUrl || '').trim()) {
        materials.push({
          title: classForm.materialTitle.trim() || 'Course Notes & Materials',
          url: (classForm.materialUrl || classForm.resourcesUrl || '').trim(),
        });
      } else if (classToEdit?.learningMaterials?.length) {
        materials = classToEdit.learningMaterials;
      }

      const payload = {
        classNumber: parseInt(classForm.classNumber, 10),
        dayNumber: parseInt(classForm.dayNumber || classForm.classNumber, 10),
        title: classForm.title.trim(),
        description: classForm.description.trim(),
        videoUrl: '', // External URLs removed in LMS local-first architecture
        duration: classForm.duration.trim(),
        resourcesUrl: (classForm.resourcesUrl || classForm.materialUrl || '').trim(),
        topics: classForm.topics
          ? classForm.topics.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        summary: classForm.summary.trim(),
        learningMaterials: materials,
        deliveryType: classForm.deliveryType === 'ONLINE' ? 'ONLINE' : 'UPLOAD',
        liveMeetingUrl: (classForm.liveMeetingUrl || '').trim(),
        liveMeetingTime: (classForm.liveMeetingTime || '').trim(),
        liveMeetingInstructions: (classForm.liveMeetingInstructions || '').trim(),
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
        const responseData = await res.json();
        const savedClassId = isEditing ? classToEdit.id : (responseData.class?.id || responseData.classId);

        // Upload local video if user attached one
        if (videoFile && savedClassId) {
          setIsUploadingVideo(true);
          setUploadProgressText('Uploading secure local LMS video...');
          try {
            const formData = new FormData();
            formData.append('video', videoFile);
            formData.append('duration', classForm.duration.trim());

            const vidRes = await fetch(`/api/staff/courses/${selectedCourseId}/classes/${savedClassId}/video`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            });

            if (!vidRes.ok) {
              const vidData = await vidRes.json();
              showToast(vidData.error || 'Class saved, but video upload encountered an issue.');
            } else {
              showToast(isEditing ? 'Class and LMS video updated! 📹' : 'Class and LMS video published! 📹');
            }
          } catch (uploadErr) {
            console.error('Video upload error:', uploadErr);
            showToast('Class saved, but network error occurred during video upload.');
          } finally {
            setIsUploadingVideo(false);
          }
        } else {
          showToast(isEditing ? 'Class updated with topics & summary!' : 'New class published to course!');
        }

        setIsClassModalOpen(false);
        setVideoFile(null);
        setUploadProgressText('');
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
    { id: 'doubts', label: 'Student Doubts & Q&A', icon: HelpCircle, count: doubts.filter((d) => d.status === 'OPEN').length },
    { id: 'profile', label: 'Staff Profile', icon: User },
    { id: 'announcements', label: 'Cohort Notices', icon: Bell, count: announcements.length },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1F1F1F] flex font-sans antialiased selection:bg-[#FFF7E6] selection:text-[#D97706]">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5 border border-stone-700/80">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* MOBILE BACKDROP OVERLAY                                   */}
      {/* ========================================================= */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ========================================================= */}
      {/* SIDE PANEL / SIDEBAR (Responsive & Collapsible with Morphing Nav) */}
      {/* ========================================================= */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#18181B] border-r border-stone-800 text-stone-300 flex flex-col justify-between select-none transform-gpu transition-[width] duration-200 ease-out will-change-[width] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          // Mobile state: slide in / out
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl w-[280px] sm:w-72 max-w-[85vw] p-5 transition-transform duration-200 ease-out' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop state: expanded w-72 or collapsed icon rail w-20
          isSidebarCollapsed ? 'lg:w-20 lg:p-3' : 'lg:w-72 lg:p-5'
        }`}
      >
        <div className="space-y-6">
          {/* Sidebar Top: Logo & Hamburger Menu Toggle */}
          <div
            className={`flex items-center pb-3.5 border-b border-stone-800 transition-all duration-200 ${
              isSidebarCollapsed ? 'justify-center pt-1' : 'justify-between pt-1'
            }`}
          >
            {/* Logo + Portal Badge (smooth opacity & width transition) */}
            <div
              className={`flex items-center gap-2.5 cursor-pointer select-none transition-all duration-200 min-w-0 overflow-hidden ${
                isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-auto opacity-100'
              }`}
              onClick={() => handleTabChange('overview')}
              title="Staff Portal Overview"
            >
              <img
                src="/logo.png"
                alt="Claxic"
                className="h-7 sm:h-8 w-auto object-contain drop-shadow-xs shrink-0"
              />
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#FBBF24] bg-[#F59E0B]/15 border border-[#F59E0B]/35 px-2.5 py-0.5 rounded-full shrink-0">
                Faculty
              </span>
            </div>

            {/* Clean 3-Bar Hamburger Button */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileSidebarOpen(false);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              }}
              className={`rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white transition-all duration-150 border border-stone-700/70 shadow-xs cursor-pointer flex items-center justify-center shrink-0 ${
                isSidebarCollapsed ? 'w-11 h-11 mx-auto' : 'p-2'
              }`}
              title={isSidebarCollapsed ? 'Expand Side Panel' : 'Collapse to Icon Bar'}
              aria-label="Toggle Side Panel"
            >
              <HamburgerIcon className="w-5 h-5 text-stone-300" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5">
            <div
              className={`transition-all duration-300 overflow-hidden ${
                isSidebarCollapsed ? 'h-0 opacity-0 pointer-events-none' : 'h-auto opacity-100 mb-2'
              }`}
            >
              <p className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 whitespace-nowrap flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0" />
                <span>Academic Directorate</span>
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
                      setIsMobileSidebarOpen(false);
                      setIsSidebarCollapsed(true);
                    }}
                    className={`rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer relative group flex items-center ${
                      isSidebarCollapsed
                        ? `w-11 h-11 mx-auto justify-center ${
                            isActive
                              ? 'bg-[#222329] text-[#FBBF24] font-bold border border-[#F59E0B]/35 shadow-[0_2px_10px_rgba(245,158,11,0.2)]'
                              : 'text-stone-400 hover:text-white hover:bg-stone-800'
                          }`
                        : `w-full justify-between px-3.5 py-2.5 ${
                            isActive
                              ? 'bg-[#222329] border border-[#F59E0B]/35 text-white font-bold shadow-[0_2px_12px_rgba(245,158,11,0.14)]'
                              : 'text-stone-400 hover:text-white hover:bg-stone-800/70 font-medium'
                          }`
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                      {/* Left accent indicator for expanded active state */}
                      {!isSidebarCollapsed && isActive && (
                        <span className="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-[#FBBF24] to-[#D97706] shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0" />
                      )}
                      <Icon
                        className={`transition-transform duration-200 group-hover:scale-105 shrink-0 ${
                          isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'
                        } ${isActive ? 'text-[#FBBF24]' : 'text-stone-400 group-hover:text-stone-200'}`}
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
                            ? 'bg-[#F59E0B] text-black shadow-xs font-bold'
                            : 'bg-stone-800 text-stone-300 border border-stone-700'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}

                    {/* Glowing Notification Dot when in Collapsed Icon Mode */}
                    {isSidebarCollapsed && item.count !== undefined && item.count > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F59E0B] ring-2 ring-[#18181B] animate-pulse" />
                    )}

                    {/* Floating Tooltip in Collapsed Mode (Desktop only) */}
                    {isSidebarCollapsed && (
                      <span className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-[#18181B] text-white text-xs font-semibold tracking-wide shadow-2xl border border-stone-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 translate-x-1 group-hover:translate-x-0 hidden lg:flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.count !== undefined && item.count > 0 && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#F59E0B] text-black">
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
        <div className="space-y-3 pt-4 border-t border-stone-800">
          {/* Expanded Profile Card vs Collapsed Profile Icon */}
          {!isSidebarCollapsed ? (
            <div
              onClick={() => handleTabChange('profile')}
              className="flex items-center gap-3 p-3 rounded-2xl bg-[#222329] hover:bg-stone-800 border border-stone-800 transition-all duration-200 cursor-pointer shadow-xs group"
              title="View Faculty Profile"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-black text-xs font-bold flex items-center justify-center shadow-xs shrink-0 ring-2 ring-stone-700/80 group-hover:ring-[#F59E0B]/50 transition-all">
                {(user?.name || 'F')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="block text-xs font-bold text-white truncate group-hover:text-stone-100">
                  {user?.name || 'Faculty Member'}
                </span>
                <span className="block text-[10px] text-[#FBBF24] truncate font-mono uppercase font-bold tracking-wider">
                  {user?.degree || 'Academic Program'}
                </span>
              </div>
            </div>
          ) : (
            /* Collapsed Profile Icon with Floating Tooltip */
            <div className="relative group flex justify-center">
              <div
                onClick={() => handleTabChange('profile')}
                className="w-11 h-11 mx-auto rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-black text-sm font-bold flex items-center justify-center cursor-pointer shadow-xs ring-2 ring-stone-700/80 hover:ring-[#F59E0B]/50 transition-transform duration-200 group-hover:scale-105"
                title={`${user?.name || 'Faculty Member'} (Click for profile)`}
              >
                {(user?.name || 'F')[0].toUpperCase()}
              </div>
              <span className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-[#18181B] text-white text-xs font-semibold tracking-wide shadow-2xl border border-stone-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 translate-x-1 group-hover:translate-x-0 hidden lg:block">
                {user?.name || 'Faculty Member'}
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
              className={`rounded-xl bg-stone-900/80 hover:bg-rose-950/40 text-stone-400 hover:text-rose-300 text-xs font-semibold flex items-center justify-center border border-stone-800 hover:border-rose-900/50 transition-all cursor-pointer ${
                isSidebarCollapsed ? 'w-11 h-11 mx-auto' : 'w-full py-2 px-3 gap-2'
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Sign Out</span>}
            </button>
            {isSidebarCollapsed && (
              <span className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-[#18181B] text-rose-400 text-xs font-semibold tracking-wide shadow-2xl border border-stone-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 translate-x-1 group-hover:translate-x-0 hidden lg:block">
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
        <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E8E3DC] px-3.5 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between shadow-2xs gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Button (Only on mobile screens < 1024px) */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#FAFAF7] hover:bg-stone-200/80 text-[#1F1F1F] transition-colors border border-[#E8E3DC] cursor-pointer shadow-2xs shrink-0 flex items-center justify-center"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <HamburgerIcon className="w-5 h-5 text-[#1F1F1F]" />
            </button>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-[#1F1F1F] font-display truncate">
                {activeTab === 'overview' && 'Faculty Executive Overview'}
                {activeTab === 'classes' && 'Course Classes & Episodes Curriculum'}
                {activeTab === 'progress' && 'Student Progress & Attendance Tracking'}
                {activeTab === 'doubts' && 'Student Doubts & Concept Clarifications'}
                {activeTab === 'profile' && 'Staff Faculty Profile & Credentials'}
                {activeTab === 'courses' && 'Assigned Academic Programs'}
                {activeTab === 'evaluations' && 'Candidate Application Reviews'}
                {activeTab === 'grading' && 'Student Cohorts & Gradebook'}
                {activeTab === 'announcements' && 'Cohort Broadcasts & Announcements'}
              </h1>
              <p className="text-[11px] sm:text-xs text-[#6B6258] hidden sm:block truncate">
                Academic Curriculum & Candidate Evaluation Directorate
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notification Bell */}
            <NotificationBell onNavigate={onNavigate} />

            {/* Clean Faculty Staff Identity Pill */}
            <div className="flex items-center gap-2 sm:gap-2.5 pl-1.5 sm:pl-2 pr-2.5 sm:pr-3 py-1 rounded-2xl bg-[#FAFAF7] border border-[#E8E3DC] shadow-2xs">
              <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-black text-xs font-bold shrink-0 shadow-xs ring-1 ring-stone-300 overflow-hidden">
                {profileForm.avatar || user?.avatar ? (
                  <img
                    src={profileForm.avatar || user?.avatar}
                    alt={user?.name || 'Faculty Member'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (user?.name || user?.email || 'F').charAt(0).toUpperCase()
                )}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-emerald-500 border-2 border-white rounded-full z-10"
                  title="Faculty Member Active"
                />
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight min-w-0">
                <span className="text-xs font-bold text-[#1F1F1F] truncate max-w-[130px] md:max-w-[180px]">
                  {user?.name || 'Faculty Staff'}
                </span>
                <span
                  className="text-[10px] font-medium text-[#6B6258] truncate max-w-[130px] md:max-w-[180px]"
                  title={user?.email}
                >
                  {user?.email}
                </span>
              </div>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#FFF7E6] text-[#D97706] uppercase tracking-wider shrink-0 border border-[#FEDDAA]">
                Faculty
              </span>
            </div>
          </div>
        </header>

        {/* Tab Content Canvas */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-full overflow-x-hidden">

          {/* =================================================================== */}
          {/* TAB 1: OVERVIEW & FACULTY HUB                                       */}
          {/* =================================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 1. TOP METRICS TILES (Only on Overview) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTabChange('courses')}
                  className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#F59E0B] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group text-left select-none"
                  title="Click to manage assigned academic programs"
                >
                  <div className="flex items-center justify-between text-[#6B6258] mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B6258] group-hover:text-[#D97706] transition-colors">
                      Assigned Programs
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#FFF7E6] text-[#D97706] border border-[#FEDDAA] flex items-center justify-center group-hover:bg-[#F59E0B] group-hover:text-white transition-all shadow-2xs">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] font-mono group-hover:text-[#D97706] transition-colors">
                    {metrics.totalAssignedCourses || courses.length}
                  </h3>
                  <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-[#F0EBE3]">
                    <span className="text-[#6B6258] font-medium">Live active cohorts</span>
                    <span className="font-bold text-[#D97706] opacity-90 group-hover:translate-x-0.5 transition-transform flex items-center">
                      View →
                    </span>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTabChange('students')}
                  className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#F59E0B] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group text-left select-none"
                  title="Click to view enrolled student directory"
                >
                  <div className="flex items-center justify-between text-[#6B6258] mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B6258] group-hover:text-[#D97706] transition-colors">
                      Enrolled Students
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#FFF7E6] text-[#D97706] border border-[#FEDDAA] flex items-center justify-center group-hover:bg-[#F59E0B] group-hover:text-white transition-all shadow-2xs">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] font-mono group-hover:text-[#D97706] transition-colors">
                    {metrics.totalEnrolledStudents || students.length}
                  </h3>
                  <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-[#F0EBE3]">
                    <span className="text-[#16A34A] font-semibold">Active verified profiles</span>
                    <span className="font-bold text-[#D97706] opacity-90 group-hover:translate-x-0.5 transition-transform flex items-center">
                      View →
                    </span>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTabChange('applications')}
                  className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#F59E0B] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group text-left select-none"
                  title="Click to review pending candidate applications"
                >
                  <div className="flex items-center justify-between text-[#6B6258] mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B6258] group-hover:text-[#D97706] transition-colors">
                      Review Queue
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#FFF7E6] text-[#D97706] border border-[#FEDDAA] flex items-center justify-center group-hover:bg-[#F59E0B] group-hover:text-white transition-all shadow-2xs">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#D97706] font-mono">
                    {metrics.pendingEvaluationsCount}
                  </h3>
                  <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-[#F0EBE3]">
                    <span className="text-[#6B6258] font-medium">Pending evaluations</span>
                    <span className="font-bold text-[#D97706] opacity-90 group-hover:translate-x-0.5 transition-transform flex items-center">
                      Review →
                    </span>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTabChange('applications')}
                  className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#F59E0B] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group text-left select-none"
                  title="Click to view confirmed admissions"
                >
                  <div className="flex items-center justify-between text-[#6B6258] mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B6258] group-hover:text-[#D97706] transition-colors">
                      Confirmed Admissions
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#FFF7E6] text-[#D97706] border border-[#FEDDAA] flex items-center justify-center group-hover:bg-[#F59E0B] group-hover:text-white transition-all shadow-2xs">
                      <Award className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] font-mono group-hover:text-[#D97706] transition-colors">
                    {metrics.confirmedAdmissionsCount}
                  </h3>
                  <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-[#F0EBE3]">
                    <span className="text-[#6B6258] font-medium">
                      Capacity: {metrics.totalFilledSeats || 33} / {metrics.totalSeatsCapacity || 350}
                    </span>
                    <span className="font-bold text-[#D97706] opacity-90 group-hover:translate-x-0.5 transition-transform flex items-center">
                      View →
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Upcoming Lecture & Quick Actions */}
              <div className="lg:col-span-7 space-y-6">

                {/* Student Doubts & Clarifications Hub */}
                <div className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#E8E3DC]/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#1F1F1F] flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-[#D97706]" />
                          <span>Student Doubts & Questions</span>
                        </h4>
                        {doubts.filter((d) => d.status === 'OPEN').length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#FFF7E6] text-[#D97706] border border-[#FEDDAA]">
                            {doubts.filter((d) => d.status === 'OPEN').length} Pending
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B6258] mt-0.5">
                        Class inquiries & questions submitted by students across your cohorts
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Filter Pills */}
                      <div className="flex items-center bg-[#FAFAF7] border border-[#E8E3DC] p-0.5 rounded-xl text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setDoubtFilterStatus('ALL')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            doubtFilterStatus === 'ALL'
                              ? 'bg-stone-900 text-white shadow-2xs'
                              : 'text-[#6B6258] hover:text-[#1F1F1F]'
                          }`}
                        >
                          All ({doubts.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDoubtFilterStatus('OPEN')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            doubtFilterStatus === 'OPEN'
                              ? 'bg-[#D97706] text-white shadow-2xs'
                              : 'text-[#6B6258] hover:text-[#1F1F1F]'
                          }`}
                        >
                          Open ({doubts.filter((d) => d.status === 'OPEN').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDoubtFilterStatus('RESOLVED')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            doubtFilterStatus === 'RESOLVED'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-[#6B6258] hover:text-[#1F1F1F]'
                          }`}
                        >
                          Resolved ({doubts.filter((d) => d.status === 'RESOLVED').length})
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTabChange('doubts')}
                        className="text-xs font-bold text-[#D97706] hover:underline shrink-0 ml-1"
                      >
                        View All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {doubts
                      .filter((d) => {
                        if (doubtFilterStatus === 'OPEN') return d.status === 'OPEN';
                        if (doubtFilterStatus === 'RESOLVED') return d.status === 'RESOLVED';
                        return true;
                      })
                      .slice(0, 4)
                      .map((d) => (
                        <div
                          key={d.id}
                          className="p-3.5 rounded-xl bg-[#FAFAF7] hover:bg-[#FFFDF9] border border-[#E8E3DC] space-y-2 text-xs transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-bold text-[#1F1F1F]">{d.studentName}</span>
                                <span className="text-[10px] font-mono text-[#D97706] bg-[#FFF7E6] border border-[#FEDDAA] px-2 py-0.2 rounded-full font-bold">
                                  Day {d.classNumber}: {d.classTitle}
                                </span>
                                <span className="text-[10px] text-[#82684D] font-mono">
                                  {new Date(d.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[#3F3934] font-medium leading-relaxed bg-white/70 p-2.5 rounded-lg border border-[#E8E3DC]/60 italic">
                                "{d.question}"
                              </p>
                              {d.status === 'RESOLVED' && d.reply && (
                                <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-[11px] space-y-0.5">
                                  <span className="font-bold text-emerald-800 flex items-center gap-1 text-[10px]">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Faculty Clarification ({d.repliedBy})</span>
                                  </span>
                                  <p className="text-emerald-900 leading-snug">{d.reply}</p>
                                </div>
                              )}
                            </div>

                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                              {d.status === 'OPEN' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>Pending</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Resolved</span>
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDoubtForReply(d);
                                  setDoubtReplyText(d.reply || '');
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                  d.status === 'OPEN'
                                    ? 'bg-stone-900 text-white hover:bg-stone-800 shadow-2xs'
                                    : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                                }`}
                              >
                                {d.status === 'OPEN' ? (
                                  <>
                                    <Send className="w-3 h-3 text-[#FBBF24]" />
                                    <span>Clarify</span>
                                  </>
                                ) : (
                                  <span>Edit Answer</span>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                    {doubts.filter((d) => {
                      if (doubtFilterStatus === 'OPEN') return d.status === 'OPEN';
                      if (doubtFilterStatus === 'RESOLVED') return d.status === 'RESOLVED';
                      return true;
                    }).length === 0 && (
                      <div className="text-center py-6 text-xs text-[#6B6258] bg-[#FAFAF7] rounded-xl border border-dashed border-[#E8E3DC]">
                        <MessageSquare className="w-6 h-6 mx-auto mb-1.5 text-stone-400" />
                        <p className="font-semibold text-stone-700">No student doubts in this view</p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Questions asked by students after class sessions will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Latest Announcements & Notices */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#FFFFFF] border border-[#E8E3DC] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#1F1F1F] flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#D97706]" />
                      <span>Cohort Broadcasts</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleTabChange('announcements')}
                      className="text-xs font-bold text-[#D97706] hover:underline"
                    >
                      + New Notice
                    </button>
                  </div>

                  <div className="space-y-3">
                    {announcements.length === 0 ? (
                      <div className="p-5 rounded-xl bg-[#FAFAF7] border border-dashed border-[#E8E3DC] text-center text-xs text-[#6B6258] space-y-1">
                        <p className="font-semibold text-stone-700">No notices broadcasted yet</p>
                        <p className="text-[11px] text-stone-500">
                          Dispatched cohort notices and urgent student updates will appear here.
                        </p>
                      </div>
                    ) : (
                      announcements.slice(0, 3).map((ann) => (
                        <div
                          key={ann.id}
                          onClick={() => setSelectedNoticeModal(ann)}
                          className="p-4 rounded-xl bg-[#FAFAF7] hover:bg-amber-50/50 border border-[#E8E3DC] hover:border-[#D97706]/40 space-y-1.5 cursor-pointer transition-all group shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#1F1F1F] group-hover:text-[#D97706] text-xs transition-colors">
                              {ann.title}
                            </span>
                            <span className="text-[10px] text-[#82684D] font-mono">
                              {new Date(ann.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-[#6B6258] leading-relaxed line-clamp-2">{ann.content}</p>
                          <div className="flex items-center justify-between text-[10px] pt-1">
                            <span className="text-[#D97706] font-semibold">
                              By {ann.authorName || 'Faculty'} ({ann.authorRole || 'Faculty'})
                            </span>
                            <span className="text-stone-400 group-hover:text-[#D97706] font-semibold transition-colors">
                              Touch to view &rarr;
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
              {courses.length === 0 ? (
                <div className="bg-white border border-[#E8E3DC] rounded-[24px] p-12 text-center space-y-4 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-[#D97706] flex items-center justify-center mx-auto shadow-inner">
                    <Layers className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h3 className="text-base font-bold text-[#1F1F1F]">No Courses Allotted Yet</h3>
                    <p className="text-xs text-[#6B6258] leading-relaxed">
                      The Academic Directorate has not allotted any courses to your faculty account yet. Course allotments are managed and assigned directly by the Platform Administrator.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAF7] border border-[#E8E3DC] text-[11px] font-mono text-stone-600">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D97706]" />
                      Allotment Status: PENDING ALLOTMENT
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header & Course Selector Bar */}
                  <div className="bg-white border border-[#E8E3DC] rounded-[24px] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#D97706] uppercase font-mono">
                        <Film className="w-4 h-4" />
                        <span>Curriculum Delivery Engine</span>
                      </div>
                  <h3 className="text-lg font-bold text-[#1F1F1F]">Course Classes & Episodes (Class 1, Class 2...)</h3>
                  <p className="text-xs text-[#6B6258]">
                    Upload, organize, and publish class videos, lecture slides, and sandbox repositories for students.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                  {/* Select Course dropdown */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="text-xs font-semibold text-[#6B6258] shrink-0">Course:</label>
                    <select
                      value={selectedCourseId || ''}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full sm:max-w-[280px] bg-[#FAFAF7] border border-[#E8E3DC] text-xs font-bold text-[#1F1F1F] py-2 px-3 rounded-xl outline-none focus:border-[#F59E0B] transition-all cursor-pointer truncate"
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
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#18181B] hover:bg-stone-900 text-white text-xs font-bold border border-stone-800 hover:border-amber-500/40 shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 text-[#F59E0B]" />
                    <span>Upload New Class</span>
                  </button>
                </div>
              </div>

              {/* Class Episodes List */}
              {isLoadingClasses ? (
                <div className="p-12 text-center">
                  <LoadingSpinner
                    size="md"
                    text="Loading class curriculum episodes..."
                    subtext="FACULTY CURRICULUM SYLLABI"
                    minHeight="min-h-[20vh]"
                  />
                </div>
              ) : classesList.length === 0 ? (
                <div className="bg-white border border-[#E8E3DC] rounded-[24px] p-12 text-center space-y-3">
                  <Film className="w-10 h-10 text-stone-300 mx-auto" />
                  <h4 className="text-sm font-bold text-[#1F1F1F]">No classes uploaded yet</h4>
                  <p className="text-xs text-[#6B6258] max-w-sm mx-auto">
                    Start publishing episodes (Class 1, Class 2, etc.) with video recordings and lecture notes for enrolled students.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenNewClassModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18181B] hover:bg-stone-900 text-white text-xs font-bold border border-stone-800 hover:border-amber-500/40 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#F59E0B]" />
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
                        className="bg-white border border-[#E8E3DC] rounded-[22px] p-5 shadow-xs hover:shadow-md hover:border-[#D0C7BC] transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-3">
                          {/* Card Top: Class # Badge & Status */}
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-full bg-[#18181B] text-amber-300 border border-stone-800 text-[10px] font-mono font-bold tracking-wider">
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
                          <h4 className="text-sm font-bold text-[#1F1F1F] leading-snug group-hover:text-[#D97706] transition-colors">
                            {cls.title}
                          </h4>

                          {/* Class Description */}
                          <p className="text-xs text-[#6B6258] line-clamp-2 leading-relaxed">
                            {cls.description || 'Lecture video and supplementary material for this class module.'}
                          </p>

                          {/* Class-wise Topics */}
                          {cls.topics && cls.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {cls.topics.map((t, tidx) => (
                                <span key={tidx} className="px-2 py-0.5 rounded-md bg-[#FAFAF7] text-[#6B6258] border border-[#EEEAE4] text-[10px] font-mono font-medium">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Post-Class Summary: What was taught */}
                          {cls.summary && (
                            <div className="p-2.5 rounded-xl bg-[#FFF9EF] border border-[#FEDDAA] text-[11px] text-[#1F1F1F] leading-relaxed">
                              <span className="font-bold text-[#D97706] block text-[10px] uppercase font-mono tracking-wider mb-0.5">
                                What Was Taught (Post-Class Summary)
                              </span>
                              <p className="line-clamp-3">{cls.summary}</p>
                            </div>
                          )}

                          {/* Class Quiz / Test Indicator */}
                          {cls.test && (
                            <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-[#FFF9EF] border border-[#FEDDAA] text-[#1F1F1F] font-medium">
                              <span className="flex items-center gap-1.5">
                                <CheckSquare className="w-3.5 h-3.5 text-[#D97706]" />
                                <span className="font-bold truncate max-w-[180px]">{cls.test.title || 'Class Assessment'}</span>
                              </span>
                              <span className="font-mono text-[10px] font-bold text-[#D97706] shrink-0">
                                Pass: {cls.test.passingScore || 70}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Metadata & Actions */}
                        <div className="space-y-3 pt-3 border-t border-[#EEEAE4]">
                          <div className="flex items-center justify-between text-[#6B6258] text-xs font-medium">
                            <span className="flex items-center gap-1.5 font-mono text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-stone-400" />
                              <span>{cls.duration || '60 mins'}</span>
                            </span>

                            {cls.deliveryType === 'ONLINE' || cls.liveMeetingUrl ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-50 text-amber-900 border border-amber-300">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                <span>Live Online Class</span>
                              </span>
                            ) : (cls.hasLocalVideo || cls.videoId || cls.videoOriginalName) ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Film className="w-3 h-3 text-emerald-600" />
                                <span>LMS Video ({formatFileSize(cls.videoSizeBytes)})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-stone-400 bg-stone-50 border border-stone-200">
                                <span>No Video Attached</span>
                              </span>
                            )}
                          </div>

                          {/* Live Meeting Link info if online */}
                          {(cls.deliveryType === 'ONLINE' || cls.liveMeetingUrl) && cls.liveMeetingUrl && (
                            <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between text-[11px]">
                              <span className="text-amber-900 font-semibold truncate flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span className="truncate">{cls.liveMeetingTime || 'Live Online Meeting'}</span>
                              </span>
                              <a
                                href={cls.liveMeetingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#D97706] font-bold hover:underline shrink-0 flex items-center gap-1"
                              >
                                <span>Open Link</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          {(cls.resourcesUrl || (cls.learningMaterials && cls.learningMaterials.length > 0)) && (
                            <div className="space-y-1">
                              {cls.resourcesUrl && (
                                <a
                                  href={cls.resourcesUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full py-1.5 px-3 rounded-lg bg-[#FAFAF7] hover:bg-stone-100 border border-[#E8E3DC] flex items-center justify-between text-[11px] text-[#1F1F1F] font-medium transition-colors"
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <FileCode className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                                    <span className="truncate">Class Resources / Slides</span>
                                  </span>
                                  <ExternalLink className="w-3 h-3 text-stone-400 shrink-0" />
                                </a>
                              )}
                              {cls.learningMaterials && cls.learningMaterials.map((mat, midx) => {
                                const isDoc = mat.fileData || mat.fileName;
                                const isPdf = mat.fileName?.endsWith('.pdf') || mat.fileType?.includes('pdf');
                                return (
                                  <div
                                    key={midx}
                                    className="w-full py-1.5 px-3 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 flex items-center justify-between text-[11px] text-stone-900 font-semibold transition-colors"
                                  >
                                    <span className="flex items-center gap-2 truncate">
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ${
                                        isPdf ? 'bg-rose-100 text-rose-700' : isDoc ? 'bg-blue-100 text-blue-700' : 'bg-stone-200 text-stone-700'
                                      }`}>
                                        {isPdf ? 'PDF' : isDoc ? 'DOC' : 'LINK'}
                                      </span>
                                      <span className="truncate">{mat.title || mat.fileName || 'Course Material'}</span>
                                    </span>
                                    {mat.fileData ? (
                                      <a
                                        href={mat.fileData}
                                        download={mat.fileName || 'course_notes'}
                                        className="text-[#D97706] hover:underline text-[10px] font-bold shrink-0 ml-2"
                                      >
                                        Download
                                      </a>
                                    ) : (
                                      <a
                                        href={mat.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#D97706] hover:underline text-[10px] font-bold shrink-0 ml-2 flex items-center gap-1"
                                      >
                                        <span>Open</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Action Buttons: Edit / Delete */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditClassModal(cls)}
                              className="p-2 rounded-lg bg-[#FAFAF7] hover:bg-stone-200 text-[#1F1F1F] border border-[#E8E3DC] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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
            </>
          )}

              {/* Enhanced Class Upload / Edit Modal */}
              {isClassModalOpen && (
                <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                  <div className="bg-white border border-[#E8E3DC] rounded-[24px] p-6 sm:p-7 max-w-2xl w-full space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-[#EEEAE4]">
                      <div>
                        <h4 className="text-base font-bold text-[#1F1F1F] font-display">
                          {classToEdit ? 'Edit Class & Update Post-Class Summary' : 'Upload New Class Episode & Content'}
                        </h4>
                        <p className="text-xs text-[#D97706] font-medium truncate max-w-sm">
                          {currentSelectedCourse?.title}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsClassModalOpen(false)}
                        className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer rounded-lg hover:bg-stone-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
                      {/* Section 1: Basic info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-[#1F1F1F] mb-1">Class / Day #</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={classForm.classNumber}
                            onChange={(e) => setClassForm({ ...classForm, classNumber: e.target.value })}
                            className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] font-mono focus:bg-white focus:border-[#F59E0B] outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-bold text-[#1F1F1F] mb-1">Class Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Class 1: Architecture Overview & Setup"
                            value={classForm.title}
                            onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                            className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] focus:bg-white focus:border-[#F59E0B] outline-none font-semibold"
                          />
                        </div>
                      </div>

                      {/* Delivery Mode Toggle: Online Live Class vs Upload LMS Video */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block font-bold text-[#1F1F1F]">
                            Class Delivery Format *
                          </label>
                          <span className="text-[10px] font-mono text-[#D97706] bg-[#FFF0D4] px-2 py-0.5 rounded font-bold">
                            {classForm.deliveryType === 'ONLINE' ? '🔴 Live Interactive' : '📹 Recorded LMS'}
                          </span>
                        </div>

                        <div className="p-1 rounded-xl bg-stone-100 border border-[#E8E3DC] flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setClassForm({ ...classForm, deliveryType: 'ONLINE' })}
                            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              classForm.deliveryType === 'ONLINE'
                                ? 'bg-[#18181B] text-white shadow-xs'
                                : 'text-[#6B6258] hover:text-[#1F1F1F]'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <span>Online Live Class (Meet / Zoom)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setClassForm({ ...classForm, deliveryType: 'UPLOAD' })}
                            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              classForm.deliveryType !== 'ONLINE'
                                ? 'bg-[#18181B] text-white shadow-xs'
                                : 'text-[#6B6258] hover:text-[#1F1F1F]'
                            }`}
                          >
                            <Film className="w-3.5 h-3.5 text-[#F59E0B]" />
                            <span>Upload LMS Video Lecture</span>
                          </button>
                        </div>
                      </div>

                      {/* MODE 1: Online Live Class (Meet / Zoom) */}
                      {classForm.deliveryType === 'ONLINE' ? (
                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block font-bold text-[#1F1F1F] flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                              <span>Live Online Class Meeting Link</span>
                            </label>
                            <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                              Google Meet / Zoom / Teams
                            </span>
                          </div>

                          <div>
                            <label className="block font-bold text-[#1F1F1F] mb-1">
                              Live Meeting URL *
                            </label>
                            <input
                              type="url"
                              required={classForm.deliveryType === 'ONLINE'}
                              placeholder="https://meet.google.com/abc-defg-hij or https://zoom.us/j/..."
                              value={classForm.liveMeetingUrl}
                              onChange={(e) => setClassForm({ ...classForm, liveMeetingUrl: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-[#1F1F1F] font-mono focus:border-[#D97706] outline-none"
                            />
                            <p className="text-[10px] text-stone-500 mt-1">
                              Enrolled students will see a direct <strong>"Join Live Class"</strong> button to enter this session.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-bold text-[#1F1F1F] mb-1">
                                Scheduled Live Class Date & Time
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Oct 12, 10:00 AM IST"
                                value={classForm.liveMeetingTime}
                                onChange={(e) => setClassForm({ ...classForm, liveMeetingTime: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-[#E8E3DC] rounded-xl text-[#1F1F1F] focus:border-[#F59E0B] outline-none"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-[#1F1F1F] mb-1">
                                Session Duration
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. 1 hr 30 mins"
                                value={classForm.duration}
                                onChange={(e) => setClassForm({ ...classForm, duration: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-[#E8E3DC] rounded-xl text-[#1F1F1F] focus:border-[#F59E0B] outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block font-bold text-[#1F1F1F] mb-1">
                              Live Meeting Instructions / Agenda
                            </label>
                            <textarea
                              rows={2}
                              placeholder="e.g. Please join 5 mins prior with microphone and camera ready."
                              value={classForm.liveMeetingInstructions}
                              onChange={(e) => setClassForm({ ...classForm, liveMeetingInstructions: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-[#E8E3DC] rounded-xl text-[#1F1F1F] focus:border-[#F59E0B] outline-none leading-relaxed"
                            />
                          </div>

                          <div className="pt-1">
                            <label className="block font-bold text-[#1F1F1F] mb-1">Publish Status</label>
                            <select
                              value={classForm.status}
                              onChange={(e) => setClassForm({ ...classForm, status: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-[#E8E3DC] rounded-xl text-[#1F1F1F] font-semibold focus:border-[#F59E0B] outline-none"
                            >
                              <option value="PUBLISHED">PUBLISHED (Students can access & join)</option>
                              <option value="DRAFT">DRAFT (Hidden from students)</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        /* MODE 2: Upload LMS Video */
                        <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E8E3DC] space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block font-bold text-[#1F1F1F] flex items-center gap-1.5">
                              <Film className="w-4 h-4 text-[#D97706]" />
                              <span>LMS Video Lecture (Local Upload)</span>
                            </label>
                            <span className="text-[10px] font-mono text-[#82684D] bg-[#FFF0D4] px-2 py-0.5 rounded font-bold text-[#D97706]">
                              .mp4, .webm, .mov, .mkv
                            </span>
                          </div>

                          {/* Existing Attached Video Info */}
                          {(classToEdit?.hasLocalVideo || classToEdit?.videoId || classToEdit?.videoOriginalName) ? (
                            <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-2xs flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[#1F1F1F] truncate">
                                    {classToEdit.videoOriginalName || 'Secure Lesson Video Attached'}
                                  </p>
                                  <p className="text-[10px] text-stone-500 font-mono">
                                    {formatFileSize(classToEdit.videoSizeBytes)} • Authenticated Range Streaming
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDetachVideo(classToEdit.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Detach Video</span>
                              </button>
                            </div>
                          ) : null}

                          {/* Upload Input Area */}
                          <div className="relative border-2 border-dashed border-[#E8E3DC] hover:border-[#F59E0B] rounded-xl p-4 text-center bg-white transition-colors cursor-pointer group">
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
                              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Upload className="w-6 h-6 text-[#D97706] mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                            {videoFile ? (
                              <div>
                                <p className="text-xs font-bold text-emerald-700 truncate max-w-xs mx-auto">
                                  Selected: {videoFile.name}
                                </p>
                                <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                                  {formatFileSize(videoFile.size)} • Click or drop new file to replace
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-xs font-semibold text-[#1F1F1F]">
                                  {(classToEdit?.hasLocalVideo || classToEdit?.videoId) ? 'Click to replace existing video' : 'Click or drag video file here to upload'}
                                </p>
                                <p className="text-[10px] text-stone-500 mt-0.5">
                                  Stored locally on server storage with authenticated HTTP Range streaming
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block font-bold text-[#1F1F1F] mb-1">Class Duration</label>
                              <input
                                type="text"
                                placeholder="e.g. 1 hr 30 mins"
                                value={classForm.duration}
                                onChange={(e) => setClassForm({ ...classForm, duration: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-[#E8E3DC] rounded-xl text-[#1F1F1F] focus:border-[#F59E0B] outline-none"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-[#1F1F1F] mb-1">Publish Status</label>
                              <select
                                value={classForm.status}
                                onChange={(e) => setClassForm({ ...classForm, status: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-[#E8E3DC] rounded-xl text-[#1F1F1F] font-semibold focus:border-[#F59E0B] outline-none"
                              >
                                <option value="PUBLISHED">PUBLISHED (Students can access)</option>
                                <option value="DRAFT">DRAFT (Hidden from students)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section 2: Class-wise Topics */}
                      <div>
                        <label className="block font-bold text-[#1F1F1F] mb-1 flex items-center justify-between">
                          <span>Class Topics Taught (Comma-separated)</span>
                          <span className="text-[10px] text-[#82684D] font-mono">e.g. Raft Consensus, Leader Election, Log Replication</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Topic 1, Topic 2, Topic 3"
                          value={classForm.topics}
                          onChange={(e) => setClassForm({ ...classForm, topics: e.target.value })}
                          className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] focus:bg-white focus:border-[#F59E0B] outline-none"
                        />
                      </div>

                      {/* Section 3: Post-Class Summary (What was taught) */}
                      <div className="p-3.5 rounded-2xl bg-[#FFF9EF] border border-[#FEDDAA] space-y-1.5">
                        <label className="block font-bold text-[#D97706] flex items-center justify-between">
                          <span>Post-Class Summary: What Was Taught *</span>
                          <span className="text-[10px] font-mono text-[#D97706] bg-[#FFF0D4] px-2 py-0.5 rounded font-bold">
                            Updated After Class
                          </span>
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Record key topics covered, architecture patterns demonstrated, student questions answered, and core takeaways..."
                          value={classForm.summary}
                          onChange={(e) => setClassForm({ ...classForm, summary: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-[#E8E3DC] rounded-xl text-[#1F1F1F] placeholder-stone-400 focus:border-[#F59E0B] outline-none leading-relaxed"
                        />
                      </div>

                      {/* Section 4: Learning Materials & Notes Upload (PDF / Word Doc / Files) */}
                      <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E8E3DC] space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block font-bold text-[#1F1F1F] flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-[#D97706]" />
                            <span>Class Notes & Learning Materials (PDF / Word Doc Upload)</span>
                          </label>
                          <span className="text-[10px] font-mono text-[#82684D] bg-[#FFF0D4] px-2 py-0.5 rounded font-bold text-[#D97706]">
                            .pdf, .doc, .docx, .ppt, .txt
                          </span>
                        </div>

                        {/* Uploaded Document Chip */}
                        {classForm.notesFile ? (
                          <div className="p-3 rounded-xl bg-white border border-amber-300 shadow-2xs flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[10px] font-mono shrink-0 ${
                                classForm.notesFile.fileName?.endsWith('.pdf')
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : classForm.notesFile.fileName?.match(/\.(docx?)$/i)
                                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {classForm.notesFile.fileName?.endsWith('.pdf') ? 'PDF' : classForm.notesFile.fileName?.match(/\.(docx?)$/i) ? 'DOC' : 'FILE'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#1F1F1F] truncate">
                                  {classForm.notesFile.fileName}
                                </p>
                                <p className="text-[10px] text-stone-500 font-mono">
                                  {classForm.notesFile.fileSize ? formatFileSize(classForm.notesFile.fileSize) : 'Attached Notes File'}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setClassForm({ ...classForm, notesFile: null })}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          /* Drag & Drop Document Upload Area */
                          <div className="relative border-2 border-dashed border-[#E8E3DC] hover:border-[#F59E0B] rounded-xl p-3.5 text-center bg-white transition-colors cursor-pointer group">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setClassForm((prev) => ({
                                    ...prev,
                                    materialTitle: prev.materialTitle || file.name.replace(/\.[^/.]+$/, ''),
                                    notesFile: {
                                      fileName: file.name,
                                      fileType: file.type,
                                      fileSize: file.size,
                                      fileData: ev.target.result,
                                    },
                                  }));
                                };
                                reader.readAsDataURL(file);
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex items-center justify-center gap-2 text-stone-600">
                              <Upload className="w-4 h-4 text-[#D97706] group-hover:scale-110 transition-transform" />
                              <span className="text-xs font-semibold">
                                Click or drop PDF, Word doc (.docx), or Notes file here to attach
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block font-bold text-[#1F1F1F] mb-1">Notes / Material Title</label>
                            <input
                              type="text"
                              placeholder="e.g. Lecture Notes & Cheat Sheet"
                              value={classForm.materialTitle}
                              onChange={(e) => setClassForm({ ...classForm, materialTitle: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-[#E8E3DC] rounded-xl text-[#1F1F1F] focus:border-[#F59E0B] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-[#1F1F1F] mb-1">Resource URL (Optional Link)</label>
                            <input
                              type="url"
                              placeholder="https://github.com/... or Google Drive"
                              value={classForm.materialUrl}
                              onChange={(e) => setClassForm({ ...classForm, materialUrl: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-[#E8E3DC] rounded-xl text-[#1F1F1F] font-mono focus:border-[#F59E0B] outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 5: Class Test / Quiz Builder */}
                      <div className="p-3.5 rounded-2xl bg-[#FFF9EF] border border-[#FEDDAA] space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block font-bold text-[#1F1F1F] flex items-center gap-1.5">
                            <CheckSquare className="w-4 h-4 text-[#D97706]" />
                            <span>Conduct Test / Quiz for this Class</span>
                          </label>
                          <span className="text-[10px] font-mono font-bold text-[#D97706] bg-[#FFF0D4] px-2 py-0.5 rounded">
                            Auto-Graded
                          </span>
                        </div>

                        <div>
                          <label className="block text-[#1F1F1F] font-semibold mb-1">Question</label>
                          <input
                            type="text"
                            placeholder="e.g. Which Raft RPC is used to maintain leader heartbeat and append entries?"
                            value={classForm.quizQuestion}
                            onChange={(e) => setClassForm({ ...classForm, quizQuestion: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-[#E8E3DC] rounded-xl text-[#1F1F1F] focus:border-[#F59E0B] outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[#6B6258] font-medium mb-0.5">Option A</label>
                            <input
                              type="text"
                              placeholder="Option A text"
                              value={classForm.quizOption0}
                              onChange={(e) => setClassForm({ ...classForm, quizOption0: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-[#E8E3DC] rounded-lg text-[#1F1F1F] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[#6B6258] font-medium mb-0.5">Option B</label>
                            <input
                              type="text"
                              placeholder="Option B text"
                              value={classForm.quizOption1}
                              onChange={(e) => setClassForm({ ...classForm, quizOption1: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-[#E8E3DC] rounded-lg text-[#1F1F1F] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[#6B6258] font-medium mb-0.5">Option C</label>
                            <input
                              type="text"
                              placeholder="Option C text"
                              value={classForm.quizOption2}
                              onChange={(e) => setClassForm({ ...classForm, quizOption2: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-[#E8E3DC] rounded-lg text-[#1F1F1F] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[#6B6258] font-medium mb-0.5">Option D</label>
                            <input
                              type="text"
                              placeholder="Option D text"
                              value={classForm.quizOption3}
                              onChange={(e) => setClassForm({ ...classForm, quizOption3: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-[#E8E3DC] rounded-lg text-[#1F1F1F] outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          <div>
                            <label className="block text-[#1F1F1F] font-semibold mb-1">Correct Option</label>
                            <select
                              value={classForm.quizCorrect}
                              onChange={(e) => setClassForm({ ...classForm, quizCorrect: parseInt(e.target.value, 10) })}
                              className="w-full px-3 py-2 bg-white border border-[#E8E3DC] rounded-lg text-[#1F1F1F] font-semibold outline-none"
                            >
                              <option value={0}>Option A is Correct</option>
                              <option value={1}>Option B is Correct</option>
                              <option value={2}>Option C is Correct</option>
                              <option value={3}>Option D is Correct</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[#1F1F1F] font-semibold mb-1">Explanation / Hint</label>
                            <input
                              type="text"
                              placeholder="Why this answer is correct..."
                              value={classForm.quizExplanation}
                              onChange={(e) => setClassForm({ ...classForm, quizExplanation: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-[#E8E3DC] rounded-lg text-[#1F1F1F] outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <label className="font-bold text-[#1F1F1F]">Status:</label>
                          <select
                            value={classForm.status}
                            onChange={(e) => setClassForm({ ...classForm, status: e.target.value })}
                            className="px-3 py-1.5 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] font-mono focus:bg-white outline-none"
                          >
                            <option value="PUBLISHED">PUBLISHED (Students can watch & learn)</option>
                            <option value="DRAFT">DRAFT (Hidden)</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsClassModalOpen(false)}
                            className="px-4 py-2 rounded-xl bg-stone-100 text-[#1F1F1F] hover:bg-stone-200 font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingClass || isUploadingVideo}
                            className="px-5 py-2 rounded-xl bg-[#18181B] hover:bg-stone-900 text-white border border-stone-800 hover:border-amber-500/40 font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2"
                          >
                            {(isSavingClass || isUploadingVideo) && <LoadingSpinner size="xs" variant="white" inline />}
                            <span>
                              {isUploadingVideo
                                ? (uploadProgressText || 'Uploading Video...')
                                : isSavingClass
                                ? 'Saving Class...'
                                : classToEdit
                                ? 'Save Changes'
                                : 'Publish Class'}
                            </span>
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
              <div className="bg-white border border-[#E8E3DC] rounded-[24px] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#D97706] uppercase font-mono">
                    <UserCheck className="w-4 h-4" />
                    <span>Student Performance & Attendance Registry</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1F1F1F]">Cohort Progress & Attendance Tracking</h3>
                  <p className="text-xs text-[#6B6258]">
                    Monitor individual student learning velocity, mark class attendance, inspect test results, and track completion progress.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[#6B6258] shrink-0">Course:</label>
                  <select
                    value={selectedCourseId || ''}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="bg-[#FAFAF7] border border-[#E8E3DC] text-xs font-bold text-[#1F1F1F] py-2 px-3 rounded-xl outline-none focus:border-[#F59E0B] transition-all cursor-pointer"
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
              <div className="bg-white border border-[#E8E3DC] rounded-[22px] overflow-hidden shadow-xs">
                {isLoadingProgress ? (
                  <div className="p-12 text-center">
                    <LoadingSpinner
                      size="md"
                      text="Loading student cohort progress records..."
                      subtext="ATTENDANCE & MILESTONE TRACKING"
                      minHeight="min-h-[20vh]"
                    />
                  </div>
                ) : studentProgressList.length === 0 ? (
                  <div className="p-12 text-center space-y-2">
                    <UserCheck className="w-10 h-10 text-stone-300 mx-auto" />
                    <h4 className="text-sm font-bold text-[#1F1F1F]">No enrolled students found for this program</h4>
                    <p className="text-xs text-[#6B6258]">
                      Students will appear here automatically when they apply or confirm admission.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto [scrollbar-width:thin]">
                    <table className="w-full text-left text-xs min-w-[760px]">
                      <thead className="bg-[#FAFAF7] text-[#6B6258] uppercase text-[10px] font-mono border-b border-[#E8E3DC]">
                        <tr>
                          <th className="py-3.5 px-4 font-bold">Enrolled Student</th>
                          <th className="py-3.5 px-4 font-bold">Start Date</th>
                          <th className="py-3.5 px-4 font-bold">Course Progress</th>
                          <th className="py-3.5 px-4 font-bold">Class Attendance</th>
                          <th className="py-3.5 px-4 font-bold">Quizzes / Tests</th>
                          <th className="py-3.5 px-4 font-bold">Final Project</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEEAE4] text-[#1F1F1F]">
                        {studentProgressList.map((st) => (
                          <tr key={st.userId} className="hover:bg-[#FAFAF7] transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-[#1F1F1F]">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#18181B] text-amber-300 border border-stone-800 text-xs font-bold flex items-center justify-center shrink-0">
                                  {(st.userName || 'S')[0].toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-[#1F1F1F]">{st.userName}</div>
                                  <div className="text-[11px] text-[#6B6258] font-mono font-normal">{st.userEmail}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono text-[#6B6258] text-[11px]">
                              {st.startDate}
                            </td>

                            <td className="py-3.5 px-4 min-w-[140px]">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-[#1F1F1F] font-mono">{st.progressPercent}%</span>
                                  <span className="text-[#6B6258]">{st.completedClassesCount} / {st.totalClasses} classes</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                                  <div
                                    className="h-full bg-[#F59E0B] rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, st.progressPercent)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="space-y-1.5">
                                <div className="font-bold text-[#1F1F1F] text-[11px]">
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
                                            : 'bg-[#FAFAF7] hover:bg-stone-200 text-[#6B6258] border border-[#E8E3DC]'
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
                                  <span className="px-2 py-0.5 rounded-md bg-[#FFF9EF] text-[#D97706] border border-[#FEDDAA] text-[10px] font-mono font-bold">
                                    Avg: {Math.round(st.testResults.reduce((sum, tr) => sum + (tr.score || 0), 0) / st.testResults.length)}%
                                  </span>
                                  <div className="text-[10px] text-[#6B6258]">
                                    {st.testResults.filter(t => t.passed).length} / {st.testResults.length} passed
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-stone-400 italic">No tests taken</span>
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
                                <span className="text-[10px] text-stone-400 font-mono">Not Submitted</span>
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
                  <h3 className="text-lg font-bold text-[#1F1F1F]">Assigned Academic Programs & Syllabi</h3>
                  <p className="text-xs text-[#6B6258]">Configure course durations, daily release times, and manage modular curriculums.</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenNewCourseModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18181B] hover:bg-stone-900 text-white text-xs font-bold border border-stone-800 hover:border-amber-500/40 shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 text-[#F59E0B]" />
                  <span>+ Create New Course</span>
                </button>
              </div>

              {courses.length === 0 ? (
                <div className="bg-white border border-[#E8E3DC] rounded-[24px] p-12 text-center space-y-4 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-[#D97706] flex items-center justify-center mx-auto shadow-inner">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h3 className="text-base font-bold text-[#1F1F1F]">No Academic Programs Allotted</h3>
                    <p className="text-xs text-[#6B6258] leading-relaxed">
                      You currently have no courses assigned to your faculty profile. Allotments are configured exclusively by the Platform Administrator.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAF7] border border-[#E8E3DC] text-[11px] font-mono text-stone-600">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D97706]" />
                      Curriculum Status: PENDING ALLOTMENT
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((c) => (
                    <div key={c.id} className="bg-white border border-[#E8E3DC] rounded-[22px] p-6 space-y-4 shadow-xs hover:shadow-sm hover:border-[#D0C7BC] transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#D97706] bg-[#FFF9EF] px-2.5 py-0.5 rounded-md border border-[#FEDDAA] font-bold">
                              {c.category} • {c.level || 'Professional'}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{formatReleaseTime(c.dailyReleaseTime || '09:00')} Daily</span>
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-[#1F1F1F] mt-2">{c.title}</h4>
                          <p className="text-xs text-[#6B6258] mt-1 line-clamp-2 leading-relaxed">{c.shortDescription}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#FAFAF7] border border-[#EEEAE4] text-center text-xs">
                        <div>
                          <span className="text-[#6B6258] block text-[10px] font-medium">Duration</span>
                          <span className="font-bold text-[#1F1F1F] font-mono">{c.duration}</span>
                        </div>
                        <div>
                          <span className="text-[#6B6258] block text-[10px] font-medium">Enrolled</span>
                          <span className="font-bold text-emerald-700 font-mono">{c.enrolledCount || 0} Students</span>
                        </div>
                        <div>
                          <span className="text-[#6B6258] block text-[10px] font-medium">Capacity</span>
                          <span className="font-bold text-[#1F1F1F] font-mono">{c.capacity || 40} Seats</span>
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
                          className="flex-1 py-2 px-3 rounded-xl bg-[#FAFAF7] hover:bg-[#18181B] hover:text-white text-[#1F1F1F] border border-[#E8E3DC] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
                          className="px-3 py-2 rounded-xl bg-[#FFF9EF] hover:bg-[#FFF0D4] text-[#D97706] border border-[#FEDDAA] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          title="View Applied Students"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Students</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditCourseModal(c)}
                          className="p-2 rounded-xl bg-[#FAFAF7] hover:bg-stone-200 text-[#1F1F1F] border border-[#E8E3DC] text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                          title="Course Settings"
                        >
                          <Sliders className="w-3.5 h-3.5 text-[#6B6258]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(c.id)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                          title="Delete Course Program"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 4: CANDIDATE ACADEMIC EVALUATIONS                               */}
          {/* =================================================================== */}
          {activeTab === 'evaluations' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#1F1F1F]">Candidate Academic Evaluations</h3>
                  <p className="text-xs text-[#6B6258]">Review student statements of purpose, conduct academic interviews, and submit admission recommendations.</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                      placeholder="Search candidate name..."
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E8E3DC] rounded-xl text-xs text-[#1F1F1F] placeholder-stone-400 focus:outline-none focus:border-[#F59E0B] font-medium shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Applications Table */}
              <div className="bg-white border border-[#E8E3DC] rounded-[22px] overflow-hidden shadow-xs">
                <div className="overflow-x-auto [scrollbar-width:thin]">
                  <table className="w-full text-left text-xs min-w-[640px]">
                    <thead className="bg-[#FAFAF7] text-[#6B6258] uppercase text-[10px] font-mono border-b border-[#E8E3DC]">
                      <tr>
                        <th className="py-3.5 px-4 font-bold">Candidate Profile</th>
                        <th className="py-3.5 px-4 font-bold">Program Applied</th>
                        <th className="py-3.5 px-4 font-bold">Academic Background</th>
                        <th className="py-3.5 px-4 font-bold">Review Status</th>
                        <th className="py-3.5 px-4 text-right font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEEAE4] text-[#1F1F1F]">
                      {filteredApps.map((app) => (
                        <tr key={app.id} className="hover:bg-[#FAFAF7] transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-[#1F1F1F]">
                            <div>{app.userName}</div>
                            <div className="text-[11px] text-[#6B6258] font-mono font-normal">{app.userEmail}</div>
                          </td>
                          <td className="py-3.5 px-4 text-[#1F1F1F] font-medium">{app.courseTitle}</td>
                          <td className="py-3.5 px-4 text-[#6B6258]">
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
                              className="px-3 py-1.5 rounded-lg bg-[#18181B] hover:bg-stone-900 text-white border border-stone-800 hover:border-amber-500/40 font-bold text-xs transition-colors cursor-pointer"
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
                <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                  <div className="bg-white border border-[#E8E3DC] rounded-[24px] p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-[#EEEAE4]">
                      <div>
                        <h4 className="text-base font-bold text-[#1F1F1F] font-display">
                          Evaluate: {selectedApp.userName}
                        </h4>
                        <p className="text-xs text-[#D97706] font-medium">{selectedApp.courseTitle}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedApp(null)}
                        className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer rounded-lg hover:bg-stone-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-bold text-[#1F1F1F] mb-1">Interview / Rubric Score (1 - 10)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={evalScore}
                          onChange={(e) => setEvalScore(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] font-mono focus:bg-white focus:border-[#F59E0B] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#1F1F1F] mb-1">Faculty Recommendation</label>
                        <select
                          value={evalRecommendation}
                          onChange={(e) => setEvalRecommendation(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] font-mono focus:bg-white focus:border-[#F59E0B] outline-none"
                        >
                          <option value="RECOMMENDED">RECOMMENDED FOR ADMISSION</option>
                          <option value="NEEDS_REVIEW">NEEDS SECOND INTERVIEW</option>
                          <option value="REJECTED">DO NOT ADMIT</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-[#1F1F1F] mb-1">Faculty Evaluation Notes</label>
                        <textarea
                          rows={3}
                          value={evalNotes}
                          onChange={(e) => setEvalNotes(e.target.value)}
                          placeholder="Enter candidate strengths, technical assessment feedback, and interview remarks..."
                          className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] placeholder-stone-400 focus:bg-white focus:border-[#F59E0B] outline-none"
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedApp(null)}
                          className="px-4 py-2.5 rounded-xl bg-stone-100 text-[#1F1F1F] hover:bg-stone-200 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingEval}
                          className="px-4 py-2.5 rounded-xl bg-[#18181B] hover:bg-stone-900 text-white border border-stone-800 hover:border-amber-500/40 font-bold cursor-pointer disabled:opacity-50"
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
                  <h3 className="text-lg font-bold text-[#1F1F1F]">Student Cohort Roster</h3>
                  <p className="text-xs text-[#6B6258]">View active enrolled students across your academic courses.</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search student by name..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E8E3DC] rounded-xl text-xs text-[#1F1F1F] placeholder-stone-400 focus:outline-none focus:border-[#F59E0B] font-medium shadow-2xs"
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E8E3DC] rounded-[22px] overflow-hidden shadow-xs">
                <div className="overflow-x-auto [scrollbar-width:thin]">
                  <table className="w-full text-left text-xs min-w-[580px]">
                    <thead className="bg-[#FAFAF7] text-[#6B6258] uppercase text-[10px] font-mono border-b border-[#E8E3DC]">
                      <tr>
                        <th className="py-3.5 px-4 font-bold">Student</th>
                        <th className="py-3.5 px-4 font-bold">Institution / Degree</th>
                        <th className="py-3.5 px-4 font-bold">Verification</th>
                        <th className="py-3.5 px-4 font-bold">Performance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEEAE4] text-[#1F1F1F]">
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-[#FAFAF7] transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-[#1F1F1F]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#18181B] text-amber-300 border border-stone-800 text-xs font-bold flex items-center justify-center">
                                {(s.name || 'S')[0].toUpperCase()}
                              </div>
                              <div>
                                <div>{s.name}</div>
                                <div className="text-[11px] text-[#6B6258] font-mono font-normal">{s.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#1F1F1F]">
                            {s.institution || 'Verified Institute'} • {s.degree || 'Degree'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                              Verified
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[#D97706] font-mono font-bold">92% Grade (A)</span>
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
          {/* TAB: STUDENT DOUBTS & QUESTIONS Q&A HUB                             */}
          {/* =================================================================== */}
          {activeTab === 'doubts' && (
            <div className="space-y-6">
              {/* Header & Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-[#1F1F1F]">Student Doubts & Questions Center</h3>
                    {doubts.filter((d) => d.status === 'OPEN').length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#FFF7E6] text-[#D97706] border border-[#FEDDAA]">
                        {doubts.filter((d) => d.status === 'OPEN').length} Pending
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Live Sync Active</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6258] mt-0.5">
                    Resolve conceptual questions, code issues, and lecture doubts submitted by students in real time.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {/* Manual Sync Button */}
                  <button
                    type="button"
                    onClick={() => fetchDoubts()}
                    disabled={isLoadingDoubts}
                    title="Refresh student questions"
                    className="px-3 py-2 bg-white border border-[#E8E3DC] hover:border-amber-400 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-900 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 text-[#D97706] ${isLoadingDoubts ? 'animate-spin' : ''}`} />
                    <span>Sync Doubts</span>
                  </button>

                  {/* Course Dropdown */}
                  <select
                    value={doubtCourseFilter}
                    onChange={(e) => setDoubtCourseFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-[#E8E3DC] rounded-xl text-xs text-[#1F1F1F] font-semibold outline-none focus:border-[#F59E0B]"
                  >
                    <option value="ALL">All Enrolled Courses</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-60">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      value={doubtSearchTerm}
                      onChange={(e) => setDoubtSearchTerm(e.target.value)}
                      placeholder="Search questions or students..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8E3DC] rounded-xl text-xs text-[#1F1F1F] placeholder-stone-400 focus:outline-none focus:border-[#F59E0B] font-medium shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 border-b border-[#E8E3DC] pb-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDoubtFilterStatus('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                    doubtFilterStatus === 'ALL'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:text-stone-900'
                  }`}
                >
                  All Questions ({doubts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDoubtFilterStatus('OPEN')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    doubtFilterStatus === 'OPEN'
                      ? 'bg-[#D97706] text-white shadow-xs'
                      : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Clarification ({doubts.filter((d) => d.status === 'OPEN').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDoubtFilterStatus('RESOLVED')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    doubtFilterStatus === 'RESOLVED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resolved ({doubts.filter((d) => d.status === 'RESOLVED').length})</span>
                </button>
              </div>

              {/* Doubts List */}
              <div className="space-y-4">
                {doubts
                  .filter((d) => {
                    if (doubtFilterStatus === 'OPEN') return d.status === 'OPEN';
                    if (doubtFilterStatus === 'RESOLVED') return d.status === 'RESOLVED';
                    return true;
                  })
                  .filter((d) => {
                    if (doubtCourseFilter !== 'ALL') {
                      const matched = courses.find((c) => c.id === doubtCourseFilter || c.slug === doubtCourseFilter);
                      const validIds = [doubtCourseFilter, matched?.id, matched?.slug].filter(Boolean);
                      if (!validIds.includes(d.courseId)) return false;
                    }
                    if (!doubtSearchTerm.trim()) return true;
                    const term = doubtSearchTerm.toLowerCase();
                    return (
                      (d.studentName || '').toLowerCase().includes(term) ||
                      (d.studentEmail || '').toLowerCase().includes(term) ||
                      (d.question || '').toLowerCase().includes(term) ||
                      (d.classTitle || '').toLowerCase().includes(term) ||
                      (d.courseTitle || '').toLowerCase().includes(term)
                    );
                  })
                  .map((d) => {
                    const isHighlighted = highlightedDoubtId === d.id;
                    const isInlineOpen = inlineReplyDoubtId === d.id;

                    return (
                      <div
                        key={d.id}
                        id={`doubt-card-${d.id}`}
                        className={`bg-white border rounded-[22px] p-5 sm:p-6 space-y-4 shadow-xs transition-all duration-300 ${
                          isHighlighted
                            ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/50 bg-amber-50/15 shadow-md'
                            : 'border-[#E8E3DC] hover:border-[#D97706]/40'
                        }`}
                      >
                        {/* Highlighted Notice if focused from notification */}
                        {isHighlighted && (
                          <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-amber-100/80 border border-amber-300 text-xs font-bold text-amber-950 animate-in fade-in duration-200">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-[#D97706]" />
                              <span>Targeted Doubt from Notification — Ready for Faculty Review</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setHighlightedDoubtId(null)}
                              className="text-amber-700 hover:text-amber-950 p-0.5 rounded cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E3DC]/60">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-black text-sm font-bold flex items-center justify-center shrink-0 shadow-xs">
                              {(d.studentName || 'S')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-[#1F1F1F]">{d.studentName}</span>
                                <span className="text-[11px] text-[#6B6258] font-mono">({d.studentEmail})</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-[#82684D] font-mono mt-0.5 flex-wrap">
                                <span className="font-bold text-[#D97706]">{d.courseTitle}</span>
                                <span>•</span>
                                <span>Day {d.classNumber}: {d.classTitle}</span>
                                <span>•</span>
                                <span>{new Date(d.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center">
                            {d.status === 'OPEN' ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pending Reply</span>
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Resolved</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Question Content */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97706]">
                            Student Question
                          </span>
                          <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E3DC] text-xs text-stone-800 leading-relaxed font-medium">
                            {d.question}
                          </div>
                        </div>

                        {/* Answer Content (If Resolved) */}
                        {d.status === 'RESOLVED' && d.reply && (
                          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-1">
                            <span className="font-bold text-emerald-900 flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Faculty Clarification by {d.repliedBy}</span>
                              {d.repliedAt && (
                                <span className="text-[10px] font-mono text-emerald-700 font-normal ml-1">
                                  • {new Date(d.repliedAt).toLocaleDateString()}
                                </span>
                              )}
                            </span>
                            <p className="text-emerald-950 leading-relaxed font-normal">{d.reply}</p>
                          </div>
                        )}

                        {/* Inline Clarification Composer OR Action Bar */}
                        {isInlineOpen ? (
                          <div className="pt-3 border-t border-[#E8E3DC] space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#1F1F1F] flex items-center gap-1.5">
                                <Send className="w-3.5 h-3.5 text-[#D97706]" />
                                <span>Faculty Clarification & Explanation for {d.studentName}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDoubtForReply(d);
                                  setDoubtReplyText(inlineReplyTexts[d.id] !== undefined ? inlineReplyTexts[d.id] : (d.reply || ''));
                                }}
                                className="text-[11px] text-[#D97706] hover:underline font-semibold cursor-pointer"
                              >
                                Open in Pop-up Modal
                              </button>
                            </div>

                            <textarea
                              rows={4}
                              autoFocus
                              value={inlineReplyTexts[d.id] !== undefined ? inlineReplyTexts[d.id] : (d.reply || '')}
                              onChange={(e) => setInlineReplyTexts((prev) => ({ ...prev, [d.id]: e.target.value }))}
                              placeholder="Type clear conceptual guidance, code solution, or architectural advice for the student..."
                              className="w-full px-3.5 py-2.5 bg-white border border-[#E8E3DC] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 outline-none leading-relaxed"
                            />

                            <div className="flex items-center justify-end gap-2.5">
                              <button
                                type="button"
                                onClick={() => setInlineReplyDoubtId(null)}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={submittingInlineId === d.id || !(inlineReplyTexts[d.id] !== undefined ? inlineReplyTexts[d.id] : (d.reply || '')).trim()}
                                onClick={() => handleReplyInlineDoubt(d.id)}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#18181B] hover:bg-stone-900 text-white border border-stone-800 hover:border-amber-500/40 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs transition-all"
                              >
                                <Send className="w-3.5 h-3.5 text-[#FBBF24]" />
                                <span>{submittingInlineId === d.id ? 'Sending Clarification...' : 'Send Clarification to Student'}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Action Bar */
                          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E8E3DC]/60">
                            <button
                              type="button"
                              onClick={() => handleDeleteDoubt(d.id)}
                              className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              Dismiss
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setInlineReplyDoubtId(d.id);
                                setInlineReplyTexts((prev) => ({
                                  ...prev,
                                  [d.id]: prev[d.id] !== undefined ? prev[d.id] : (d.reply || ''),
                                }));
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                d.status === 'OPEN'
                                  ? 'bg-[#18181B] hover:bg-stone-900 text-white shadow-xs'
                                  : 'bg-white text-stone-800 border border-stone-300 hover:bg-stone-100'
                              }`}
                            >
                              <Send className="w-3.5 h-3.5 text-[#FBBF24]" />
                              <span>{d.status === 'OPEN' ? 'Provide Clarification' : 'Edit Faculty Reply'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                {doubts.length === 0 && (
                  <div className="p-12 text-center bg-white rounded-[22px] border border-[#E8E3DC] space-y-2">
                    <MessageSquare className="w-10 h-10 text-stone-300 mx-auto" />
                    <h5 className="text-sm font-bold text-[#1F1F1F]">No student doubts recorded</h5>
                    <p className="text-xs text-[#6B6258]">
                      When students ask questions in their class viewer, they will appear here in real time.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 6: COHORT NOTICES & ANNOUNCEMENTS                               */}
          {/* =================================================================== */}
          {activeTab === 'announcements' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white border border-[#E8E3DC] rounded-[22px] p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-[#1F1F1F] flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#D97706]" />
                  <span>Broadcast New Notice</span>
                </h3>

                <form onSubmit={handlePostAnnouncement} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-[#1F1F1F] mb-1">Notice Title</label>
                    <input
                      id="announcement-title-input"
                      type="text"
                      required
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g. Mid-term Capstone Project Submission Deadline"
                      className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] placeholder-stone-400 focus:bg-white focus:border-[#F59E0B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#1F1F1F] mb-1">Notice Priority</label>
                    <select
                      value={annPriority}
                      onChange={(e) => setAnnPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] font-mono focus:bg-white focus:border-[#F59E0B] outline-none"
                    >
                      <option value="NORMAL">Standard Notice</option>
                      <option value="HIGH">High Priority (Urgent)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1F1F1F] mb-1">Announcement Body</label>
                    <textarea
                      rows={4}
                      required
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      placeholder="Write your cohort notice here..."
                      className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] placeholder-stone-400 focus:bg-white focus:border-[#F59E0B] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPostingAnn}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#18181B] hover:bg-stone-900 text-white border border-stone-800 hover:border-amber-500/40 font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isPostingAnn ? 'Broadcasting...' : 'Broadcast Notice to Students'}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1F1F1F]">Broadcasted Notices</h3>
                  <span className="text-[11px] font-mono text-[#6B6258] bg-white px-2.5 py-0.5 rounded-full border border-[#E8E3DC]">
                    {announcements.length} {announcements.length === 1 ? 'Notice' : 'Notices'}
                  </span>
                </div>

                {announcements.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-dashed border-[#E8E3DC] rounded-2xl space-y-2">
                    <Bell className="w-8 h-8 text-stone-300 mx-auto" />
                    <p className="text-xs font-bold text-[#1F1F1F]">No notices broadcasted yet</p>
                    <p className="text-[11px] text-[#6B6258] max-w-xs mx-auto">
                      Use the broadcast console on the left to dispatch notifications and urgent curriculum announcements to students.
                    </p>
                  </div>
                ) : (
                  announcements.map((ann) => (
                    <div
                      key={ann.id}
                      onClick={() => setSelectedNoticeModal(ann)}
                      className="bg-white border border-[#E8E3DC] hover:border-[#D97706]/40 rounded-[22px] p-5 space-y-2 shadow-xs cursor-pointer transition-all hover:shadow-sm group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1F1F1F] text-xs group-hover:text-[#D97706] transition-colors">
                            {ann.title}
                          </span>
                          {ann.priority === 'HIGH' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              HIGH PRIORITY
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#6B6258] font-mono">
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B6258] leading-relaxed line-clamp-2">{ann.content}</p>
                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <span className="text-[#D97706] font-semibold">
                          Dispatched by {ann.authorName || 'Faculty'} ({ann.authorRole || 'Faculty'})
                        </span>
                        <span className="text-stone-400 group-hover:text-[#D97706] font-bold transition-colors">
                          Touch to view details &rarr;
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB: STAFF PROFILE & CREDENTIALS                                   */}
          {/* =================================================================== */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl space-y-6">
              {/* Profile Overview Card */}
              <div className="bg-white border border-[#E8E3DC] rounded-[24px] p-6 sm:p-8 shadow-xs relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 pb-6 border-b border-[#EEEAE4]">
                  {/* Professional Faculty Profile Photo with Camera / Edit button */}
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-[#18181B] text-amber-300 text-2xl font-bold flex items-center justify-center border-2 border-[#F59E0B]/50 shadow-md overflow-hidden relative">
                      {profileForm.avatar || user?.avatar ? (
                        <img
                          src={profileForm.avatar || user?.avatar}
                          alt={profileForm.name || 'Faculty Member'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-amber-300">
                          <span className="text-3xl font-black">
                            {(profileForm.name || user?.name || user?.email || 'F')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Photo Action Pill Button */}
                    <button
                      type="button"
                      onClick={() => setIsPhotoModalOpen(true)}
                      title="Update Professional Photo"
                      className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-[#18181B] hover:bg-stone-900 text-amber-300 hover:text-amber-200 border border-amber-500/50 text-[10px] font-bold shadow-md flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                    >
                      <Camera className="w-3 h-3 text-[#F59E0B]" />
                      <span>Photo</span>
                    </button>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-xl font-bold text-[#1F1F1F] tracking-tight">
                        {profileForm.name || user?.name || 'Faculty Member'}
                      </h2>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified Faculty Lead
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-[#D97706]">
                      {profileForm.degree || user?.degree || 'Course Faculty & Systems Instructor'}
                    </p>

                    <p className="text-xs text-[#6B6258] font-mono">
                      Official ID: {user?.id ? user.id.slice(0, 16) : 'STF-FACULTY-CORE'} • Department: {profileForm.institution || user?.institution || 'Academic Directorate'}
                    </p>

                    {/* Quick Button to change photo */}
                    <div className="pt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPhotoModalOpen(true)}
                        className="text-xs font-bold text-[#D97706] hover:text-[#B45309] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{profileForm.avatar ? 'Change Profile Photo' : 'Set Professional Profile Photo'}</span>
                      </button>
                      {profileForm.avatar && (
                        <button
                          type="button"
                          onClick={() => setProfileForm({ ...profileForm, avatar: '' })}
                          className="text-xs text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Locked Administrative Properties (Immutable by Staff) */}
                <div className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-stone-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B6258]">
                      Administrative Access Controls (Admin-Managed Only)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E3DC] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase font-bold text-[#82684D]">
                          Institutional Email Handle
                        </span>
                        <span className="text-[10px] font-mono text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded font-bold">
                          LOCKED
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[#1F1F1F] flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#D97706]" />
                        {user?.email || 'staff@claxic.edu'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E3DC] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase font-bold text-[#82684D]">
                          System Role & Permissions
                        </span>
                        <span className="text-[10px] font-mono text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded font-bold">
                          LOCKED
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[#1F1F1F] flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-[#D97706]" />
                        STAFF Role (Faculty Directorate)
                      </span>
                    </div>
                  </div>

                  {/* Allotted Courses Matrix (Immutable by Staff) */}
                  <div className="mt-4 p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E3DC] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase font-bold text-[#82684D] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>Allotted Academic Courses Matrix</span>
                      </span>
                      <span className="text-[10px] font-mono text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded font-bold">
                        ADMIN CONTROLLED
                      </span>
                    </div>

                    <div className="space-y-2">
                      {courses.length > 0 ? (
                        courses.map((course) => (
                          <div
                            key={course.id}
                            className="p-3 rounded-lg bg-white border border-[#E8E3DC] flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <span className="font-bold text-[#1F1F1F] block">{course.title}</span>
                              <span className="text-[11px] text-[#6B6258] font-mono">
                                {course.category} • {course.duration || '10 Days'}
                              </span>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                              ACTIVE ALLOTMENT
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 rounded-lg bg-white border border-dashed border-[#E8E3DC] text-xs text-[#6B6258] text-center">
                          No courses currently allotted by Platform Administrator.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form 1: Permitted Profile Details Editor */}
              <div className="bg-white border border-[#E8E3DC] rounded-[24px] p-6 sm:p-8 shadow-xs space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#D97706]" />
                    <h3 className="text-base font-bold text-[#1F1F1F]">Edit Permitted Profile Details</h3>
                  </div>
                  <p className="text-xs text-[#6B6258] mt-0.5">
                    Update your faculty display name, contact phone, institution affiliation, and academic degrees.
                  </p>
                </div>

                {profileFeedback && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      profileFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {profileFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{profileFeedback.message}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#1F1F1F] mb-1.5">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        placeholder="e.g. Dr. Jane Doe"
                        className="w-full px-3.5 py-2.5 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] focus:bg-white focus:border-[#F59E0B] outline-none font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#1F1F1F] mb-1.5">Mobile / Phone Number</label>
                      <input
                        type="tel"
                        value={profileForm.mobile}
                        onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                        placeholder="e.g. +91 9876543210"
                        className="w-full px-3.5 py-2.5 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] focus:bg-white focus:border-[#F59E0B] outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#1F1F1F] mb-1.5">Assigned Department / Institute</label>
                      <input
                        type="text"
                        value={profileForm.institution}
                        onChange={(e) => setProfileForm({ ...profileForm, institution: e.target.value })}
                        placeholder="e.g. Dept. of Computer Science & Systems"
                        className="w-full px-3.5 py-2.5 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] focus:bg-white focus:border-[#F59E0B] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#1F1F1F] mb-1.5">Academic Degree / Qualification</label>
                      <input
                        type="text"
                        value={profileForm.degree}
                        onChange={(e) => setProfileForm({ ...profileForm, degree: e.target.value })}
                        placeholder="e.g. Ph.D in Distributed Systems, M.Tech CSE"
                        className="w-full px-3.5 py-2.5 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] focus:bg-white focus:border-[#F59E0B] outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="px-5 py-2.5 rounded-xl bg-[#18181B] hover:bg-stone-900 text-white font-bold border border-stone-800 hover:border-amber-500/40 cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-xs"
                    >
                      {isUpdatingProfile && <LoadingSpinner size="xs" variant="white" inline />}
                      <span>{isUpdatingProfile ? 'Saving Details...' : 'Save Profile Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODAL: CREATE / EDIT COURSE & SETTINGS                              */}
          {/* =================================================================== */}
          {isCourseModalOpen && (
            <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white border border-[#E8E3DC] rounded-[28px] p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-[#EEEAE4]">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97706]">
                      Academic Curriculum Architecture
                    </span>
                    <h4 className="text-base font-bold text-[#1F1F1F]">
                      {courseToEdit ? 'Edit Course Settings' : 'Create New Course Program'}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCourseModalOpen(false)}
                    className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer rounded-lg hover:bg-stone-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#1F1F1F] mb-1">Course Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Distributed Cloud Architecture & Kubernetes"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] focus:bg-white focus:border-[#F59E0B] outline-none font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#1F1F1F] mb-1">Category</label>
                      <select
                        value={courseForm.category}
                        onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] font-semibold outline-none"
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="AI & Full Stack">AI & Full Stack</option>
                        <option value="Cloud & DevOps">Cloud & DevOps</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#1F1F1F] mb-1">Course Duration *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 10 Days, 12 Weeks, 30 Days"
                        value={courseForm.duration}
                        onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] font-semibold outline-none"
                      />
                    </div>
                  </div>

                  {/* Daily Lecture Release Time configuration */}
                  <div className="p-3.5 rounded-2xl bg-[#FFF9EF] border border-[#FEDDAA] space-y-1.5">
                    <label className="block font-bold text-[#D97706] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#D97706]" />
                        <span>Daily Lecture Release Time *</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#D97706] bg-[#FFF0D4] px-2 py-0.5 rounded font-bold">
                        Individual Day-by-Day Release
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="time"
                        required
                        value={courseForm.dailyReleaseTime}
                        onChange={(e) => setCourseForm({ ...courseForm, dailyReleaseTime: e.target.value })}
                        className="px-3 py-2 bg-white border border-[#FEDDAA] rounded-xl text-[#1F1F1F] font-mono font-bold text-sm outline-none focus:border-[#F59E0B]"
                      />
                      <span className="text-[11px] text-[#6B6258] leading-snug">
                        Every day's video and test automatically unlocks at this scheduled time based on each student's individual start date.
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1F1F1F] mb-1">Program Overview / Summary</label>
                    <textarea
                      rows={3}
                      placeholder="Describe what students will learn, project outcomes, and curriculum milestones..."
                      value={courseForm.shortDescription}
                      onChange={(e) => setCourseForm({ ...courseForm, shortDescription: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] placeholder-stone-400 focus:bg-white focus:border-[#F59E0B] outline-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-[#1F1F1F] mb-1">Seat Capacity</label>
                      <input
                        type="number"
                        min="1"
                        value={courseForm.capacity}
                        onChange={(e) => setCourseForm({ ...courseForm, capacity: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] font-mono outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-[#1F1F1F]">Tuition Fee (₹)</label>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(courseForm.isFree)}
                            onChange={(e) =>
                              setCourseForm({
                                ...courseForm,
                                isFree: e.target.checked,
                                price: e.target.checked ? 0 : (courseForm.price || 9999),
                              })
                            }
                            className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span>Free Course</span>
                        </label>
                      </div>
                      <input
                        type="number"
                        min="0"
                        disabled={courseForm.isFree}
                        value={courseForm.isFree ? 0 : courseForm.price}
                        onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-xl text-[#1F1F1F] font-mono outline-none ${
                          courseForm.isFree ? 'bg-emerald-50 text-emerald-800 font-bold border-emerald-300' : 'bg-[#FAFAF7] border-[#E8E3DC]'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#1F1F1F] mb-1">Lead Instructor</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Sarah Jenkins"
                        value={courseForm.instructor}
                        onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl text-[#1F1F1F] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EEEAE4]">
                    <button
                      type="button"
                      onClick={() => setIsCourseModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-stone-100 text-[#1F1F1F] hover:bg-stone-200 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCourse}
                      className="px-5 py-2.5 rounded-xl bg-[#18181B] hover:bg-stone-900 text-white border border-stone-800 hover:border-amber-500/40 font-bold cursor-pointer disabled:opacity-50"
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
            <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white border border-[#E8E3DC] rounded-[28px] p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-[#EEEAE4]">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97706]">
                      Cohort Admission Registry
                    </span>
                    <h4 className="text-base font-bold text-[#1F1F1F]">
                      Students Applied for {currentSelectedCourse?.title || 'Selected Course'}
                    </h4>
                    <p className="text-xs text-[#6B6258]">
                      {courseAppsList.length} applicant{courseAppsList.length === 1 ? '' : 's'} registered for this program schedule.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCourseAppsModalOpen(false)}
                    className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer rounded-lg hover:bg-stone-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isLoadingCourseApps ? (
                  <div className="p-12 text-center">
                    <LoadingSpinner
                      size="md"
                      text="Loading applied students list..."
                      subtext="ADMISSIONS APPLICANT DOSSIER"
                      minHeight="min-h-[20vh]"
                    />
                  </div>
                ) : courseAppsList.length === 0 ? (
                  <div className="p-12 text-center bg-[#FAFAF7] rounded-2xl border border-[#E8E3DC] space-y-2">
                    <Users className="w-10 h-10 text-stone-300 mx-auto" />
                    <h5 className="text-sm font-bold text-[#1F1F1F]">No applicants yet</h5>
                    <p className="text-xs text-[#6B6258]">
                      No students have applied for this specific program yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courseAppsList.map((app) => (
                      <div
                        key={app.id}
                        className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E8E3DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-white hover:shadow-xs transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#18181B] text-amber-300 border border-stone-800 flex items-center justify-center font-bold text-sm shrink-0">
                            {(app.studentName || app.userName || 'S')[0].toUpperCase()}
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#1F1F1F] block text-sm">
                              {app.studentName || app.userName}
                            </span>
                            <span className="text-[#6B6258] font-mono text-[11px] block">
                              {app.studentEmail || app.userEmail} {app.studentPhone ? `• ${app.studentPhone}` : ''}
                            </span>
                            <div className="flex items-center gap-2 pt-0.5">
                              <span className="text-[10px] font-mono text-[#6B6258]">
                                App #: <strong className="text-[#1F1F1F]">{app.applicationNumber || app.id.slice(0, 10)}</strong>
                              </span>
                              <span>•</span>
                              <span className="text-[10px] font-mono text-[#D97706] font-semibold">
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
                    className="px-5 py-2.5 rounded-xl bg-[#18181B] hover:bg-stone-900 text-white border border-stone-800 hover:border-amber-500/40 font-bold text-xs cursor-pointer transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODAL: FACULTY CLARIFICATION & DOUBT REPLY MODAL                   */}
          {/* =================================================================== */}
          {selectedDoubtForReply && (
            <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white border border-[#E8E3DC] rounded-[28px] p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-[#EEEAE4]">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97706] flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Faculty Clarification Desk</span>
                    </span>
                    <h4 className="text-base font-bold text-[#1F1F1F] mt-0.5">
                      Reply to {selectedDoubtForReply.studentName}'s Doubt
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDoubtForReply(null)}
                    className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer rounded-lg hover:bg-stone-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E3DC] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#82684D] font-mono text-[11px]">
                    <span className="font-bold text-[#D97706]">
                      {selectedDoubtForReply.courseTitle}
                    </span>
                    <span>Day {selectedDoubtForReply.classNumber}: {selectedDoubtForReply.classTitle}</span>
                  </div>
                  <div className="text-stone-900 font-medium leading-relaxed bg-white p-3 rounded-lg border border-[#E8E3DC]/80">
                    "{selectedDoubtForReply.question}"
                  </div>
                </div>

                <form onSubmit={handleReplyDoubt} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#1F1F1F] mb-1.5">
                      Official Faculty Clarification / Explanation *
                    </label>
                    <textarea
                      rows={5}
                      required
                      autoFocus
                      placeholder="Type clear conceptual guidance, code solution, or architectural advice for the student..."
                      value={doubtReplyText}
                      onChange={(e) => setDoubtReplyText(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E8E3DC] rounded-xl text-stone-900 placeholder-stone-400 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 outline-none leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EEEAE4]">
                    <button
                      type="button"
                      onClick={() => setSelectedDoubtForReply(null)}
                      className="px-4 py-2.5 rounded-xl bg-stone-100 text-[#1F1F1F] hover:bg-stone-200 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingDoubtReply || !doubtReplyText.trim()}
                      className="px-5 py-2.5 rounded-xl bg-[#18181B] hover:bg-stone-900 text-white border border-stone-800 hover:border-amber-500/40 font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5 text-[#FBBF24]" />
                      <span>{isSubmittingDoubtReply ? 'Submitting...' : 'Send Clarification to Student'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODAL: PROFESSIONAL FACULTY PHOTO SELECTOR & UPLOADER               */}
          {/* =================================================================== */}
          {isPhotoModalOpen && (
            <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white border border-[#E8E3DC] rounded-[28px] p-6 max-w-xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-[#EEEAE4]">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97706]">
                      Faculty Profile Identity
                    </span>
                    <h4 className="text-base font-bold text-[#1F1F1F]">
                      Select Professional Faculty Photo
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(false)}
                    className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer rounded-lg hover:bg-stone-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Current Active Preview */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAFAF7] border border-[#E8E3DC]">
                  <div className="w-16 h-16 rounded-2xl bg-[#18181B] text-amber-300 font-bold flex items-center justify-center border-2 border-[#F59E0B]/50 overflow-hidden shrink-0 shadow-md">
                    {profileForm.avatar ? (
                      <img src={profileForm.avatar} alt="Selected Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black">{(profileForm.name || 'F')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#1F1F1F] block">Active Faculty Preview</span>
                    <p className="text-[11px] text-[#6B6258]">
                      This photo represents your academic identity across student hubs, class modules, and faculty communications.
                    </p>
                  </div>
                </div>

                {/* Upload from Device */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#1F1F1F]">Upload Custom Photo from Device</label>
                  <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-[#E8E3DC] hover:border-[#F59E0B] rounded-2xl cursor-pointer bg-[#FAFAF7] hover:bg-amber-50/30 transition-colors">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Upload className="w-6 h-6 text-[#D97706] mb-1.5" />
                      <span className="text-xs font-bold text-[#1F1F1F]">Click to upload profile picture</span>
                      <span className="text-[10px] text-[#6B6258] mt-0.5">PNG, JPG, or WebP (Max 3MB)</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#EEEAE4]">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm((prev) => ({ ...prev, avatar: '' }));
                      showToast('Photo cleared.');
                    }}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear Photo
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPhotoModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-[#E8E3DC] font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPhotoModalOpen(false);
                        showToast('Photo selected! Click "Save Profile Changes" to save.');
                      }}
                      className="px-5 py-2 rounded-xl bg-[#18181B] hover:bg-stone-900 text-white font-bold text-xs border border-stone-800 hover:border-amber-500/40 cursor-pointer shadow-xs"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODAL: BROADCASTED NOTICE DETAILS MODAL (Touch to Open)             */}
          {/* =================================================================== */}
          {selectedNoticeModal && (
            <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white border border-[#E8E3DC] rounded-[28px] p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
                <div className="flex items-start justify-between pb-3 border-b border-[#EEEAE4]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        selectedNoticeModal.priority === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {selectedNoticeModal.priority === 'HIGH' ? 'HIGH PRIORITY NOTICE' : 'COHORT NOTICE'}
                      </span>
                      <span className="text-[11px] font-mono text-[#6B6258] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(selectedNoticeModal.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#1F1F1F]">
                      {selectedNoticeModal.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedNoticeModal(null)}
                    className="text-stone-400 hover:text-stone-700 p-1.5 cursor-pointer rounded-lg hover:bg-stone-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E3DC] text-xs text-[#1F1F1F] leading-relaxed whitespace-pre-wrap">
                  {selectedNoticeModal.content}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 px-1 text-[#6B6258]">
                  <div>
                    <span>Dispatched by: </span>
                    <strong className="text-[#1F1F1F]">{selectedNoticeModal.authorName || 'Faculty'}</strong>
                    <span className="text-xs text-[#D97706] font-mono"> ({selectedNoticeModal.authorRole || 'Faculty'})</span>
                  </div>
                  {selectedNoticeModal.courseId && selectedNoticeModal.courseId !== 'ALL' && (
                    <span className="text-[10px] font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-700">
                      Target Course: {selectedNoticeModal.courseId}
                    </span>
                  )}
                </div>

                <div className="flex justify-end pt-3 border-t border-[#EEEAE4]">
                  <button
                    type="button"
                    onClick={() => setSelectedNoticeModal(null)}
                    className="px-5 py-2.5 rounded-xl bg-[#18181B] text-white font-bold text-xs hover:bg-stone-900 cursor-pointer shadow-xs"
                  >
                    Close Notice
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
