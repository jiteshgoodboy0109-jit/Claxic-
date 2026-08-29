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

import { HomeView } from './views/HomeView.jsx';
import { CoursesView } from './views/CoursesView.jsx';
import { CourseDetailView } from './views/CourseDetailView.jsx';
import { StudentDashboardView } from './views/StudentDashboardView.jsx';
import { UserLoginView } from './views/UserLoginView.jsx';
import { AdminDashboardView } from './admin/views/AdminDashboardView.jsx';
import { AdminLoginView } from './admin/views/AdminLoginView.jsx';

const MainApp = () => {
  const { user, isLoading: isAuthLoading, openAuthModal } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState('home');
  const [dashboardTab, setDashboardTab] = useState('courses');

  // Courses state
  const [courses, setCourses] = useState([]);
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

  // URL parser helper
  const parseRouteFromUrl = useCallback(
    (coursesList = []) => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const tab = searchParams.get('tab');

      if (path === '/admin-login' || path === '/admin/login') {
        return { view: 'admin-login', tab: null, course: null };
      }
      if (path === '/login') {
        return { view: 'login', tab: null, course: null };
      }
      if (path === '/register') {
        return { view: 'register', tab: null, course: null };
      }
      if (path.startsWith('/admin')) {
        return { view: 'admin', tab: tab || 'overview', course: null };
      }
      if (path.startsWith('/dashboard')) {
        return { view: 'dashboard', tab: tab || 'courses', course: null };
      }
      if (path.startsWith('/courses/')) {
        const slug = path.replace('/courses/', '').trim();
        const found = coursesList.find((c) => c.slug === slug || c.id === slug);
        return { view: 'course-detail', slug, course: found || null };
      }
      if (path === '/courses') {
        return { view: 'courses', tab: null, course: null };
      }
      return { view: 'home', tab: null, course: null };
    },
    []
  );

  // Fetch Courses list & synchronize initial URL route
  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        const coursesList = data.courses || [];
        setCourses(coursesList);

        // Resolve deep link if URL matches /courses/:slug
        const route = parseRouteFromUrl(coursesList);
        setCurrentView(route.view);
        if (route.tab) setDashboardTab(route.tab);
        if (route.course) setSelectedCourse(route.course);
      }
    } catch (e) {
      console.error('Error fetching courses:', e);
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
      if (route.tab && route.view === 'dashboard') {
        setDashboardTab(route.tab);
      }
      if (route.view === 'course-detail') {
        const found = courses.find((c) => c.slug === route.slug || c.id === route.slug);
        if (found) setSelectedCourse(found);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [courses, parseRouteFromUrl]);

  // Central Navigation Router Handler with Real URL Synchronization
  const handleNavigate = (view, param) => {
    let targetPath = '/';
    if (view === 'home') {
      targetPath = param ? `/#${param}` : '/';
    } else if (view === 'courses') {
      targetPath = '/courses';
      setSelectedCourse(null);
    } else if (view === 'course-detail') {
      const slug =
        typeof param === 'string'
          ? param
          : param?.slug || param?.id || selectedCourse?.slug;
      targetPath = `/courses/${slug}`;
      if (typeof param === 'object' && param !== null) {
        setSelectedCourse(param);
      }
    } else if (view === 'dashboard') {
      targetPath = param ? `/dashboard?tab=${param}` : '/dashboard';
      if (param) setDashboardTab(param);
    } else if (view === 'admin') {
      targetPath = param ? `/admin?tab=${param}` : '/admin';
    } else if (view === 'admin-login') {
      targetPath = '/admin-login';
    } else if (view === 'login') {
      targetPath = '/login';
    } else if (view === 'register') {
      targetPath = '/register';
    }

    if (window.location.pathname + window.location.search !== targetPath) {
      window.history.pushState({ view, param }, '', targetPath);
    }

    setCurrentView(view);
    if (view === 'dashboard' && param) {
      setDashboardTab(param);
    }

    if (view === 'home' && param) {
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

  // Select a course for detail view
  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    handleNavigate('course-detail', course);
  };

  // Open Application & Payment Modal
  const handleApplyCourse = (course) => {
    if (!user) {
      addToast('info', 'Sign in Required', 'Please sign in or create an account to start registration.');
      openAuthModal('login');
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

  const isAuthView = currentView === 'login' || currentView === 'register' || currentView === 'admin-login';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {/* Top Navbar (Hidden on Login/Register/Admin-Login views) */}
      {!isAuthView && <Navbar currentView={currentView} onNavigate={handleNavigate} />}

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
          selectedCourse ? (
            <CourseDetailView
              course={selectedCourse}
              allCourses={courses}
              onBack={() => handleNavigate('courses')}
              onApply={handleApplyCourse}
              onSelectCourse={handleSelectCourse}
            />
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
              <h2 className="text-2xl font-bold text-white">Course Not Found</h2>
              <p className="text-slate-400 text-sm">
                The requested course could not be located in our catalog.
              </p>
              <Button variant="primary" onClick={() => handleNavigate('courses')}>
                Browse All Courses
              </Button>
            </div>
          )
        )}

        {/* DEDICATED USER / STUDENT AUTHENTICATION PAGE */}
        {(currentView === 'login' || currentView === 'register') && (
          <UserLoginView
            initialMode={currentView === 'register' ? 'register' : 'login'}
            onNavigate={handleNavigate}
          />
        )}

        {/* DEDICATED ADMIN EXECUTIVE LOGIN PAGE */}
        {currentView === 'admin-login' && (
          <AdminLoginView onNavigate={handleNavigate} />
        )}

        {/* PROTECTED ROUTE: STUDENT DASHBOARD (User Data Only) */}
        {currentView === 'dashboard' && (
          !user ? (
            <UserLoginView initialMode="login" onNavigate={handleNavigate} />
          ) : (
            <StudentDashboardView
              initialTab={dashboardTab}
              onBrowseCourses={() => handleNavigate('courses')}
              onViewReceipt={handleViewReceipt}
              onSelectCourse={handleSelectCourse}
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
                  Your account (<span className="text-slate-200 font-mono font-semibold">{user.email}</span>) is authenticated with standard <span className="text-emerald-400 font-semibold">STUDENT (USER)</span> permissions. Access to administrator records, system metrics, applicant registries, and financial logs is strictly prohibited.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleNavigate('dashboard')}
                  leftIcon={<LayoutDashboard className="w-4 h-4" />}
                >
                  Go to Student Portal
                </Button>
                <Button variant="outline" size="lg" onClick={() => handleNavigate('admin-login')}>
                  Switch to Admin Sign In
                </Button>
              </div>
            </div>
          ) : (
            <AdminDashboardView
              onOpenCourseModal={handleOpenCourseModal}
              onOpenEmailSandbox={() => setIsEmailSandboxOpen(true)}
              onViewReceipt={handleViewReceipt}
            />
          )
        )}
      </main>

      {/* Global Footer (Hidden on Login/Register/Admin-Login views) */}
      {!isAuthView && <Footer onNavigate={handleNavigate} />}

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
