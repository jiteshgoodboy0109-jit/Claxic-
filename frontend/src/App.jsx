import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AuthModal } from './components/modals/AuthModal.jsx';
import { ApplicationModal } from './components/modals/ApplicationModal.jsx';
import { ReceiptModal } from './components/modals/ReceiptModal.jsx';
import { CourseModal } from './admin/modals/CourseModal.jsx';
import { EmailSandboxModal } from './admin/modals/EmailSandboxModal.jsx';
import { ToastContainer } from './components/ui/Toast.jsx';
import { Button } from './components/ui/Button.jsx';
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  User as UserIcon,
  BookOpen,
  LayoutDashboard,
} from 'lucide-react';

// Public & General Views
import { HomeView } from './views/HomeView.jsx';
import { CoursesView } from './views/CoursesView.jsx';
import { CourseDetailView } from './views/CourseDetailView.jsx';

// Role-Based Views: Student
import { StudentDashboardView } from './student/views/StudentDashboardView.jsx';
import { StudentLoginView as UserLoginView } from './student/views/StudentLoginView.jsx';

// Role-Based Views: Staff & Faculty
import { StaffLoginView } from './staff/views/StaffLoginView.jsx';
import { StaffDashboardView } from './staff/views/StaffDashboardView.jsx';

// Role-Based Views: Administration
import { AdminDashboardView } from './admin/views/AdminDashboardView.jsx';
import { AdminLoginView } from './admin/views/AdminLoginView.jsx';

const MainApp = () => {
  const { user, isLoading: isAuthLoading } = useAuth();

  // Sub-tabs state for role portals
  const [studentTab, setStudentTab] = useState(() => {
    const p = window.location.pathname;
    if (p.includes('/applications')) return 'applications';
    if (p.includes('/payments') || p.includes('/billing')) return 'billing';
    if (p.includes('/profile')) return 'profile';
    return 'courses';
  });

  const [staffTab, setStaffTab] = useState(() => {
    const p = window.location.pathname;
    const match = p.match(/^\/staff\/([a-z0-9_-]+)/);
    if (match && match[1] && match[1] !== 'login') {
      const seg = match[1];
      if (seg === 'cohort') return 'grading';
      if (seg === 'applications') return 'evaluations';
      return seg;
    }
    return 'overview';
  });

  const [adminTab, setAdminTab] = useState(() => {
    const p = window.location.pathname;
    const match = p.match(/^\/admin\/([a-z0-9_-]+)/);
    if (match && match[1] && match[1] !== 'login') {
      const seg = match[1];
      if (seg === 'payments') return 'financials';
      return seg;
    }
    return 'overview';
  });

  // Helper to parse route synchronously from current window.location
  const parseRouteFromUrl = useCallback((coursesList = []) => {
    let path = window.location.pathname.toLowerCase().trim();
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    const searchParams = new URLSearchParams(window.location.search);
    const legacyTab = searchParams.get('tab');

    // 1. Authentication Gateways
    if (path === '/admin/login' || path === '/admin-login') {
      return { view: 'admin-login', tab: null, course: null, title: 'Admin Console Gateway — Claxic' };
    }
    if (path === '/staff/login' || path === '/staff-login') {
      return { view: 'staff-login', tab: null, course: null, title: 'Faculty & Staff Sign In — Claxic' };
    }
    if (path === '/login' || path === '/student/login') {
      return { view: 'login', tab: null, course: null, title: 'Student Sign In — Claxic' };
    }
    if (path === '/register' || path === '/student/register') {
      return { view: 'register', tab: null, course: null, title: 'Create Student Account — Claxic' };
    }

    // 2. Student Portal (/student/... & legacy /dashboard)
    if (path.startsWith('/student') || path.startsWith('/dashboard')) {
      const seg = path.replace(/^\/(student|dashboard)/, '').replace(/^\//, '').split('/')[0] || legacyTab;
      let tab = 'courses';
      if (seg === 'applications') tab = 'applications';
      else if (seg === 'payments' || seg === 'billing') tab = 'billing';
      else if (seg === 'profile') tab = 'profile';
      else tab = 'courses';
      return { view: 'student', tab, course: null, title: 'Student Learning Hub — Claxic' };
    }

    // 3. Staff Portal (/staff/...)
    if (path.startsWith('/staff')) {
      const seg = path.replace(/^\/staff/, '').replace(/^\//, '').split('/')[0] || legacyTab || 'overview';
      let tab = seg || 'overview';
      if (seg === 'cohort') tab = 'grading';
      else if (seg === 'applications') tab = 'evaluations';
      return { view: 'staff', tab, course: null, title: 'Faculty & Staff Workspace — Claxic' };
    }

    // 4. Admin Portal (/admin/...)
    if (path.startsWith('/admin')) {
      const seg = path.replace(/^\/admin/, '').replace(/^\//, '').split('/')[0] || legacyTab || 'overview';
      let tab = seg || 'overview';
      if (seg === 'payments') tab = 'financials';
      return { view: 'admin', tab, course: null, title: 'Executive Admin Console — Claxic' };
    }

    // 5. Course Catalog & Detail
    if (path.startsWith('/courses/') || path.startsWith('/course/')) {
      const rest = path.replace(/^\/(courses|course)\//, '').trim();
      const isApply = rest.endsWith('/apply');
      const slug = isApply ? rest.replace(/\/apply$/, '') : rest;
      const found = coursesList.find((c) => c.slug?.toLowerCase() === slug || c.id?.toLowerCase() === slug);
      return {
        view: 'course-detail',
        slug,
        isApply,
        course: found || null,
        title: found?.title ? `${found.title} — Claxic` : 'Academic Course Detail — Claxic',
      };
    }
    if (path === '/courses' || path === '/course') {
      return { view: 'courses', tab: null, course: null, title: 'Academic Course Catalog — Claxic' };
    }

    // 6. Home / Admissions
    return { view: 'home', tab: null, course: null, title: 'Claxic — Academic Admissions & Learning Portal' };
  }, []);

  // Synchronously initialize view from URL on first mount
  const [currentView, setCurrentView] = useState(() => {
    const r = parseRouteFromUrl([]);
    if (r.title) document.title = r.title;
    return r.view;
  });

  // Courses state & deep link loading
  const [courses, setCourses] = useState([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Modals state
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [appModalCourse, setAppModalCourse] = useState(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptPaymentId, setReceiptPaymentId] = useState(null);

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState(null);

  const [isEmailSandboxOpen, setIsEmailSandboxOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const addToast = (type, title, message) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // URL normalization on mount to ensure clean canonical URLs in browser address bar
  useEffect(() => {
    const p = window.location.pathname.toLowerCase().trim();
    if (p === '/student' || p === '/student/' || p === '/dashboard' || p === '/dashboard/') {
      window.history.replaceState(null, '', '/student/learning');
    } else if (p === '/staff' || p === '/staff/') {
      window.history.replaceState(null, '', '/staff/overview');
    } else if (p === '/admin' || p === '/admin/') {
      window.history.replaceState(null, '', '/admin/overview');
    } else if (p === '/staff-login') {
      window.history.replaceState(null, '', '/staff/login');
    } else if (p === '/admin-login') {
      window.history.replaceState(null, '', '/admin/login');
    } else if (p === '/student-login') {
      window.history.replaceState(null, '', '/login');
    } else if (p === '/student-register') {
      window.history.replaceState(null, '', '/register');
    } else if (p === '/course' || p === '/course/') {
      window.history.replaceState(null, '', '/courses');
    }
  }, []);

  // Fetch Courses list & synchronize initial URL route
  const fetchCourses = async () => {
    setIsCoursesLoading(true);
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        const coursesList = data.courses || [];
        setCourses(coursesList);

        // Resolve deep link if URL matches /courses/:slug
        const route = parseRouteFromUrl(coursesList);
        setCurrentView(route.view);
        if (route.title) document.title = route.title;
        if (route.tab) {
          if (route.view === 'student') setStudentTab(route.tab);
          if (route.view === 'staff') setStaffTab(route.tab);
          if (route.view === 'admin') setAdminTab(route.tab);
        }
        if (route.view === 'course-detail') {
          if (route.course) {
            setSelectedCourse(route.course);
            if (route.isApply) {
              setAppModalCourse(route.course);
              setIsAppModalOpen(true);
            }
          } else {
            setSelectedCourse(null);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching courses:', e);
    } finally {
      setIsCoursesLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Synchronize Browser Back / Forward buttons (popstate event)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseRouteFromUrl(courses);
      setCurrentView(route.view);
      if (route.title) document.title = route.title;
      if (route.view === 'student' && route.tab) setStudentTab(route.tab);
      if (route.view === 'staff' && route.tab) setStaffTab(route.tab);
      if (route.view === 'admin' && route.tab) setAdminTab(route.tab);

      if (route.view === 'course-detail') {
        const found = route.course || courses.find((c) => c.slug?.toLowerCase() === route.slug?.toLowerCase() || c.id?.toLowerCase() === route.slug?.toLowerCase());
        if (found) {
          setSelectedCourse(found);
          document.title = `${found.title} — Claxic`;
          if (route.isApply) {
            setAppModalCourse(found);
            setIsAppModalOpen(true);
          }
        } else {
          setSelectedCourse(null);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [courses, parseRouteFromUrl]);

  // Central Navigation Router Handler with Semantic URL Synchronization
  const handleNavigate = (view, param) => {
    let targetView = view || 'home';
    let targetTab = param || null;
    let targetPath = '/';
    let pageTitle = 'Claxic — Academic Admissions & Learning Portal';

    // Normalize slashes in targetView (e.g. 'staff/classes' or '/staff/classes')
    if (typeof targetView === 'string') {
      const cleanPath = targetView.replace(/^\//, '').trim();
      const parts = cleanPath.split('/').filter(Boolean);

      if (parts.length > 0) {
        const rootSeg = parts[0].toLowerCase();
        const subSeg = parts[1] ? parts[1].toLowerCase() : null;

        if (rootSeg === 'student' || rootSeg === 'dashboard') {
          targetView = 'student';
          if (subSeg) targetTab = subSeg;
        } else if (rootSeg === 'staff') {
          if (subSeg === 'login') {
            targetView = 'staff-login';
          } else {
            targetView = 'staff';
            if (subSeg) targetTab = subSeg;
          }
        } else if (rootSeg === 'admin') {
          if (subSeg === 'login') {
            targetView = 'admin-login';
          } else {
            targetView = 'admin';
            if (subSeg) targetTab = subSeg;
          }
        } else if (rootSeg === 'courses') {
          if (subSeg) {
            targetView = 'course-detail';
            param = subSeg;
          } else {
            targetView = 'courses';
          }
        } else if (rootSeg === 'login') {
          targetView = 'login';
        } else if (rootSeg === 'register') {
          targetView = 'register';
        }
      }
    }

    // Map legacy 'dashboard' view string to 'student'
    if (targetView === 'dashboard') {
      targetView = 'student';
    }

    if (targetView === 'home') {
      targetPath = param ? `/#${param}` : '/';
      pageTitle = 'Claxic — Academic Admissions & Learning Portal';
    } else if (targetView === 'courses') {
      targetPath = '/courses';
      pageTitle = 'Academic Course Catalog — Claxic';
      setSelectedCourse(null);
    } else if (targetView === 'course-detail') {
      const slug =
        typeof param === 'string'
          ? param
          : param?.slug || param?.id || selectedCourse?.slug;
      targetPath = `/courses/${slug}`;
      if (typeof param === 'object' && param !== null) {
        setSelectedCourse(param);
        pageTitle = `${param.title || 'Course'} — Claxic`;
      } else {
        const found = courses.find((c) => c.slug?.toLowerCase() === slug?.toLowerCase() || c.id?.toLowerCase() === slug?.toLowerCase());
        if (found) {
          setSelectedCourse(found);
          pageTitle = `${found.title} — Claxic`;
        } else {
          pageTitle = 'Course Specialization — Claxic';
        }
      }
    } else if (targetView === 'login') {
      targetPath = '/login';
      pageTitle = 'Student Sign In — Claxic';
    } else if (targetView === 'register') {
      targetPath = '/register';
      pageTitle = 'Create Student Account — Claxic';
    } else if (targetView === 'staff-login') {
      targetPath = '/staff/login';
      pageTitle = 'Faculty & Staff Sign In — Claxic';
    } else if (targetView === 'admin-login') {
      targetPath = '/admin/login';
      pageTitle = 'Admin Console Gateway — Claxic';
    } else if (targetView === 'student') {
      targetTab = targetTab || studentTab || 'courses';
      if (targetTab === 'learning') targetTab = 'courses';
      setStudentTab(targetTab);
      if (targetTab === 'applications') targetPath = '/student/applications';
      else if (targetTab === 'billing' || targetTab === 'payments') targetPath = '/student/payments';
      else if (targetTab === 'profile') targetPath = '/student/profile';
      else targetPath = '/student/learning';
      pageTitle = 'Student Learning Hub — Claxic';
    } else if (targetView === 'staff') {
      targetTab = targetTab || staffTab || 'overview';
      if (targetTab === 'cohort') targetTab = 'grading';
      if (targetTab === 'applications') targetTab = 'evaluations';
      setStaffTab(targetTab);
      targetPath = `/staff/${targetTab}`;
      pageTitle = 'Staff & Faculty Workspace — Claxic';
    } else if (targetView === 'admin') {
      targetTab = targetTab || adminTab || 'overview';
      if (targetTab === 'payments') targetTab = 'financials';
      setAdminTab(targetTab);
      const urlSeg = targetTab === 'financials' ? 'payments' : targetTab;
      targetPath = `/admin/${urlSeg}`;
      pageTitle = 'Executive Admin Console — Claxic';
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({ view: targetView, tab: targetTab }, '', targetPath);
    }

    document.title = pageTitle;
    setCurrentView(targetView);

    if (targetView === 'home' && param) {
      setTimeout(() => {
        const elem = document.getElementById(param);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Resume pending course application after student signs in
  useEffect(() => {
    if (user && user.role === 'USER') {
      try {
        const pendingCourseRaw = sessionStorage.getItem('claxic_pending_apply_course');
        if (pendingCourseRaw) {
          sessionStorage.removeItem('claxic_pending_apply_course');
          const pendingCourse = JSON.parse(pendingCourseRaw);
          if (pendingCourse) {
            setAppModalCourse(pendingCourse);
            setIsAppModalOpen(true);
            handleNavigate('course-detail', pendingCourse);
            addToast('info', 'Ready to Apply', `Continuing application for ${pendingCourse.title}`);
          }
        }
      } catch (e) {
        console.error('Failed to resume pending course application:', e);
      }
    }
  }, [user]);

  // Select a course for detail view
  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    handleNavigate('course-detail', course);
  };

  // Open Application & Payment Modal or Redirect to Dedicated Student Sign In
  const handleApplyCourse = (course) => {
    if (!user) {
      if (course) {
        try {
          sessionStorage.setItem('claxic_pending_apply_course', JSON.stringify(course));
        } catch (e) {
          console.error('Failed to save pending course:', e);
        }
      }
      addToast('info', 'Sign in Required', 'Please sign in to proceed with your course application.');
      handleNavigate('login');
      return;
    }
    setAppModalCourse(course);
    setIsAppModalOpen(true);
  };

  // Success handler after payment
  const handlePaymentSuccess = (receiptNumber) => {
    addToast('success', 'Enrollment Confirmed!', `Your receipt #${receiptNumber} has been verified.`);
    fetchCourses();
    setReceiptPaymentId(receiptNumber);
    setIsReceiptModalOpen(true);
  };

  // Open Receipt
  const handleViewReceipt = (receiptNumberOrPaymentId) => {
    setReceiptPaymentId(receiptNumberOrPaymentId);
    setIsReceiptModalOpen(true);
  };

  // Open Admin Course Modal
  const handleOpenCourseModal = (course) => {
    setCourseToEdit(course || null);
    setIsCourseModalOpen(true);
  };

  const handleCourseSaved = () => {
    addToast('success', 'Course Saved', 'The course program has been updated successfully.');
    fetchCourses();
  };

  const isAuthView =
    currentView === 'login' ||
    currentView === 'register' ||
    currentView === 'staff-login' ||
    currentView === 'admin-login' ||
    (currentView === 'admin' && (!user || user.role !== 'ADMIN')) ||
    (currentView === 'staff' && (!user || user.role !== 'STAFF'));

  const isPortalDashboard =
    (currentView === 'admin' && user && user.role === 'ADMIN') ||
    (currentView === 'staff' && user && user.role === 'STAFF');

  const showGlobalNav = !isAuthView && !isPortalDashboard;
  const showGlobalFooter = !isAuthView && !isPortalDashboard;

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0F1E2E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-300 text-xs font-mono">
          <div className="w-8 h-8 rounded-full border-2 border-[#38BDF8] border-t-transparent animate-spin" />
          <span>Authenticating Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {/* Top Navbar (Hidden on Login / Register / Staff Login / Admin Login / Dedicated Portals) */}
      {showGlobalNav && <Navbar currentView={currentView} onNavigate={handleNavigate} />}

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            courses={courses}
            onSelectCourse={handleSelectCourse}
            onApplyCourse={handleApplyCourse}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'courses' && (
          <CoursesView
            courses={courses}
            onSelectCourse={handleSelectCourse}
            onApplyCourse={handleApplyCourse}
          />
        )}

        {currentView === 'course-detail' && (
          isCoursesLoading ? (
            <div className="min-h-[70vh] bg-[#f6fafa] flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#d8ecec] text-center space-y-4 shadow-sm">
                <div className="w-10 h-10 rounded-full border-3 border-[#0B4F50] border-t-transparent animate-spin mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Loading Academic Program...</h3>
                <p className="text-xs text-slate-500">Retrieving curriculum, modules, and schedule from database.</p>
              </div>
            </div>
          ) : selectedCourse ? (
            <CourseDetailView
              course={selectedCourse}
              allCourses={courses}
              onBack={() => handleNavigate('courses')}
              onApply={handleApplyCourse}
              onSelectCourse={handleSelectCourse}
            />
          ) : (
            <div className="min-h-[70vh] bg-[#f6fafa] flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#d8ecec] text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#0B4F50] flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Course Program Not Found</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The requested course could not be located in our catalog or may have been archived.
                </p>
                <Button variant="primary" onClick={() => handleNavigate('courses')}>
                  Browse All Masterclasses
                </Button>
              </div>
            </div>
          )
        )}

        {/* DEDICATED STUDENT AUTHENTICATION PAGE */}
        {(currentView === 'login' || currentView === 'register') && (
          <UserLoginView
            initialMode={currentView === 'register' ? 'register' : 'login'}
            onNavigate={handleNavigate}
          />
        )}

        {/* DEDICATED FACULTY & STAFF LOGIN PAGE */}
        {currentView === 'staff-login' && (
          <StaffLoginView onNavigate={handleNavigate} />
        )}

        {/* DEDICATED ADMIN EXECUTIVE LOGIN PAGE */}
        {currentView === 'admin-login' && (
          <AdminLoginView onNavigate={handleNavigate} />
        )}

        {/* PROTECTED ROUTE: STUDENT PORTAL (/student/...) */}
        {(currentView === 'student' || currentView === 'dashboard') && (
          !user ? (
            <UserLoginView initialMode="login" onNavigate={handleNavigate} />
          ) : user.role === 'ADMIN' ? (
            <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-800/80 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[11px] font-mono uppercase font-bold tracking-wider">
                  Admin Active
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight font-display mt-2">
                  Switched from Student View
                </h2>
                <p className="text-slate-400 text-sm">
                  You are authenticated with Administrator permissions (<span className="text-slate-200 font-mono font-semibold">{user.email}</span>).
                </p>
              </div>
              <Button variant="primary" size="lg" onClick={() => handleNavigate('admin')}>
                Go to Admin Console
              </Button>
            </div>
          ) : user.role === 'STAFF' ? (
            <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-sky-950/60 border border-sky-800/80 text-sky-400 flex items-center justify-center mx-auto shadow-lg">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-sky-950 text-sky-400 border border-sky-800 text-[11px] font-mono uppercase font-bold tracking-wider">
                  Staff Active
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight font-display mt-2">
                  Faculty Workspace
                </h2>
                <p className="text-slate-400 text-sm">
                  You are authenticated with Faculty Staff permissions (<span className="text-slate-200 font-mono font-semibold">{user.email}</span>).
                </p>
              </div>
              <Button variant="primary" size="lg" onClick={() => handleNavigate('staff')}>
                Go to Faculty Portal
              </Button>
            </div>
          ) : (
            <StudentDashboardView
              initialTab={studentTab}
              onNavigate={handleNavigate}
              onBrowseCourses={() => handleNavigate('courses')}
              onViewReceipt={handleViewReceipt}
              onSelectCourse={handleSelectCourse}
            />
          )
        )}

        {/* PROTECTED ROUTE: FACULTY & STAFF PANEL (Strict Staff Isolation) */}
        {currentView === 'staff' && (
          !user ? (
            <StaffLoginView onNavigate={handleNavigate} />
          ) : user.role !== 'STAFF' ? (
            <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800 text-[11px] font-mono uppercase font-bold tracking-wider">
                  403 Access Denied
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight font-display mt-2">
                  Faculty Authorization Required
                </h2>
                <p className="text-slate-400 text-sm">
                  Your account (<span className="text-slate-200 font-mono font-semibold">{user.email}</span>) is authenticated with <span className="text-amber-400 font-semibold">{user.role}</span> permissions. Access to instructor rosters, candidate interview rubrics, and academic evaluations requires Staff/Faculty authorization.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                {user.role === 'ADMIN' ? (
                  <Button variant="primary" size="lg" onClick={() => handleNavigate('admin')}>
                    Go to Admin Console
                  </Button>
                ) : (
                  <Button variant="primary" size="lg" onClick={() => handleNavigate('student', 'courses')}>
                    Go to Student Portal
                  </Button>
                )}
                <Button variant="outline" size="lg" onClick={() => handleNavigate('staff-login')}>
                  Staff Sign In
                </Button>
              </div>
            </div>
          ) : (
            <StaffDashboardView
              initialTab={staffTab}
              onNavigate={handleNavigate}
            />
          )
        )}

        {/* PROTECTED ROUTE: ADMIN DASHBOARD (Strict Admin Isolation) */}
        {currentView === 'admin' && (
          !user ? (
            <AdminLoginView onNavigate={handleNavigate} />
          ) : user.role !== 'ADMIN' ? (
            <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800 text-[11px] font-mono uppercase font-bold tracking-wider">
                  403 Access Denied
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight font-display mt-2">
                  Administrative Privilege Required
                </h2>
                <p className="text-slate-400 text-sm">
                  Your account (<span className="text-slate-200 font-mono font-semibold">{user.email}</span>) is authenticated with <span className="text-sky-400 font-semibold">{user.role}</span> permissions. Access to administrator records, system metrics, applicant registries, and financial logs is strictly prohibited.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                {user.role === 'STAFF' ? (
                  <Button variant="primary" size="lg" onClick={() => handleNavigate('staff')}>
                    Go to Faculty Portal
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => handleNavigate('student', 'courses')}
                    leftIcon={<LayoutDashboard className="w-4 h-4" />}
                  >
                    Go to Student Portal
                  </Button>
                )}
                <Button variant="outline" size="lg" onClick={() => handleNavigate('admin-login')}>
                  Switch to Admin Sign In
                </Button>
              </div>
            </div>
          ) : (
            <AdminDashboardView
              initialTab={adminTab}
              onOpenCourseModal={handleOpenCourseModal}
              onOpenEmailSandbox={() => setIsEmailSandboxOpen(true)}
              onViewReceipt={handleViewReceipt}
              onNavigate={handleNavigate}
            />
          )
        )}
      </main>

      {/* Global Footer (Hidden on Login/Register/Admin-Login/Admin Dashboard views) */}
      {showGlobalFooter && <Footer onNavigate={handleNavigate} />}

      {/* Modals Container */}
      <AuthModal />

      <ApplicationModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        course={appModalCourse}
        onSuccess={handlePaymentSuccess}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        paymentIdOrReceipt={receiptPaymentId}
      />

      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        courseToEdit={courseToEdit}
        onSaved={handleCourseSaved}
      />

      <EmailSandboxModal
        isOpen={isEmailSandboxOpen}
        onClose={() => setIsEmailSandboxOpen(false)}
      />

      {/* Toast Alert Stream */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
