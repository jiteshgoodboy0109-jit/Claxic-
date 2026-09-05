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
  Play,
  Video,
  CheckSquare,
  Sparkles,
  ChevronRight,
  X,
  Film,
  Code2,
  Mail,
  Check,
  PlayCircle,
  GraduationCap,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const StudentDashboardView = ({
  initialTab = 'courses',
  onNavigate,
  onBrowseCourses,
  onViewReceipt,
  onSelectCourse,
}) => {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  const [applications, setApplications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Learning Hub & Classroom State
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedLearningCourseId, setSelectedLearningCourseId] = useState(null);
  const [classFilter, setClassFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'UPCOMING' | 'COMPLETED' | 'PROJECT'
  const [activeClassForVideo, setActiveClassForVideo] = useState(null);
  const [activeClassForQuiz, setActiveClassForQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Anti-skip lecture watch time verification state
  const [watchSeconds, setWatchSeconds] = useState(0);
  const WATCH_REQUIREMENT_SECONDS = 30; // 30s minimum engagement requirement to unlock attendance

  // Track video lecture watch time when active
  useEffect(() => {
    if (!activeClassForVideo) {
      setWatchSeconds(0);
      return;
    }

    setWatchSeconds(0);
    const timer = setInterval(() => {
      setWatchSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeClassForVideo]);

  // Final Project Submission Form State
  const [projectForm, setProjectForm] = useState({
    projectTitle: '',
    description: '',
    githubUrl: '',
    documentationUrl: '',
    liveDemoUrl: '',
  });
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [projectError, setProjectError] = useState(null);
  const [projectSuccessMsg, setProjectSuccessMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

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

  // Helper to convert any YouTube URL into privacy-enhanced embed URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    try {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
      } else if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        videoId = urlObj.searchParams.get('v');
      } else if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) {
        videoId = url.split('/embed/')[1]?.split('?')[0]?.split('&')[0];
      }
      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
      }
    } catch (e) {
      // fallback
    }
    return url;
  };

  // Student Profile Form State
  const fileInputRef = useRef(null);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileMobile, setProfileMobile] = useState(extract10DigitMobile(user?.mobile));
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
      setProfileMobile(extract10DigitMobile(user.mobile));
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
      const headers = { Authorization: `Bearer ${token}` };
      const [appRes, payRes, learnRes] = await Promise.all([
        fetch('/api/user/applications', { headers }),
        fetch('/api/user/payments', { headers }),
        fetch('/api/learning/my-courses', { headers }),
      ]);

      if (appRes.status === 401 || payRes.status === 401 || learnRes.status === 401) {
        if (logout) logout();
        if (onNavigate) onNavigate('login');
        return;
      }

      if (appRes.ok) {
        const appData = await appRes.json();
        setApplications(appData.applications || []);
      }
      if (payRes.ok) {
        const payData = await payRes.json();
        setPayments(payData.payments || []);
      }
      if (learnRes.ok) {
        const learnData = await learnRes.json();
        const loadedCourses = learnData.courses || [];
        setEnrolledCourses(loadedCourses);
        if (loadedCourses.length > 0 && !selectedLearningCourseId) {
          setSelectedLearningCourseId(loadedCourses[0].courseId);
        }
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadLearningCourses = async () => {
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/learning/my-courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEnrolledCourses(data.courses || []);
      }
    } catch (e) {
      console.error('Error reloading learning courses:', e);
    }
  };

  // Mark class completed with verified watch time
  const handleCompleteClass = async (courseId, classId, currentWatchSeconds = 0) => {
    try {
      setIsMarkingComplete(true);
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/learning/courses/${courseId}/classes/${classId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ watchSeconds: currentWatchSeconds }),
      });
      if (res.ok) {
        showToast('Class attendance verified & completed!');
        reloadLearningCourses();
      }
    } catch (e) {
      console.error('Complete class error:', e);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  // Submit interactive quiz
  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    if (!activeClassForQuiz || !selectedLearningCourseId) return;
    setIsSubmittingQuiz(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(
        `/api/learning/courses/${selectedLearningCourseId}/classes/${activeClassForQuiz.id}/quiz`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answers: quizAnswers }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setQuizResult(data);
        showToast(data.message);
        reloadLearningCourses();
      } else {
        alert(data.error || 'Failed to submit quiz.');
      }
    } catch (e) {
      console.error('Quiz error:', e);
      alert('Failed to submit quiz answers.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Submit final course project
  const handleSubmitProject = async (e) => {
    e.preventDefault();
    setProjectError(null);
    setProjectSuccessMsg(null);

    if (!projectForm.projectTitle.trim()) {
      setProjectError('Please provide a project or model title.');
      return;
    }
    if (!projectForm.githubUrl.trim() || !projectForm.githubUrl.includes('github.com')) {
      setProjectError('Please provide a valid GitHub repository URL (e.g. https://github.com/username/project).');
      return;
    }

    setIsSubmittingProject(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/learning/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: selectedLearningCourseId,
          ...projectForm,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setProjectSuccessMsg('Project submitted successfully for faculty review!');
        showToast('Final project submitted to faculty!');
        reloadLearningCourses();
      } else {
        setProjectError(data.error || 'Failed to submit project.');
      }
    } catch (e) {
      setProjectError('Failed to submit project. Please check your network connection.');
    } finally {
      setIsSubmittingProject(false);
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

  // Handle 10-digit mobile number input
  const handleProfileMobileChange = (e) => {
    let digits = e.target.value.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    if (digits.length > 10) {
      digits = digits.slice(-10);
    }
    setProfileMobile(digits);
  };

  // Save profile and avatar changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (profileMobile && profileMobile.length !== 10) {
      setProfileError('Please enter a valid 10-digit mobile number.');
      return;
    }
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
          mobile: profileMobile ? `+91 ${profileMobile.trim()}` : '',
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
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (onNavigate) {
      onNavigate('student', tab);
    } else {
      let target = '/student/learning';
      if (tab === 'applications') target = '/student/applications';
      else if (tab === 'billing' || tab === 'payments') target = '/student/payments';
      else if (tab === 'profile') target = '/student/profile';
      window.history.replaceState(null, '', target);
    }
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

      {/* Tab 1: Enrolled Courses & Automated Learning Hub */}
      {activeTab === 'courses' && (
        <div className="space-y-8">
          {enrolledCourses.length === 0 && confirmedApps.length === 0 ? (
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
            (() => {
              const activeCourse =
                enrolledCourses.find((c) => c.courseId === selectedLearningCourseId) ||
                enrolledCourses[0] ||
                null;

              if (!activeCourse) {
                return (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Loading your learning curriculum...
                  </div>
                );
              }

              const filteredSchedule = (activeCourse.schedule || []).filter((cls) => {
                if (classFilter === 'ALL') return true;
                if (classFilter === 'TODAY') return cls.status === 'TODAY';
                if (classFilter === 'COMPLETED') return cls.status === 'COMPLETED';
                if (classFilter === 'UPCOMING') return cls.status === 'UPCOMING';
                return true;
              });

              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Multi-cohort Selector if enrolled in multiple programs */}
                  {enrolledCourses.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
                      {enrolledCourses.map((c) => (
                        <button
                          key={c.courseId}
                          type="button"
                          onClick={() => setSelectedLearningCourseId(c.courseId)}
                          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
                            selectedLearningCourseId === c.courseId
                              ? 'bg-[#0B4F50] text-white shadow-xs'
                              : 'bg-white border border-[#d8ecec] text-slate-700 hover:bg-[#f2f7f7]'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{c.courseTitle}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Active Course Learning Overview Card (Simple & Neat UI) */}
                  <div className="p-6 sm:p-7 rounded-[28px] bg-white border border-[#d8ecec] shadow-xs space-y-5">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                      <div className="space-y-2.5 flex-1">
                        {/* Status & Cohort Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-[#0B4F50]/10 text-[#0B4F50] text-[11px] font-mono font-bold tracking-wider uppercase border border-[#0B4F50]/15">
                            {activeCourse.category} Cohort
                          </span>
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/80 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active Learning Cycle</span>
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
                          {activeCourse.courseTitle}
                        </h2>

                        {/* Academic Metadata Info Strip */}
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-600 font-medium pt-0.5">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#0B4F50]" />
                            <span>Commenced: <strong className="text-slate-800 font-semibold">{activeCourse.formattedStartDate || activeCourse.startDate}</strong></span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#0B4F50]" />
                            <span>Duration: <strong className="text-slate-800 font-semibold">{activeCourse.duration}</strong> ({activeCourse.totalClasses} Day Schedule)</span>
                          </span>
                          {activeCourse.instructor && (
                            <span className="flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-[#0B4F50]" />
                              <span>Faculty: <strong className="text-slate-800 font-semibold">{typeof activeCourse.instructor === 'object' ? activeCourse.instructor?.name || 'Lead Instructor' : activeCourse.instructor}</strong></span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Course Completion Telemetry Pill */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center p-4 rounded-2xl bg-[#f2f7f7] border border-[#d8ecec] shrink-0 sm:min-w-[155px] text-left sm:text-right">
                        <div>
                          <div className="flex items-baseline gap-1 sm:justify-end">
                            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0B4F50]">
                              {activeCourse.progressPercent}%
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Completed
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {activeCourse.completedCount} of {activeCourse.totalClasses} Classes Done
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Schedule Milestones */}
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Curriculum Progression</span>
                        </span>
                        <span className="font-mono text-xs font-bold text-[#0B4F50]">
                          {activeCourse.completedCount}/{activeCourse.totalClasses} Milestones Reached
                        </span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-slate-100 border border-slate-200/70 overflow-hidden p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-[#0B4F50] to-teal-500 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${Math.min(100, activeCourse.progressPercent)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-0.5">
                        <span>Day 1 ({activeCourse.formattedStartDate || activeCourse.startDate})</span>
                        <span className="flex items-center gap-1 text-[#0B4F50] font-semibold">
                          <Award className="w-3.5 h-3.5 text-[#0B4F50]" />
                          <span>Capstone Certification</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Course Faculty & Staff Profile (Only Visible Inside Student's Course Content) */}
                  <div className="p-6 sm:p-7 rounded-[28px] bg-white border border-[#d8ecec] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="relative shrink-0">
                        <img
                          src={
                            typeof activeCourse.instructor === 'object' && activeCourse.instructor?.avatar
                              ? activeCourse.instructor.avatar
                              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'
                          }
                          alt={
                            typeof activeCourse.instructor === 'object'
                              ? activeCourse.instructor?.name || 'Faculty Lead'
                              : activeCourse.instructor || 'Faculty Lead'
                          }
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-[#d8ecec] shadow-xs"
                        />
                        <span
                          className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"
                          title="Course Faculty Member Active"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#0B4F50]/10 text-[#0B4F50] border border-[#0B4F50]/20">
                            Assigned Course Faculty
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                            Verified Staff
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                          {typeof activeCourse.instructor === 'object'
                            ? activeCourse.instructor?.name || 'Dr. Sarah Jenkins'
                            : activeCourse.instructor || 'Dr. Sarah Jenkins'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {typeof activeCourse.instructor === 'object'
                            ? activeCourse.instructor?.title || activeCourse.instructor?.company || 'Lead Engineering Faculty'
                            : 'Academic Faculty Directorate'}
                        </p>
                        {typeof activeCourse.instructor === 'object' && activeCourse.instructor?.bio && (
                          <p className="text-xs text-slate-600 line-clamp-2 max-w-2xl pt-0.5">
                            {activeCourse.instructor.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <a
                        href="mailto:faculty.office@claxic.edu"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f2f7f7] hover:bg-[#e4efef] text-[#0B4F50] text-xs font-bold border border-[#d8ecec] transition-all shadow-2xs cursor-pointer"
                      >
                        <Mail className="w-4 h-4 text-[#0B4F50]" />
                        <span>Contact Faculty</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => window.open('https://meet.google.com', '_blank')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B4F50] hover:bg-[#083e40] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Video className="w-4 h-4 text-teal-200" />
                        <span>Faculty Mentorship & Office Hours</span>
                      </button>
                    </div>
                  </div>

                  {/* Navigation Filter Tabs for Course Schedule */}
                  <div className="flex items-center justify-between border-b border-[#d8ecec] pb-2 overflow-x-auto gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setClassFilter('ALL')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          classFilter === 'ALL'
                            ? 'bg-[#0B4F50] text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-[#f2f7f7] border border-[#d8ecec]'
                        }`}
                      >
                        All Classes ({activeCourse.schedule.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setClassFilter('TODAY')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          classFilter === 'TODAY'
                            ? 'bg-[#0B4F50] text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-[#f2f7f7] border border-[#d8ecec]'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Today's Class</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setClassFilter('COMPLETED')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          classFilter === 'COMPLETED'
                            ? 'bg-[#0B4F50] text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-[#f2f7f7] border border-[#d8ecec]'
                        }`}
                      >
                        Completed ({activeCourse.completedCount})
                      </button>

                      <button
                        type="button"
                        onClick={() => setClassFilter('UPCOMING')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          classFilter === 'UPCOMING'
                            ? 'bg-[#0B4F50] text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-[#f2f7f7] border border-[#d8ecec]'
                        }`}
                      >
                        Upcoming ({activeCourse.schedule.filter((c) => c.status === 'UPCOMING').length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setClassFilter('PROJECT')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          classFilter === 'PROJECT'
                            ? 'bg-[#0B4F50] text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-[#f2f7f7] border border-[#d8ecec]'
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Final Capstone Project</span>
                        {activeCourse.finalProject && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    </div>

                    <span className="text-xs text-slate-400 font-mono hidden md:inline shrink-0">
                      Auto-Scheduled from Start Date
                    </span>
                  </div>

                  {/* Day-by-Day Schedule Cards */}
                  {classFilter !== 'PROJECT' && (
                    <div className="space-y-4">
                      {filteredSchedule.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-[28px] border border-[#d8ecec] space-y-2">
                          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                          <h4 className="text-sm font-bold text-slate-800">No classes match this filter</h4>
                          <p className="text-xs text-slate-500">
                            Switch to "All Classes" to view your complete curriculum schedule.
                          </p>
                        </div>
                      ) : (
                        filteredSchedule.map((cls) => (
                          <div
                            key={cls.id}
                            className={`p-6 rounded-[28px] bg-white border transition-all space-y-4 shadow-xs hover:shadow-md ${
                              cls.isToday
                                ? 'border-sky-300 ring-2 ring-sky-100'
                                : cls.status === 'COMPLETED'
                                ? 'border-emerald-200'
                                : 'border-[#d8ecec]'
                            }`}
                          >
                            {/* Class Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                              <div className="flex items-center gap-2.5">
                                <span className="px-3 py-1 rounded-full bg-[#0B4F50] text-white text-[10px] font-mono font-bold tracking-wider">
                                  DAY {cls.dayNumber} • CLASS {cls.classNumber}
                                </span>
                                <span className="text-xs font-mono font-semibold text-slate-600">
                                  {cls.formattedDate}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {cls.status === 'COMPLETED' && (
                                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Class Completed</span>
                                  </span>
                                )}
                                {cls.isLocked && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-mono font-bold">
                                    <Lock className="w-3 h-3 text-amber-600" />
                                    <span>{cls.lockMessage || `Unlocks on Day ${cls.dayNumber}`}</span>
                                  </span>
                                )}
                                {!cls.isLocked && cls.isToday && cls.status !== 'COMPLETED' && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-mono font-bold">
                                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                                    <span>Today's Class</span>
                                  </span>
                                )}
                                {!cls.isLocked && !cls.isToday && cls.status === 'AVAILABLE' && (
                                  <span className="px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                                    Recording Ready
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Class Content Details */}
                            <div className="space-y-2.5">
                              <div className="flex items-start justify-between gap-4">
                                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                  {cls.title}
                                </h3>
                                <span className="text-xs text-slate-500 font-mono shrink-0 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{cls.duration}</span>
                                </span>
                              </div>

                              {/* Topics Taught */}
                              {cls.topics && cls.topics.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {cls.topics.map((topic, tidx) => (
                                    <span
                                      key={tidx}
                                      className="px-2.5 py-0.5 rounded-md bg-[#f2f7f7] border border-[#d8ecec] text-[#0B4F50] font-mono text-[10px] font-semibold"
                                    >
                                      #{topic}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Staff Post-Class Summary: What was taught in this session */}
                              {cls.summary && !cls.isLocked && (
                                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-xs text-teal-950 space-y-1 mt-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[#0B4F50] text-[10px] uppercase font-mono tracking-wider">
                                      Faculty Post-Class Summary (What Was Taught)
                                    </span>
                                    <span className="text-[10px] font-mono font-semibold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded">
                                      Recorded by Faculty
                                    </span>
                                  </div>
                                  <p className="leading-relaxed pt-0.5">{cls.summary}</p>
                                </div>
                              )}
                            </div>

                            {/* Action Toolbar */}
                            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                              {cls.isLocked ? (
                                <div className="flex items-center gap-2 text-xs text-amber-900 bg-amber-50/90 border border-amber-200/90 px-4 py-2.5 rounded-xl font-medium w-full">
                                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>This lecture and assessment are locked. {cls.lockMessage || `Available on Day ${cls.dayNumber}.`}</span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    {/* Watch Video button */}
                                    {cls.videoUrl && (
                                      <button
                                        type="button"
                                        onClick={() => setActiveClassForVideo(cls)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4F50] hover:bg-[#073637] text-white font-bold transition-all cursor-pointer shadow-2xs"
                                      >
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                        <span>Watch Class Video</span>
                                      </button>
                                    )}

                                    {/* Learning Materials */}
                                    {cls.learningMaterials && cls.learningMaterials.length > 0 ? (
                                      cls.learningMaterials.map((mat, midx) => (
                                        <a
                                          key={midx}
                                          href={mat.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f2f7f7] hover:bg-[#ebf4f4] border border-[#d8ecec] text-slate-800 font-semibold transition-colors cursor-pointer"
                                        >
                                          <FileText className="w-3.5 h-3.5 text-[#0B4F50]" />
                                          <span>{mat.title || 'Learning Materials'}</span>
                                          <ExternalLink className="w-3 h-3 text-slate-400" />
                                        </a>
                                      ))
                                    ) : cls.resourcesUrl ? (
                                      <a
                                        href={cls.resourcesUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f2f7f7] hover:bg-[#ebf4f4] border border-[#d8ecec] text-slate-800 font-semibold transition-colors cursor-pointer"
                                      >
                                        <FileText className="w-3.5 h-3.5 text-[#0B4F50]" />
                                        <span>Learning Materials</span>
                                        <ExternalLink className="w-3 h-3 text-slate-400" />
                                      </a>
                                    ) : null}

                                    {/* Class Quiz / Test */}
                                    {cls.test && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveClassForQuiz(cls);
                                          setQuizAnswers({});
                                          setQuizResult(cls.testResult || null);
                                        }}
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                                          cls.testResult && cls.testResult.passed
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                            : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200'
                                        }`}
                                      >
                                        <CheckSquare className="w-3.5 h-3.5 text-[#0284C7]" />
                                        <span>
                                          {cls.testResult
                                            ? `Quiz Passed (${cls.testResult.score}%)`
                                            : 'Take Class Test'}
                                        </span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Verified Attendance Status / Action */}
                                  {cls.status === 'COMPLETED' ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs shadow-2xs">
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Attended & Verified</span>
                                      {cls.watchSeconds > 0 && (
                                        <span className="text-[10px] font-mono text-emerald-700 font-normal">
                                          ({cls.watchSeconds}s watched)
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setActiveClassForVideo(cls)}
                                      className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[#0B4F50] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-98"
                                    >
                                      <PlayCircle className="w-3.5 h-3.5 text-[#0B4F50]" />
                                      <span>Watch & Verify Attendance</span>
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Final Course Project Section */}
                  {(classFilter === 'ALL' || classFilter === 'PROJECT') && (
                    <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#d8ecec] space-y-6 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#0B4F50] uppercase">
                            <Award className="w-4 h-4" />
                            <span>Final Course Capstone & Graduation Model</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">
                            Final Project: Model Implementation & GitHub Submission
                          </h3>
                          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                            To complete the course and receive your accredited certificate, submit your capstone model architecture and source code via a public GitHub repository for faculty evaluation.
                          </p>
                        </div>

                        {activeCourse.finalProject && (
                          <div className="shrink-0">
                            <span
                              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                                activeCourse.finalProject.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : activeCourse.finalProject.status === 'CHANGES_REQUESTED'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              Status: {activeCourse.finalProject.status.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* If Project is Submitted */}
                      {activeCourse.finalProject ? (
                        <div className="p-5 rounded-2xl bg-[#f8fbfb] border border-[#d8ecec] space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h4 className="text-base font-bold text-slate-900">
                                {activeCourse.finalProject.projectTitle}
                              </h4>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">
                                Submitted on: {new Date(activeCourse.finalProject.submittedAt).toLocaleDateString()}
                              </p>
                            </div>

                            <a
                              href={activeCourse.finalProject.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-mono font-bold transition-all cursor-pointer shrink-0"
                            >
                              <Code2 className="w-4 h-4 text-[#38BDF8]" />
                              <span>Open Submitted GitHub Repo</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                            </a>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed">
                            {activeCourse.finalProject.description}
                          </p>

                          {/* Faculty Feedback Card */}
                          {activeCourse.finalProject.staffFeedback ? (
                            <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5 shadow-2xs">
                              <span className="font-bold text-[#0B4F50] block text-[11px] uppercase font-mono">
                                Faculty Review Remarks & Verification Feedback
                              </span>
                              <p className="text-slate-800 leading-relaxed">
                                {activeCourse.finalProject.staffFeedback}
                              </p>
                              {activeCourse.finalProject.reviewedBy && (
                                <span className="text-[10px] text-slate-400 block pt-1 font-mono">
                                  Verified by Faculty: {activeCourse.finalProject.reviewedBy} • {new Date(activeCourse.finalProject.reviewedAt || activeCourse.finalProject.updatedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-800 font-medium">
                              Your project is currently in the faculty verification queue. You will receive feedback here once evaluated.
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Submission Form */
                        <form onSubmit={handleSubmitProject} className="space-y-4 text-xs">
                          {projectError && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                              {projectError}
                            </div>
                          )}
                          {projectSuccessMsg && (
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                              {projectSuccessMsg}
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                Project / Model Title *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Distributed Consensus Engine with Multi-Raft"
                                value={projectForm.projectTitle}
                                onChange={(e) => setProjectForm({ ...projectForm, projectTitle: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-[#f2f7f7] border border-[#d8ecec] rounded-xl text-slate-900 focus:bg-white focus:border-[#0B4F50] outline-none font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                GitHub Repository URL * (Public Access)
                              </label>
                              <input
                                type="url"
                                required
                                placeholder="https://github.com/your-username/repository"
                                value={projectForm.githubUrl}
                                onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-[#f2f7f7] border border-[#d8ecec] rounded-xl text-slate-900 font-mono focus:bg-white focus:border-[#0B4F50] outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                Documentation URL / README Link
                              </label>
                              <input
                                type="url"
                                placeholder="https://github.com/.../blob/main/README.md or Notion doc"
                                value={projectForm.documentationUrl}
                                onChange={(e) => setProjectForm({ ...projectForm, documentationUrl: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-[#f2f7f7] border border-[#d8ecec] rounded-xl text-slate-900 font-mono focus:bg-white focus:border-[#0B4F50] outline-none"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                Live Demo / Deployment URL (Optional)
                              </label>
                              <input
                                type="url"
                                placeholder="https://my-app.vercel.app or demo endpoint"
                                value={projectForm.liveDemoUrl}
                                onChange={(e) => setProjectForm({ ...projectForm, liveDemoUrl: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-[#f2f7f7] border border-[#d8ecec] rounded-xl text-slate-900 font-mono focus:bg-white focus:border-[#0B4F50] outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              Model Architecture & Implementation Summary *
                            </label>
                            <textarea
                              rows={3}
                              required
                              placeholder="Describe your model architecture, algorithms implemented, testing methodology, and instructions for faculty review..."
                              value={projectForm.description}
                              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-[#f2f7f7] border border-[#d8ecec] rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0B4F50] outline-none leading-relaxed"
                            />
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="submit"
                              disabled={isSubmittingProject}
                              className="px-6 py-3 rounded-full bg-[#0B4F50] hover:bg-[#073637] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                            >
                              <Award className="w-4 h-4" />
                              <span>{isSubmittingProject ? 'Submitting...' : 'Submit Project for Faculty Review'}</span>
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Video Player Modal */}
                  {activeClassForVideo && (
                    <div className="fixed inset-0 bg-[#0F1E2E]/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                      <div className="bg-white border border-[#CBD5E1] rounded-[28px] p-6 max-w-2xl w-full space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0B4F50]">
                              DAY {activeClassForVideo.dayNumber} • {activeCourse.courseTitle}
                            </span>
                            <h4 className="text-base font-bold text-slate-900 mt-0.5">
                              {activeClassForVideo.title}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveClassForVideo(null)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Video Player Frame */}
                        <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center relative shadow-inner">
                          {activeClassForVideo.videoUrl && (activeClassForVideo.videoUrl.includes('youtube.com') || activeClassForVideo.videoUrl.includes('youtu.be') || activeClassForVideo.videoUrl.includes('youtube-nocookie.com')) ? (
                            <iframe
                              src={getYouTubeEmbedUrl(activeClassForVideo.videoUrl)}
                              title={activeClassForVideo.title}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <div className="p-8 text-center text-white space-y-3">
                              <Film className="w-12 h-12 text-[#38BDF8] mx-auto" />
                              <h5 className="text-sm font-bold">{activeClassForVideo.title}</h5>
                              <a
                                href={activeClassForVideo.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0284C7] text-white text-xs font-bold"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Launch Video Stream</span>
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Post-Class Summary in Modal */}
                        {activeClassForVideo.summary && (
                          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-100 text-xs text-teal-950 space-y-1">
                            <span className="font-bold text-[#0B4F50] block text-[10px] uppercase font-mono">
                              What Was Taught
                            </span>
                            <p className="leading-relaxed">{activeClassForVideo.summary}</p>
                          </div>
                        )}

                        {/* Anti-Skip Live Engagement & Watch Verification Meter */}
                        <div className="p-4 rounded-2xl bg-[#f2f7f7] border border-[#d8ecec] space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              {watchSeconds >= WATCH_REQUIREMENT_SECONDS ? (
                                <>
                                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                  <span className="text-emerald-800 font-bold">Lecture Engagement Verified</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4 text-[#0B4F50] animate-pulse" />
                                  <span className="text-[#0B4F50]">Engagement Verification in Progress</span>
                                </>
                              )}
                            </span>
                            <span className="font-mono font-bold text-xs text-slate-600">
                              {Math.min(watchSeconds, WATCH_REQUIREMENT_SECONDS)}s / {WATCH_REQUIREMENT_SECONDS}s
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                watchSeconds >= WATCH_REQUIREMENT_SECONDS
                                  ? 'bg-emerald-500'
                                  : 'bg-[#0B4F50]'
                              }`}
                              style={{
                                width: `${Math.min(100, Math.round((watchSeconds / WATCH_REQUIREMENT_SECONDS) * 100))}%`,
                              }}
                            />
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center justify-between">
                            <span>
                              {watchSeconds >= WATCH_REQUIREMENT_SECONDS
                                ? '✓ Minimum lecture requirement fulfilled. You may now confirm attendance.'
                                : `Watch lecture for at least ${WATCH_REQUIREMENT_SECONDS - watchSeconds} more seconds to unlock attendance verification.`}
                            </span>
                            <span className="font-mono text-slate-400 shrink-0 ml-2">
                              {Math.min(100, Math.round((watchSeconds / WATCH_REQUIREMENT_SECONDS) * 100))}%
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Duration: {activeClassForVideo.duration}</span>
                          </span>
                          <button
                            type="button"
                            disabled={isMarkingComplete || watchSeconds < WATCH_REQUIREMENT_SECONDS}
                            onClick={() => {
                              handleCompleteClass(activeCourse.courseId, activeClassForVideo.id, watchSeconds);
                              setActiveClassForVideo(null);
                            }}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              watchSeconds >= WATCH_REQUIREMENT_SECONDS
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {watchSeconds < WATCH_REQUIREMENT_SECONDS ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Watch Required ({WATCH_REQUIREMENT_SECONDS - watchSeconds}s remaining)</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Confirm Watched & Attended</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interactive Quiz / Test Modal */}
                  {activeClassForQuiz && activeClassForQuiz.test && (
                    <div className="fixed inset-0 bg-[#0F1E2E]/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                      <div className="bg-white border border-[#CBD5E1] rounded-[28px] p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0B4F50]">
                              DAY {activeClassForQuiz.dayNumber} COMPREHENSION TEST
                            </span>
                            <h4 className="text-base font-bold text-slate-900 mt-0.5">
                              {activeClassForQuiz.test.title}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveClassForQuiz(null);
                              setQuizResult(null);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* If Quiz Already Graded */}
                        {quizResult ? (
                          <div className="space-y-4 text-xs">
                            <div
                              className={`p-5 rounded-2xl border text-center space-y-2 ${
                                quizResult.passed
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                                  : 'bg-amber-50 border-amber-200 text-amber-950'
                              }`}
                            >
                              <div className="text-3xl font-extrabold font-mono">
                                {quizResult.score}%
                              </div>
                              <h5 className="font-bold text-sm">
                                {quizResult.passed ? '🎉 Congratulations! You Passed' : 'Needs Review'}
                              </h5>
                              <p className="text-xs leading-relaxed max-w-xs mx-auto">
                                {quizResult.message}
                              </p>
                            </div>

                            {/* Answers Review */}
                            {quizResult.review && quizResult.review.length > 0 && (
                              <div className="space-y-3 pt-2">
                                <h6 className="font-bold text-slate-800 text-[11px] uppercase font-mono">
                                  Review Questions & Rationales
                                </h6>
                                {quizResult.review.map((rev, ridx) => (
                                  <div
                                    key={ridx}
                                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                                      rev.isCorrect
                                        ? 'bg-emerald-50/50 border-emerald-200'
                                        : 'bg-rose-50/50 border-rose-200'
                                    }`}
                                  >
                                    <p className="font-bold text-slate-900">{rev.question}</p>
                                    <p className="text-slate-600">
                                      Your answer: <strong className={rev.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>{rev.selectedAnswer}</strong>
                                    </p>
                                    {!rev.isCorrect && (
                                      <p className="text-emerald-800">
                                        Correct answer: <strong>{rev.correctAnswer}</strong>
                                      </p>
                                    )}
                                    {rev.explanation && (
                                      <p className="text-[11px] text-slate-500 italic pt-0.5">
                                        Note: {rev.explanation}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="pt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveClassForQuiz(null);
                                  setQuizResult(null);
                                }}
                                className="px-5 py-2.5 rounded-xl bg-[#0B4F50] text-white text-xs font-bold cursor-pointer hover:bg-[#073637]"
                              >
                                Done & Return to Curriculum
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Interactive Quiz Questions */
                          <form onSubmit={handleSubmitQuiz} className="space-y-4 text-xs">
                            <div className="space-y-4">
                              {(activeClassForQuiz.test.questions || []).map((q, qIdx) => (
                                <div key={q.id || qIdx} className="p-4 rounded-2xl bg-[#f8fbfb] border border-[#d8ecec] space-y-2.5">
                                  <span className="font-mono font-bold text-[10px] text-[#0B4F50] block">
                                    QUESTION {qIdx + 1}
                                  </span>
                                  <p className="font-bold text-slate-900 text-sm">{q.question}</p>

                                  <div className="space-y-1.5 pt-1">
                                    {(q.options || []).map((opt, optIdx) => (
                                      <label
                                        key={optIdx}
                                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                          quizAnswers[q.id] === optIdx
                                            ? 'bg-teal-50 border-[#0B4F50] text-[#0B4F50] font-semibold'
                                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name={`question_${q.id}`}
                                          checked={quizAnswers[q.id] === optIdx}
                                          onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })}
                                          className="text-[#0B4F50]"
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="pt-2 flex items-center justify-between">
                              <span className="text-[11px] text-slate-500 font-mono">
                                Passing Threshold: {activeClassForQuiz.test.passingScore || 70}%
                              </span>
                              <button
                                type="submit"
                                disabled={isSubmittingQuiz}
                                className="px-5 py-2.5 rounded-xl bg-[#0B4F50] hover:bg-[#073637] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                              >
                                {isSubmittingQuiz ? 'Grading Answers...' : 'Submit Answers for Grading'}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
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
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold flex items-center justify-between">
                    <span>Mobile Number</span>
                    {profileMobile && (
                      <span className={`text-[10px] font-mono font-bold ${profileMobile.length === 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {profileMobile.length === 10 ? '✓ 10 Digits' : `${profileMobile.length}/10`}
                      </span>
                    )}
                  </label>
                  <div className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus-within:bg-white border border-[#d8ecec] focus-within:border-[#0B4F50] focus-within:ring-2 focus-within:ring-[#0B4F50]/15 rounded-full flex items-center transition-all overflow-hidden">
                    <div className="flex items-center gap-1.5 pl-3.5 pr-2.5 py-2.5 border-r border-[#d8ecec] select-none shrink-0 bg-[#e5f0f0]/60 text-slate-800 font-mono font-bold text-xs sm:text-sm">
                      <span className="text-sm leading-none">🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={profileMobile}
                      onChange={handleProfileMobileChange}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full bg-transparent px-3.5 py-2.5 text-sm text-slate-900 outline-none font-mono placeholder:font-sans placeholder:text-slate-400"
                    />
                  </div>
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
