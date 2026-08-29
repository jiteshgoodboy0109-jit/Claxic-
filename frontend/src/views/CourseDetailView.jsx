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
import { CourseCard } from '../components/courses/CourseCard.jsx';

export const CourseDetailView = ({
  course,
  allCourses,
  onBack,
  onApply,
  onSelectCourse,
}) => {
  const [activeTab, setActiveTab] = useState('curriculum');

  const related = (allCourses || [])
    .filter((c) => c.id !== course.id && (c.category === course.category || c.level === course.level))
    .slice(0, 3);

  return (
    <div className="pb-24 space-y-16 font-sans text-slate-900 bg-[#f6fafa] min-h-screen">
      {/* Top Banner */}
      <section className="relative pt-10 pb-16 bg-white border-b border-[#d8ecec] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs text-[#0B4F50] hover:text-[#073637] mb-8 transition-colors font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Programs</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-wrap gap-2.5">
                <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-[#0B4F50] border border-[#cbe4e4] text-xs font-bold">
                  {course.category}
                </span>
                <span className="px-3.5 py-1 rounded-full bg-[#f2f7f7] text-[#0B4F50] border border-[#d8ecec] text-xs font-medium">
                  {course.level}
                </span>
                <span className="px-3.5 py-1 rounded-full bg-[#083E40] text-white text-xs font-medium">
                  {course.mode}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.2]">
                {course.title}
              </h1>

              <p className="text-base text-slate-600 font-normal leading-relaxed">
                {course.fullDescription}
              </p>

              {/* Key Meta Badges */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[#f2f7f7] text-xs">
                <div>
                  <span className="text-slate-500 block uppercase font-medium text-[11px]">Duration</span>
                  <span className="text-slate-900 font-bold text-sm mt-0.5 block">{course.duration}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-medium text-[11px]">Cohort Starts</span>
                  <span className="text-slate-900 font-bold text-sm mt-0.5 block">{course.startDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-medium text-[11px]">Deadline</span>
                  <span className="text-slate-900 font-bold text-sm mt-0.5 block">{course.registrationDeadline}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-medium text-[11px]">Seat Availability</span>
                  <span className="text-[#0B4F50] font-bold text-sm mt-0.5 block">
                    {course.capacity - course.enrolledCount} / {course.capacity} Remaining
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar Pricing Box */}
            <div className="bg-white border border-[#d8ecec] p-8 rounded-[32px] space-y-6 shadow-md sticky top-28">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase block font-semibold">Tuition Fee</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-[#083E40]">
                    ₹{course.price.toLocaleString('en-IN')}
                  </span>
                  {course.originalPrice && (
                    <span className="text-sm text-slate-400 line-through">
                      ₹{course.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#0B4F50] block pt-1 font-semibold">
                  Includes 18% GST Tax Receipt & Lifetime Materials Access
                </span>
              </div>

              <div className="space-y-3">
                <button
                  disabled={course.status === 'FULL'}
                  onClick={() => onApply(course)}
                  className="w-full py-3.5 px-6 rounded-full bg-[#0B4F50] hover:bg-[#073637] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                >
                  {course.status === 'FULL' ? 'Cohort Capacity Reached' : 'Apply & Reserve Seat'}
                </button>
                <p className="text-xs text-center text-slate-500">
                  Protected by 7-Day Unconditional Money-Back Guarantee
                </p>
              </div>

              <div className="pt-4 border-t border-[#f2f7f7] space-y-2.5 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0B4F50] shrink-0" />
                  <span>Live Interactive Workshops + 4K Recordings</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0B4F50] shrink-0" />
                  <span>1-on-1 Architecture Code Reviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0B4F50] shrink-0" />
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
        <div className="flex border-b border-[#d8ecec] text-xs font-semibold uppercase tracking-wider overflow-x-auto">
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`pb-4 px-6 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'curriculum'
                ? 'border-[#0B4F50] text-[#0B4F50]'
                : 'border-transparent text-slate-500 hover:text-[#0B4F50]'
            }`}
          >
            Syllabus & Modules
          </button>
          <button
            onClick={() => setActiveTab('instructor')}
            className={`pb-4 px-6 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'instructor'
                ? 'border-[#0B4F50] text-[#0B4F50]'
                : 'border-transparent text-slate-500 hover:text-[#0B4F50]'
            }`}
          >
            Lead Faculty Profile
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`pb-4 px-6 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'faq'
                ? 'border-[#0B4F50] text-[#0B4F50]'
                : 'border-transparent text-slate-500 hover:text-[#0B4F50]'
            }`}
          >
            Program FAQ
          </button>
        </div>

        {/* Tab 1: Curriculum Modules */}
        {activeTab === 'curriculum' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-900">Curriculum Breakdown</h2>
            <div className="space-y-4">
              {course.modules.map((mod, idx) => (
                <div key={mod.id || idx} className="p-6 rounded-[24px] bg-white border border-[#d8ecec] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#0B4F50] font-bold">
                      Module {idx + 1} • {mod.duration}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{mod.title}</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 pt-2 font-medium">
                    {mod.topics && mod.topics.map((top, tIdx) => (
                      <li key={tIdx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0B4F50] shrink-0" />
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
        {activeTab === 'instructor' && course.instructor && (
          <div className="p-8 rounded-[32px] bg-white border border-[#d8ecec] shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <img
                src={course.instructor.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={course.instructor.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#d8ecec] shadow-sm"
                onError={(e) => {
                  e.target.src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(course.instructor.name);
                }}
              />
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">{course.instructor.name}</h3>
                <p className="text-xs text-[#0B4F50] font-bold">{course.instructor.title}</p>
                <p className="text-xs text-slate-500 font-medium">{course.instructor.company}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal border-t border-[#f2f7f7] pt-4">
              {course.instructor.bio}
            </p>
          </div>
        )}

        {/* Tab 3: FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-4 max-w-3xl">
            {course.faq && course.faq.map((f, idx) => (
              <div key={idx} className="p-6 rounded-[24px] bg-white border border-[#d8ecec] shadow-2xs space-y-2">
                <h4 className="text-sm font-bold text-slate-900">{f.question}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{f.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Related Specialization Tracks */}
        {related.length > 0 && (
          <div className="pt-12 border-t border-[#d8ecec] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#0B4F50] uppercase tracking-wider">Related Specializations</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">Explore Complementary Cohorts</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((rc) => (
                <CourseCard
                  key={rc.id}
                  course={rc}
                  onSelect={onSelectCourse}
                  onApply={onApply}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
