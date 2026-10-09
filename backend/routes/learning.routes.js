import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/index.js';

const router = express.Router();

// Helper to calculate date for day N (skipping weekends or adding business days)
function calculateClassDate(startDateStr, dayIndex) {
  try {
    const baseDate = new Date(startDateStr || new Date());
    if (isNaN(baseDate.getTime())) {
      return new Date(Date.now() + dayIndex * 86400000).toISOString().split('T')[0];
    }
    // Calculate calendar date (1 class every weekday/day)
    const target = new Date(baseDate.getTime());
    target.setDate(target.getDate() + dayIndex);
    return target.toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

// Format friendly date: "Sep 15, 2026"
function formatFriendlyDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
}

// Format release time: "09:00" -> "9:00 AM", "14:30" -> "2:30 PM"
function formatReleaseTime(timeStr) {
  if (!timeStr) return '9:00 AM';
  const parts = String(timeStr).split(':');
  let hour = parseInt(parts[0], 10);
  const minute = parts[1] ? parts[1].padStart(2, '0') : '00';
  if (isNaN(hour)) return '9:00 AM';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}

// Check if a specific class is locked for a given student's individual start date
export function checkClassUnlockStatus(startDateStr, dayIndex, releaseTimeStr, isCompleted = false) {
  if (isCompleted) {
    return { isLocked: false, unlocksAt: null, lockMessage: null };
  }
  const scheduledDate = calculateClassDate(startDateStr, dayIndex);
  const time = releaseTimeStr || '09:00';
  const unlockDateTime = new Date(`${scheduledDate}T${time}:00`);
  const now = new Date();

  if (now >= unlockDateTime) {
    return { isLocked: false, unlocksAt: unlockDateTime.toISOString(), lockMessage: null };
  }

  // Calculate friendly message
  const nowDayStr = now.toISOString().split('T')[0];
  let lockMsg;
  if (scheduledDate === nowDayStr) {
    lockMsg = `Unlocks today at ${formatReleaseTime(time)}`;
  } else {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    if (scheduledDate === tomorrowStr) {
      lockMsg = `Unlocks tomorrow at ${formatReleaseTime(time)}`;
    } else {
      lockMsg = `Available on Day ${dayIndex + 1} (${formatFriendlyDate(scheduledDate)} at ${formatReleaseTime(time)})`;
    }
  }

  return {
    isLocked: true,
    unlocksAt: unlockDateTime.toISOString(),
    lockMessage: lockMsg,
  };
}

// 1. Get Student's Active Courses with Automated Daily Schedule & Progress
router.get('/my-courses', requireAuth, (req, res) => {
  try {
    const user = req.user;
    const applications = (db.raw.applications || []).filter(
      (a) => a.userId === user.id && (a.status === 'CONFIRMED' || a.status === 'APPROVED' || a.status === 'SUBMITTED')
    );

    const todayStr = new Date().toISOString().split('T')[0];

    const enrolledCourses = applications.map((app) => {
      const course = db.raw.courses.find((c) => c.id === app.courseId) || {
        id: app.courseId,
        title: app.courseTitle,
        category: 'Engineering',
        duration: '12 Weeks',
        dailyReleaseTime: '09:00',
        classes: [],
      };

      // Selected / registered start date
      const startDate = app.formData?.startDate || app.createdAt?.split('T')[0] || course.startDate || todayStr;

      // Student progress record
      const progress = (db.raw.studentProgress || []).find(
        (sp) => sp.userId === user.id && sp.courseId === course.id
      ) || {
        completedClasses: [],
        testResults: [],
        attendance: [],
        progressPercent: 0,
      };

      // Raw classes on course (fallback to default classes if empty)
      const rawClasses = course.classes && course.classes.length > 0 ? course.classes : [];
      const releaseTime = course.dailyReleaseTime || '09:00';

      // Auto-generate day-by-day class schedule starting from selected start date
      const schedule = rawClasses.map((cls, idx) => {
        const scheduledDate = calculateClassDate(startDate, idx);
        const isToday = scheduledDate === todayStr;
        const isPast = scheduledDate < todayStr;
        const isCompleted = progress.completedClasses.includes(cls.id);
        const { isLocked, unlocksAt, lockMessage } = checkClassUnlockStatus(startDate, idx, releaseTime, isCompleted);

        let classStatus = 'UPCOMING';
        if (isCompleted) {
          classStatus = 'COMPLETED';
        } else if (isLocked) {
          classStatus = 'LOCKED';
        } else if (isToday) {
          classStatus = 'TODAY';
        } else if (isPast) {
          classStatus = 'AVAILABLE';
        }

        const testResult = (progress.testResults || []).find((tr) => tr.classId === cls.id) || null;
        const attendanceRecord = (progress.attendance || []).find((att) => att.classId === cls.id) || null;

        // Strip correct answer from test when sending to student
        // If locked, strip entire test and videoUrl to prevent premature access
        let safeTest = null;
        if (cls.test && !isLocked) {
          safeTest = {
            id: cls.test.id,
            title: cls.test.title,
            passingScore: cls.test.passingScore || 70,
            questions: (cls.test.questions || []).map((q) => ({
              id: q.id,
              question: q.question,
              options: q.options || [],
            })),
          };
        }

        return {
          id: cls.id,
          classNumber: cls.classNumber || idx + 1,
          dayNumber: cls.dayNumber || idx + 1,
          title: cls.title,
          scheduledDate,
          formattedDate: formatFriendlyDate(scheduledDate),
          isToday,
          isPast,
          isUpcoming: isLocked,
          isLocked,
          unlocksAt,
          lockMessage,
          status: classStatus,
          duration: cls.duration || '1 hr 30 mins',
          videoUrl: isLocked ? null : (cls.videoUrl || ''),
          topics: cls.topics || [],
          summary: cls.summary || '',
          learningMaterials: isLocked ? [] : (cls.learningMaterials || []),
          test: safeTest,
          testResult,
          attendance: attendanceRecord,
          watchSeconds: (progress.watchLog && progress.watchLog[cls.id]) || 0,
        };
      });

      // Calculate progress percentage
      const totalClasses = schedule.length;
      const completedCount = schedule.filter((c) => c.status === 'COMPLETED').length;
      const progressPercent = totalClasses > 0 ? Math.round((completedCount / totalClasses) * 100) : 0;

      // Final project submission for this course
      const finalProject = (db.raw.projectSubmissions || []).find(
        (p) => p.userId === user.id && p.courseId === course.id
      ) || null;

      return {
        courseId: course.id,
        courseTitle: course.title,
        bannerImage: course.bannerImage || '',
        category: course.category,
        duration: course.duration,
        instructor: course.instructor,
        startDate,
        formattedStartDate: formatFriendlyDate(startDate),
        applicationNumber: app.applicationNumber,
        applicationStatus: app.status,
        progressPercent,
        completedCount,
        totalClasses,
        schedule,
        finalProject,
      };
    });

    return res.json({ success: true, courses: enrolledCourses });
  } catch (err) {
    console.error('Fetch student courses error:', err);
    return res.status(500).json({ error: 'Failed to retrieve enrolled courses.' });
  }
});

// 2. Mark Class as Completed / Watched
router.post('/courses/:courseId/classes/:classId/complete', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { courseId, classId } = req.params;

    const course = db.raw.courses.find((c) => c.id === courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Verify enrollment
    const app = (db.raw.applications || []).find(
      (a) => a.userId === user.id && a.courseId === courseId && (a.status === 'CONFIRMED' || a.status === 'APPROVED' || a.status === 'SUBMITTED')
    );
    if (!app) {
      return res.status(403).json({ error: 'You are not enrolled in this course.' });
    }

    // Find class
    const classIndex = (course.classes || []).findIndex((cls) => cls.id === classId);
    if (classIndex === -1) {
      return res.status(404).json({ error: 'Class not found in this course.' });
    }

    // Check lock status according to student's individual schedule
    const todayStr = new Date().toISOString().split('T')[0];
    const startDate = app.formData?.startDate || app.createdAt?.split('T')[0] || course.startDate || todayStr;
    const releaseTime = course.dailyReleaseTime || '09:00';
    const { isLocked, unlocksAt, lockMessage } = checkClassUnlockStatus(startDate, classIndex, releaseTime, false);

    if (isLocked) {
      return res.status(403).json({
        error: lockMessage || 'This class is locked until its scheduled release time.',
        isLocked: true,
        unlocksAt,
      });
    }

    let updatedProgress;
    const now = new Date().toISOString();

    await db.transaction((data) => {
      if (!data.studentProgress) data.studentProgress = [];
      let prog = data.studentProgress.find((sp) => sp.userId === user.id && sp.courseId === courseId);

      if (!prog) {
        prog = {
          id: 'prog_' + crypto.randomBytes(8).toString('hex'),
          userId: user.id,
          courseId,
          startDate,
          completedClasses: [classId],
          testResults: [],
          attendance: [classId],
          watchLog: req.body?.watchSeconds ? { [classId]: parseInt(req.body.watchSeconds, 10) } : {},
          progressPercent: 0,
          updatedAt: now,
        };
        data.studentProgress.push(prog);
      } else {
        if (!prog.completedClasses) prog.completedClasses = [];
        if (!prog.completedClasses.includes(classId)) {
          prog.completedClasses.push(classId);
        }
        if (!prog.attendance) prog.attendance = [];
        if (!prog.attendance.includes(classId)) {
          prog.attendance.push(classId);
        }
        if (!prog.watchLog) prog.watchLog = {};
        if (req.body && req.body.watchSeconds) {
          prog.watchLog[classId] = (prog.watchLog[classId] || 0) + parseInt(req.body.watchSeconds, 10);
        }
        prog.updatedAt = now;
      }

      const totalClasses = course.classes?.length || 5;
      prog.progressPercent = Math.min(100, Math.round((prog.completedClasses.length / totalClasses) * 100));
      updatedProgress = prog;
    });

    return res.json({
      success: true,
      message: 'Class marked as completed.',
      progress: updatedProgress,
    });
  } catch (err) {
    console.error('Mark class complete error:', err);
    return res.status(500).json({ error: 'Failed to update class progress.' });
  }
});

// 3. Submit Class Quiz / Test Answers
router.post('/courses/:courseId/classes/:classId/quiz', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { courseId, classId } = req.params;
    const { answers } = req.body; // { [questionId]: selectedIndex }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Quiz answers are required.' });
    }

    const course = db.raw.courses.find((c) => c.id === courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Verify enrollment
    const app = (db.raw.applications || []).find(
      (a) => a.userId === user.id && a.courseId === courseId && (a.status === 'CONFIRMED' || a.status === 'APPROVED' || a.status === 'SUBMITTED')
    );
    if (!app) {
      return res.status(403).json({ error: 'You are not enrolled in this course.' });
    }

    const classIndex = (course.classes || []).findIndex((cls) => cls.id === classId);
    if (classIndex === -1) {
      return res.status(404).json({ error: 'Class not found in this course.' });
    }

    // Check lock status
    const todayStr = new Date().toISOString().split('T')[0];
    const startDate = app.formData?.startDate || app.createdAt?.split('T')[0] || course.startDate || todayStr;
    const releaseTime = course.dailyReleaseTime || '09:00';
    const { isLocked, unlocksAt, lockMessage } = checkClassUnlockStatus(startDate, classIndex, releaseTime, false);

    if (isLocked) {
      return res.status(403).json({
        error: lockMessage || 'This class quiz is locked until its scheduled release time.',
        isLocked: true,
        unlocksAt,
      });
    }

    const targetClass = course.classes[classIndex];
    if (!targetClass.test || !targetClass.test.questions) {
      return res.status(404).json({ error: 'Test not found for this class.' });
    }

    const test = targetClass.test;
    const totalQuestions = test.questions.length;
    let correctCount = 0;
    const review = [];

    test.questions.forEach((q) => {
      const selected = answers[q.id];
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) correctCount++;

      review.push({
        questionId: q.id,
        question: q.question,
        selectedAnswer: q.options[selected] || 'Not answered',
        correctAnswer: q.options[q.correctIndex],
        isCorrect,
        explanation: q.explanation || '',
      });
    });

    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passingScore = test.passingScore || 70;
    const passed = score >= passingScore;
    const now = new Date().toISOString();

    let savedResult;

    await db.transaction((data) => {
      if (!data.studentProgress) data.studentProgress = [];
      let prog = data.studentProgress.find((sp) => sp.userId === user.id && sp.courseId === courseId);

      if (!prog) {
        prog = {
          id: 'prog_' + crypto.randomBytes(8).toString('hex'),
          userId: user.id,
          courseId,
          startDate: now.split('T')[0],
          completedClasses: passed ? [classId] : [],
          testResults: [],
          attendance: [],
          progressPercent: 0,
          updatedAt: now,
        };
        data.studentProgress.push(prog);
      }

      if (!prog.testResults) prog.testResults = [];
      // Replace existing result or push new
      const existingIdx = prog.testResults.findIndex((tr) => tr.classId === classId);
      const testResultEntry = {
        classId,
        score,
        passed,
        totalQuestions,
        correctAnswers: correctCount,
        submittedAt: now,
      };

      if (existingIdx >= 0) {
        prog.testResults[existingIdx] = testResultEntry;
      } else {
        prog.testResults.push(testResultEntry);
      }

      // If passed, auto mark class completed
      if (passed) {
        if (!prog.completedClasses) prog.completedClasses = [];
        if (!prog.completedClasses.includes(classId)) {
          prog.completedClasses.push(classId);
        }
      }

      const totalClasses = course.classes?.length || 5;
      prog.progressPercent = Math.min(100, Math.round((prog.completedClasses.length / totalClasses) * 100));
      prog.updatedAt = now;
      savedResult = testResultEntry;
    });

    return res.json({
      success: true,
      score,
      passed,
      passingScore,
      correctCount,
      totalQuestions,
      review,
      message: passed
        ? `Congratulations! You scored ${score}% and passed the test.`
        : `You scored ${score}%. The passing score is ${passingScore}%. Please review the answers and try again.`,
    });
  } catch (err) {
    console.error('Quiz submission error:', err);
    return res.status(500).json({ error: 'Failed to grade quiz.' });
  }
});

// 4. Get Student's Final Project Submissions
router.get('/projects', requireAuth, (req, res) => {
  try {
    const user = req.user;
    const projects = (db.raw.projectSubmissions || []).filter((p) => p.userId === user.id);
    return res.json({ success: true, projects });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load student projects.' });
  }
});

// 5. Submit Final Course Project via GitHub Repository
router.post('/projects', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const {
      courseId,
      projectTitle,
      description,
      githubUrl,
      documentationUrl,
      liveDemoUrl,
      otherFiles,
    } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'Course selection is required.' });
    }
    if (!projectTitle || !projectTitle.trim()) {
      return res.status(400).json({ error: 'Project / model title is required.' });
    }
    if (!githubUrl || !githubUrl.trim() || !githubUrl.includes('github.com')) {
      return res.status(400).json({ error: 'A valid GitHub repository URL is required (e.g. https://github.com/username/repo).' });
    }

    const course = db.raw.courses.find((c) => c.id === courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const now = new Date().toISOString();
    let savedProject;

    await db.transaction((data) => {
      if (!data.projectSubmissions) data.projectSubmissions = [];

      let proj = data.projectSubmissions.find((p) => p.userId === user.id && p.courseId === courseId);

      if (proj) {
        proj.projectTitle = projectTitle.trim();
        proj.description = (description || '').trim();
        proj.githubUrl = githubUrl.trim();
        proj.documentationUrl = (documentationUrl || '').trim();
        proj.liveDemoUrl = (liveDemoUrl || '').trim();
        proj.otherFiles = (otherFiles || '').trim();
        proj.status = 'PENDING_REVIEW';
        proj.submittedAt = now;
        proj.updatedAt = now;
        savedProject = proj;
      } else {
        savedProject = {
          id: 'proj_' + crypto.randomBytes(8).toString('hex'),
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          courseId: course.id,
          courseTitle: course.title,
          projectTitle: projectTitle.trim(),
          description: (description || '').trim(),
          githubUrl: githubUrl.trim(),
          documentationUrl: (documentationUrl || '').trim(),
          liveDemoUrl: (liveDemoUrl || '').trim(),
          otherFiles: (otherFiles || '').trim(),
          status: 'PENDING_REVIEW',
          staffFeedback: '',
          reviewedBy: '',
          reviewedAt: '',
          submittedAt: now,
          updatedAt: now,
        };
        data.projectSubmissions.push(savedProject);
      }

      // Add Notification
      if (!data.notifications) data.notifications = [];
      data.notifications.unshift({
        id: 'notif_' + Math.random().toString(36).substring(2, 9),
        userId: user.id,
        title: 'Final Project Submitted: ' + course.title,
        message: `Your GitHub project "${projectTitle.trim()}" has been submitted for faculty review.`,
        type: 'info',
        link: '/dashboard',
        isRead: false,
        createdAt: now,
      });

      // Add Audit Log
      if (!data.auditLogs) data.auditLogs = [];
      data.auditLogs.unshift({
        id: 'audit_' + Math.random().toString(36).substring(2, 9),
        adminId: user.id,
        adminName: user.name,
        action: 'PROJECT_SUBMITTED',
        targetType: 'PROJECT',
        targetId: savedProject.id,
        targetTitle: `${savedProject.projectTitle} (${course.title})`,
        createdAt: now,
      });
    });

    return res.status(201).json({
      success: true,
      message: 'Final course project submitted successfully! Faculty will review your repository.',
      project: savedProject,
    });
  } catch (err) {
    console.error('Project submission error:', err);
    return res.status(500).json({ error: 'Failed to submit final project.' });
  }
});

// 10. Get Doubts for Course / Class
router.get('/doubts', requireAuth, (req, res) => {
  try {
    const { courseId, classId } = req.query;
    let doubts = db.raw.doubts || [];

    if (courseId) {
      doubts = doubts.filter((d) => d.courseId === courseId);
    }
    if (classId) {
      doubts = doubts.filter((d) => d.classId === classId);
    }

    doubts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ success: true, doubts });
  } catch (err) {
    console.error('Fetch doubts error:', err);
    return res.status(500).json({ error: 'Failed to fetch class doubts.' });
  }
});

// 11. Submit a Class Doubt
router.post('/doubts', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { courseId, classId, classNumber, classTitle, question } = req.body;

    if (!courseId || !classId) {
      return res.status(400).json({ error: 'Course and class identifiers are required.' });
    }
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Please enter your doubt or question.' });
    }

    const course = (db.raw.courses || []).find((c) => c.id === courseId);
    const courseTitle = course ? course.title : 'Course';

    const now = new Date().toISOString();
    const doubtId = 'dbt_' + crypto.randomBytes(6).toString('hex');

    const newDoubt = {
      id: doubtId,
      studentId: user.id,
      studentName: user.name,
      studentEmail: user.email,
      courseId,
      courseTitle,
      classId,
      classNumber: Number(classNumber) || 1,
      classTitle: (classTitle || `Day ${classNumber || 1}`).trim(),
      question: question.trim(),
      reply: '',
      repliedBy: '',
      repliedAt: null,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };

    await db.transaction((data) => {
      if (!data.doubts) data.doubts = [];
      data.doubts.unshift(newDoubt);

      // Notify allotted faculty or all staff members
      if (!data.notifications) data.notifications = [];
      const allottedStaffIds = (data.staffCourseAllotments || [])
        .filter((a) => (a.courseId === courseId || a.courseId === course?.slug) && a.status === 'ACTIVE')
        .map((a) => a.staffId);

      const targetStaff = (data.users || []).filter((u) => 
        (u.role === 'STAFF' || u.role === 'ADMIN') &&
        (allottedStaffIds.length === 0 || allottedStaffIds.includes(u.id))
      );

      const staffToNotify = targetStaff.length > 0
        ? targetStaff
        : (data.users || []).filter((u) => u.role === 'STAFF');

      for (const staff of staffToNotify) {
        data.notifications.unshift({
          id: 'notif_dbt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
          userId: staff.id,
          title: `❓ Student Doubt: Day ${newDoubt.classNumber} - ${newDoubt.classTitle}`,
          message: `${user.name} asked: "${question.trim().slice(0, 80)}" in "${courseTitle}". Click to answer in Staff Portal.`,
          type: 'DOUBT_ALERT',
          link: '/staff/doubts',
          tab: 'doubts',
          meta: {
            doubtId: newDoubt.id,
            studentName: user.name,
            studentEmail: user.email,
            courseTitle: courseTitle,
            courseId: courseId,
            classTitle: newDoubt.classTitle,
            question: question.trim(),
            badge: 'STUDENT DOUBT',
            actionLabel: 'Answer Doubt',
          },
          isRead: false,
          createdAt: now,
        });
      }

      // Audit Log
      if (!data.auditLogs) data.auditLogs = [];
      data.auditLogs.unshift({
        id: 'audit_' + Math.random().toString(36).substring(2, 9),
        adminId: user.id,
        adminName: user.name,
        action: 'DOUBT_ASKED',
        targetType: 'DOUBT',
        targetId: doubtId,
        targetTitle: `${newDoubt.classTitle} - ${question.trim().slice(0, 40)}`,
        createdAt: now,
      });
    });

    return res.status(201).json({
      success: true,
      message: 'Your doubt has been submitted to your faculty mentor.',
      doubt: newDoubt,
    });
  } catch (err) {
    console.error('Post doubt error:', err);
    return res.status(500).json({ error: 'Failed to submit doubt.' });
  }
});

// ===================================================================
// Video Streaming & Controlled Playback
// ===================================================================

// Stream Class Lesson Video with HTTP Range (206) Support
router.get('/courses/:courseId/classes/:classId/video-stream', requireAuth, async (req, res) => {
  try {
    const { courseId, classId } = req.params;
    const user = req.user;

    const course = (db.raw.courses || []).find((c) => c.id === courseId || c.slug === courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const cls = (course.classes || []).find((c) => c.id === classId);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found.' });
    }

    // Role check: USER role must be enrolled in course
    if (user.role === 'USER') {
      const isEnrolled = (db.raw.applications || []).some(
        (a) => a.userId === user.id && a.courseId === course.id && (a.status === 'CONFIRMED' || a.status === 'APPROVED' || a.status === 'SUBMITTED')
      );
      if (!isEnrolled) {
        return res.status(403).json({ error: 'Access denied. You are not enrolled in this course.' });
      }
    }

    // Locate video record
    const videoRecord = (db.raw.lessonVideos || []).find(
      (v) => (cls.videoId && v.id === cls.videoId) || (v.courseId === course.id && v.classId === cls.id)
    );

    if (!videoRecord || !videoRecord.filePath || !fs.existsSync(videoRecord.filePath)) {
      return res.status(404).json({ error: 'Video file not found or has been removed.' });
    }

    const filePath = videoRecord.filePath;
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const mimeType = videoRecord.mimeType || 'video/mp4';

    // Anti-download headers & inline playback
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.setHeader('Content-Range', `bytes */${fileSize}`);
        return res.status(416).send('Requested range not satisfiable');
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error('Video streaming error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Error streaming video.' });
    }
  }
});

// Get Video Playback Progress for Student
router.get('/courses/:courseId/classes/:classId/progress', requireAuth, (req, res) => {
  try {
    const { courseId, classId } = req.params;
    const user = req.user;

    const record = (db.raw.lessonPlaybackProgress || []).find(
      (p) => p.userId === user.id && (p.courseId === courseId || p.courseId === p.courseId) && p.classId === classId
    );

    const sp = (db.raw.studentProgress || []).find((s) => s.userId === user.id && s.courseId === courseId);
    const isCompletedInCourse = sp && Array.isArray(sp.completedClasses) && sp.completedClasses.includes(classId);

    const watchedSeconds = record ? (record.watchedSeconds || 0) : 0;
    const totalDurationSeconds = record ? (record.totalDurationSeconds || 0) : 0;
    const furthestPosition = record ? (record.furthestPositionSeconds || record.lastPlaybackPosition || 0) : 0;
    const completionRatio = record ? (record.completionRatio || 0) : (isCompletedInCourse ? 1.0 : 0);
    const completed = Boolean((record && record.completed) || isCompletedInCourse || completionRatio >= 0.75);
    const canSkipForward = Boolean((record && record.canSkipForward) || completed);

    return res.json({
      success: true,
      progress: {
        watchedSeconds,
        totalDurationSeconds,
        furthestPosition,
        completionRatio,
        completed,
        canSkipForward,
        lastPosition: record ? (record.lastPlaybackPosition || 0) : 0,
      },
    });
  } catch (err) {
    console.error('Fetch progress error:', err);
    return res.status(500).json({ error: 'Failed to retrieve lesson progress.' });
  }
});

// Update Video Playback Progress (Enforces 75% watched threshold & unlocks 5s skip)
router.post('/courses/:courseId/classes/:classId/progress', requireAuth, async (req, res) => {
  try {
    const { courseId, classId } = req.params;
    const user = req.user;
    const {
      currentTime = 0,
      duration = 0,
      watchedIncrement = 0,
    } = req.body;

    const curTime = Math.max(0, Number(currentTime) || 0);
    const dur = Math.max(0, Number(duration) || 0);
    const validIncrement = Math.min(15, Math.max(0, Number(watchedIncrement) || 0));

    const now = new Date().toISOString();
    let updatedProgress;
    let becameCompleted = false;

    await db.transaction((data) => {
      if (!data.lessonPlaybackProgress) data.lessonPlaybackProgress = [];
      let prog = data.lessonPlaybackProgress.find(
        (p) => p.userId === user.id && p.courseId === courseId && p.classId === classId
      );

      if (!prog) {
        prog = {
          id: 'prog_' + crypto.randomBytes(8).toString('hex'),
          userId: user.id,
          courseId,
          classId,
          watchedSeconds: 0,
          totalDurationSeconds: dur,
          furthestPositionSeconds: curTime,
          completionRatio: 0,
          completed: false,
          completedAt: null,
          canSkipForward: false,
          lastPlaybackPosition: curTime,
          createdAt: now,
          updatedAt: now,
        };
        data.lessonPlaybackProgress.push(prog);
      }

      if (dur > 0) {
        prog.totalDurationSeconds = dur;
      }
      prog.watchedSeconds = (prog.watchedSeconds || 0) + validIncrement;
      prog.lastPlaybackPosition = curTime;
      if (curTime > (prog.furthestPositionSeconds || 0)) {
        prog.furthestPositionSeconds = curTime;
      }

      const effectiveDuration = prog.totalDurationSeconds || dur || 1;
      const ratio = Math.min(1.0, prog.watchedSeconds / effectiveDuration);
      prog.completionRatio = Number(ratio.toFixed(4));

      // 75% threshold rule:
      if (prog.completionRatio >= 0.75 || (dur > 0 && prog.watchedSeconds >= dur * 0.75)) {
        if (!prog.completed) {
          becameCompleted = true;
          prog.completed = true;
          prog.completedAt = now;
        }
        prog.canSkipForward = true;
      }

      prog.updatedAt = now;
      updatedProgress = prog;

      if (!data.studentProgress) data.studentProgress = [];
      let studentProg = data.studentProgress.find((sp) => sp.userId === user.id && sp.courseId === courseId);
      if (!studentProg) {
        studentProg = {
          id: 'sp_' + crypto.randomBytes(6).toString('hex'),
          userId: user.id,
          courseId,
          completedClasses: [],
          testResults: [],
          attendance: [],
          progressPercent: 0,
          createdAt: now,
          updatedAt: now,
        };
        data.studentProgress.push(studentProg);
      }

      if (prog.completed && !studentProg.completedClasses.includes(classId)) {
        studentProg.completedClasses.push(classId);

        if (!studentProg.attendance.some((att) => att.classId === classId)) {
          studentProg.attendance.push({
            classId,
            date: now.split('T')[0],
            status: 'PRESENT',
            verifiedAt: now,
          });
        }

        const course = (data.courses || []).find((c) => c.id === courseId || c.slug === courseId);
        const totalClassesCount = (course && course.classes && course.classes.length > 0) ? course.classes.length : 10;
        studentProg.progressPercent = Math.min(100, Math.round((studentProg.completedClasses.length / totalClassesCount) * 100));
        studentProg.updatedAt = now;
      }
    });

    return res.json({
      success: true,
      progress: updatedProgress,
      becameCompleted,
    });
  } catch (err) {
    console.error('Save progress error:', err);
    return res.status(500).json({ error: 'Failed to save playback progress.' });
  }
});

export default router;
