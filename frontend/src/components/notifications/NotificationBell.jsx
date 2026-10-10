import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  Sparkles,
  Flame,
  BookOpen,
  CheckCheck,
  Trash2,
  ExternalLink,
  X,
  ChevronRight,
  Clock,
  Tag,
  ArrowRight,
  GraduationCap,
  Layers,
  Award,
  Volume2,
  Smartphone,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  triggerInBuildPopNotification,
  requestDeviceNotificationPermission,
  showDeviceNotification,
} from './notificationHelper.js';

export const NotificationBell = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({ all: 0, classes: 0, launches: 0, academic: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [devicePermission, setDevicePermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';
  });
  const [selectedNotification, setSelectedNotification] = useState(null);
  const dropdownRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const isFirstFetchRef = useRef(true);

  const authToken = token || localStorage.getItem('claxic_token');

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!authToken || !user) return;
    try {
      const res = await fetch(`/api/notifications?type=${activeTab}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const incoming = data.notifications || [];
        setNotifications(incoming);
        setUnreadCount(data.unreadCount || 0);
        if (data.categoryCounts) {
          setCategoryCounts(data.categoryCounts);
        }

        // On first load, seed seen IDs so we don't bombard user with all historical notices
        if (isFirstFetchRef.current) {
          incoming.forEach((n) => seenIdsRef.current.add(n.id));
          isFirstFetchRef.current = false;
        } else {
          // Detect truly new incoming unread notifications
          const freshItems = incoming.filter((n) => !n.isRead && !seenIdsRef.current.has(n.id));
          freshItems.forEach((fresh) => {
            seenIdsRef.current.add(fresh.id);
            // Trigger in-build pop toast + device push notification + audio chime!
            triggerInBuildPopNotification(fresh);
          });
        }
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [authToken, user, activeTab]);

  // Periodic polling & on tab change & live event updates
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // 10s live auto-refresh
    const handleUpdate = () => fetchNotifications();
    const handleOpenDrawer = () => {
      setIsOpen(true);
      fetchNotifications();
    };

    window.addEventListener('claxic_notifications_updated', handleUpdate);
    window.addEventListener('claxic_open_notification_drawer', handleOpenDrawer);

    // Refresh device permission state
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setDevicePermission(Notification.permission);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('claxic_notifications_updated', handleUpdate);
      window.removeEventListener('claxic_open_notification_drawer', handleOpenDrawer);
    };
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Mark single notification as read
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete notification
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Handle card click / open detailed notification modal or navigate
  const handleCardClick = (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);

    // If it's a student doubt alert for faculty: touch navigates directly to doubts page & focuses this doubt!
    const isDoubtAlert =
      notif.type === 'DOUBT_ALERT' ||
      notif.tab === 'doubts' ||
      (notif.link && notif.link.includes('/staff/doubts'));

    if (isDoubtAlert) {
      if (onNavigate) {
        onNavigate('staff', 'doubts');
      } else {
        window.location.href = '/staff/doubts';
      }
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('claxic_open_doubt', {
            detail: {
              doubtId: notif.meta?.doubtId,
              courseId: notif.meta?.courseId,
            },
          })
        );
      }, 80);
      return;
    }

    // If it's a doubt reply for student: touch navigates directly to student class learning!
    if (notif.type === 'DOUBT_REPLY') {
      if (onNavigate) {
        onNavigate('student', 'courses');
      } else {
        window.location.href = '/student/learning';
      }
      return;
    }

    setSelectedNotification(notif);
  };

  // Format time relative
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const now = new Date();
    const date = new Date(dateStr);
    const diffSecs = Math.floor((now - date) / 1000);
    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Request browser push notification permission
  const handleEnableDevicePush = async () => {
    const perm = await requestDeviceNotificationPermission();
    setDevicePermission(perm);
  };

  // Test In-Build Pop & Native Device Notification on demand
  const handleTestPopAndDeviceNotification = (e) => {
    if (e) e.stopPropagation();
    const testPayload = {
      id: 'test_alert_' + Date.now(),
      title: 'Curriculum Update: System Architecture Session',
      message: 'New academic module released with interactive engineering lab and lecture materials.',
      type: 'ACADEMIC_SESSION',
      link: '/student',
    };
    triggerInBuildPopNotification(testPayload);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* 1. Trigger Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="Notifications"
        className={`relative p-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-slate-100 text-[#EE2D02] ring-2 ring-[#EE2D02]/20'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-95'
        }`}
      >
        <Bell className="w-5 h-5 transition-transform duration-200 hover:rotate-12" />

        {/* Pulsing Badge for Unread */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center px-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EE2D02] opacity-60"></span>
            <span className="relative inline-flex items-center justify-center rounded-full h-4 min-w-4 px-1 bg-gradient-to-r from-[#EE2D02] to-orange-500 text-[10px] font-black font-mono text-white shadow-md">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* 2. Floating Notification Center Window */}
      {isOpen && (
        <div
          className="absolute right-0 sm:-right-4 mt-3 w-[92vw] sm:w-[460px] md:w-[500px] max-w-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200 font-sans"
          style={{
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.08)',
          }}
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
                <Bell className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Notification Center</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FFF1EE] text-[#EE2D02] border border-[#EE2D02]/20">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">Official alerts & academic updates</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isLoading}
                  title="Mark all as read"
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-[#EE2D02] hover:bg-[#FFF1EE] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs - Creative Classes tab removed */}
          <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All', count: categoryCounts.all },
              { id: 'academic', label: 'Academic', count: categoryCounts.academic },
              { id: 'launches', label: 'Announcements', count: categoryCounts.launches },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-[62vh] overflow-y-auto divide-y divide-slate-100 overscroll-contain">
            {notifications.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-slate-100 to-orange-50 flex items-center justify-center text-slate-400">
                  <Sparkles className="w-7 h-7 text-amber-500/70" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">You're all caught up!</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {activeTab === 'academic'
                    ? 'No new academic alerts or curriculum updates.'
                    : activeTab === 'launches'
                    ? 'No new academy announcements right now.'
                    : 'No notifications in this category right now.'}
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isClass =
                  notif.type === 'CREATIVE_CLASS' || notif.type === 'class_alert' || notif.type?.includes('CLASS');
                const isLaunch =
                  notif.type === 'COURSE_LAUNCH_AD' || notif.type === 'course_launch' || notif.type?.includes('LAUNCH');
                const isDoubt =
                  notif.type === 'DOUBT_ALERT' || notif.type === 'DOUBT_REPLY' || notif.tab === 'doubts' || notif.type?.includes('DOUBT');

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleCardClick(notif)}
                    className={`group relative p-4 transition-all duration-200 cursor-pointer hover:bg-slate-50/90 ${
                      !notif.isRead ? 'bg-[#FFF9F8]/70 border-l-4 border-l-[#EE2D02]' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* CARD TYPE 1: NEW COURSE LAUNCH AD */}
                    {isLaunch ? (
                      <div className="space-y-3">
                        {/* Top Promo Tag */}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            {notif.meta?.badge ? notif.meta.badge.replace(/[🎨🚀🔥]/g, '').trim() : 'ACADEMY ANNOUNCEMENT'}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>

                        {/* Ad Banner Image Preview (if present) */}
                        {notif.meta?.bannerImage && (
                          <div className="relative rounded-2xl overflow-hidden aspect-[16/7] bg-slate-900 border border-slate-200/80 shadow-xs group-hover:shadow-md transition-shadow">
                            <img
                              src={notif.meta.bannerImage}
                              alt={notif.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
                              <span className="text-white text-xs font-bold drop-shadow-sm line-clamp-1">
                                {notif.meta?.courseTitle || notif.title}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Title & Message */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#EE2D02] transition-colors line-clamp-1">
                            {notif.title}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                        </div>

                        {/* Price & Offer Row */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            {notif.meta?.price !== undefined && (
                              <span className="text-sm font-black text-slate-900 font-mono">
                                ₹{Number(notif.meta.price).toLocaleString('en-IN')}
                              </span>
                            )}
                            {notif.meta?.originalPrice && Number(notif.meta.originalPrice) > Number(notif.meta.price) && (
                              <span className="text-xs font-semibold text-slate-400 line-through font-mono">
                                ₹{Number(notif.meta.originalPrice).toLocaleString('en-IN')}
                              </span>
                            )}
                            {notif.meta?.discountPercent && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                {notif.meta.discountPercent}% OFF
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#EE2D02] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                              {notif.meta?.actionLabel || 'View Details'}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : isClass ? (
                      /* CARD TYPE 2: CLASS ALERT (Enrolled Students) */
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <BookOpen className="w-3 h-3 text-emerald-600" />
                            {notif.meta?.dayNumber ? `Day ${notif.meta.dayNumber} • Live Class` : 'Academic Session'}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {notif.title}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>

                        {/* Topics Pill List */}
                        {Array.isArray(notif.meta?.topics) && notif.meta.topics.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            {notif.meta.topics.slice(0, 3).map((topic, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium"
                              >
                                #{topic}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action Link */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] font-semibold text-slate-400">
                            {notif.meta?.courseTitle || 'Enrolled Course'}
                          </span>
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 group-hover:underline">
                            {notif.meta?.actionLabel || 'Open Lesson'}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ) : isDoubt ? (
                      /* CARD TYPE 3: STUDENT DOUBT ALERT (Faculty Clarifications) */
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                            <HelpCircle className="w-3 h-3 text-[#D97706]" />
                            {notif.meta?.badge || (notif.type === 'DOUBT_REPLY' ? 'DOUBT ANSWERED' : 'STUDENT DOUBT')}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#D97706] font-mono font-bold">
                            <span>{notif.meta?.studentName || (notif.type === 'DOUBT_REPLY' ? notif.meta?.authorName : 'Student')}</span>
                            <span>•</span>
                            <span>{notif.meta?.courseTitle || 'Curriculum'}</span>
                            {notif.meta?.classNumber && <span>(Day {notif.meta.classNumber})</span>}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#D97706] transition-colors mt-0.5">
                            {notif.title}
                          </h4>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-[#FAFAF7] p-2.5 rounded-xl border border-slate-200/80">
                            "{notif.meta?.question || notif.message}"
                          </p>
                        </div>

                        {/* Action Link */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-[11px] font-mono text-slate-400">
                            {notif.meta?.classTitle || 'Lesson Doubt'}
                          </span>
                          <span className="text-xs font-bold text-[#D97706] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            <span>{notif.meta?.actionLabel || (notif.type === 'DOUBT_REPLY' ? 'View Explanation' : 'Open & Answer Doubt')}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* CARD TYPE 3: ACADEMIC & GENERAL SYSTEM NOTIFICATION */
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
                            <GraduationCap className="w-3 h-3 text-sky-600" />
                            Institutional Notice
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#EE2D02] transition-colors">
                          {notif.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    )}

                    {/* Quick Row Hover Controls */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-lg border border-slate-200 shadow-xs">
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          title="Mark as read"
                          className="p-1 hover:text-[#EE2D02] hover:bg-[#FFF1EE] rounded text-slate-400 transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(notif.id, e)}
                        title="Dismiss"
                        className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded text-slate-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar: Device Push Status + Test Notification Button */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            {devicePermission === 'granted' ? (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Device Push Active</span>
              </div>
            ) : devicePermission === 'denied' ? (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <span>Push Blocked in Browser</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleEnableDevicePush}
                className="text-[11px] font-bold text-[#EE2D02] hover:text-rose-700 hover:underline transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#EE2D02]" />
                <span>Enable Device System Push</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTestPopAndDeviceNotification}
              title="Test In-Build Pop Banner, Chime & Device Push Alert"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <Volume2 className="w-3 h-3 text-[#EE2D02]" />
              <span>Test Pop Alert</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Detailed Notification View Modal (Touch / Click to Open) */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E8E3DC] rounded-[24px] p-6 max-w-lg w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#EEEAE4]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Bell className="w-3 h-3 text-[#D97706]" />
                    {selectedNotification.meta?.badge || (selectedNotification.type === 'urgent' ? 'URGENT NOTICE' : 'SYSTEM NOTIFICATION')}
                  </span>
                  <span className="text-[11px] font-mono text-[#6B6258] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(selectedNotification.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1F1F1F]">
                  {selectedNotification.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="text-stone-400 hover:text-stone-700 p-1.5 cursor-pointer rounded-lg hover:bg-stone-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedNotification.meta?.bannerImage && (
              <div className="rounded-xl overflow-hidden aspect-video bg-stone-900 border border-stone-200 shadow-xs">
                <img
                  src={selectedNotification.meta.bannerImage}
                  alt={selectedNotification.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E3DC] text-xs text-[#1F1F1F] leading-relaxed whitespace-pre-wrap font-normal">
              {selectedNotification.message}
            </div>

            {selectedNotification.meta?.authorName && (
              <div className="text-xs text-[#D97706] font-semibold flex items-center gap-1.5 px-1">
                <span>Dispatched by:</span>
                <strong className="text-[#1F1F1F]">{selectedNotification.meta.authorName}</strong>
              </div>
            )}

            {Array.isArray(selectedNotification.meta?.topics) && selectedNotification.meta.topics.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap px-1">
                {selectedNotification.meta.topics.map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-mono">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EEEAE4]">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-[#E8E3DC] font-bold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
              {selectedNotification.link && (
                <button
                  type="button"
                  onClick={() => {
                    const link = selectedNotification.link;
                    const doubtId = selectedNotification.meta?.doubtId;
                    const isDoubt =
                      selectedNotification.type === 'DOUBT_ALERT' ||
                      selectedNotification.tab === 'doubts' ||
                      link.includes('/staff/doubts');

                    setSelectedNotification(null);
                    if (onNavigate) {
                      if (isDoubt) {
                        onNavigate('staff', 'doubts');
                        if (doubtId) {
                          setTimeout(() => {
                            window.dispatchEvent(
                              new CustomEvent('claxic_open_doubt', { detail: { doubtId } })
                            );
                          }, 80);
                        }
                      } else if (link.startsWith('/courses/')) {
                        const slug = link.replace('/courses/', '');
                        onNavigate('course-detail', { slug });
                      } else if (link.startsWith('/student') || link === '/dashboard') {
                        onNavigate('student');
                      } else if (link.startsWith('/staff')) {
                        const seg = link.replace(/^\/staff\/?/, '');
                        onNavigate('staff', seg || 'overview');
                      } else {
                        window.location.href = link;
                      }
                    } else {
                      window.location.href = link;
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#18181B] hover:bg-stone-900 text-white font-bold text-xs border border-stone-800 hover:border-amber-500/40 cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <span>
                    {selectedNotification.type === 'DOUBT_ALERT' ? 'Open & Reply to Doubt' : 'Open Connected Resource'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
