import React, { useState } from 'react';
import { Clock, Star, ArrowRight, BookOpen } from 'lucide-react';

export const CourseCard = ({
  course,
  onSelect,
  onApply,
  showApplyButton = true,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  // Curated category color accents
  const getCategoryStyles = (category) => {
    switch (category) {
      case 'AI & Full Stack':
        return 'bg-[#FFF1EE] text-[#EE2D02] border-[#FFD4CC]';
      case 'Product & Design':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'Cyber Security':
        return 'bg-cyan-50 text-cyan-900 border-cyan-200';
      case 'Cloud & DevOps':
        return 'bg-sky-50 text-sky-900 border-sky-200';
      case 'System Architecture':
        return 'bg-indigo-50 text-indigo-900 border-indigo-200';
      case 'Data & ML':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      default:
        return 'bg-[#FFF1EE] text-[#EE2D02] border-[#FFD4CC]';
    }
  };

  return (
    <div
      onClick={() => onSelect && onSelect(course)}
      className="group bg-white border border-slate-200/90 hover:border-[#FFD4CC] rounded-[24px] overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_35px_-8px_rgba(238,45,2,0.12)] hover:-translate-y-1 cursor-pointer"
    >
      <div>
        {/* Course Banner Image with Fallback Pattern */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
          {!imgFailed && course.bannerImage ? (
            <img
              src={course.bannerImage}
              alt={course.title}
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0B0E14] via-[#1A1D27] to-[#EE2D02]/30 flex flex-col items-center justify-center p-6 text-center text-white relative">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-2 border border-white/20">
                <BookOpen className="w-6 h-6 text-[#EE2D02]" />
              </div>
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
                {course.category}
              </span>
            </div>
          )}

          {/* Frosted Metadata Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-2xs ${getCategoryStyles(course.category)}`}>
              {course.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#0B0E14]/90 backdrop-blur-md text-white text-[11px] font-medium border border-white/20 shadow-2xs">
              {course.mode}
            </span>
          </div>

          {course.status === 'FULL' && (
            <div className="absolute bottom-3 right-3">
              <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[10px] font-bold tracking-wider shadow-sm">
                BATCH FULL
              </span>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-6 space-y-3.5">
          {/* Duration & Star Rating */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#EE2D02]" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              <span>{course.rating}</span>
              <span className="text-slate-400 font-normal text-[11px]">({course.reviewsCount})</span>
            </div>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelect && onSelect(course)}
            className="text-base font-bold text-slate-900 group-hover:text-[#EE2D02] cursor-pointer transition-colors leading-snug line-clamp-2"
          >
            {course.title}
          </h3>

          {/* Instructor Attribution */}
          {course.instructor && (
            <div className="flex items-center gap-2.5 pt-0.5">
              <img
                src={course.instructor.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80'}
                alt={course.instructor.name}
                className="w-6 h-6 rounded-full object-cover border border-slate-200"
              />
              <div className="text-xs text-slate-600 font-medium truncate">
                <span>{course.instructor.name}</span>
                {course.instructor.company && (
                  <span className="text-slate-400"> • {course.instructor.company}</span>
                )}
              </div>
            </div>
          )}

          {/* Short Description */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {course.shortDescription}
          </p>

          {/* Skills / Tech Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {course.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FFF1EE] border border-[#FFD4CC] text-[#EE2D02] font-medium"
                >
                  {tag}
                </span>
              ))}
              {course.tags.length > 4 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                  +{course.tags.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Price & Action CTA */}
      <div className="p-6 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-900">
              ₹{course.price.toLocaleString('en-IN')}
            </span>
            {course.originalPrice && (
              <span className="text-xs text-slate-400 line-through">
                ₹{course.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block -mt-0.5">
            Inclusive of 18% GST
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect && onSelect(course)}
            className="px-3.5 py-2 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
          >
            Syllabus
          </button>
          {showApplyButton && (
            <button
              disabled={course.status === 'FULL'}
              onClick={(e) => {
                e.stopPropagation();
                if (onApply) onApply(course);
              }}
              className="px-4 py-2 rounded-full text-xs font-bold text-white bg-[#EE2D02] hover:bg-[#D42700] disabled:opacity-50 transition-all shadow-xs hover:shadow flex items-center gap-1 cursor-pointer"
            >
              <span>{course.status === 'FULL' ? 'Full' : 'Apply'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
