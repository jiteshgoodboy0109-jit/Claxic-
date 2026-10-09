import express from 'express';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/index.js';

const router = express.Router();

// Apply requireAuth to all notification routes
router.use(requireAuth);

/**
 * 1. GET /api/notifications
 * Retrieve notifications for the logged-in user with unread count & category stats
 */
router.get('/', (req, res) => {
  try {
    const user = req.user;
    const { type, unreadOnly, limit = 50 } = req.query;

    const userEmailLower = user.email?.toLowerCase();
    const isUserNotif = (n) =>
      n.userId === user.id || (userEmailLower && n.userEmail && n.userEmail.toLowerCase() === userEmailLower);

    const allUserNotifs = (db.raw.notifications || []).filter(isUserNotif);

    // Calculate unread count
    const unreadCount = allUserNotifs.filter((n) => !n.isRead).length;

    // Filter by type if specified
    let filtered = allUserNotifs;
    if (type && type !== 'all') {
      if (type === 'classes') {
        filtered = filtered.filter(
          (n) => n.type === 'CREATIVE_CLASS' || n.type === 'class_alert' || n.type?.includes('CLASS')
        );
      } else if (type === 'launches') {
        filtered = filtered.filter(
          (n) => n.type === 'COURSE_LAUNCH_AD' || n.type === 'course_launch' || n.type?.includes('LAUNCH')
        );
      } else if (type === 'academic') {
        filtered = filtered.filter(
          (n) =>
            n.type !== 'CREATIVE_CLASS' &&
            n.type !== 'class_alert' &&
            n.type !== 'COURSE_LAUNCH_AD' &&
            n.type !== 'course_launch'
        );
      } else {
        filtered = filtered.filter((n) => n.type === type);
      }
    }

    if (unreadOnly === 'true' || unreadOnly === true) {
      filtered = filtered.filter((n) => !n.isRead);
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Limit slice
    const paginated = filtered.slice(0, Math.min(Number(limit) || 50, 100));

    // Category breakdown counts
    const classCount = allUserNotifs.filter(
      (n) => n.type === 'CREATIVE_CLASS' || n.type === 'class_alert' || n.type?.includes('CLASS')
    ).length;
    const launchCount = allUserNotifs.filter(
      (n) => n.type === 'COURSE_LAUNCH_AD' || n.type === 'course_launch' || n.type?.includes('LAUNCH')
    ).length;
    const academicCount = allUserNotifs.length - classCount - launchCount;

    return res.json({
      success: true,
      unreadCount,
      totalCount: allUserNotifs.length,
      categoryCounts: {
        all: allUserNotifs.length,
        classes: classCount,
        launches: launchCount,
        academic: Math.max(0, academicCount),
      },
      notifications: paginated,
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

/**
 * 2. PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    let targetNotif = null;

    const userEmailLower = user.email?.toLowerCase();
    const isUserNotif = (n) =>
      n.userId === user.id || (userEmailLower && n.userEmail && n.userEmail.toLowerCase() === userEmailLower);

    await db.transaction((data) => {
      const notif = (data.notifications || []).find((n) => n.id === id && isUserNotif(n));
      if (notif) {
        notif.isRead = true;
        targetNotif = notif;
      }
    });

    if (!targetNotif) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    const unreadCount = (db.raw.notifications || []).filter((n) => isUserNotif(n) && !n.isRead).length;

    return res.json({
      success: true,
      message: 'Notification marked as read.',
      notification: targetNotif,
      unreadCount,
    });
  } catch (err) {
    console.error('Mark notification read error:', err);
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
});

/**
 * 3. PATCH /api/notifications/read-all
 * Mark all notifications for current user as read
 */
router.patch('/read-all', async (req, res) => {
  try {
    const user = req.user;
    const userEmailLower = user.email?.toLowerCase();
    const isUserNotif = (n) =>
      n.userId === user.id || (userEmailLower && n.userEmail && n.userEmail.toLowerCase() === userEmailLower);
    let updatedCount = 0;

    await db.transaction((data) => {
      if (data.notifications) {
        for (const notif of data.notifications) {
          if (isUserNotif(notif) && !notif.isRead) {
            notif.isRead = true;
            updatedCount++;
          }
        }
      }
    });

    return res.json({
      success: true,
      message: `${updatedCount} notifications marked as read.`,
      updatedCount,
      unreadCount: 0,
    });
  } catch (err) {
    console.error('Mark all read error:', err);
    return res.status(500).json({ error: 'Failed to mark all as read.' });
  }
});

/**
 * 4. DELETE /api/notifications/:id
 * Delete a specific notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const user = req.user;
    const userEmailLower = user.email?.toLowerCase();
    const isUserNotif = (n) =>
      n.userId === user.id || (userEmailLower && n.userEmail && n.userEmail.toLowerCase() === userEmailLower);
    const { id } = req.params;

    let deleted = false;

    await db.transaction((data) => {
      if (data.notifications) {
        const initialLen = data.notifications.length;
        data.notifications = data.notifications.filter((n) => !(n.id === id && isUserNotif(n)));
        if (data.notifications.length < initialLen) {
          deleted = true;
        }
      }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Notification not found or already removed.' });
    }

    const unreadCount = (db.raw.notifications || []).filter((n) => isUserNotif(n) && !n.isRead).length;

    return res.json({
      success: true,
      message: 'Notification deleted successfully.',
      unreadCount,
    });
  } catch (err) {
    console.error('Delete notification error:', err);
    return res.status(500).json({ error: 'Failed to delete notification.' });
  }
});

/**
 * 5. DELETE /api/notifications/clear-read
 * Clear all already-read notifications for current user
 */
router.delete('/clear-read', async (req, res) => {
  try {
    const user = req.user;
    let removedCount = 0;

    await db.transaction((data) => {
      if (data.notifications) {
        const before = data.notifications.length;
        data.notifications = data.notifications.filter((n) => !(n.userId === user.id && n.isRead));
        removedCount = before - data.notifications.length;
      }
    });

    return res.json({
      success: true,
      message: `Cleared ${removedCount} read notifications.`,
      removedCount,
    });
  } catch (err) {
    console.error('Clear read notifications error:', err);
    return res.status(500).json({ error: 'Failed to clear read notifications.' });
  }
});

export default router;
