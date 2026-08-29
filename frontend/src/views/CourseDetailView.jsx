import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Award,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Star,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Share2,
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';

export const CourseDetailView = ({
  course,
  allCourses,
  onBack,
  onApply,
  onSelectCourse,
}) => {
  const [activeTab, setActiveTab] = useState('curriculum');
  const [openFaq, setOpenFaq] = useState(0);

  const related = allCourses
    .filter((c) => c.id !== course.id && (c.category === course.category || c.level === course.level))
    .slice(0, 2);

  return (
    <div className="pb-24 space-y-16 font-sans text-slate-900 bg-slate-50 min-h-screen">
      {/* Top Banner */}
      <section className="relative pt-10 pb-16 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-600 hover:text-indigo-600 mb-8 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course Catalog
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-wrap gap-2.5">
                <Badge variant="gold">{course.category}</Badge>
                <Badge variant="default">{course.level}</Badge>
                <Badge variant="info">{course.mode}</Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-display uppercase tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-base text-slate-600 font-normal leading-relaxed">
                {course.fullDescription}
              </p>

              {/* Key Meta Badges */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block uppercase font-semibold">Duration</span>
                  <span className="text-slate-900 font-bold">{course.duration}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-semibold">Cohort Starts</span>
                  <span className="text-slate-900 font-bold">{course.startDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-semibold">Deadline</span>
                  <span className="text-slate-900 font-bold">{course.registrationDeadline}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-semibold">Seat Availability</span>
                  <span className="text-emerald-600 font-bold">
                    {course.capacity - course.enrolledCount} / {course.capacity} Remaining
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar Pricing Box */}
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl space-y-6 shadow-sm sticky top-28">
              <div className="space-y-1">
                <span className="text-xs font-mono text-slate-500 uppercase block font-semibold">Tuition Fee</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold font-mono text-slate-900">
                    ₹{course.price.toLocaleString('en-IN')}
                  </span>
                  {course.originalPrice && (
                    <span className="text-sm font-mono text-slate-400 line-through">
                      ₹{course.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-emerald-600 block pt-1 font-semibold">
                  Includes 18% GST Tax Receipt & Lifetime Materials Access
                </span>
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  isDisabled={course.status === 'FULL'}
                  onClick={() => onApply(course)}
                >
                  {course.status === 'FULL' ? 'Cohort Capacity Reached' : 'Apply & Reserve Seat'}
                </Button>
                <p className="text-[11px] text-center text-slate-500 font-mono">
                  Protected by 7-Day Unconditional Money-Back Guarantee
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2.5 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Live Interactive Workshops + 4K Recordings</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1-on-1 Architecture Code Reviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified Claxic Credential Certificate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum & Instructors Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 font-mono text-xs uppercase tracking-wider overflow-x-auto">
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`pb-4 px-6 border-b-2 font-bold transition-colors whitespace-nowrap ${
              activeTab === 'curriculum'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Syllabus & Modules
          </button>
          <button
            onClick={() => setActiveTab('instructor')}
            className={`pb-4 px-6 border-b-2 font-bold transition-colors whitespace-nowrap ${
              activeTab === 'instructor'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Lead Faculty Profile
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`pb-4 px-6 border-b-2 font-bold transition-colors whitespace-nowrap ${
              activeTab === 'faq'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Program FAQ
          </button>
        </div>

        {/* Tab 1: Curriculum Modules */}
        {activeTab === 'curriculum' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-900 font-display uppercase">Syllabus Breakdown</h2>
            <div className="space-y-4">
              {course.modules.map((mod, idx) => (
                <div key={mod.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-indigo-600 font-bold uppercase">
                      Module {idx + 1} • {mod.duration}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-display">{mod.title}</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 pt-2 font-medium">
                    {mod.topics.map((top, tIdx) => (
                      <li key={tIdx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{top}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Instructor Profile */}
        {activeTab === 'instructor' && (
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-md"
              />
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 font-display">{course.instructor.name}</h3>
                <p className="text-xs text-indigo-600 font-mono font-bold">{course.instructor.title}</p>
                <p className="text-xs text-slate-500 font-medium">{course.instructor.company}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal border-t border-slate-100 pt-4">
              {course.instructor.bio}
            </p>
          </div>
        )}

        {/* Tab 3: FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-4 max-w-3xl">
            {course.faq.map((f, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <h4 className="text-sm font-bold text-slate-900">{f.question}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{f.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
