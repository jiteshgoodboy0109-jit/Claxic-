import express from 'express';
import crypto from 'crypto';
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

// 2a. Create New Course
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
      price: Number(price) || 0,
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
    });

    return res.status(201).json({
      success: true,
      message: 'Course created successfully.',
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
        if (price !== undefined) c.price = Number(price) || 0;
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

// 9. Upload / Add New Class with Topics, Summary, Materials, and Test
router.post('/courses/:courseId/classes', async (req, res) => {
  try {
    const { courseId } = req.params;
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
          uploadedAt: now,
          uploadedBy: req.user.name,
        };
        c.classes.push(createdClass);
        // Sort sequentially by dayNumber
        c.classes.sort((a, b) => (a.dayNumber || a.classNumber || 0) - (b.dayNumber || b.classNumber || 0));
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Class uploaded successfully with curriculum content.',
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
    } = req.body;

    let updatedClass;

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
          if (test !== undefined) {
            cls.test = test && typeof test === 'object' ? test : null;
          }
          if (status !== undefined) cls.status = status;
          cls.updatedAt = new Date().toISOString();
          cls.lastEditedBy = req.user.name;
          updatedClass = cls;

          // Re-sort after updating dayNumber
          c.classes.sort((a, b) => (a.dayNumber || a.classNumber || 0) - (b.dayNumber || b.classNumber || 0));
        }
      }
    });

    if (!updatedClass) {
      return res.status(404).json({ error: 'Class episode not found.' });
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

// 12. Create / Update Class Quiz or Test
router.post('/courses/:courseId/classes/:classId/test', async (req, res) => {
  try {
    const { courseId, classId } = req.params;
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

export default router;
