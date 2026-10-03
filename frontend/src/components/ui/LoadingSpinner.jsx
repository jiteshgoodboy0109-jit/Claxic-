import React from 'react';

/**
 * Universal High-Impact Loading Animation for Claxic
 * Supports inline, section, and full-screen modes.
 */
export const LoadingSpinner = ({
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  text = '',
  subtext = '',
  showText = false, // Pure clean spinner without bottom text as requested
  fullScreen = false,
  inline = false,
  minHeight = 'min-h-[35vh]',
  variant = 'brand', // 'brand' | 'white' | 'dark' | 'amber'
  className = '',
}) => {
  // Proportional responsive sizes
  const sizeMap = {
    xs: {
      ring: 'w-4 h-4 border-[1.5px]',
      dot: 'w-1 h-1',
      textSize: 'text-[11px]',
      gap: 'gap-1.5',
    },
    sm: {
      ring: 'w-6 h-6 border-2',
      dot: 'w-1.5 h-1.5',
      textSize: 'text-xs',
      gap: 'space-y-1.5',
    },
    md: {
      ring: 'w-10 h-10 border-2 sm:w-11 sm:h-11',
      dot: 'w-2 h-2',
      textSize: 'text-xs font-semibold',
      gap: 'space-y-2.5',
    },
    lg: {
      ring: 'w-12 h-12 border-[2.5px] sm:w-14 sm:h-14',
      dot: 'w-2.5 h-2.5',
      textSize: 'text-xs sm:text-sm font-bold',
      gap: 'space-y-3',
    },
    xl: {
      ring: 'w-16 h-16 border-3 sm:w-18 sm:h-18',
      dot: 'w-3 h-3',
      textSize: 'text-sm sm:text-base font-extrabold',
      gap: 'space-y-4',
    },
  };

  const s = sizeMap[size] || sizeMap.md;

  // Curated color themes
  const themes = {
    brand: {
      track: 'border-slate-200/80',
      head: 'border-t-[#EE2D02] border-r-[#EE2D02]/60',
      dot: 'bg-[#EE2D02]',
      glow: 'bg-[#EE2D02]/20',
      text: 'text-slate-800',
      subtext: 'text-slate-400',
    },
    white: {
      track: 'border-white/20',
      head: 'border-t-white border-r-white/80',
      dot: 'bg-white',
      glow: 'bg-white/20',
      text: 'text-white',
      subtext: 'text-white/70',
    },
    dark: {
      track: 'border-slate-700/60',
      head: 'border-t-[#EE2D02] border-r-[#FF5722]/80',
      dot: 'bg-[#EE2D02]',
      glow: 'bg-[#EE2D02]/20',
      text: 'text-slate-100',
      subtext: 'text-slate-400',
    },
    amber: {
      track: 'border-stone-700/60',
      head: 'border-t-[#F59E0B] border-r-[#FBBF24]/80',
      dot: 'bg-[#F59E0B]',
      glow: 'bg-[#F59E0B]/20',
      text: 'text-amber-100',
      subtext: 'text-amber-400/80',
    },
  }[variant] || themes.brand;

  // Inline button mode
  if (size === 'xs' || inline) {
    return (
      <span
        className={`inline-flex items-center justify-center relative select-none shrink-0 will-change-transform ${className}`}
        role="status"
        aria-label="Loading"
      >
        <span
          className={`${s.ring} rounded-full ${themes.track} ${themes.head} animate-spin`}
          style={{ animationDuration: '0.7s' }}
        />
      </span>
    );
  }

  const spinnerMarkup = (
    <div
      className={`relative flex flex-col items-center justify-center text-center select-none animate-in fade-in duration-150 font-sans ${className}`}
      role="status"
      aria-label={text || 'Loading'}
    >
      {/* Precision Modern Ring with Pulsing Core */}
      <div className="relative flex items-center justify-center will-change-transform">
        {/* Soft Ambient Radial Halo */}
        <div
          className={`absolute rounded-full ${themes.glow} blur-lg animate-pulse pointer-events-none w-8 h-8 sm:w-10 sm:h-10`}
        />

        {/* Clean Rotating Arc */}
        <div
          className={`${s.ring} rounded-full ${themes.track} ${themes.head} animate-spin will-change-transform`}
          style={{ animationDuration: '0.75s' }}
        />

        {/* Centered Breathing Core Dot */}
        <div
          className={`absolute ${s.dot} rounded-full ${themes.dot} animate-pulse shadow-xs`}
        />
      </div>

      {/* Typography strictly hidden by default per user request */}
      {showText && text && (
        <div className="space-y-1 max-w-xs mx-auto animate-in fade-in duration-150 mt-3">
          <p className={`${s.textSize} ${themes.text} tracking-tight font-sans`}>
            {text}
          </p>
          {subtext && (
            <p className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              {subtext}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-xs animate-in fade-in duration-100">
        {spinnerMarkup}
      </div>
    );
  }

  return (
    <div className={`w-full flex items-center justify-center ${minHeight}`}>
      {spinnerMarkup}
    </div>
  );
};

// Convenient exports
export const InlineSpinner = (props) => <LoadingSpinner size="xs" inline {...props} />;
export const ClaxicLoader = LoadingSpinner;
export default LoadingSpinner;
