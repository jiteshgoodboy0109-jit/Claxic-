import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Lock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Gauge,
  ExternalLink,
} from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner.jsx';

export const SecureVideoPlayer = ({
  courseId,
  classItem,
  onPlaybackCompleted,
  onProgressUpdate,
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressReportTimer = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const controlsTimeoutRef = useRef(null);

  // Security & 75% Rule States
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [furthestPosition, setFurthestPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [canSkipForward, setCanSkipForward] = useState(false);
  const [warningMessage, setWarningMessage] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Authenticated stream URL (with token in query for native HTML5 video streaming)
  const token = localStorage.getItem('claxic_token') || '';
  const localStreamUrl = `/api/learning/courses/${courseId}/classes/${classItem.id}/video-stream?token=${encodeURIComponent(token)}`;

  // Determine if source is YouTube
  const isYouTube = Boolean(
    classItem.videoUrl &&
    !classItem.hasLocalVideo &&
    !classItem.videoStoredName &&
    (classItem.videoUrl.includes('youtube.com') || classItem.videoUrl.includes('youtu.be'))
  );

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`
      : url;
  };

  // Determine effective media source
  const effectiveVideoSrc =
    classItem.hasLocalVideo || classItem.videoId || classItem.videoStoredName || !classItem.videoUrl
      ? localStreamUrl
      : classItem.videoUrl.startsWith('http') || classItem.videoUrl.startsWith('/')
      ? classItem.videoUrl
      : localStreamUrl;

  // Fetch initial playback progress
  useEffect(() => {
    let isMounted = true;
    const fetchProgress = async () => {
      try {
        const res = await fetch(
          `/api/learning/courses/${courseId}/classes/${classItem.id}/progress`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.progress) {
            const initialWatched = data.progress.watchedSeconds || 0;
            const completed = Boolean(data.progress.completed);
            const skipUnlocked = Boolean(data.progress.canSkipForward);
            setWatchedSeconds(initialWatched);
            setFurthestPosition(data.progress.furthestPosition || 0);
            setIsCompleted(completed);
            setCanSkipForward(skipUnlocked);

            // Resume to last playback position if video element is ready
            if (videoRef.current && data.progress.lastPosition > 0) {
              videoRef.current.currentTime = data.progress.lastPosition;
              setCurrentTime(data.progress.lastPosition);
            }

            if (onProgressUpdate) {
              const dur = videoRef.current?.duration || duration || 0;
              const ratio = dur > 0 ? Math.min(100, Math.round((initialWatched / dur) * 100)) : (completed ? 100 : 0);
              onProgressUpdate({
                watchedSeconds: initialWatched,
                duration: dur,
                watchRatio: ratio,
                isPlaying: false,
                isCompleted: completed,
                canSkipForward: skipUnlocked,
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load initial progress:', err);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    fetchProgress();
    return () => {
      isMounted = false;
      if (progressReportTimer.current) clearInterval(progressReportTimer.current);
    };
  }, [courseId, classItem.id, token]);

  // Active Playback Watch Timer: ONLY runs while video is actively PLAYING
  useEffect(() => {
    if (!isPlaying) return;

    const secondTicker = setInterval(() => {
      setWatchedSeconds((prev) => {
        const next = prev + 1;
        const dur = videoRef.current?.duration || duration || 0;
        const ratio = dur > 0 ? Math.min(100, Math.round((next / dur) * 100)) : 0;
        const completed = ratio >= 75 || isCompleted;

        if (completed && !canSkipForward) {
          setCanSkipForward(true);
          setIsCompleted(true);
        }

        if (onProgressUpdate) {
          onProgressUpdate({
            watchedSeconds: next,
            duration: dur,
            watchRatio: ratio,
            isPlaying: true,
            isCompleted: completed,
            canSkipForward: completed || canSkipForward,
          });
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(secondTicker);
  }, [isPlaying, duration, isCompleted, canSkipForward, onProgressUpdate]);

  // Periodic server progress heartbeat (every 5 seconds of active playback)
  useEffect(() => {
    if (isPlaying) {
      progressReportTimer.current = setInterval(() => {
        reportProgressToServer(5);
      }, 5000);
    } else {
      if (progressReportTimer.current) clearInterval(progressReportTimer.current);
    }

    return () => {
      if (progressReportTimer.current) clearInterval(progressReportTimer.current);
    };
  }, [isPlaying, currentTime, duration, watchedSeconds]);

  const reportProgressToServer = async (increment = 5) => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime || 0;
    const dur = videoRef.current.duration || duration || 0;

    try {
      const res = await fetch(
        `/api/learning/courses/${courseId}/classes/${classItem.id}/progress`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentTime: cur,
            duration: dur,
            watchedIncrement: increment,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.progress) {
          setWatchedSeconds(data.progress.watchedSeconds);
          setFurthestPosition(data.progress.furthestPositionSeconds);
          if (data.progress.completed) {
            setIsCompleted(true);
            setCanSkipForward(true);
            if (onPlaybackCompleted) onPlaybackCompleted(classItem.id);
          }
          if (onProgressUpdate) onProgressUpdate(data.progress);
        }
      }
    } catch (err) {
      console.error('Progress sync error:', err);
    }
  };

  // Video Events
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsBuffering(false);
      setPlaybackError(null);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    if (cur > furthestPosition) {
      setFurthestPosition(cur);
    }

    // Update buffered progress
    if (videoRef.current.buffered && videoRef.current.buffered.length > 0) {
      const bufEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBufferedEnd(bufEnd);
    }
  };

  const handleSeeking = () => {
    if (!videoRef.current) return;
    const targetTime = videoRef.current.currentTime;

    // RULE: If not completed / 75% not reached, forbid seeking ahead into unwatched territory!
    if (!canSkipForward && !isCompleted) {
      if (targetTime > furthestPosition + 2) {
        videoRef.current.currentTime = furthestPosition;
        setCurrentTime(furthestPosition);
        showWarning('Forward seeking is locked until 75% of this lesson has been watched.');
      }
    }
  };

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      reportProgressToServer(1);
    } else {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setPlaybackError(null);
        })
        .catch((err) => {
          console.warn('Playback play request was prevented:', err);
          setIsPlaying(false);
        });
    }
  }, [isPlaying]);

  // 5-Second Forward Skip Rule
  const handleSkipForward5s = () => {
    if (!videoRef.current) return;

    if (!canSkipForward && !isCompleted) {
      showWarning('5-second forward skip is locked until 75% completion is reached.');
      return;
    }

    const newTime = Math.min(duration, videoRef.current.currentTime + 5);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // 5-Second Rewind (Always permitted for pedagogical review!)
  const handleRewind5s = () => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, videoRef.current.currentTime - 5);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeekChange = (e) => {
    if (!videoRef.current) return;
    const seekTo = parseFloat(e.target.value);

    if (!canSkipForward && !isCompleted && seekTo > furthestPosition + 2) {
      showWarning('Forward scrubbing locked until 75% of lecture is watched.');
      return;
    }

    videoRef.current.currentTime = seekTo;
    setCurrentTime(seekTo);
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.volume = volume || 0.5;
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error(err));
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch((err) => console.error(err));
    }
  };

  const showWarning = (msg) => {
    setWarningMessage(msg);
    setTimeout(() => {
      setWarningMessage(null);
    }, 4000);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  const handleRetryPlayback = () => {
    setPlaybackError(null);
    setIsBuffering(true);
    if (videoRef.current) {
      videoRef.current.src = effectiveVideoSrc;
      videoRef.current.load();
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleRewind5s();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkipForward5s();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, canSkipForward, isCompleted, furthestPosition]);

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Calculate percentage of video watched
  const watchRatio = duration > 0 ? Math.min(100, Math.round((watchedSeconds / duration) * 100)) : 0;
  const isNear75 = watchRatio >= 75 || isCompleted;

  if (isYouTube) {
    return (
      <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-stone-800 space-y-2">
        <div className="relative aspect-video w-full bg-stone-950">
          <iframe
            src={getYouTubeEmbedUrl(classItem.videoUrl)}
            title={classItem.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <div className="p-3 bg-stone-900 border-t border-stone-800 flex items-center justify-between text-xs text-stone-300">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{classItem.title}</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono text-[10px]">
              YouTube Stream
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsCompleted(true);
              setCanSkipForward(true);
              if (onPlaybackCompleted) onPlaybackCompleted(classItem.id);
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all text-xs"
          >
            Mark Lesson Attended
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onContextMenu={(e) => e.preventDefault()}
      className="relative bg-black rounded-2xl overflow-hidden select-none group shadow-2xl border border-stone-800"
    >
      {/* HTML5 Native Video Tag with Anti-Download and Authenticated Stream */}
      <video
        ref={videoRef}
        src={effectiveVideoSrc}
        preload="auto"
        playsInline
        controlsList="nodownload"
        disablePictureInPicture
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => {
          setIsBuffering(false);
          setPlaybackError(null);
        }}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
          setPlaybackError(null);
        }}
        onPause={() => {
          setIsPlaying(false);
          reportProgressToServer(1);
        }}
        onEnded={() => {
          setIsPlaying(false);
          reportProgressToServer(5);
        }}
        onError={() => {
          setIsBuffering(false);
          setPlaybackError('Video stream interrupted or format unsupported.');
        }}
        onClick={handlePlayPause}
        className="w-full aspect-video object-contain bg-black cursor-pointer"
      />

      {/* Buffering Spinner Overlay */}
      {isBuffering && !playbackError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none z-30">
          <LoadingSpinner size="md" variant="brand" />
          <span className="text-white text-xs font-mono font-medium mt-2 drop-shadow-md">
            Buffering HD Stream...
          </span>
        </div>
      )}

      {/* Playback Error Overlay with Retry */}
      {playbackError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950/90 text-center p-6 z-40 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white tracking-tight">Stream Loading Interrupted</h4>
          <p className="text-xs text-stone-400 max-w-sm">
            {playbackError} High-quality range stream will re-sync with network.
          </p>
          <button
            type="button"
            onClick={handleRetryPlayback}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EE2D02] hover:bg-[#D02600] text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Playback</span>
          </button>
        </div>
      )}

      {/* Warning Alert Banner (Forward skip locked notice) */}
      {warningMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-[90%] bg-rose-950/90 border border-rose-500/70 text-rose-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Top Overlay Badge Bar */}
      <div
        className={`absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
            {classItem.title}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            1080p HD Stream
          </span>
        </div>

        {/* 75% Completion Rule Status Badge & Play State */}
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Streaming Live</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-stone-900/80 text-stone-300 border border-stone-700 backdrop-blur-sm">
              <Pause className="w-3 h-3 text-amber-400" />
              <span>Paused</span>
            </span>
          )}

          {isNear75 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>75% Verified • Skip Unlocked</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>{watchRatio}% / 75% Required</span>
            </span>
          )}
        </div>
      </div>

      {/* Custom Bottom Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/75 to-transparent transition-opacity duration-300 z-20 space-y-2.5 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrub / Progress Bar with Buffered Indicator and 75% Marker */}
        <div className="relative w-full flex items-center group/scrubber py-1">
          {/* Buffered Background Bar */}
          <div className="absolute left-0 right-0 h-1.5 bg-stone-800 rounded-full overflow-hidden">
            {duration > 0 && (
              <div
                style={{ width: `${Math.min(100, (bufferedEnd / duration) * 100)}%` }}
                className="h-full bg-stone-600/60 transition-all duration-200"
              />
            )}
          </div>

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            className="w-full h-1.5 bg-transparent appearance-none cursor-pointer z-10 accent-[#EE2D02] hover:h-2 transition-all"
          />

          {/* 75% Threshold Marker Notch */}
          {duration > 0 && (
            <div
              style={{ left: `${75}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-400/80 pointer-events-none"
              title="75% Completion Threshold"
            />
          )}
        </div>

        {/* Buttons and Settings Row */}
        <div className="flex items-center justify-between text-white text-xs gap-2">
          {/* Left: Playback Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play / Pause */}
            <button
              type="button"
              onClick={handlePlayPause}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-[#FBBF24] fill-current" />}
            </button>

            {/* Rewind -5s (Always allowed) */}
            <button
              type="button"
              onClick={handleRewind5s}
              className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1"
              title="Rewind 5 seconds (Left Arrow)"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-[10px] font-mono">-5s</span>
            </button>

            {/* Skip +5s (Restricted before 75%) */}
            <button
              type="button"
              onClick={handleSkipForward5s}
              disabled={!canSkipForward && !isCompleted}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                canSkipForward || isCompleted
                  ? 'text-amber-300 hover:text-amber-200 hover:bg-white/10 cursor-pointer'
                  : 'text-stone-600 opacity-50 cursor-not-allowed'
              }`}
              title={
                canSkipForward || isCompleted
                  ? 'Skip forward 5 seconds (Right Arrow)'
                  : 'Skip forward locked until 75% watched'
              }
            >
              <FastForward className="w-4 h-4" />
              <span className="text-[10px] font-mono">+5s</span>
              {!canSkipForward && !isCompleted && <Lock className="w-3 h-3 text-stone-500 ml-0.5" />}
            </button>

            {/* Volume Control */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 text-stone-300 hover:text-white cursor-pointer"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#EE2D02]"
              />
            </div>

            {/* Time Stamp */}
            <div className="font-mono text-[11px] text-stone-300">
              <span>{formatTime(currentTime)}</span>
              <span className="text-stone-500"> / </span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Speed & Fullscreen Actions */}
          <div className="flex items-center gap-2">
            {/* Speed Toggle */}
            <button
              type="button"
              onClick={cyclePlaybackRate}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 text-[11px] font-mono font-bold transition-colors cursor-pointer"
              title="Playback Speed"
            >
              {playbackRate}x
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
