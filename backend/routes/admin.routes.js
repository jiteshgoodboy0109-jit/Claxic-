import express from 'express';
import crypto from 'crypto';
import { db, hashPassword } from '../db/index.js';
import { extractToken, getUserByToken, requireAdmin } from '../middleware/index.js';
import { destroyAllUserSessions } from '../services/auth.service.js';

const router = express.Router();

// Role-based authorization: Allow both STAFF and ADMIN for courses, require ADMIN for all else
router.use((req, res, next) => {
  const isCourseRoute = req.path.startsWith('/courses');
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }

  if (isCourseRoute) {
    if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
      return res.status(403).json({ error: 'Access forbidden. Faculty or Administrator privileges required.' });
    }
  } else {
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access forbidden. Administrator privileges required.' });
    }
  }

  req.user = user;
  req.token = token;
  next();
});

// Admin Executive Overview & Metrics
router.get('/overview', (req, res) => {
  try {
    const payments = db.raw.payments || [];
    const users = db.raw.users || [];
    const applications = db.raw.applications || [];
    const courses = db.raw.courses || [];
    const auditLogs = db.raw.auditLogs || [];

    const totalRevenue = payments
      .filter((p) => p && p.status === 'SUCCESS')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalUsers = users.length;
    const verifiedUsers = users.filter((u) => u && u.isVerified).length;
    const totalApplications = applications.length;
    const confirmedApplications = applications.filter((a) => a && a.status === 'CONFIRMED').length;
    const pendingApplications = applications.filter(
      (a) => a && (a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW' || a.status === 'PAYMENT_PENDING')
    ).length;
    const totalCourses = courses.length;
    const activeCourses = courses.filter((c) => c && c.status === 'PUBLISHED').length;

    // Category distribution
    const categoryCounts = {};
    for (const c of courses) {
      if (!c) continue;
      const cat = c.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + (c.enrolledCount || 1);
    }
    const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({ category, count }));

    // Registrations over time
    const regByDate = {};
    for (const a of applications) {
      if (!a) continue;
      const d = a.createdAt ? String(a.createdAt).substring(0, 10) : '2026-08-20';
      regByDate[d] = (regByDate[d] || 0) + (a.paidAmount || a.amount || 24999);
    }
    const registrationsOverTime = Object.entries(regByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

  // Dynamic 12-Month Cohort Growth Analysis (Past Year vs YTD Current Year)
  const now = new Date();
  const currentYear = now.getFullYear();
  const pastYear = currentYear - 1;
  const currentMonthIdx = now.getMonth();

  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getMonthlyBreakdown = (targetYear, maxMonth) => {
    return Array.from({ length: maxMonth + 1 }, (_, m) => {
      const monthApps = db.raw.applications.filter((a) => {
        if (!a.createdAt) return false;
        const d = new Date(a.createdAt);
        return d.getFullYear() === targetYear && d.getMonth() === m;
      });
      const applied = monthApps.length;
      const admitted = monthApps.filter((a) => a.status === 'CONFIRMED' || a.status === 'APPROVED').length;
      const enrolled = monthApps.filter((a) => a.status === 'CONFIRMED').length;

      return {
        month: monthShort[m],
        monthFull: monthFull[m],
        year: targetYear,
        applied,
        admitted,
        enrolled,
      };
    });
  };

  const monthlyCohortGrowth = {
    currentYear,
    pastYear,
    currentMonthIdx,
    pastYearData: getMonthlyBreakdown(pastYear, 11), // Full 12 months for past year
    currentYearData: getMonthlyBreakdown(currentYear, currentMonthIdx), // Only up to current month for current year (NO future months)
  };

  return res.json({
    totalRevenue,
    totalUsers,
    verifiedUsers,
    totalApplications,
    confirmedApplications,
    pendingApplications,
    totalCourses,
    activeCourses,
    categoryDistribution,
    registrationsOverTime,
    monthlyCohortGrowth,
    metrics: {
      totalRevenue,
      totalUsers,
      verifiedUsers,
      totalApplications,
      confirmedApplications,
      pendingApplications,
      totalCourses,
      activeCourses,
    },
    recentApplications: (db.raw.applications || []).slice(0, 8),
    recentPayments: (db.raw.payments || []).slice(0, 8),
    recentAuditLogs: (db.raw.auditLogs || []).slice(0, 10),
  });
} catch (err) {
    console.error('Admin overview error:', err);
    return res.status(500).json({ error: 'Failed to load executive overview.' });
  }
});

// Admin Analytics Data for Charts
router.get('/analytics', (req, res) => {
  try {
    const payments = db.raw.payments || [];
    const applications = db.raw.applications || [];
    const courses = db.raw.courses || [];

    // Compute monthly revenue trend
    const revenueByMonth = {};
    for (const p of payments) {
      if (p && p.status === 'SUCCESS') {
        const month = p.createdAt ? String(p.createdAt).substring(0, 7) : '2026-08';
        revenueByMonth[month] = (revenueByMonth[month] || 0) + (p.amount || 0);
      }
    }

    const revenueTrend = Object.entries(revenueByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));

    // Application status breakdown
    const statusCounts = {};
    for (const a of applications) {
      if (!a) continue;
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    }
    const applicationBreakdown = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    // Course enrollment distribution
    const courseEnrollments = courses.map((c) => ({
      title: c.title,
      enrolled: c.enrolledCount || 0,
      capacity: c.capacity || 40,
      fillRate: Math.round(((c.enrolledCount || 0) / (c.capacity || 40)) * 100),
    }));

    return res.json({
      revenueTrend,
      applicationBreakdown,
      courseEnrollments,
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    return res.status(500).json({ error: 'Failed to load analytics data.' });
  }
});

// Get All Courses (Admin View)
router.get('/courses', (req, res) => {
  try {
    res.json({ courses: db.raw.courses || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load courses.' });
  }
});

// Create New Course
router.post('/courses', async (req, res) => {
  try {
    const admin = req.user;
    const courseData = req.body;

    if (!courseData.title || !courseData.price || !courseData.capacity) {
      return res.status(400).json({ error: 'Title, price, and capacity are required fields.' });
    }

    const courseId = 'crs_' + crypto.randomBytes(8).toString('hex');
    const slug = courseData.slug || courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newCourse = {
      id: courseId,
      slug,
      title: courseData.title.trim(),
      shortDescription: courseData.shortDescription || '',
      fullDescription: courseData.fullDescription || '',
      bannerImage: courseData.bannerImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
      category: courseData.category || 'Computer Science',
      level: courseData.level || 'Intermediate',
      mode: courseData.mode || 'Live Interactive',
      duration: courseData.duration || '10 Weeks',
      startDate: courseData.startDate || '2026-10-01',
      endDate: courseData.endDate || '2026-12-15',
      registrationDeadline: courseData.registrationDeadline || '2026-09-25',
      price: Number(courseData.price) || 9999,
      originalPrice: Number(courseData.originalPrice) || Number(courseData.price) * 1.5,
      capacity: Number(courseData.capacity) || 40,
      enrolledCount: 0,
      status: courseData.status || 'PUBLISHED',
      featured: Boolean(courseData.featured),
      rating: 5.0,
      reviewsCount: 0,
      tags: Array.isArray(courseData.tags) ? courseData.tags : ['Engineering', 'Claxic'],
      instructor: courseData.instructor || {
        id: 'inst_' + Math.random().toString(36).substring(2, 7),
        name: admin.name,
        title: 'Senior Faculty Member',
        company: 'Claxic Academic Directorate',
        avatar: admin.avatar,
        bio: 'Distinguished researcher and course director.',
      },
      modules: courseData.modules || [],
      learningOutcomes: courseData.learningOutcomes || [],
      requirements: courseData.requirements || [],
      faq: courseData.faq || [],
    };

    await db.transaction((data) => {
      data.courses.unshift(newCourse);
      if (!data.auditLogs) data.auditLogs = [];
      data.auditLogs.unshift({
        id: 'audit_' + Math.random().toString(36).substring(2, 9),
        adminId: admin.id,
        adminName: admin.name,
        action: 'COURSE_CREATED',
        targetType: 'COURSE',
        targetId: newCourse.id,
        targetTitle: newCourse.title,
        createdAt: new Date().toISOString(),
      });
    });

    return res.status(201).json({ success: true, message: 'Course created successfully.', course: newCourse });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create course.' });
  }
});

// Update Existing Course
router.put('/courses/:id', async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const updates = req.body;

    const courseIndex = db.raw.courses.findIndex((c) => c.id === id);
    if (courseIndex === -1) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    let updatedCourse;
    await db.transaction((data) => {
      data.courses[courseIndex] = {
        ...data.courses[courseIndex],
        ...updates,
        price: updates.price ? Number(updates.price) : data.courses[courseIndex].price,
        capacity: updates.capacity ? Number(updates.capacity) : data.courses[courseIndex].capacity,
      };
      updatedCourse = data.courses[courseIndex];

      if (!data.auditLogs) data.auditLogs = [];
      data.auditLogs.unshift({
        id: 'audit_' + Math.random().toString(36).substring(2, 9),
        adminId: admin.id,
        adminName: admin.name,
        action: 'COURSE_UPDATED',
        targetType: 'COURSE',
        targetId: updatedCourse.id,
        targetTitle: updatedCourse.title,
        createdAt: new Date().toISOString(),
      });
    });

    return res.json({ success: true, message: 'Course updated successfully.', course: updatedCourse });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update course.' });
  }
});

// Delete Course
router.delete('/courses/:id', async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.params;

    const course = db.raw.courses.find((c) => c.id === id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    await db.transaction((data) => {
      data.courses = data.courses.filter((c) => c.id !== id);
      if (!data.auditLogs) data.auditLogs = [];
      data.auditLogs.unshift({
        id: 'audit_' + Math.random().toString(36).substring(2, 9),
        adminId: admin.id,
        adminName: admin.name,
        action: 'COURSE_DELETED',
        targetType: 'COURSE',
        targetId: course.id,
        targetTitle: course.title,
        createdAt: new Date().toISOString(),
      });
    });

    return res.json({ success: true, message: 'Course deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete course.' });
  }
});

// Get All Applications
router.get('/applications', (req, res) => {
  try {
    const { status, courseId, search } = req.query;
    let apps = [...(db.raw.applications || [])];

    if (status && status !== 'ALL') {
      apps = apps.filter((a) => a && a.status === status);
    }

    if (courseId && courseId !== 'ALL') {
      apps = apps.filter((a) => a && a.courseId === courseId);
    }

    if (search) {
      const q = search.toLowerCase();
      apps = apps.filter(
        (a) =>
          a &&
          ((a.userName || '').toLowerCase().includes(q) ||
            (a.userEmail || '').toLowerCase().includes(q) ||
            (a.applicationNumber || '').toLowerCase().includes(q) ||
            (a.courseTitle || '').toLowerCase().includes(q))
      );
    }

    res.json({ applications: apps });
  } catch (err) {
    console.error('Admin applications error:', err);
    res.status(500).json({ error: 'Failed to load applications.' });
  }
});

// Update Application Status (Approve / Reject / Review)
router.patch('/applications/:id/status', async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const { status, reviewNotes, adminNotes } = req.body;

    const validStatuses = [
      'DRAFT',
      'SUBMITTED',
      'UNDER_REVIEW',
      'PAYMENT_PENDING',
      'APPROVED',
      'CONFIRMED',
      'REJECTED',
      'CANCELLED',
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid application status provided.' });
    }

    const application = db.raw.applications.find((a) => a.id === id);
    if (!application) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    const notes = (adminNotes !== undefined ? adminNotes : reviewNotes) || '';
    const now = new Date().toISOString();
    let updatedApp = null;

    await db.transaction((data) => {
      const app = data.applications.find((a) => a.id === id);
      if (app) {
        const prevStatus = app.status;
        app.status = status;
        if (notes) {
          app.reviewNotes = notes;
          app.adminNotes = notes;
        }
        app.updatedAt = now;
        updatedApp = { ...app };

        // Adjust course enrolledCount
        const course = data.courses.find((c) => c.id === app.courseId);
        if (course) {
          const wasEnrolled = prevStatus === 'CONFIRMED' || prevStatus === 'APPROVED';
          const isNowEnrolled = status === 'CONFIRMED' || status === 'APPROVED';
          if (!wasEnrolled && isNowEnrolled) {
            course.enrolledCount = (course.enrolledCount || 0) + 1;
            if (course.enrolledCount >= course.capacity) {
              course.status = 'FULL';
            }
          } else if (wasEnrolled && !isNowEnrolled) {
            course.enrolledCount = Math.max(0, (course.enrolledCount || 1) - 1);
            if (course.status === 'FULL') {
              course.status = 'PUBLISHED';
            }
          }
        }
      }

      // Add user notification
      if (!data.notifications) data.notifications = [];
      data.notifications.unshift({
        id: 'notif_' + Math.random().toString(36).substring(2, 9),
        userId: application.userId,
        title: `Application Status Updated: ${status}`,
        message: `Your application #${application.applicationNumber} status changed to ${status}.`,
        type: status === 'CONFIRMED' || status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'error' : 'info',
        link: '/dashboard',
        isRead: false,
        createdAt: now,
      });

      // Audit log
      if (!data.auditLogs) data.auditLogs = [];
      data.auditLogs.unshift({
        id: 'audit_' + Math.random().toString(36).substring(2, 9),
        adminId: admin.id,
        adminName: admin.name,
        action: 'APPLICATION_STATUS_UPDATED',
        targetType: 'APPLICATION',
        targetId: application.id,
        targetTitle: `#${application.applicationNumber} -> ${status}`,
        createdAt: now,
      });
    });

    return res.json({
      success: true,
      message: `Application status updated to ${status}.`,
      application: updatedApp || application,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update application status.' });
  }
});

// Delete Application
router.delete('/applications/:id', async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.params;

    const application = db.raw.applications.find((a) => a.id === id);
    if (!application) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    await db.transaction((data) => {
      data.applications = data.applications.filter((a) => a.id !== id);

      if (!data.auditLogs) data.auditLogs = [];
      data.auditLogs.unshift({
        id: 'audit_' + Math.random().toString(36).substring(2, 9),
        adminId: admin.id,
        adminName: admin.name,
        action: 'APPLICATION_DELETED',
        targetType: 'APPLICATION',
        targetId: application.id,
        targetTitle: `Removed #${application.applicationNumber} (${application.userName})`,
        createdAt: new Date().toISOString(),
      });
    });

    return res.json({ success: true, message: 'Application deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete application.' });
  }
});

// Export Applications to CSV
router.get('/applications/export', (req, res) => {
  const apps = db.raw.applications;
  const headers = ['Application Number', 'Candidate Name', 'Email', 'Mobile', 'Course Title', 'Amount', 'Status', 'Submitted Date'];
  const rows = apps.map((a) => [
    a.applicationNumber,
    `"${a.userName}"`,
    a.userEmail,
    a.formData?.mobile || '',
    `"${a.courseTitle}"`,
    a.amount,
    a.status,
    a.createdAt,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="claxic_admissions_export.csv"');
  return res.send(csv);
});

// Get All Users
router.get('/users', (req, res) => {
  const users = db.raw.users.map(({ passwordHash, salt, ...safeUser }) => safeUser);
  res.json({ users });
});

// Update User Profile
router.put('/users/:id', async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const { name, email, mobile, role, isVerified, isActive, institution, degree, yearOfStudy } = req.body;

    const user = db.raw.users.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = db.raw.users.some(
        (u) => u.id !== id && u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (emailExists) {
        return res.status(409).json({ error: 'Another user already exists with this email address.' });
      }
    }

    const now = new Date().toISOString();
    let updatedUser;

    await db.transaction((data) => {
      const u = data.users.find((x) => x.id === id);
      if (u) {
        if (name !== undefined) u.name = name.trim();
        if (email !== undefined) u.email = email.trim().toLowerCase();
        if (mobile !== undefined) u.mobile = mobile.trim();
        if (role !== undefined && ['USER', 'ADMIN', 'STAFF', 'INSTRUCTOR'].includes(role)) u.role = role === 'INSTRUCTOR' ? 'STAFF' : role;
        if (isVerified !== undefined) u.isVerified = Boolean(isVerified);
        if (isActive !== undefined) u.isActive = Boolean(isActive);
        if (institution !== undefined) u.institution = institution.trim();
        if (degree !== undefined) u.degree = degree.trim();
        if (yearOfStudy !== undefined) u.yearOfStudy = yearOfStudy.trim();
        u.updatedAt = now;
        updatedUser = u;
      }

      if (!data.auditLogs) data.auditLogs = [];
      data.auditLogs.unshift({
        id: 'audit_' + Math.random().toString(36).substring(2, 9),
        adminId: admin.id,
        adminName: admin.name,
        action: 'USER_PROFILE_UPDATED',
        targetType: 'USER',
        targetId: user.id,
        targetTitle: `${user.name} (${user.email})`,
        createdAt: now,
      });
    });

    const { passwordHash: _, salt: __, ...safeUser } = updatedUser;
    return res.json({ success: true, message: 'User profile updated successfully.', user: safeUser });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

// Quick Toggle User Status / Role
router.patch('/users/:id/status', async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const { isActive, role, isVerified } = req.body;

    const user = db.raw.users.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User record not found.' });
    }

    const now = new Date().toISOString();
    let updatedUser;
    await db.transaction((data) => {
      const u = data.users.find((x) => x.id === id);
      if (u) {
        if (isActive !== undefined) u.isActive = Boolean(isActive);
        if (role !== undefined && ['USER', 'ADMIN', 'STAFF', 'INSTRUCTOR'].includes(role)) u.role = role === 'INSTRUCTOR' ? 'STAFF' : role;
        if (isVerified !== undefined) u.isVerified = Boolean(isVerified);
        u.updatedAt = now;
        updatedUser = u;
      }

      if (!data.auditLogs) data.auditLogs = [];
      data.auditLogs.unshift({
        id: 'audit_' + Math.random().toString(36).substring(2, 9),
        adminId: admin.id,
        adminName: admin.name,
        action: 'USER_STATUS_TOGGLED',
        targetType: 'USER',
        targetId: user.id,
        targetTitle: `${user.name} -> Active:${isActive}, Role:${role}`,
        createdAt: now,
      });
    });

    const { passwordHash: _, salt: __, ...safeUser } = updatedUser;
    return res.json({ success: true, message: 'User updated successfully.', user: safeUser });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// Admin Reset User Password
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const user = db.raw.users.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const { hash } = hashPassword(newPassword, salt);
    const now = new Date().toISOString();

    await db.transaction((data) => {
      const u = data.users.find((x) => x.id === id);
      if (u) {
        u.passwordHash = hash;
        u.salt = salt;
        u.updatedAt = now;
      }

      if (!data.auditLogs) data.auditLogs = [];
      data.auditLogs.unshift({
        id: 'audit_' + Math.random().toString(36).substring(2, 9),
        adminId: admin.id,
        adminName: admin.name,
        action: 'USER_PASSWORD_RESET_BY_ADMIN',
        targetType: 'USER',
        targetId: user.id,
        targetTitle: `${user.name} (${user.email})`,
        createdAt: now,
      });
    });

    await destroyAllUserSessions(user.id);

    return res.json({ success: true, message: `Password reset successfully for ${user.name}. All active sessions have been terminated.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Delete User Account (Admin Only)
router.delete('/users/:id', async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.params;

    if (admin.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own active administrative account.' });
    }

    const user = db.raw.users.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const now = new Date().toISOString();
    await db.transaction((data) => {
      data.users = (data.users || []).filter((u) => u.id !== id);
      data.applications = (data.applications || []).filter((a) => a.userId !== id);
      
      // Clean up sessions object safely
      if (data.sessions && typeof data.sessions === 'object') {
        for (const [tokenKey, sess] of Object.entries(data.sessions)) {
          if (sess && sess.userId === id) {
            delete data.sessions[tokenKey];
          }
        }
      }

      // Clean up tokens & notifications
      if (data.verificationTokens) {
        data.verificationTokens = data.verificationTokens.filter((vt) => vt.userId !== id);
      }
      if (data.passwordResetTokens) {
        data.passwordResetTokens = data.passwordResetTokens.filter((pr) => pr.userId !== id);
      }
      if (data.notifications) {
        data.notifications = data.notifications.filter((n) => n.userId !== id);
      }

      if (!data.auditLogs) data.auditLogs = [];
      data.auditLogs.unshift({
        id: 'audit_' + Math.random().toString(36).substring(2, 9),
        adminId: admin.id,
        adminName: admin.name,
        action: 'USER_DELETED',
        targetType: 'USER',
        targetId: user.id,
        targetTitle: `${user.name} (${user.email})`,
        createdAt: now,
      });
    });

    return res.json({ success: true, message: `User ${user.name} removed successfully.` });
  } catch (err) {
    console.error('Error deleting user account:', err);
    return res.status(500).json({ error: 'Failed to delete user account.' });
  }
});

// Get All Payments
router.get('/payments', (req, res) => {
  try {
    res.json({ payments: db.raw.payments || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load payments.' });
  }
});

// Process Refund
router.post('/payments/:id/refund', async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const { reason } = req.body;

    const payment = (db.raw.payments || []).find((p) => p && p.id === id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found.' });
    }

    if (payment.status === 'REFUNDED') {
      return res.status(400).json({ error: 'Payment has already been refunded.' });
    }

    const now = new Date().toISOString();
    const result = await db.transaction((data) => {
      const p = data.payments.find((x) => x.id === id);
      if (p) {
        p.status = 'REFUNDED';
        p.refundReason = reason || 'Admin initiated refund';
        p.refundedAt = now;
        p.updatedAt = now;
      }

      const app = data.applications.find((a) => a.id === payment.applicationId);
      if (app) {
        app.status = 'CANCELLED';
        app.updatedAt = now;
      }

      const course = data.courses.find((c) => c.id === payment.courseId);
      if (course && course.enrolledCount > 0) {
        course.enrolledCount -= 1;
        if (course.status === 'FULL') {
          course.status = 'PUBLISHED';
        }
      }

      if (!data.auditLogs) data.auditLogs = [];
      data.auditLogs.unshift({
        id: 'audit_' + Math.random().toString(36).substring(2, 9),
        adminId: admin.id,
        adminName: admin.name,
        action: 'PAYMENT_REFUNDED',
        targetType: 'PAYMENT',
        targetId: payment.id,
        targetTitle: `₹${payment.amount} refunded to ${payment.userName}`,
        createdAt: now,
      });

      return { payment: p };
    });

    return res.json({ success: true, payment: result.payment, message: 'Refund processed and course seat restored.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process refund.' });
  }
});

// Audit Logs
router.get('/audit-logs', (req, res) => {
  try {
    res.json({ auditLogs: (db.raw.auditLogs || []).slice(0, 100) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load audit logs.' });
  }
});

// Email Dispatch Records
router.get('/system/emails', (req, res) => {
  res.json({ emailRecords: db.raw.emailRecords || [] });
});

export default router;
