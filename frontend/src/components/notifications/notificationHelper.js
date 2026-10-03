/**
 * CLAXIC REAL-TIME NOTIFICATION & SOUND ENGINE
 * 
 * Manages:
 * 1. Native Device / OS Push Notifications (via Notification API & ServiceWorker)
 * 2. In-Build Interactive Pop Toast Banners
 * 3. Synthesized Web Audio API gentle chimes (Zero audio file latency)
 */

// Synthesize pleasant two-tone chime (D5 -> A5)
export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Smooth dual harmonic chime
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch (err) {
    // Ignore audio autoplay restrictions gracefully
  }
};

// Request device notification permission
export const requestDeviceNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      showDeviceNotification('🔔 Claxic Notifications Active', {
        body: 'Device notifications successfully enabled! You will receive live class alerts and announcements.',
        tag: 'claxic-permission-granted',
      });
    }
    return permission;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return 'default';
  }
};

// Dispatch Native OS / Browser Device Notification
export const showDeviceNotification = (title, options = {}) => {
  if (!('Notification' in window)) return null;

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body: options.body || options.message || 'New update from Claxic Academy',
        icon: options.icon || '/favicon.png',
        badge: options.badge || '/favicon-32x32.png',
        tag: options.tag || 'claxic-alert-' + Date.now(),
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
      });

      notif.onclick = () => {
        window.focus();
        if (options.onClick) {
          options.onClick();
        } else if (options.data?.link) {
          window.location.href = options.data.link;
        }
        notif.close();
      };

      return notif;
    } catch (err) {
      // Fallback to Service Worker registration if direct Notification() fails (e.g. mobile Chrome)
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body: options.body || options.message,
            icon: options.icon || '/favicon.png',
            badge: options.badge || '/favicon-32x32.png',
            data: { link: options.data?.link || '/' },
          });
        }).catch(() => {});
      }
    }
  }
  return null;
};

// Dispatch custom event for In-Build Floating Pop Banner
export const triggerInBuildPopNotification = (notificationData) => {
  // 1. Play soft audio chime
  playNotificationSound();

  // 2. Dispatch custom event for UI popup component
  const event = new CustomEvent('claxic_inbuild_pop_notification', {
    detail: notificationData,
  });
  window.dispatchEvent(event);

  // 3. Dispatch native device notification if permitted
  if ('Notification' in window && Notification.permission === 'granted') {
    showDeviceNotification(notificationData.title, {
      body: notificationData.message,
      tag: notificationData.id,
      data: { link: notificationData.link || '/' },
    });
  }
};
