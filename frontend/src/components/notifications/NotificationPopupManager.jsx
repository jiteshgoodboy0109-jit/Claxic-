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
  BookOpen,
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
        const isClass =
          pop.type === 'CREATIVE_CLASS' ||
          pop.type === 'class_alert' ||
          pop.type?.includes('CLASS') ||
          pop.type === 'ACADEMIC_SESSION';
        const isLaunch =
          pop.type === 'COURSE_LAUNCH_AD' ||
          pop.type === 'course_launch' ||
          pop.type?.includes('LAUNCH');
        const isDoubt =
          pop.type === 'DOUBT_REPLY' ||
          pop.type?.includes('DOUBT');

        let config = {
          badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
          badgeText: 'OFFICIAL NOTICE',
          iconBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.15)]',
          accentGradient: 'from-sky-500 via-blue-400 to-transparent',
          progressBarGradient: 'from-sky-400 to-blue-500',
          ctaPill: 'bg-white/10 hover:bg-white/15 text-white border-white/10 group-hover:border-white/20',
          pulseColor: 'bg-sky-400',
          IconComp: Bell,
          actionLabel: 'Open Notice',
        };

        if (isClass) {
          config = {
            badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
            badgeText: 'CURRICULUM SESSION',
            iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
            accentGradient: 'from-emerald-500 via-teal-400 to-transparent',
            progressBarGradient: 'from-emerald-400 to-teal-500',
            ctaPill: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30 group-hover:border-emerald-500/40',
            pulseColor: 'bg-emerald-400',
            IconComp: BookOpen,
            actionLabel: 'View Lesson Session',
          };
        } else if (isLaunch) {
          config = {
            badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
            badgeText: 'ACADEMY ANNOUNCEMENT',
            iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
            accentGradient: 'from-amber-500 via-orange-400 to-transparent',
            progressBarGradient: 'from-amber-400 to-orange-500',
            ctaPill: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30 group-hover:border-amber-500/40',
            pulseColor: 'bg-amber-400',
            IconComp: Sparkles,
            actionLabel: 'Explore Announcement',
          };
        } else if (isDoubt) {
          config = {
            badgeBg: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
            badgeText: 'FACULTY CLARIFICATION',
            iconBg: 'bg-violet-500/15 text-violet-400 border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]',
            accentGradient: 'from-violet-500 via-purple-400 to-transparent',
            progressBarGradient: 'from-violet-400 to-purple-500',
            ctaPill: 'bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border-violet-500/30 group-hover:border-violet-500/40',
            pulseColor: 'bg-violet-400',
            IconComp: GraduationCap,
            actionLabel: 'Read Faculty Answer',
          };
        }

        return (
          <div
            key={pop.popId}
            onClick={() => handleActionClick(pop)}
            className="pointer-events-auto group relative overflow-hidden rounded-[22px] bg-[#101216]/95 text-white border border-white/[0.09] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl p-4 sm:p-4.5 transition-all duration-300 hover:scale-[1.01] hover:border-white/20 cursor-pointer animate-in slide-in-from-top-4 fade-in duration-200"
          >
            {/* Top Glowing Brand Accent Line */}
            <div
              className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${config.accentGradient}`}
            />

            <div className="flex items-start gap-3.5">
              {/* Category Icon Pod */}
              <div
                className={`w-10 h-10 rounded-xl ${config.iconBg} border flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-105`}
              >
                <config.IconComp className="w-5 h-5" />
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0 pr-1">
                {/* Header Row: Category Badge, Live Alert & Close */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border ${config.badgeBg}`}
                    >
                      {config.badgeText}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-stone-400 font-mono">
                      <span className="relative flex h-1.5 w-1.5">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pulseColor} opacity-75`}
                        />
                        <span
                          className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.pulseColor}`}
                        />
                      </span>
                      <span>Live Alert</span>
                    </span>
                  </div>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDismiss(pop.popId, e)}
                    className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer -mr-1 -mt-0.5"
                    aria-label="Dismiss pop notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Title */}
                <h4 className="text-[13px] sm:text-sm font-bold text-white tracking-tight line-clamp-1 group-hover:text-amber-200 transition-colors">
                  {pop.title ? pop.title.replace(/[🎨🚀🔥]/g, '').trim() : ''}
                </h4>

                {/* Message Body */}
                <p className="text-[11.5px] text-stone-300/90 line-clamp-2 mt-1 leading-relaxed font-normal">
                  {pop.message}
                </p>

                {/* Action Link & Timestamp Footer */}
                <div className="mt-3 flex items-center justify-between pt-1">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all ${config.ctaPill}`}
                  >
                    <span>{config.actionLabel}</span>
                    <ChevronRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>

                  <span className="text-[10px] font-mono text-stone-400/80">
                    Just now
                  </span>
                </div>
              </div>
            </div>

            {/* Auto-Dismiss Countdown Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${config.progressBarGradient} animate-shrink-progress`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
