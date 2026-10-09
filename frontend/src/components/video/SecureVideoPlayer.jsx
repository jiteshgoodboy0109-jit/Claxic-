import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

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
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
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
  const streamUrl = `/api/learning/courses/${courseId}/classes/${classItem.id}/video-stream?token=${encodeURIComponent(token)}`;

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
            setWatchedSeconds(data.progress.watchedSeconds || 0);
            setFurthestPosition(data.progress.furthestPosition || 0);
            setIsCompleted(Boolean(data.progress.completed));
            setCanSkipForward(Boolean(data.progress.canSkipForward));

            // Resume to last playback position if video element is ready
            if (videoRef.current && data.progress.lastPosition > 0) {
              videoRef.current.currentTime = data.progress.lastPosition;
              setCurrentTime(data.progress.lastPosition);
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
    const cur = videoRef.current.currentTime;
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
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    // Update local furthest watched position
    if (cur > furthestPosition) {
      setFurthestPosition(cur);
    }
  };

  const handleSeeking = () => {
    if (!videoRef.current) return;
    const targetTime = videoRef.current.currentTime;

    // RULE: If not completed / 75% not reached, forbid seeking ahead into unwatched territory!
    if (!canSkipForward && !isCompleted) {
      if (targetTime > furthestPosition + 2) {
        // Violates forward skip restriction
        videoRef.current.currentTime = furthestPosition;
        setCurrentTime(furthestPosition);
        showWarning('Forward seeking is locked until 75% of this lesson has been watched.');
      }
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      reportProgressToServer(1);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Play failed:', err);
      });
    }
  };

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

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.error(err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => console.error(err));
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

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Calculate percentage of video watched
  const watchRatio = duration > 0 ? Math.min(100, Math.round((watchedSeconds / duration) * 100)) : 0;
  const isNear75 = watchRatio >= 75 || isCompleted;

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
        src={streamUrl}
        playsInline
        controlsList="nodownload"
        disablePictureInPicture
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onEnded={() => {
          setIsPlaying(false);
          reportProgressToServer(5);
        }}
        onClick={handlePlayPause}
        className="w-full aspect-video object-contain bg-black cursor-pointer"
      />

      {/* Warning Alert Banner (Forward skip locked notice) */}
      {warningMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-[90%] bg-rose-950/90 border border-rose-500/70 text-rose-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Top Overlay Badge Bar */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
            {classItem.title}
          </span>
        </div>

        {/* 75% Completion Rule Status Badge */}
        <div className="flex items-center gap-2">
          {isNear75 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>75% Verified • Skip Unlocked</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>{watchRatio}% Watched (75% to Unlock Skip)</span>
            </span>
          )}
        </div>
      </div>

      {/* Custom Bottom Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent transition-opacity duration-300 z-20 space-y-2.5 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubbing Bar */}
        <div className="relative w-full group/bar">
          {/* Visual Watched Fill & Total Range */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeekChange}
            className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#F59E0B] focus:outline-none"
          />

          {/* 75% Marker Line Indicator */}
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
          <div className="flex items-center gap-3">
            {/* Play / Pause */}
            <button
              type="button"
              onClick={handlePlayPause}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-[#FBBF24]" />}
            </button>

            {/* Rewind -5s (Always allowed) */}
            <button
              type="button"
              onClick={handleRewind5s}
              className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1"
              title="Rewind 5 seconds"
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
                  ? 'Skip forward 5 seconds'
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
                className="w-16 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#F59E0B]"
              />
            </div>

            {/* Time Stamp */}
            <div className="font-mono text-[11px] text-stone-300">
              <span>{formatTime(currentTime)}</span>
              <span className="text-stone-500"> / </span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Playback Speed & Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="flex items-center rounded-lg bg-stone-900/80 border border-stone-800 p-0.5 text-[11px] font-mono font-bold">
              {[1, 1.25, 1.5].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    playbackSpeed === speed
                      ? 'bg-[#F59E0B] text-black'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
