import React, { useState, useEffect } from 'react';
import {
  Bell,
  Film,
  Flame,
  Sparkles,
  ExternalLink,
  X,
  ChevronRight,
  GraduationCap,
  CheckCheck,
} from 'lucide-react';

export const NotificationPopupManager = ({ onNavigate }) => {
  const [activePops, setActivePops] = useState([]);

  useEffect(() => {
    const handlePopEvent = (event) => {
      const data = event.detail;
      if (!data) return;

      const popId = data.id || 'pop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newPop = {
        ...data,
        popId,
        addedAt: Date.now(),
      };

      setActivePops((prev) => {
        // Prevent duplicate toasts
        if (prev.some((p) => p.id === data.id || p.popId === popId)) return prev;
        // Keep maximum 3 stacked
        return [newPop, ...prev].slice(0, 3);
      });

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setActivePops((prev) => prev.filter((p) => p.popId !== popId));
      }, 6500);
    };

    window.addEventListener('claxic_inbuild_pop_notification', handlePopEvent);
    return () => {
      window.removeEventListener('claxic_inbuild_pop_notification', handlePopEvent);
    };
  }, []);

  const handleDismiss = (popId, e) => {
    if (e) e.stopPropagation();
    setActivePops((prev) => prev.filter((p) => p.popId !== popId));
  };

  const handleActionClick = (pop) => {
    setActivePops((prev) => prev.filter((p) => p.popId !== pop.popId));

    if (pop.link) {
      if (onNavigate) {
        if (pop.link.startsWith('/courses/')) {
          const slug = pop.link.replace('/courses/', '');
          onNavigate('course-detail', { slug });
        } else if (pop.link.startsWith('/student') || pop.link === '/dashboard') {
          onNavigate('student');
        } else if (pop.link.startsWith('/staff')) {
          onNavigate('staff');
        } else {
          window.location.href = pop.link;
        }
      } else {
        window.location.href = pop.link;
      }
    } else {
      // Default: trigger opening the notification bell or student portal
      window.dispatchEvent(new CustomEvent('claxic_open_notification_drawer'));
    }
  };

  if (activePops.length === 0) return null;

  return (
    <div className="fixed top-5 right-4 sm:right-6 z-[99999] flex flex-col gap-3 max-w-[420px] w-[calc(100vw-32px)] sm:w-[420px] pointer-events-none">
      {activePops.map((pop) => {
        const isClass = pop.type === 'CREATIVE_CLASS' || pop.type === 'class_alert';
        const isLaunch = pop.type === 'COURSE_LAUNCH_AD' || pop.type === 'course_launch';

        let badgeBg = 'bg-[#EE2D02]/10 text-[#EE2D02] border-[#EE2D02]/20';
        let badgeText = '📢 ACADEMY NOTICE';
        let iconBg = 'bg-gradient-to-tr from-[#EE2D02] to-amber-500';
        let IconComp = Bell;

        if (isClass) {
          badgeBg = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
          badgeText = '🎨 CREATIVE CLASS';
          iconBg = 'bg-gradient-to-tr from-indigo-600 to-purple-500';
          IconComp = Film;
        } else if (isLaunch) {
          badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
          badgeText = '🚀 NEW COURSE LAUNCH';
          iconBg = 'bg-gradient-to-tr from-amber-500 to-orange-500';
          IconComp = Flame;
        }

        return (
          <div
            key={pop.popId}
            onClick={() => handleActionClick(pop)}
            className="pointer-events-auto group relative overflow-hidden rounded-2xl bg-[#0F172A]/95 text-white border border-slate-700/80 shadow-2xl backdrop-blur-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:border-slate-500 cursor-pointer animate-in slide-in-from-top-4 fade-in"
            style={{
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Top Glowing Ambient Line */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${isClass ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : isLaunch ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-[#EE2D02] to-amber-500'}`} />

            <div className="flex items-start gap-3">
              {/* Category Icon */}
              <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center text-white shrink-0 shadow-md`}>
                <IconComp className="w-5 h-5" />
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${badgeBg}`}>
                    {badgeText}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Just now
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white tracking-tight line-clamp-1 group-hover:text-amber-300 transition-colors">
                  {pop.title}
                </h4>

                <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-relaxed font-normal">
                  {pop.message}
                </p>

                {/* Action Link Footer */}
                <div className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold text-sky-400 group-hover:text-sky-300">
                  <span>{isClass ? 'View Class Lesson' : isLaunch ? 'Explore Course Promo' : 'Open Notice'}</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => handleDismiss(pop.popId, e)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                aria-label="Dismiss pop notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Auto-Dismiss Countdown Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-[#EE2D02] animate-shrink-progress" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
