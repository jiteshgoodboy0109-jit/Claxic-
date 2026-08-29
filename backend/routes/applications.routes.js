import express from 'express';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/index.js';
import { sendEmail } from '../services/email.service.js';

const router = express.Router();

// Save Intermediate Draft Application
router.post('/draft', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { courseId, formData, currentStep } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required to save draft.' });
    }

    const course = db.raw.courses.find((c) => c.id === courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const now = new Date().toISOString();
    let draftApp = db.raw.applications.find(
      (a) => a.userId === user.id && a.courseId === courseId && a.status === 'DRAFT'
    );

    await db.transaction((data) => {
      if (draftApp) {
        const target = data.applications.find((a) => a.id === draftApp.id);
        if (target) {
          target.formData = formData || {};
          target.currentStep = currentStep || 1;
          target.updatedAt = now;
        }
      } else {
        const appNumber = 'APP-2026-' + Math.floor(1000 + Math.random() * 9000);
        draftApp = {
          id: 'app_' + crypto.randomBytes(8).toString('hex'),
          applicationNumber: appNumber,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          courseId: course.id,
          courseTitle: course.title,
          status: 'DRAFT',
          currentStep: currentStep || 1,
          formData: formData || {},
          amount: course.price,
          createdAt: now,
          updatedAt: now,
        };
        data.applications.push(draftApp);
      }
    });

    return res.json({ success: true, message: 'Application draft autosaved.', application: draftApp });
  } catch (err) {
    console.error('Save draft error:', err);
    return res.status(500).json({ error: 'Failed to save draft application.' });
  }
});

// Retrieve User's Draft for a Specific Course
router.get('/draft/:courseId', requireAuth, (req, res) => {
  const user = req.user;
  const { courseId } = req.params;

  const draft = db.raw.applications.find(
    (a) => a.userId === user.id && a.courseId === courseId && a.status === 'DRAFT'
  );

  return res.json({ draft: draft || null });
});

// Finalize Application Submission
router.post('/', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { courseId, formData, essay, trackPreference, resumeUrl, scholarshipRequested } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'Course identifier is required.' });
    }

    const course = db.raw.courses.find((c) => c.id === courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course offering not found.' });
    }

    if (course.enrolledCount >= course.capacity || course.status === 'FULL') {
      return res.status(400).json({ error: 'Course capacity has been reached.' });
    }

    const now = new Date().toISOString();
    let appNumber = 'APP-2026-' + Math.floor(1000 + Math.random() * 9000);

    const mergedFormData = {
      ...(formData || {}),
      fullName: user.name,
      email: user.email,
      mobile: formData?.mobile || user.mobile,
      institution: formData?.institution || user.institution,
      degree: formData?.degree || user.degree,
      yearOfStudy: formData?.yearOfStudy || user.yearOfStudy,
      essay: essay || formData?.essay || '',
      trackPreference: trackPreference || formData?.trackPreference || 'Standard',
      resumeUrl: resumeUrl || formData?.resumeUrl || '',
      scholarshipRequested: scholarshipRequested || formData?.scholarshipRequested || false,
    };

    let application = db.raw.applications.find(
      (a) => a.userId === user.id && a.courseId === courseId && a.status === 'DRAFT'
    );

    await db.transaction((data) => {
      if (application) {
        const target = data.applications.find((a) => a.id === application.id);
        if (target) {
          target.status = 'SUBMITTED';
          target.formData = mergedFormData;
          target.updatedAt = now;
          target.amount = course.price;
        }
      } else {
        application = {
          id: 'app_' + crypto.randomBytes(8).toString('hex'),
          applicationNumber: appNumber,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          courseId: course.id,
          courseTitle: course.title,
          status: 'SUBMITTED',
          currentStep: 4,
          formData: mergedFormData,
          amount: course.price,
          createdAt: now,
          updatedAt: now,
        };
        data.applications.push(application);
      }

      // Add user notification
      if (!data.notifications) data.notifications = [];
      data.notifications.unshift({
        id: 'notif_' + Math.random().toString(36).substring(2, 9),
        userId: user.id,
        title: 'Application Received: ' + course.title,
        message: `Your application #${application.applicationNumber || appNumber} has been received for review.`,
        type: 'info',
        link: '/dashboard',
        isRead: false,
        createdAt: now,
      });

      // Audit Log
      if (!data.auditLogs) data.auditLogs = [];
      data.auditLogs.unshift({
        id: 'audit_' + Math.random().toString(36).substring(2, 9),
        adminId: user.id,
        adminName: user.name,
        action: 'APPLICATION_SUBMITTED',
        targetType: 'APPLICATION',
        targetId: application.id,
        targetTitle: `${course.title} (${application.applicationNumber || appNumber})`,
        createdAt: now,
      });
    });

    // Send confirmation email
    sendEmail(user.email, `Application Received — ${course.title}`, 'APPLICATION_RECEIVED', {
      name: user.name,
      courseTitle: course.title,
      applicationNumber: application.applicationNumber || appNumber,
      amount: course.price,
    });

    return res.status(201).json({
      message: 'Application submitted successfully!',
      application,
    });
  } catch (err) {
    console.error('Submit application error:', err);
    return res.status(500).json({ error: 'Server error during application submission.' });
  }
});

// Get Current User's Applications
router.get('/user', requireAuth, (req, res) => {
  const user = req.user;
  const userApps = db.raw.applications
    .filter((a) => a.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ applications: userApps });
});

// Single Application Detail
router.get('/:id', requireAuth, (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const app = db.raw.applications.find(
    (a) => a.id === id && (a.userId === user.id || user.role === 'ADMIN')
  );

  if (!app) {
    return res.status(404).json({ error: 'Application record not found.' });
  }

  res.json({ application: app });
});

export default router;
