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
  const { user, isLoading: isAuthLoading, openAuthModal } = useAuth();

  // Helper to parse route synchronously from current window.location
  const parseRouteFromUrl = useCallback((coursesList = []) => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');

    if (path === '/admin-login' || path === '/admin/login') {
      return { view: 'admin-login', tab: null, course: null, title: 'Admin Console Gateway — Claxic' };
    }
    if (path === '/staff-login' || path === '/staff/login') {
      return { view: 'staff-login', tab: null, course: null, title: 'Faculty & Staff Sign In — Claxic' };
    }
    if (path === '/login') {
      return { view: 'login', tab: null, course: null, title: 'Student Sign In — Claxic' };
    }
    if (path === '/register') {
      return { view: 'register', tab: null, course: null, title: 'Create Student Account — Claxic' };
    }
    if (path.startsWith('/admin')) {
      return { view: 'admin', tab: tab || 'overview', course: null, title: 'Executive Admin Console — Claxic' };
    }
    if (path.startsWith('/staff')) {
      return { view: 'staff', tab: tab || 'overview', course: null, title: 'Staff & Faculty Workspace — Claxic' };
    }
    if (path.startsWith('/dashboard')) {
      return { view: 'dashboard', tab: tab || 'courses', course: null, title: 'Student Learning Dashboard — Claxic' };
    }
    if (path.startsWith('/courses/')) {
      const slug = path.replace('/courses/', '').trim();
      const found = coursesList.find((c) => c.slug === slug || c.id === slug);
      return {
        view: 'course-detail',
        slug,
        course: found || null,
        title: found?.title ? `${found.title} — Claxic` : 'Academic Course Detail — Claxic',
      };
    }
    if (path === '/courses') {
      return { view: 'courses', tab: null, course: null, title: 'Academic Course Catalog — Claxic' };
    }
    return { view: 'home', tab: null, course: null, title: 'Claxic — Academic Admissions & Learning Portal' };
  }, []);

  // Synchronously initialize view from URL on first mount
  const [currentView, setCurrentView] = useState(() => {
    const r = parseRouteFromUrl([]);
    if (r.title) document.title = r.title;
    return r.view;
  });
  const [dashboardTab, setDashboardTab] = useState(() => parseRouteFromUrl([]).tab || 'courses');

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
        if (route.title) document.title = route.title;
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
      if (route.title) document.title = route.title;
      if (route.tab && (route.view === 'dashboard' || route.view === 'admin' || route.view === 'staff')) {
        setDashboardTab(route.tab);
      }
      if (route.view === 'course-detail') {
        const found = courses.find((c) => c.slug === route.slug || c.id === route.slug);
        if (found) {
          setSelectedCourse(found);
          document.title = `${found.title} — Claxic`;
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [courses, parseRouteFromUrl]);

  // Dedicated Portal Guard: If authenticated as STAFF or ADMIN, never redirect to default application/home page
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      if (currentView === 'home' || currentView === 'courses' || currentView === 'course-detail' || currentView === 'login' || currentView === 'register') {
        handleNavigate('admin');
      }
    } else if (user && user.role === 'STAFF') {
      if (currentView === 'home' || currentView === 'courses' || currentView === 'course-detail' || currentView === 'login' || currentView === 'register') {
        handleNavigate('staff');
      }
    }
  }, [user, currentView]);

  // Central Navigation Router Handler with Real URL Synchronization
  const handleNavigate = (view, param) => {
    // Prevent Staff & Admin users from inadvertently landing on the public application/home page
    if (user && user.role === 'ADMIN') {
      if (view === 'home' || view === 'courses' || view === 'course-detail' || view === 'login' || view === 'register') {
        view = 'admin';
      }
    } else if (user && user.role === 'STAFF') {
      if (view === 'home' || view === 'courses' || view === 'course-detail' || view === 'login' || view === 'register') {
        view = 'staff';
      }
    }

    let targetPath = '/';
    let pageTitle = 'Claxic — Academic Admissions & Learning Portal';

    if (view === 'home') {
      targetPath = param ? `/#${param}` : '/';
      pageTitle = 'Claxic — Academic Admissions & Learning Portal';
    } else if (view === 'courses') {
      targetPath = '/courses';
      pageTitle = 'Academic Course Catalog — Claxic';
      setSelectedCourse(null);
    } else if (view === 'course-detail') {
      const slug =
        typeof param === 'string'
          ? param
          : param?.slug || param?.id || selectedCourse?.slug;
      targetPath = `/courses/${slug}`;
      if (typeof param === 'object' && param !== null) {
        setSelectedCourse(param);
        pageTitle = `${param.title || 'Course'} — Claxic`;
      } else {
        const found = courses.find((c) => c.slug === slug || c.id === slug);
        if (found) {
          setSelectedCourse(found);
          pageTitle = `${found.title} — Claxic`;
        } else {
          pageTitle = 'Course Specialization — Claxic';
        }
      }
    } else if (view === 'dashboard') {
      targetPath = param ? `/dashboard?tab=${param}` : '/dashboard';
      pageTitle = 'Student Learning Dashboard — Claxic';
      if (param) setDashboardTab(param);
    } else if (view === 'admin') {
      targetPath = param ? `/admin?tab=${param}` : '/admin';
      pageTitle = 'Executive Admin Console — Claxic';
    } else if (view === 'staff') {
      targetPath = param ? `/staff?tab=${param}` : '/staff';
      pageTitle = 'Staff & Faculty Workspace — Claxic';
    } else if (view === 'admin-login') {
      targetPath = '/admin-login';
      pageTitle = 'Admin Console Gateway — Claxic';
    } else if (view === 'staff-login') {
      targetPath = '/staff-login';
      pageTitle = 'Faculty & Staff Sign In — Claxic';
    } else if (view === 'login') {
      targetPath = '/login';
      pageTitle = 'Student Sign In — Claxic';
    } else if (view === 'register') {
      targetPath = '/register';
      pageTitle = 'Create Student Account — Claxic';
    }

    if (window.location.pathname + window.location.search !== targetPath) {
      window.history.pushState({ view, param }, '', targetPath);
    }

    document.title = pageTitle;
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

        {/* PROTECTED ROUTE: DASHBOARD (Auto-Routes to Admin / Staff / Student based on Role) */}
        {currentView === 'dashboard' && (
          !user ? (
            <UserLoginView initialMode="login" onNavigate={handleNavigate} />
          ) : user.role === 'ADMIN' ? (
            <AdminDashboardView
              onNavigate={handleNavigate}
              onSelectCourse={handleSelectCourse}
            />
          ) : user.role === 'STAFF' ? (
            <StaffDashboardView onNavigate={handleNavigate} />
          ) : (
            <StudentDashboardView
              initialTab={dashboardTab}
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
                  <Button variant="primary" size="lg" onClick={() => handleNavigate('dashboard')}>
                    Go to Student Portal
                  </Button>
                )}
                <Button variant="outline" size="lg" onClick={() => handleNavigate('staff-login')}>
                  Staff Sign In
                </Button>
              </div>
            </div>
          ) : (
            <StaffDashboardView onNavigate={handleNavigate} />
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
                    onClick={() => handleNavigate('dashboard')}
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
