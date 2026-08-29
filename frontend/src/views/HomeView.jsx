import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  Calendar,
  Zap,
  Star,
  ChevronRight,
  Clock,
  Briefcase,
  FileText,
  User as UserIcon,
  Mail,
  Phone,
  School,
  GraduationCap,
  Check,
  Lock,
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const HomeView = ({
  courses,
  onSelectCourse,
  onApplyCourse,
  onNavigate,
}) => {
  const { user, openAuthModal, login } = useAuth();

  // Direct Application Form State embedded on Home Page
  const [selectedCourseId, setSelectedCourseId] = useState(
    courses.length > 0 ? courses[0].id : ''
  );
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [institution, setInstitution] = useState(user?.institution || '');
  const [degree, setDegree] = useState(user?.degree || '');
  const [batch, setBatch] = useState('Weekend Evening');
  const [sop, setSop] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const handleInlineApplySubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!selectedCourse) {
      setSubmitError('Please select a valid course program.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          formData: {
            fullName,
            email,
            mobile,
            institution,
            degree,
            batch,
            sop,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Application submission failed.');
      }

      setSubmitSuccess({
        applicationNumber: data.application.applicationNumber,
        courseTitle: selectedCourse.title,
        status: data.application.status,
      });

      if (onApplyCourse) {
        onApplyCourse(selectedCourse);
      }
    } catch (err) {
      setSubmitError(err.message || 'Error submitting admission application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const publishedCourses = courses.filter((c) => c.status === 'PUBLISHED' || c.status === 'FULL');

  return (
    <div className="space-y-16 pb-16 font-sans text-slate-900 bg-slate-50">
      {/* 1. HERO & DIRECT APPLICATION FORM SECTION */}
      <section className="pt-8 sm:pt-12 pb-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Title */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-800 text-xs font-mono tracking-wider uppercase font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-slate-700" />
              <span>Fall 2026 Academic Admissions</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight uppercase leading-tight font-display">
              Course Application & Registration
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal">
              Select your academic specialization, enter your candidate details, and complete your registration directly below.
            </p>
          </div>

          {/* EMBEDDED APPLICATION FORM CARD */}
          <div className="max-w-4xl mx-auto bg-white border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block font-semibold">
                  Official Admission Form
                </span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5 uppercase font-display">
                  Direct Student Registration
                </h2>
              </div>
              {selectedCourse && (
                <div className="text-right font-mono bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Program Fee</span>
                  <span className="text-lg font-bold text-slate-900">
                    ₹{selectedCourse.price.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {/* Alert Messages */}
            {submitError && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Application Submitted! App #{submitSuccess.applicationNumber}</span>
                </div>
                <p className="text-slate-700 text-xs">
                  Your seat for <strong>{submitSuccess.courseTitle}</strong> has been registered.
                </p>
              </div>
            )}

            {/* Application Form */}
            <form onSubmit={handleInlineApplySubmit} className="space-y-5">
              {/* Course Selection Dropdown */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1.5 font-bold">
                  1. Select Specialization Cohort *
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} — ₹{c.price.toLocaleString('en-IN')} ({c.duration})
                    </option>
                  ))}
                </select>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Full Candidate Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="candidate@university.edu"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Contact & Institution */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    College / Institution
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="IIT Bombay / Stanford"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Degree / Qualification
                  </label>
                  <input
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder="B.Tech Computer Science"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Preferred Batch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Preferred Schedule
                  </label>
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
                  >
                    <option value="Weekend Evening">Weekend Evening (Sat & Sun 6-9 PM)</option>
                    <option value="Weekday Morning">Weekday Morning (Mon-Thu 8-10 AM)</option>
                    <option value="Executive Fast-Track">Executive Fast-Track (Intensive 4-Week)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Goal / Specialization
                  </label>
                  <input
                    type="text"
                    value={sop}
                    onChange={(e) => setSop(e.target.value)}
                    placeholder="e.g. Preparing for Senior Engineer role"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Verified Razorpay Gateway & Tax Invoice PDF Receipt</span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {user ? 'Submit Application & Pay Fee' : 'Sign In & Submit Application'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 2. COURSE PROGRAM CATALOG SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-wider mb-1 font-semibold">
              <BookOpen className="w-4 h-4 text-slate-700" />
              <span>Available Academic Programs</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight uppercase font-display">
              Course Catalog ({publishedCourses.length} Active Tracks)
            </h2>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('courses')}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Explore All Courses
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedCourses.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative h-44 overflow-hidden bg-slate-100 border-b border-slate-100">
                  <img
                    src={c.bannerImage}
                    alt={c.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="gold">{c.category}</Badge>
                    <Badge variant="default">{c.level}</Badge>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      {c.duration}
                    </span>
                    <span className="flex items-center gap-1 text-amber-900 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {c.rating}
                    </span>
                  </div>

                  <h3
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      window.scrollTo({ top: 200, behavior: 'smooth' });
                    }}
                    className="text-base font-bold text-slate-900 hover:text-slate-700 cursor-pointer uppercase transition-colors font-display leading-snug"
                  >
                    {c.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                    {c.shortDescription}
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                <span className="text-base font-bold font-mono text-slate-900">
                  ₹{c.price.toLocaleString('en-IN')}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectCourse(c)}
                  >
                    Details
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      window.scrollTo({ top: 200, behavior: 'smooth' });
                    }}
                  >
                    Apply Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
