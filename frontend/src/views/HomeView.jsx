import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Award,
  CheckCircle2,
  Layers,
  Code2,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const HomeView = ({
  courses,
  onNavigate,
}) => {
  const { user, openAuthModal } = useAuth();

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
    } catch (err) {
      setSubmitError(err.message || 'Error submitting admission application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const publishedCourses = courses.filter((c) => c.status === 'PUBLISHED' || c.status === 'FULL');

  return (
    <div className="space-y-12 pb-20 font-sans text-slate-900 bg-[#f6fafa]">
      {/* 1. COMPACT, ATTRACTIVE HERO SECTION */}
      <section className="relative pt-9 sm:pt-12 pb-24 sm:pb-28 bg-[#083E40] text-white overflow-hidden">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(20,184,166,0.3),transparent)] pointer-events-none" />
        
        {/* Botanical Watermark */}
        <div className="absolute top-0 right-0 opacity-15 pointer-events-none">
          <svg width="220" height="220" viewBox="0 0 100 100" fill="none" stroke="#FDE047" strokeWidth="1.2">
            <path d="M10,90 Q50,10 90,50 Q60,80 10,90 Z" />
            <path d="M10,90 Q30,50 90,50" />
            <path d="M30,70 Q45,55 55,60" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-3.5">



            {/* Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Master Production Systems & Advanced Engineering.
            </h1>

            {/* Subhead */}
            <p className="text-xs sm:text-sm text-teal-100/90 max-w-xl mx-auto font-normal leading-relaxed">
              Intensive, live interactive cohorts led by distinguished principal architects from Google, Microsoft, and leading tech scaleups.
            </p>



          </div>
        </div>
      </section>

      {/* 2. DIRECT ADMISSIONS REGISTRATION FORM CARD (ELEVATED WITH RICH BACKGROUND SHADOW) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-20">
        <div className="bg-white border border-[#d8ecec]/90 rounded-[32px] sm:rounded-[36px] p-6 sm:p-10 shadow-[0_25px_60px_-15px_rgba(8,62,64,0.28),0_12px_30px_-5px_rgba(0,0,0,0.12)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eef7f7] pb-5">
            <div>
              <span className="text-xs font-semibold text-[#0B4F50] uppercase tracking-wider block">
                Direct Candidate Admissions
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                Cohort Registration Form
              </h2>
            </div>
            {selectedCourse && (
              <div className="bg-[#f2f7f7] px-4 py-2 rounded-2xl border border-[#d8ecec] text-left sm:text-right">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Program Tuition</span>
                <span className="text-lg font-bold text-[#0B4F50]">
                  ₹{selectedCourse.price.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          {/* Alert Messages */}
          {submitError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Application Submitted! App #{submitSuccess.applicationNumber}</span>
              </div>
              <p className="text-slate-700 text-xs">
                Your seat for <strong>{submitSuccess.courseTitle}</strong> has been registered. You can complete your fee payment in your dashboard.
              </p>
            </div>
          )}

          {/* Application Form */}
          <form onSubmit={handleInlineApplySubmit} className="space-y-4">
            {/* Course Selection Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Academic Program *
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 rounded-full px-4 py-3 text-sm text-slate-900 outline-none font-semibold transition-all cursor-pointer"
              >
                {publishedCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — ₹{c.price.toLocaleString('en-IN')} ({c.duration})
                  </option>
                ))}
              </select>
            </div>

            {/* Candidate Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 rounded-full px-4 py-2.5 sm:py-3 text-sm text-slate-900 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. priya.sharma@domain.com"
                  className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 rounded-full px-4 py-2.5 sm:py-3 text-sm text-slate-900 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 rounded-full px-4 py-2.5 sm:py-3 text-sm text-slate-900 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  College / Company
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Stanford / Microsoft"
                  className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 rounded-full px-4 py-2.5 sm:py-3 text-sm text-slate-900 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Degree / Current Role
                </label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="B.Tech CS / SDE 2"
                  className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 rounded-full px-4 py-2.5 sm:py-3 text-sm text-slate-900 outline-none transition-all"
                />
              </div>
            </div>

            {/* Preferred Batch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Batch Schedule
                </label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 rounded-full px-4 py-2.5 sm:py-3 text-sm text-slate-900 outline-none font-medium transition-all"
                >
                  <option value="Weekend Evening">Weekend Evening (Sat & Sun 6:00 - 9:00 PM IST)</option>
                  <option value="Weekday Morning">Weekday Morning (Tue & Thu 7:30 - 9:30 AM IST)</option>
                  <option value="Executive Fast-Track">Executive Fast-Track (Intensive 4-Week Format)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Learning Objective
                </label>
                <input
                  type="text"
                  value={sop}
                  onChange={(e) => setSop(e.target.value)}
                  placeholder="e.g. Lead Staff Architect interviews"
                  className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 rounded-full px-4 py-2.5 sm:py-3 text-sm text-slate-900 outline-none transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-[#eef7f7] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0B4F50] shrink-0" />
                <span>Verified Razorpay Gateway & Instant PDF Tax Invoice</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#0B4F50] hover:bg-[#073637] text-white font-bold text-sm rounded-full shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{user ? 'Submit Application & Reserve Seat' : 'Sign In & Submit Application'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 3. CATALOG REDIRECT BANNER */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-6 rounded-[28px] bg-white border border-[#d8ecec] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#eef7f7] text-[#0B4F50] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Want to review full curriculum modules & faculty?
              </h3>
              <p className="text-xs text-slate-500">
                Explore detailed course overviews, weekly topics, and project milestones in the Course Catalog.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('courses')}
            className="px-5 py-2.5 rounded-full bg-[#eef7f7] hover:bg-[#e2f0f0] text-[#0B4F50] font-bold text-xs border border-[#cbe4e4] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
          >
            <span>Browse Catalog</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 4. VALUE PILLARS: WHY CLAXIC COHORTS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-2">
        <div className="text-center max-w-xl mx-auto mb-8 space-y-1.5">
          <span className="text-xs font-bold text-[#0B4F50] uppercase tracking-wider">
            Pedagogical Excellence
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Practitioners
          </h2>
          <p className="text-xs text-slate-600">
            Every track is designed from first principles with real-world infrastructure and architectural rigor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#d8ecec] p-6 rounded-[24px] space-y-3 shadow-2xs hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-[#eef7f7] text-[#0B4F50] border border-[#cbe4e4] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Production-Scale Architecture</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deploy distributed systems, vector search pipelines, and Kubernetes clusters designed to handle real enterprise workloads.
            </p>
          </div>

          <div className="bg-white border border-[#d8ecec] p-6 rounded-[24px] space-y-3 shadow-2xs hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-[#eef7f7] text-[#0B4F50] border border-[#cbe4e4] flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Direct 1-on-1 Mentorship</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Receive line-by-line code evaluations and private architecture mock interviews with principal architects.
            </p>
          </div>

          <div className="bg-white border border-[#d8ecec] p-6 rounded-[24px] space-y-3 shadow-2xs hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-[#eef7f7] text-[#0B4F50] border border-[#cbe4e4] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Verifiable Invoices & Certificates</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cryptographically signed certificate of mastery, verifiable portfolio links, and 18% GST tax invoices for reimbursement.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
