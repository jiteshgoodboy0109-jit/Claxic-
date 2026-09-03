import express from 'express';
import { db } from '../db/index.js';
import { requireStaff } from '../middleware/index.js';

const router = express.Router();

// Apply requireStaff to all staff routes
router.use(requireStaff);

// 1. Staff Executive Overview & Metrics
router.get('/overview', (req, res) => {
  try {
    const staffUser = req.user;
    const courses = db.raw.courses || [];
    const applications = db.raw.applications || [];
    const users = db.raw.users || [];

    const enrolledStudents = users.filter((u) => u.role === 'USER' && u.isActive);
    const pendingReviews = applications.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW');
    const confirmedAdmissions = applications.filter((a) => a.status === 'CONFIRMED' || a.status === 'APPROVED');

    const totalSeatsCapacity = courses.reduce((sum, c) => sum + (c.capacity || 40), 0);
    const totalFilledSeats = courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);

    return res.json({
      success: true,
      staff: staffUser,
      metrics: {
        totalAssignedCourses: courses.length,
        totalEnrolledStudents: enrolledStudents.length,
        pendingEvaluationsCount: pendingReviews.length,
        confirmedAdmissionsCount: confirmedAdmissions.length,
        totalSeatsCapacity,
        totalFilledSeats,
      },
      assignedCourses: courses.slice(0, 4),
      recentApplications: applications.slice(0, 5),
    });
  } catch (err) {
    console.error('Staff overview error:', err);
    return res.status(500).json({ error: 'Failed to retrieve staff overview.' });
  }
});

// 2. Staff Course List
router.get('/courses', (req, res) => {
  try {
    const courses = db.raw.courses || [];
    return res.json({ success: true, courses });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load courses.' });
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
    const announcements = db.raw.announcements || [
      {
        id: 'ann_welcome',
        authorName: 'Dr. Sarah Jenkins (Staff)',
        authorRole: 'STAFF',
        title: 'Fall Semester Orientation & Lab Access Setup',
        content: 'Welcome students! Please review your module curriculum and confirm your Slack channel access for live office hours.',
        courseId: 'ALL',
        priority: 'HIGH',
        createdAt: '2026-08-28T09:00:00.000Z',
      },
    ];
    return res.json({ success: true, announcements });
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

// 9. Upload / Add New Class or Episode
router.post('/courses/:courseId/classes', async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      classNumber,
      title,
      description,
      videoUrl,
      duration = '60 mins',
      resourcesUrl = '',
      status = 'PUBLISHED',
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Class title is required.' });
    }

    const course = db.raw.courses.find((c) => c.id === courseId || c.slug === courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const now = new Date().toISOString();
    let createdClass;

    await db.transaction((data) => {
      const c = data.courses.find((item) => item.id === course.id);
      if (c) {
        if (!c.classes) c.classes = [];
        const nextNum = classNumber || (c.classes.length + 1);
        createdClass = {
          id: `cls_${c.id}_${Date.now()}`,
          classNumber: parseInt(nextNum, 10),
          title: title.trim(),
          description: (description || '').trim(),
          videoUrl: (videoUrl || '').trim(),
          duration: (duration || '60 mins').trim(),
          resourcesUrl: (resourcesUrl || '').trim(),
          status: status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
          uploadedAt: now,
          uploadedBy: req.user.name,
        };
        c.classes.push(createdClass);
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Class uploaded successfully.',
      class: createdClass,
    });
  } catch (err) {
    console.error('Upload class error:', err);
    return res.status(500).json({ error: 'Failed to upload class.' });
  }
});

// 10. Update Class Episode
router.put('/courses/:courseId/classes/:classId', async (req, res) => {
  try {
    const { courseId, classId } = req.params;
    const { classNumber, title, description, videoUrl, duration, resourcesUrl, status } = req.body;

    let updatedClass;

    await db.transaction((data) => {
      const c = data.courses.find((item) => item.id === courseId || item.slug === courseId);
      if (c && c.classes) {
        const cls = c.classes.find((item) => item.id === classId);
        if (cls) {
          if (classNumber !== undefined) cls.classNumber = parseInt(classNumber, 10);
          if (title !== undefined) cls.title = title.trim();
          if (description !== undefined) cls.description = description.trim();
          if (videoUrl !== undefined) cls.videoUrl = videoUrl.trim();
          if (duration !== undefined) cls.duration = duration.trim();
          if (resourcesUrl !== undefined) cls.resourcesUrl = resourcesUrl.trim();
          if (status !== undefined) cls.status = status;
          cls.updatedAt = new Date().toISOString();
          updatedClass = cls;
        }
      }
    });

    if (!updatedClass) {
      return res.status(404).json({ error: 'Class episode not found.' });
    }

    return res.json({
      success: true,
      message: 'Class episode updated.',
      class: updatedClass,
    });
  } catch (err) {
    console.error('Update class error:', err);
    return res.status(500).json({ error: 'Failed to update class.' });
  }
});

// 11. Delete Class Episode
router.delete('/courses/:courseId/classes/:classId', async (req, res) => {
  try {
    const { courseId, classId } = req.params;

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

export default router;
