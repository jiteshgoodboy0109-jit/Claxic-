import express from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { db, hashPassword, verifyPassword } from '../db/index.js';
import { requireStaff } from '../middleware/index.js';
import { destroyAllUserSessions } from '../services/auth.service.js';
import { sendEmail } from '../services/email.service.js';

const router = express.Router();

// Apply requireStaff to all staff routes
router.use(requireStaff);

// Helper: Check if staff is allotted to manage a course
export function isStaffAllotted(staffId, courseId, role = 'STAFF') {
  if (role === 'ADMIN') return true;
  const course = (db.raw.courses || []).find((c) => c.id === courseId || c.slug === courseId);
  const targetIds = [courseId, course?.id, course?.slug].filter(Boolean);
  return (db.raw.staffCourseAllotments || []).some(
    (a) => a.staffId === staffId && targetIds.includes(a.courseId) && a.status === 'ACTIVE'
  );
}

// Helper: Get all enrolled/registered students for a specific course
export function getEnrolledStudentsForCourse(course, data) {
  if (!course) return [];
  const courseId = course.id;
  const courseSlug = course.slug;
  const normCourseTitle = course.title?.toLowerCase().trim();
  const validAppStatuses = ['CONFIRMED', 'APPROVED', 'SUBMITTED', 'ENROLLED', 'PAID', 'ACCEPTED'];
  const studentUserIds = new Set();
  const studentsMap = new Map();

  const addStudent = (uid, name, email) => {
    if (!uid && !email) return;
    const key = (email || uid).toLowerCase();
    if (!studentsMap.has(key)) {
      studentsMap.set(key, {
        id: uid || `usr_${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: name || 'Student',
        email: email || null,
      });
    }
  };

  // 1. Applications matching courseId, courseSlug, or courseTitle
  (data.applications || []).forEach((app) => {
    const appTitle = (app.courseTitle || app.programTitle || app.title)?.toLowerCase().trim();
    const matchesCourse =
      app.courseId === courseId ||
      app.courseId === courseSlug ||
      app.courseSlug === courseSlug ||
      (normCourseTitle && appTitle && normCourseTitle === appTitle);

    const statusValid = !app.status || validAppStatuses.includes(String(app.status).toUpperCase());

    if (matchesCourse && statusValid) {
      if (app.userId) studentUserIds.add(app.userId);
      const email = app.userEmail || app.formData?.email || app.email;
      const name = app.userName || app.formData?.fullName || app.formData?.name || app.name;
      if (email) {
        const userObj = (data.users || []).find((u) => u.email && u.email.toLowerCase() === email.toLowerCase());
        if (userObj) {
          studentUserIds.add(userObj.id);
        } else {
          addStudent(app.userId, name, email);
        }
      }
    }
  });

  // 2. Student progress records
  (data.studentProgress || []).forEach((sp) => {
    if (sp.courseId === courseId || sp.courseId === courseSlug) {
      if (sp.userId) studentUserIds.add(sp.userId);
    }
  });

  // 3. Successful payments
  (data.payments || []).forEach((pay) => {
    if (
      (pay.courseId === courseId || pay.courseId === courseSlug) &&
      (pay.status === 'SUCCESS' || pay.status === 'COMPLETED' || pay.status === 'PAID')
    ) {
      if (pay.userId) studentUserIds.add(pay.userId);
      if (pay.userEmail) {
        const userObj = (data.users || []).find((u) => u.email && u.email.toLowerCase() === pay.userEmail.toLowerCase());
        if (userObj) studentUserIds.add(userObj.id);
      }
    }
  });

  // 4. User accounts with explicit enrolled courses
  (data.users || []).forEach((u) => {
    if (u.role === 'USER' || u.role === 'STUDENT' || !u.role) {
      if (
        (Array.isArray(u.enrolledCourses) && (u.enrolledCourses.includes(courseId) || u.enrolledCourses.includes(courseSlug))) ||
        (Array.isArray(u.purchasedCourses) && (u.purchasedCourses.includes(courseId) || u.purchasedCourses.includes(courseSlug))) ||
        u.courseId === courseId ||
        u.courseId === courseSlug
      ) {
        studentUserIds.add(u.id);
      }
    }
  });

  // Resolve user IDs to student objects
  studentUserIds.forEach((uid) => {
    const userObj = (data.users || []).find((u) => u.id === uid);
    if (userObj) {
      addStudent(userObj.id, userObj.name, userObj.email);
    } else {
      const app = (data.applications || []).find((a) => a.userId === uid);
      if (app) {
        addStudent(
          uid,
          app.userName || app.formData?.fullName || 'Student',
          app.userEmail || app.formData?.email || null
        );
      }
    }
  });

  return Array.from(studentsMap.values());
}

// Multer Disk Storage Configuration for Secure Local Video Uploads
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'videos');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    const safeName = 'vid_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex') + ext;
    cb(null, safeName);
  },
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB maximum video size
  fileFilter: (req, file, cb) => {
    const allowedMime = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-matroska'];
    const hasValidExt = file.originalname.match(/\.(mp4|webm|mov|mkv|ogg)$/i);
    if (allowedMime.includes(file.mimetype) || hasValidExt) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Supported formats: MP4, WebM, MOV, MKV.'));
    }
  },
});

// ===================================================================
// 0. STAFF PROFILE & CREDENTIAL MANAGEMENT
// ===================================================================

// Get Staff Member Profile with Allotted Courses
router.get('/profile', (req, res) => {
  try {
    const staffUser = req.user;
    const user = (db.raw.users || []).find((u) => u.id === staffUser.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const { passwordHash: _, salt: __, ...safeProfile } = user;

    // Get courses allotted to this staff member
    const allotments = (db.raw.staffCourseAllotments || [])
      .filter((a) => a.staffId === staffUser.id && a.status === 'ACTIVE')
      .map((a) => {
        const course = (db.raw.courses || []).find((c) => c.id === a.courseId);
        return {
          id: a.id,
          courseId: a.courseId,
          courseTitle: course ? course.title : 'Course',
          courseCategory: course ? course.category : '',
          assignedAt: a.assignedAt,
          status: a.status,
        };
      });

    return res.json({
      success: true,
      profile: {
        ...safeProfile,
        allottedCourses: allotments,
        allottedCourseCount: allotments.length,
      },
    });
  } catch (err) {
    console.error('Fetch staff profile error:', err);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// Update Permitted Staff Profile Details (Cannot modify role, email or permissions)
router.put('/profile', async (req, res) => {
  try {
    const staffUser = req.user;
    const { name, mobile, institution, degree, avatar } = req.body;

    const user = (db.raw.users || []).find((u) => u.id === staffUser.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const now = new Date().toISOString();
    let updatedProfile;

    await db.transaction((data) => {
      const u = (data.users || []).find((x) => x.id === staffUser.id);
      if (u) {
        if (name && name.trim()) u.name = name.trim();
        if (mobile !== undefined) u.mobile = mobile ? mobile.trim() : '';
        if (institution !== undefined) u.institution = institution ? institution.trim() : '';
        if (degree !== undefined) u.degree = degree ? degree.trim() : '';
        if (avatar !== undefined) u.avatar = avatar ? avatar.trim() : u.avatar;
        u.updatedAt = now;
        updatedProfile = u;
      }
    });

    const { passwordHash: _, salt: __, ...safeUser } = updatedProfile;
    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: safeUser,
    });
  } catch (err) {
    console.error('Update staff profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Secure Staff Password Change
router.post('/profile/change-password', async (req, res) => {
  try {
    const staffUser = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const user = (db.raw.users || []).find((u) => u.id === staffUser.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const isCurrentValid = verifyPassword(currentPassword, user.passwordHash, user.salt);
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Incorrect current password.' });
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    const { hash: newHash } = hashPassword(newPassword, newSalt);
    const now = new Date().toISOString();

    await db.transaction((data) => {
      const u = (data.users || []).find((x) => x.id === staffUser.id);
      if (u) {
        u.passwordHash = newHash;
        u.salt = newSalt;
        u.updatedAt = now;
      }
    });

    // Destroy other sessions
    await destroyAllUserSessions(staffUser.id);

    return res.json({
      success: true,
      message: 'Password changed successfully. Please keep your credentials secure.',
    });
  } catch (err) {
    console.error('Staff password change error:', err);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

// ===================================================================
// 1. Staff Executive Overview & Metrics (Filtered to Allotted Courses)
// ===================================================================
router.get('/overview', (req, res) => {
  try {
    const staffUser = req.user;
    const allCourses = db.raw.courses || [];
    const applications = db.raw.applications || [];
    const users = db.raw.users || [];

    // Filter to courses allotted to this staff member
    const allottedCourseIds = staffUser.role === 'ADMIN'
      ? null
      : (db.raw.staffCourseAllotments || [])
          .filter((a) => a.staffId === staffUser.id && a.status === 'ACTIVE')
          .map((a) => a.courseId);

    const staffCourses = allottedCourseIds === null
      ? allCourses
      : allCourses.filter((c) => allottedCourseIds.includes(c.id));

    const staffCourseIdSet = new Set(staffCourses.map((c) => c.id));

    // Filter applications and enrolled students to staff courses
    const relevantApplications = applications.filter((a) => staffCourseIdSet.has(a.courseId));
    const enrolledStudents = users.filter((u) => u.role === 'USER' && u.isActive);
    const pendingReviews = relevantApplications.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW');
    const confirmedAdmissions = relevantApplications.filter((a) => a.status === 'CONFIRMED' || a.status === 'APPROVED');

    const totalSeatsCapacity = staffCourses.reduce((sum, c) => sum + (c.capacity || 40), 0);
    const totalFilledSeats = staffCourses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);

    return res.json({
      success: true,
      staff: staffUser,
      hasAllottedCourses: staffCourses.length > 0,
      metrics: {
        totalAssignedCourses: staffCourses.length,
        totalEnrolledStudents: enrolledStudents.length,
        pendingEvaluationsCount: pendingReviews.length,
        confirmedAdmissionsCount: confirmedAdmissions.length,
        totalSeatsCapacity,
        totalFilledSeats,
      },
      assignedCourses: staffCourses.slice(0, 4),
      recentApplications: relevantApplications.slice(0, 5),
    });
  } catch (err) {
    console.error('Staff overview error:', err);
    return res.status(500).json({ error: 'Failed to retrieve staff overview.' });
  }
});

// 2. Staff Course List (Strictly Allotted Courses Only)
router.get('/courses', (req, res) => {
  try {
    const staffUser = req.user;
    const allCourses = db.raw.courses || [];

    const allottedCourseIds = staffUser.role === 'ADMIN'
      ? null
      : (db.raw.staffCourseAllotments || [])
          .filter((a) => a.staffId === staffUser.id && a.status === 'ACTIVE')
          .map((a) => a.courseId);

    const courses = allottedCourseIds === null
      ? allCourses
      : allCourses.filter((c) => allottedCourseIds.includes(c.id));

    return res.json({
      success: true,
      courses,
      hasAllottedCourses: courses.length > 0,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load courses.' });
  }
});

// 2a. Create New Course (Auto-allots to creator)
router.post('/courses', async (req, res) => {
  try {
    const staffUser = req.user;
    const {
      title,
      category = 'Engineering',
      duration = '10 Days',
      dailyReleaseTime = '09:00',
      shortDescription = '',
      price = 0,
      capacity = 40,
      instructor,
      bannerImage = '',
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Course title is required.' });
    }

    const courseId = 'crs_' + crypto.randomBytes(6).toString('hex');
    const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const now = new Date().toISOString();

    const newCourse = {
      id: courseId,
      slug: slug || courseId,
      title: title.trim(),
      category: (category || 'Engineering').trim(),
      duration: (duration || '10 Days').trim(),
      dailyReleaseTime: (dailyReleaseTime || '09:00').trim(),
      shortDescription: (shortDescription || '').trim(),
      description: (shortDescription || '').trim(),
      isFree: Boolean(req.body.isFree || Number(price) === 0),
      price: req.body.isFree || Number(price) === 0 ? 0 : (Number(price) || 0),
      capacity: Number(capacity) || 40,
      enrolledCount: 0,
      instructor: (instructor || staffUser.name || 'Claxic Faculty').trim(),
      instructorRole: 'Lead Faculty',
      bannerImage: (bannerImage || '').trim() || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      classes: [],
      createdAt: now,
      updatedAt: now,
      createdBy: staffUser.name,
    };

    await db.transaction((data) => {
      if (!data.courses) data.courses = [];
      data.courses.push(newCourse);

      // Automatically allot created course to this staff member
      if (!data.staffCourseAllotments) data.staffCourseAllotments = [];
      data.staffCourseAllotments.push({
        id: 'allot_' + crypto.randomBytes(6).toString('hex'),
        staffId: staffUser.id,
        courseId: newCourse.id,
        assignedBy: staffUser.id,
        assignedAt: now,
        updatedAt: now,
        status: 'ACTIVE',
      });
    });

    return res.status(201).json({
      success: true,
      message: 'Course created and allotted to your profile successfully.',
      course: newCourse,
    });
  } catch (err) {
    console.error('Create course error:', err);
    return res.status(500).json({ error: 'Failed to create course.' });
  }
});

// 2b. Update Course Settings (Duration, Daily Release Time, etc.)
router.put('/courses/:courseId', async (req, res) => {
  try {
    const staffUser = req.user;
    const { courseId } = req.params;

    if (!isStaffAllotted(staffUser.id, courseId, staffUser.role)) {
      return res.status(403).json({ error: 'Access denied. You are not allotted to manage this course.' });
    }

    const {
      title,
      category,
      duration,
      dailyReleaseTime,
      shortDescription,
      price,
      capacity,
      instructor,
      bannerImage,
      status,
    } = req.body;

    let updatedCourse;
    const now = new Date().toISOString();

    await db.transaction((data) => {
      const c = data.courses.find((item) => item.id === courseId || item.slug === courseId);
      if (c) {
        if (title !== undefined) c.title = title.trim();
        if (category !== undefined) c.category = category.trim();
        if (duration !== undefined) c.duration = duration.trim();
        if (dailyReleaseTime !== undefined) c.dailyReleaseTime = dailyReleaseTime.trim() || '09:00';
        if (shortDescription !== undefined) {
          c.shortDescription = shortDescription.trim();
          c.description = shortDescription.trim();
        }
        if (req.body.isFree !== undefined) c.isFree = Boolean(req.body.isFree);
        else if (price !== undefined) c.isFree = Number(price) === 0;
        if (c.isFree) c.price = 0;
        else if (price !== undefined) c.price = Number(price) || 0;
        if (capacity !== undefined) c.capacity = Number(capacity) || 40;
        if (instructor !== undefined) c.instructor = instructor.trim();
        if (bannerImage !== undefined) c.bannerImage = bannerImage.trim();
        if (status !== undefined) c.status = status;
        c.updatedAt = now;
        c.lastEditedBy = staffUser.name;
        updatedCourse = c;
      }
    });

    if (!updatedCourse) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    return res.json({
      success: true,
      message: 'Course updated successfully.',
      course: updatedCourse,
    });
  } catch (err) {
    console.error('Update course error:', err);
    return res.status(500).json({ error: 'Failed to update course.' });
  }
});

// 2c. Get Students Applied for Specific Course
router.get('/courses/:courseId/applications', (req, res) => {
  try {
    const { courseId } = req.params;
    if (!isStaffAllotted(req.user.id, courseId, req.user.role)) {
      return res.status(403).json({ error: 'Access denied. You are not allotted to view this course.' });
    }
    const applications = (db.raw.applications || []).filter((a) => a.courseId === courseId);
    const users = db.raw.users || [];

    const enriched = applications.map((app) => {
      const user = users.find((u) => u.id === app.userId);
      return {
        ...app,
        studentName: app.userName || user?.name || 'Applicant',
        studentEmail: app.userEmail || user?.email || '',
        studentPhone: app.phone || user?.phone || '',
        avatar: user?.avatar || '',
      };
    });

    return res.json({ success: true, applications: enriched });
  } catch (err) {
    console.error('Fetch course applications error:', err);
    return res.status(500).json({ error: 'Failed to retrieve course applications.' });
  }
});

// 3. Staff Applications / Candidate Review Pipeline
router.get('/applications', (req, res) => {
  try {
    const applications = db.raw.applications || [];
    return res.json({ success: true, applications });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load applications.' });
  }
});

// 4. Staff Evaluation & Notes on Candidate
router.post('/applications/:id/evaluate', async (req, res) => {
  try {
    const staffUser = req.user;
    const { id } = req.params;
    const { staffNotes, interviewScore, recommendation, newStatus } = req.body;

    const application = db.raw.applications.find((a) => a.id === id);
    if (!application) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    const now = new Date().toISOString();
    let updatedApp;

    await db.transaction((data) => {
      const app = data.applications.find((a) => a.id === id);
      if (app) {
        if (staffNotes !== undefined) app.staffNotes = staffNotes;
        if (interviewScore !== undefined) app.interviewScore = interviewScore;
        if (recommendation !== undefined) app.recommendation = recommendation;
        if (newStatus && ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CONFIRMED'].includes(newStatus)) {
          app.status = newStatus;
        }
        app.evaluatedBy = staffUser.name;
        app.evaluatedAt = now;
        app.updatedAt = now;
        updatedApp = app;
      }
    });

    return res.json({
      success: true,
      message: 'Evaluation saved successfully.',
      application: updatedApp,
    });
  } catch (err) {
    console.error('Evaluation error:', err);
    return res.status(500).json({ error: 'Failed to save candidate evaluation.' });
  }
});

// Quick Update Application Status for Staff
router.patch('/applications/:id/status', async (req, res) => {
  try {
    const staffUser = req.user;
    const { id } = req.params;
    const { status, adminNotes, staffNotes, reviewNotes } = req.body;

    const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CONFIRMED', 'REJECTED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid application status provided.' });
    }

    const application = db.raw.applications.find((a) => a.id === id);
    if (!application) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    const notes = staffNotes || adminNotes || reviewNotes || '';
    const now = new Date().toISOString();
    let updatedApp = null;

    await db.transaction((data) => {
      const app = data.applications.find((a) => a.id === id);
      if (app) {
        const prevStatus = app.status;
        app.status = status;
        if (notes) {
          app.staffNotes = notes;
          app.reviewNotes = notes;
        }
        app.evaluatedBy = staffUser.name;
        app.evaluatedAt = now;
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

// 5. Staff Student Roster
router.get('/students', (req, res) => {
  try {
    const users = (db.raw.users || []).filter((u) => u.role === 'USER');
    const safeUsers = users.map(({ passwordHash, salt, ...safe }) => safe);
    return res.json({ success: true, students: safeUsers });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load student roster.' });
  }
});

// 6. Post Staff Cohort Announcement
router.post('/announcements', async (req, res) => {
  try {
    const staffUser = req.user;
    const { title, content, courseId, priority = 'NORMAL' } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const now = new Date().toISOString();
    const newAnnouncement = {
      id: 'ann_' + Math.random().toString(36).substring(2, 9),
      authorId: staffUser.id,
      authorName: staffUser.name,
      authorRole: 'STAFF',
      title: title.trim(),
      content: content.trim(),
      courseId: courseId || 'ALL',
      priority,
      createdAt: now,
    };

    await db.transaction((data) => {
      if (!data.announcements) data.announcements = [];
      data.announcements.unshift(newAnnouncement);

      // Targeted Notification to Students
      if (!data.notifications) data.notifications = [];
      let targetStudentIds = [];
      if (courseId && courseId !== 'ALL') {
        targetStudentIds = Array.from(
          new Set([
            ...(data.applications || [])
              .filter((a) => a.courseId === courseId && (a.status === 'CONFIRMED' || a.status === 'APPROVED'))
              .map((a) => a.userId),
            ...(data.studentProgress || [])
              .filter((p) => p.courseId === courseId)
              .map((p) => p.userId),
          ])
        ).filter(Boolean);
      } else {
        targetStudentIds = (data.users || [])
          .filter((u) => u.role === 'USER' && u.isActive !== false)
          .map((u) => u.id);
      }

      for (const studentId of targetStudentIds) {
        data.notifications.unshift({
          id: 'notif_ann_' + Math.random().toString(36).substring(2, 9),
          userId: studentId,
          title: `📢 Faculty Notice: ${title.trim()}`,
          message: content.trim(),
          type: priority === 'HIGH' ? 'urgent' : 'info',
          link: '/student/learning',
          meta: {
            authorName: staffUser.name,
            priority,
            courseId: courseId || 'ALL',
            badge: priority === 'HIGH' ? 'URGENT NOTICE' : 'FACULTY ANNOUNCEMENT',
          },
          isRead: false,
          createdAt: now,
        });
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Announcement broadcasted successfully.',
      announcement: newAnnouncement,
    });
  } catch (err) {
    console.error('Announcement error:', err);
    return res.status(500).json({ error: 'Failed to post announcement.' });
  }
});

// 7. Get Cohort Announcements
router.get('/announcements', (req, res) => {
  try {
    const rawList = db.raw.announcements || [];
    const sorted = [...rawList].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return res.json({ success: true, announcements: sorted });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load announcements.' });
  }
});

// Helper: Seed sample classes if empty
const getInitialSampleClasses = (courseId) => [
  {
    id: `cls_${courseId}_1`,
    classNumber: 1,
    title: 'Class 1: Course Overview, Prerequisites & Workspace Setup',
    description: 'Welcome and full architectural overview. Walkthrough of dev environment setup, Docker configuration, and initial codebase walkthrough.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: '1 hr 15 mins',
    resourcesUrl: 'https://github.com/claxic-academy/lecture-notes-class-1',
    status: 'PUBLISHED',
    uploadedAt: '2026-08-25T10:00:00.000Z',
  },
  {
    id: `cls_${courseId}_2`,
    classNumber: 2,
    title: 'Class 2: Deep Dive into Distributed Systems & State Contracts',
    description: 'Comprehensive analysis of state consistency, RPC models, database indexing, and event queues in production microservices.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: '1 hr 30 mins',
    resourcesUrl: 'https://github.com/claxic-academy/lecture-notes-class-2',
    status: 'PUBLISHED',
    uploadedAt: '2026-08-28T10:00:00.000Z',
  },
  {
    id: `cls_${courseId}_3`,
    classNumber: 3,
    title: 'Class 3: Advanced Real-Time Protocols & Production Deployment',
    description: 'Hands-on lab: building WebSocket synchronization, error handling, rate limiting, and zero-downtime CI/CD container pipelines.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: '1 hr 45 mins',
    resourcesUrl: 'https://github.com/claxic-academy/lecture-notes-class-3',
    status: 'PUBLISHED',
    uploadedAt: '2026-09-01T10:00:00.000Z',
  },
];

// 8. Get Classes / Episodes for Course
router.get('/courses/:courseId/classes', async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!isStaffAllotted(req.user.id, courseId, req.user.role)) {
      return res.status(403).json({ error: 'Access denied. You are not allotted to manage this course.' });
    }

    const course = db.raw.courses.find((c) => c.id === courseId || c.slug === courseId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    if (!course.classes || course.classes.length === 0) {
      const initialClasses = getInitialSampleClasses(course.id);
      await db.transaction((data) => {
        const c = data.courses.find((item) => item.id === course.id);
        if (c) {
          c.classes = initialClasses;
        }
      });
      return res.json({ success: true, courseId: course.id, classes: initialClasses });
    }

    return res.json({ success: true, courseId: course.id, classes: course.classes });
  } catch (err) {
    console.error('Fetch classes error:', err);
    return res.status(500).json({ error: 'Failed to retrieve course classes.' });
  }
});

// 9. Upload / Add New Class with Topics, Summary, Materials, and Test
router.post('/courses/:courseId/classes', async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!isStaffAllotted(req.user.id, courseId, req.user.role)) {
      return res.status(403).json({ error: 'Access denied. You are not allotted to manage this course.' });
    }

    const {
      classNumber,
      dayNumber,
      title,
      description,
      videoUrl,
      duration = '1 hr 30 mins',
      resourcesUrl = '',
      topics = [],
      summary = '',
      learningMaterials = [],
      test = null,
      status = 'PUBLISHED',
      deliveryType = 'UPLOAD',
      liveMeetingUrl = '',
      liveMeetingTime = '',
      liveMeetingInstructions = '',
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Class title is required.' });
    }

    const course = db.raw.courses.find((c) => c.id === courseId || c.slug === courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const parsedTopics = Array.isArray(topics)
      ? topics.map((t) => String(t).trim()).filter(Boolean)
      : typeof topics === 'string'
      ? topics.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const now = new Date().toISOString();
    let createdClass;
    let enrolledStudentsToNotify = [];

    await db.transaction((data) => {
      const c = data.courses.find((item) => item.id === course.id);
      if (c) {
        if (!c.classes) c.classes = [];
        const nextNum = parseInt(dayNumber || classNumber || (c.classes.length + 1), 10);
        createdClass = {
          id: `cls_${c.id}_${Date.now()}`,
          classNumber: nextNum,
          dayNumber: nextNum,
          title: title.trim(),
          description: (description || '').trim(),
          videoUrl: (videoUrl || '').trim(),
          duration: (duration || '1 hr 30 mins').trim(),
          resourcesUrl: (resourcesUrl || '').trim(),
          topics: parsedTopics,
          summary: (summary || '').trim(),
          learningMaterials: Array.isArray(learningMaterials) ? learningMaterials : [],
          test: test && typeof test === 'object' ? test : null,
          status: status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
          deliveryType: deliveryType === 'ONLINE' ? 'ONLINE' : 'UPLOAD',
          liveMeetingUrl: (liveMeetingUrl || '').trim(),
          liveMeetingTime: (liveMeetingTime || '').trim(),
          liveMeetingInstructions: (liveMeetingInstructions || '').trim(),
          uploadedAt: now,
          uploadedBy: req.user.name,
        };
        c.classes.push(createdClass);
        // Sort sequentially by dayNumber
        c.classes.sort((a, b) => (a.dayNumber || a.classNumber || 0) - (b.dayNumber || b.classNumber || 0));

        // Targeted Notification: Only students enrolled in this specific course
        if (!data.notifications) data.notifications = [];
        enrolledStudentsToNotify = getEnrolledStudentsForCourse(course, data);

        const isOnline = createdClass.deliveryType === 'ONLINE';
        const notifTitle = isOnline
          ? `🔴 Live Class: Day ${nextNum} - ${title.trim()}`
          : `🎬 New Class Uploaded: Day ${nextNum} - ${title.trim()}`;
        const notifMsg = isOnline
          ? `Live class scheduled for "${course.title}" by ${req.user.name || 'Faculty'}.${createdClass.liveMeetingTime ? ` Scheduled at ${createdClass.liveMeetingTime}.` : ''} Join via your Student Portal.`
          : `Day ${nextNum} class "${title.trim()}" has been uploaded for "${course.title}". Duration: ${duration || '1 hr 30 mins'}. Topics: ${parsedTopics.slice(0, 3).join(', ') || 'Curriculum core'}.`;

        for (const student of enrolledStudentsToNotify) {
          data.notifications.unshift({
            id: 'notif_class_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
            userId: student.id,
            userEmail: student.email,
            title: notifTitle,
            message: notifMsg,
            type: 'CREATIVE_CLASS',
            link: '/student',
            meta: {
              courseId: course.id,
              courseTitle: course.title,
              dayNumber: nextNum,
              classTitle: title.trim(),
              duration: duration || '1 hr 30 mins',
              topics: parsedTopics,
              deliveryType: createdClass.deliveryType,
              liveMeetingUrl: createdClass.liveMeetingUrl,
              liveMeetingTime: createdClass.liveMeetingTime,
              liveMeetingInstructions: createdClass.liveMeetingInstructions,
              instructorName: req.user.name,
              authorName: req.user.name,
              badge: isOnline ? 'LIVE ONLINE CLASS' : 'CLASS LESSON',
              actionLabel: isOnline ? 'Join Online Class' : 'Watch Class',
              hasNotes: (createdClass.learningMaterials && createdClass.learningMaterials.length > 0) || !!resourcesUrl,
            },
            isRead: false,
            createdAt: now,
          });
        }
      }
    });

    // Send email notifications to all enrolled students asynchronously
    const isOnline = createdClass.deliveryType === 'ONLINE';
    const emailSubject = isOnline
      ? `🔴 Live Class Alert: Day ${createdClass.dayNumber} - ${createdClass.title} (${course.title})`
      : `🎬 New Class Uploaded: Day ${createdClass.dayNumber} - ${createdClass.title} (${course.title})`;

    for (const student of enrolledStudentsToNotify) {
      if (student.email) {
        sendEmail(
          student.email,
          emailSubject,
          'CLASS_UPLOADED',
          {
            name: student.name || 'Student',
            studentName: student.name || 'Student',
            courseTitle: course.title,
            courseId: course.id,
            dayNumber: createdClass.dayNumber,
            classTitle: createdClass.title,
            deliveryType: createdClass.deliveryType,
            duration: createdClass.duration || '1 hr 30 mins',
            topics: createdClass.topics,
            instructorName: req.user.name,
            liveMeetingUrl: createdClass.liveMeetingUrl,
            liveMeetingTime: createdClass.liveMeetingTime,
            liveMeetingInstructions: createdClass.liveMeetingInstructions,
            hasNotes: (createdClass.learningMaterials && createdClass.learningMaterials.length > 0) || !!createdClass.resourcesUrl,
            actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student`,
          }
        ).catch((err) => {
          console.error(`[Class Upload Email] Failed to notify ${student.email}:`, err.message);
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Class uploaded successfully with curriculum content and enrolled students notified.',
      class: createdClass,
    });
  } catch (err) {
    console.error('Upload class error:', err);
    return res.status(500).json({ error: 'Failed to upload class.' });
  }
});

// 10. Update Class Episode (including Post-Class Summary, What Was Taught, Materials & Tests)
router.put('/courses/:courseId/classes/:classId', async (req, res) => {
  try {
    const { courseId, classId } = req.params;
    if (!isStaffAllotted(req.user.id, courseId, req.user.role)) {
      return res.status(403).json({ error: 'Access denied. You are not allotted to manage this course.' });
    }

    const {
      classNumber,
      dayNumber,
      title,
      description,
      videoUrl,
      duration,
      resourcesUrl,
      topics,
      summary,
      learningMaterials,
      test,
      status,
      deliveryType,
      liveMeetingUrl,
      liveMeetingTime,
      liveMeetingInstructions,
    } = req.body;

    let updatedClass;
    let enrolledStudentsToNotifyOnUpdate = [];
    let courseTitleForEmail = '';

    await db.transaction((data) => {
      const c = data.courses.find((item) => item.id === courseId || item.slug === courseId);
      if (c && c.classes) {
        const cls = c.classes.find((item) => item.id === classId);
        if (cls) {
          if (dayNumber !== undefined || classNumber !== undefined) {
            const num = parseInt(dayNumber !== undefined ? dayNumber : classNumber, 10);
            cls.classNumber = num;
            cls.dayNumber = num;
          }
          if (title !== undefined) cls.title = title.trim();
          if (description !== undefined) cls.description = description.trim();
          if (videoUrl !== undefined) cls.videoUrl = videoUrl.trim();
          if (duration !== undefined) cls.duration = duration.trim();
          if (resourcesUrl !== undefined) cls.resourcesUrl = resourcesUrl.trim();
          if (topics !== undefined) {
            cls.topics = Array.isArray(topics)
              ? topics.map((t) => String(t).trim()).filter(Boolean)
              : typeof topics === 'string'
              ? topics.split(',').map((t) => t.trim()).filter(Boolean)
              : [];
          }
          if (summary !== undefined) cls.summary = summary.trim();
          if (learningMaterials !== undefined) {
            cls.learningMaterials = Array.isArray(learningMaterials) ? learningMaterials : [];
          }
          if (deliveryType !== undefined) {
            cls.deliveryType = deliveryType === 'ONLINE' ? 'ONLINE' : 'UPLOAD';
          }
          if (liveMeetingUrl !== undefined) {
            cls.liveMeetingUrl = liveMeetingUrl.trim();
          }
          if (liveMeetingTime !== undefined) {
            cls.liveMeetingTime = liveMeetingTime.trim();
          }
          if (liveMeetingInstructions !== undefined) {
            cls.liveMeetingInstructions = liveMeetingInstructions.trim();
          }
          if (test !== undefined) {
            cls.test = test && typeof test === 'object' ? test : null;
          }
          if (status !== undefined) cls.status = status;
          cls.updatedAt = new Date().toISOString();
          cls.lastEditedBy = req.user.name;
          updatedClass = cls;

          // Re-sort after updating dayNumber
          c.classes.sort((a, b) => (a.dayNumber || a.classNumber || 0) - (b.dayNumber || b.classNumber || 0));

          // Targeted Notification: Notify enrolled students about class updates
          if (!data.notifications) data.notifications = [];
          enrolledStudentsToNotifyOnUpdate = getEnrolledStudentsForCourse(c, data);
          courseTitleForEmail = c.title;

          const isOnline = updatedClass.deliveryType === 'ONLINE';
          const notifTitle = isOnline
            ? `🔴 Live Class Update: Day ${updatedClass.dayNumber || updatedClass.classNumber} - ${updatedClass.title}`
            : `📝 Class Updated: Day ${updatedClass.dayNumber || updatedClass.classNumber} - ${updatedClass.title}`;
          const notifMsg = `Updates published for Day ${updatedClass.dayNumber || updatedClass.classNumber} of "${c.title}" by ${req.user.name || 'Faculty'}.${updatedClass.liveMeetingTime ? ` Meeting time: ${updatedClass.liveMeetingTime}.` : ''} Check your Student Portal for latest notes and link.`;

          for (const student of enrolledStudentsToNotifyOnUpdate) {
            data.notifications.unshift({
              id: 'notif_class_upd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
              userId: student.id,
              userEmail: student.email,
              title: notifTitle,
              message: notifMsg,
              type: 'CREATIVE_CLASS',
              link: '/student',
              meta: {
                courseId: c.id,
                courseTitle: c.title,
                dayNumber: updatedClass.dayNumber || updatedClass.classNumber,
                classTitle: updatedClass.title,
                duration: updatedClass.duration,
                topics: updatedClass.topics,
                deliveryType: updatedClass.deliveryType,
                liveMeetingUrl: updatedClass.liveMeetingUrl,
                liveMeetingTime: updatedClass.liveMeetingTime,
                instructorName: req.user.name,
                authorName: req.user.name,
                badge: isOnline ? 'LIVE CLASS UPDATED' : 'CLASS UPDATED',
                actionLabel: isOnline ? 'Join Live Class' : 'Open Lesson',
                hasNotes: (updatedClass.learningMaterials && updatedClass.learningMaterials.length > 0) || !!updatedClass.resourcesUrl,
              },
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    });

    if (!updatedClass) {
      return res.status(404).json({ error: 'Class episode not found.' });
    }

    // Asynchronously dispatch email alerts to enrolled students
    for (const student of enrolledStudentsToNotifyOnUpdate) {
      if (student.email) {
        sendEmail(
          student.email,
          `📝 Class Updated: Day ${updatedClass.dayNumber || updatedClass.classNumber} - ${updatedClass.title} (${courseTitleForEmail})`,
          'CLASS_UPLOADED',
          {
            name: student.name || 'Student',
            studentName: student.name || 'Student',
            courseTitle: courseTitleForEmail,
            courseId: courseId,
            dayNumber: updatedClass.dayNumber || updatedClass.classNumber,
            classTitle: updatedClass.title,
            deliveryType: updatedClass.deliveryType,
            duration: updatedClass.duration || '1 hr 30 mins',
            topics: updatedClass.topics,
            instructorName: req.user.name,
            liveMeetingUrl: updatedClass.liveMeetingUrl,
            liveMeetingTime: updatedClass.liveMeetingTime,
            liveMeetingInstructions: updatedClass.liveMeetingInstructions,
            hasNotes: (updatedClass.learningMaterials && updatedClass.learningMaterials.length > 0) || !!updatedClass.resourcesUrl,
            actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student`,
          }
        ).catch((err) => {
          console.error(`[Class Update Email] Failed to notify ${student.email}:`, err.message);
        });
      }
    }

    return res.json({
      success: true,
      message: 'Class content and summary updated successfully.',
      class: updatedClass,
    });
  } catch (err) {
    console.error('Update class error:', err);
    return res.status(500).json({ error: 'Failed to update class.' });
  }
});

// 10b. Local Video Upload for Class Lesson (Multer storage into uploads/videos/)
router.post('/courses/:courseId/classes/:classId/video', uploadVideo.single('video'), async (req, res) => {
  try {
    const { courseId, classId } = req.params;
    if (!isStaffAllotted(req.user.id, courseId, req.user.role)) {
      return res.status(403).json({ error: 'Access denied. You are not allotted to manage this course.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded. Please select a valid video file (MP4, WebM, MOV, MKV).' });
    }

    const course = db.raw.courses.find((c) => c.id === courseId || c.slug === courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const cls = (course.classes || []).find((c) => c.id === classId);
    if (!cls) {
      return res.status(404).json({ error: 'Class episode not found.' });
    }

    const now = new Date().toISOString();
    const videoId = 'vid_' + crypto.randomBytes(8).toString('hex');

    const videoRecord = {
      id: videoId,
      courseId: course.id,
      classId: cls.id,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      filePath: req.file.path,
      fileSizeBytes: req.file.size,
      mimeType: req.file.mimetype,
      durationSeconds: req.body.durationSeconds ? parseInt(req.body.durationSeconds, 10) : 0,
      uploadedBy: req.user.id,
      createdAt: now,
      updatedAt: now,
    };

    let updatedClass;

    await db.transaction((data) => {
      if (!data.lessonVideos) data.lessonVideos = [];
      data.lessonVideos.push(videoRecord);

      const c = data.courses.find((item) => item.id === course.id);
      if (c && c.classes) {
        const targetClass = c.classes.find((item) => item.id === classId);
        if (targetClass) {
          targetClass.videoId = videoRecord.id;
          targetClass.videoOriginalName = videoRecord.originalName;
          targetClass.videoStoredName = videoRecord.storedName;
          targetClass.videoSizeBytes = videoRecord.fileSizeBytes;
          targetClass.videoMimeType = videoRecord.mimeType;
          targetClass.videoPath = `/api/learning/courses/${course.id}/classes/${cls.id}/video-stream`;
          targetClass.hasLocalVideo = true;
          // Clear external video URL as per requirements
          targetClass.videoUrl = '';
          targetClass.videoUploadedAt = now;
          targetClass.updatedAt = now;
          updatedClass = targetClass;

          // Targeted Notification: Video ready for streaming
          if (!data.notifications) data.notifications = [];
          const enrolledStudents = getEnrolledStudentsForCourse(course, data);
          const dayNum = targetClass.dayNumber || targetClass.classNumber || 1;

          for (const student of enrolledStudents) {
            data.notifications.unshift({
              id: 'notif_vid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
              userId: student.id,
              userEmail: student.email,
              title: `🎬 Video Ready: Day ${dayNum} - ${targetClass.title}`,
              message: `High-definition video for "${targetClass.title}" in "${course.title}" has been uploaded and is ready for streaming. Watch it in your Student Portal!`,
              type: 'CREATIVE_CLASS',
              link: '/student',
              meta: {
                courseId: course.id,
                courseTitle: course.title,
                dayNumber: dayNum,
                classTitle: targetClass.title,
                instructorName: req.user.name,
                authorName: req.user.name,
                badge: 'VIDEO READY',
                actionLabel: 'Watch Class Video',
              },
              isRead: false,
              createdAt: now,
            });
          }
        }
      }
    });

    // Send email notifications to all enrolled students for video upload
    if (updatedClass) {
      const dayNum = updatedClass.dayNumber || updatedClass.classNumber || 1;
      const enrolledStudentsToNotify = getEnrolledStudentsForCourse(course, db.raw);
      const emailSubject = `🎬 New Video Lecture Available: Day ${dayNum} - ${updatedClass.title} (${course.title})`;

      for (const student of enrolledStudentsToNotify) {
        if (student.email) {
          sendEmail(
            student.email,
            emailSubject,
            'VIDEO_UPLOADED',
            {
              name: student.name || 'Student',
              studentName: student.name || 'Student',
              courseTitle: course.title,
              courseId: course.id,
              dayNumber: dayNum,
              classTitle: updatedClass.title,
              instructorName: req.user.name,
              actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student`,
            }
          ).catch((err) => {
            console.error(`[Video Upload Email] Failed to notify ${student.email}:`, err.message);
          });
        }
      }
    }

    return res.json({
      success: true,
      message: 'Video uploaded and attached to lesson successfully.',
      video: videoRecord,
      class: updatedClass,
    });
  } catch (err) {
    console.error('Upload video error:', err);
    return res.status(500).json({ error: 'Failed to upload video.' });
  }
});

// 10c. Remove Video from Class Lesson
router.delete('/courses/:courseId/classes/:classId/video', async (req, res) => {
  try {
    const { courseId, classId } = req.params;
    if (!isStaffAllotted(req.user.id, courseId, req.user.role)) {
      return res.status(403).json({ error: 'Access denied. You are not allotted to manage this course.' });
    }

    let updatedClass;
    await db.transaction((data) => {
      const c = data.courses.find((item) => item.id === courseId || item.slug === courseId);
      if (c && c.classes) {
        const cls = c.classes.find((item) => item.id === classId);
        if (cls) {
          cls.videoId = null;
          cls.videoOriginalName = null;
          cls.videoStoredName = null;
          cls.videoSizeBytes = null;
          cls.videoMimeType = null;
          cls.videoPath = null;
          cls.hasLocalVideo = false;
          cls.updatedAt = new Date().toISOString();
          updatedClass = cls;
        }
      }
    });

    if (!updatedClass) {
      return res.status(404).json({ error: 'Class not found.' });
    }

    return res.json({
      success: true,
      message: 'Video detached from lesson successfully.',
      class: updatedClass,
    });
  } catch (err) {
    console.error('Delete video error:', err);
    return res.status(500).json({ error: 'Failed to detach video.' });
  }
});

// 11. Delete Class Episode
router.delete('/courses/:courseId/classes/:classId', async (req, res) => {
  try {
    const { courseId, classId } = req.params;
    if (!isStaffAllotted(req.user.id, courseId, req.user.role)) {
      return res.status(403).json({ error: 'Access denied. You are not allotted to manage this course.' });
    }

    let removed = false;
    await db.transaction((data) => {
      const c = data.courses.find((item) => item.id === courseId || item.slug === courseId);
      if (c && c.classes) {
        const initialLen = c.classes.length;
        c.classes = c.classes.filter((item) => item.id !== classId);
        if (c.classes.length < initialLen) removed = true;
      }
    });

    if (!removed) {
      return res.status(404).json({ error: 'Class episode not found.' });
    }

    return res.json({ success: true, message: 'Class episode deleted successfully.' });
  } catch (err) {
    console.error('Delete class error:', err);
    return res.status(500).json({ error: 'Failed to delete class.' });
  }
});

// 12. Create / Update Class Quiz or Test
router.post('/courses/:courseId/classes/:classId/test', async (req, res) => {
  try {
    const { courseId, classId } = req.params;
    if (!isStaffAllotted(req.user.id, courseId, req.user.role)) {
      return res.status(403).json({ error: 'Access denied. You are not allotted to manage this course.' });
    }
    const { title, passingScore = 70, questions = [] } = req.body;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Test title and at least one question are required.' });
    }

    let updatedClass;

    await db.transaction((data) => {
      const c = data.courses.find((item) => item.id === courseId || item.slug === courseId);
      if (c && c.classes) {
        const cls = c.classes.find((item) => item.id === classId);
        if (cls) {
          cls.test = {
            id: `test_${cls.id}`,
            title: title.trim(),
            passingScore: parseInt(passingScore, 10) || 70,
            questions: questions.map((q, qIdx) => ({
              id: q.id || `q_${qIdx + 1}`,
              question: q.question.trim(),
              options: Array.isArray(q.options) ? q.options : [],
              correctIndex: parseInt(q.correctIndex || 0, 10),
              explanation: (q.explanation || '').trim(),
            })),
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.name,
          };
          updatedClass = cls;
        }
      }
    });

    if (!updatedClass) {
      return res.status(404).json({ error: 'Class not found.' });
    }

    return res.json({
      success: true,
      message: 'Class quiz/test saved successfully.',
      test: updatedClass.test,
    });
  } catch (err) {
    console.error('Save test error:', err);
    return res.status(500).json({ error: 'Failed to save test.' });
  }
});

// 13. Student Progress & Performance Tracking
router.get('/courses/:courseId/students/progress', (req, res) => {
  try {
    const { courseId } = req.params;
    const applications = (db.raw.applications || []).filter(
      (a) => (a.courseId === courseId || courseId === 'ALL') && (a.status === 'CONFIRMED' || a.status === 'APPROVED' || a.status === 'SUBMITTED')
    );

    const course = db.raw.courses.find((c) => c.id === courseId) || null;
    const totalClasses = course?.classes?.length || 5;

    const studentProgressList = applications.map((app) => {
      const user = db.raw.users.find((u) => u.id === app.userId) || {
        id: app.userId,
        name: app.userName,
        email: app.userEmail,
        avatar: '',
      };

      const progress = (db.raw.studentProgress || []).find(
        (sp) => sp.userId === app.userId && sp.courseId === app.courseId
      ) || {
        completedClasses: [],
        testResults: [],
        attendance: [],
        progressPercent: 0,
      };

      const completedCount = progress.completedClasses?.length || 0;
      const progressPercent = totalClasses > 0 ? Math.round((completedCount / totalClasses) * 100) : 0;
      const attendanceCount = progress.attendance?.filter((a) => a.attended)?.length || 0;

      const project = (db.raw.projectSubmissions || []).find(
        (p) => p.userId === app.userId && p.courseId === app.courseId
      ) || null;

      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userAvatar: user.avatar,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        courseId: app.courseId,
        courseTitle: app.courseTitle,
        startDate: app.formData?.startDate || app.createdAt?.split('T')[0] || '2026-09-01',
        completedClassesCount: completedCount,
        totalClasses,
        progressPercent,
        attendanceCount,
        attendanceRecords: progress.attendance || [],
        testResults: progress.testResults || [],
        finalProject: project,
      };
    });

    return res.json({ success: true, students: studentProgressList });
  } catch (err) {
    console.error('Fetch student progress error:', err);
    return res.status(500).json({ error: 'Failed to retrieve student progress.' });
  }
});

// 14. Mark / Toggle Student Attendance
router.post('/courses/:courseId/attendance', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId, classId, attended = true, date } = req.body;

    if (!userId || !classId) {
      return res.status(400).json({ error: 'userId and classId are required.' });
    }

    const todayStr = date || new Date().toISOString().split('T')[0];
    let updatedAttendance;

    await db.transaction((data) => {
      if (!data.studentProgress) data.studentProgress = [];
      let prog = data.studentProgress.find((sp) => sp.userId === userId && sp.courseId === courseId);

      if (!prog) {
        prog = {
          id: 'prog_' + crypto.randomBytes(8).toString('hex'),
          userId,
          courseId,
          startDate: todayStr,
          completedClasses: attended ? [classId] : [],
          testResults: [],
          attendance: [{ classId, date: todayStr, attended: Boolean(attended) }],
          progressPercent: 0,
          updatedAt: new Date().toISOString(),
        };
        data.studentProgress.push(prog);
      } else {
        if (!prog.attendance) prog.attendance = [];
        const existingIdx = prog.attendance.findIndex((att) => att.classId === classId);
        if (existingIdx >= 0) {
          prog.attendance[existingIdx].attended = Boolean(attended);
          prog.attendance[existingIdx].date = todayStr;
        } else {
          prog.attendance.push({ classId, date: todayStr, attended: Boolean(attended) });
        }
        prog.updatedAt = new Date().toISOString();
      }

      updatedAttendance = prog.attendance;
    });

    return res.json({
      success: true,
      message: `Attendance marked for class.`,
      attendance: updatedAttendance,
    });
  } catch (err) {
    console.error('Mark attendance error:', err);
    return res.status(500).json({ error: 'Failed to record attendance.' });
  }
});

// 15. Staff Final Project Reviews Hub
router.get('/projects', (req, res) => {
  try {
    const { courseId, status } = req.query;
    let projects = [...(db.raw.projectSubmissions || [])];

    if (courseId && courseId !== 'ALL') {
      projects = projects.filter((p) => p.courseId === courseId);
    }
    if (status && status !== 'ALL') {
      projects = projects.filter((p) => p.status === status);
    }

    // Sort newest submissions first
    projects.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return res.json({ success: true, projects });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load project submissions.' });
  }
});

// 16. Staff Verify & Review Student Project
router.patch('/projects/:id/review', async (req, res) => {
  try {
    const staffUser = req.user;
    const { id } = req.params;
    const { status, staffFeedback } = req.body;

    if (!status || !['APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'UNDER_REVIEW'].includes(status)) {
      return res.status(400).json({ error: 'Valid review status is required (APPROVED, CHANGES_REQUESTED, REJECTED).' });
    }

    const project = db.raw.projectSubmissions.find((p) => p.id === id);
    if (!project) {
      return res.status(404).json({ error: 'Project submission not found.' });
    }

    const now = new Date().toISOString();
    let updatedProject;

    await db.transaction((data) => {
      const proj = data.projectSubmissions.find((p) => p.id === id);
      if (proj) {
        proj.status = status;
        if (staffFeedback !== undefined) proj.staffFeedback = staffFeedback.trim();
        proj.reviewedBy = staffUser.name;
        proj.reviewedAt = now;
        proj.updatedAt = now;
        updatedProject = proj;

        // Add Notification for Student
        if (!data.notifications) data.notifications = [];
        const statusLabel =
          status === 'APPROVED'
            ? 'Approved & Certified 🎉'
            : status === 'CHANGES_REQUESTED'
            ? 'Action Required: Changes Requested'
            : 'Review Completed';

        data.notifications.unshift({
          id: 'notif_' + Math.random().toString(36).substring(2, 9),
          userId: proj.userId,
          title: `Project Review: ${statusLabel}`,
          message: `Your final project "${proj.projectTitle}" has been reviewed by ${staffUser.name}. Feedback: "${staffFeedback || 'No feedback notes provided.'}"`,
          type: status === 'APPROVED' ? 'success' : 'info',
          link: '/dashboard',
          isRead: false,
          createdAt: now,
        });

        // Add Audit Log
        if (!data.auditLogs) data.auditLogs = [];
        data.auditLogs.unshift({
          id: 'audit_' + Math.random().toString(36).substring(2, 9),
          adminId: staffUser.id,
          adminName: staffUser.name,
          action: 'PROJECT_REVIEWED',
          targetType: 'PROJECT',
          targetId: proj.id,
          targetTitle: `${proj.projectTitle} -> ${status}`,
          createdAt: now,
        });
      }
    });

    return res.json({
      success: true,
      message: `Project status successfully updated to ${status}.`,
      project: updatedProject,
    });
  } catch (err) {
    console.error('Project review error:', err);
    return res.status(500).json({ error: 'Failed to record project review.' });
  }
});

// 12. Staff Doubts Management: Get All Doubts
router.get('/doubts', (req, res) => {
  try {
    const staffUser = req.user;
    const { status, courseId } = req.query;
    let doubts = db.raw.doubts || [];

    // Allotment Guard: Filter to allotted courses if not Admin
    if (staffUser.role !== 'ADMIN') {
      const allottedCourseIds = (db.raw.staffCourseAllotments || [])
        .filter((a) => a.staffId === staffUser.id && a.status === 'ACTIVE')
        .map((a) => a.courseId);
      const matchedCourses = (db.raw.courses || []).filter(
        (c) => allottedCourseIds.includes(c.id) || allottedCourseIds.includes(c.slug)
      );
      const expandedCourseIds = new Set([
        ...allottedCourseIds,
        ...matchedCourses.map((c) => c.id),
        ...matchedCourses.map((c) => c.slug),
      ]);
      doubts = doubts.filter((d) => expandedCourseIds.has(d.courseId));
    }

    if (status && status !== 'ALL') {
      doubts = doubts.filter((d) => d.status === status);
    }
    if (courseId) {
      doubts = doubts.filter((d) => d.courseId === courseId);
    }

    doubts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ success: true, doubts });
  } catch (err) {
    console.error('Staff get doubts error:', err);
    return res.status(500).json({ error: 'Failed to fetch student doubts.' });
  }
});

// 13. Staff Reply / Clarify Doubt
router.post('/doubts/:id/reply', async (req, res) => {
  try {
    const staffUser = req.user;
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ error: 'Clarification reply cannot be empty.' });
    }

    // Check existing doubt and allotment authorization
    const existingDoubt = (db.raw.doubts || []).find((d) => d.id === id);
    if (!existingDoubt) {
      return res.status(404).json({ error: 'Doubt record not found.' });
    }

    if (!isStaffAllotted(staffUser.id, existingDoubt.courseId, staffUser.role)) {
      return res.status(403).json({
        error: 'Access denied: You are not allotted to manage this course.',
      });
    }

    let updatedDoubt = null;
    const now = new Date().toISOString();

    await db.transaction((data) => {
      if (!data.doubts) data.doubts = [];
      const doubt = data.doubts.find((d) => d.id === id);
      if (!doubt) {
        throw new Error('Doubt record not found');
      }

      doubt.reply = reply.trim();
      doubt.repliedBy = `${staffUser.name || 'Faculty Mentor'} (Lead Faculty)`;
      doubt.repliedAt = now;
      doubt.status = 'RESOLVED';
      doubt.updatedAt = now;
      updatedDoubt = doubt;

      // Notify the student
      if (!data.notifications) data.notifications = [];
      data.notifications.unshift({
        id: 'notif_' + Math.random().toString(36).substring(2, 9),
        userId: doubt.studentId,
        title: `Faculty Answered Your Question: ${doubt.classTitle}`,
        message: `${staffUser.name} responded: "${reply.trim().slice(0, 80)}..."`,
        type: 'success',
        link: '/dashboard',
        isRead: false,
        createdAt: now,
      });

      // Audit Log
      if (!data.auditLogs) data.auditLogs = [];
      data.auditLogs.unshift({
        id: 'audit_' + Math.random().toString(36).substring(2, 9),
        adminId: staffUser.id,
        adminName: staffUser.name,
        action: 'DOUBT_RESOLVED',
        targetType: 'DOUBT',
        targetId: doubt.id,
        targetTitle: `Resolved doubt for ${doubt.studentName} (${doubt.classTitle})`,
        createdAt: now,
      });
    });

    return res.json({
      success: true,
      message: 'Faculty clarification recorded and student notified.',
      doubt: updatedDoubt,
    });
  } catch (err) {
    console.error('Staff reply doubt error:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit clarification.' });
  }
});

// 14. Staff Delete / Dismiss Spam Doubt
router.delete('/doubts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.transaction((data) => {
      if (!data.doubts) data.doubts = [];
      data.doubts = data.doubts.filter((d) => d.id !== id);
    });
    return res.json({ success: true, message: 'Doubt removed.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete doubt.' });
  }
});

export default router;
