import { db } from '../db/index.js';

export async function sendEmail(to, subject, templateType, data) {
  const now = new Date().toISOString();
  const emailId = 'eml_' + Math.random().toString(36).substring(2, 9);

  let htmlBody = '';
  switch (templateType) {
    case 'WELCOME':
      htmlBody = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0D0D0D; color: #F2F2F2; border-radius: 8px;">
          <h1 style="color: #FFFFFF; font-size: 24px; margin-bottom: 16px;">Welcome to Claxic, ${data.name}!</h1>
          <p style="color: #A3A3A3; font-size: 15px; line-height: 1.6;">Your account has been created successfully. Browse our accredited engineering cohorts and submit your application today.</p>
        </div>
      `;
      break;

    case 'VERIFY_EMAIL':
      htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0D0D0D; color: #F2F2F2;">
          <h2>Verify Your Claxic Email</h2>
          <p>Your 6-digit verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #6366F1; background: #1E1E1E; padding: 12px; text-align: center; border-radius: 6px;">
            ${data.token}
          </div>
        </div>
      `;
      break;

    case 'PASSWORD_RESET':
      htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0D0D0D; color: #F2F2F2;">
          <h2>Password Reset Request</h2>
          <p>Your password reset code is: <strong>${data.token}</strong></p>
        </div>
      `;
      break;

    case 'APPLICATION_RECEIVED':
      htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0D0D0D; color: #F2F2F2;">
          <h2>Application Received: ${data.courseTitle}</h2>
          <p>Application #: <strong>${data.applicationNumber}</strong></p>
          <p>Fee Amount: ₹${data.amount?.toLocaleString('en-IN')}</p>
        </div>
      `;
      break;

    case 'PAYMENT_CONFIRMATION':
      htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0D0D0D; color: #F2F2F2;">
          <h2>Enrollment Confirmed!</h2>
          <p>Course: <strong>${data.courseTitle}</strong></p>
          <p>Official Receipt #: <strong>${data.receiptNumber}</strong></p>
          <p>Amount Paid: ₹${data.amount?.toLocaleString('en-IN')}</p>
          <p>Batch Start Date: <strong>${data.startDate}</strong></p>
        </div>
      `;
      break;

    case 'CLASS_UPLOADED':
      htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #18181B; color: #F4F4F5; border-radius: 16px; border: 1px solid #27272A;">
          <div style="border-bottom: 1px solid #27272A; padding-bottom: 16px; margin-bottom: 20px;">
            <span style="background: #F59E0B; color: #000; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 1px;">
              ${data.deliveryType === 'ONLINE' ? '🔴 Live Online Class Alert' : '🔔 New Curriculum Session'}
            </span>
            <h1 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin: 12px 0 4px 0;">
              Day ${data.dayNumber}: ${data.classTitle}
            </h1>
            <p style="color: #A1A1AA; font-size: 13px; margin: 0;">
              Course: <strong style="color: #FBBF24;">${data.courseTitle}</strong> • Duration: ${data.duration || '1 hr 30 mins'}
            </p>
          </div>

          <div style="background: #27272A; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
            <p style="color: #E4E4E7; font-size: 14px; margin: 0 0 10px 0; line-height: 1.5;">
              ${data.deliveryType === 'ONLINE'
                ? `An interactive live online class has been scheduled by faculty member <strong>${data.instructorName || 'Your Instructor'}</strong>. Please join at the scheduled time.`
                : `A new learning session has been uploaded by faculty member <strong>${data.instructorName || 'Your Instructor'}</strong> and is now available in your learning dashboard.`}
            </p>
            ${data.liveMeetingTime ? `<p style="color: #FBBF24; font-size: 13px; font-weight: 600; margin: 6px 0;">⏰ Scheduled Time: ${data.liveMeetingTime}</p>` : ''}
            ${data.topics && data.topics.length > 0 ? `<p style="color: #A1A1AA; font-size: 12px; margin: 6px 0;"><strong>Topics Covered:</strong> ${data.topics.join(', ')}</p>` : ''}
            ${data.hasNotes ? `<p style="color: #34D399; font-size: 12px; margin: 6px 0;">📎 Downloadable PDF/Word notes and study materials attached.</p>` : ''}
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.actionUrl || 'http://localhost:5173/student'}" style="display: inline-block; background: #EE2D02; color: #FFFFFF; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(238, 45, 2, 0.4);">
              ${data.deliveryType === 'ONLINE' ? '🔴 Enter Student Portal & Join Live Class' : '🚀 Open Student Portal & Start Learning'}
            </a>
          </div>

          <p style="color: #71717A; font-size: 11px; text-align: center; margin-top: 20px;">
            Claxic Academic & Engineering Directorate • Learning Management System
          </p>
        </div>
      `;
      break;

    case 'VIDEO_UPLOADED':
      htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #18181B; color: #F4F4F5; border-radius: 16px; border: 1px solid #27272A;">
          <div style="border-bottom: 1px solid #27272A; padding-bottom: 16px; margin-bottom: 20px;">
            <span style="background: #10B981; color: #000; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 1px;">
              🎬 Video Lecture Ready
            </span>
            <h1 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin: 12px 0 4px 0;">
              Day ${data.dayNumber}: ${data.classTitle}
            </h1>
            <p style="color: #A1A1AA; font-size: 13px; margin: 0;">
              Course: <strong style="color: #FBBF24;">${data.courseTitle}</strong>
            </p>
          </div>

          <div style="background: #27272A; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
            <p style="color: #E4E4E7; font-size: 14px; margin: 0 0 10px 0; line-height: 1.5;">
              A high-definition video lecture for <strong>Day ${data.dayNumber} - ${data.classTitle}</strong> has been uploaded by faculty member <strong>${data.instructorName || 'Your Instructor'}</strong>.
            </p>
            <p style="color: #34D399; font-size: 12px; margin: 6px 0;">
              ▶️ The video is ready for high-speed streaming in your student learning workspace.
            </p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.actionUrl || 'http://localhost:5173/student'}" style="display: inline-block; background: #EE2D02; color: #FFFFFF; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(238, 45, 2, 0.4);">
              ▶️ Watch Video Lecture Now
            </a>
          </div>

          <p style="color: #71717A; font-size: 11px; text-align: center; margin-top: 20px;">
            Claxic Academic & Engineering Directorate • Learning Management System
          </p>
        </div>
      `;
      break;

    default:
      htmlBody = `<p>${JSON.stringify(data)}</p>`;
  }

  const record = {
    id: emailId,
    to,
    toEmail: to,
    subject,
    templateType,
    htmlBody,
    previewText: htmlBody ? htmlBody.replace(/<[^>]*>?/gm, '').slice(0, 120) : '',
    sentAt: now,
    timestamp: now,
    status: 'DELIVERED',
  };

  await db.transaction((store) => {
    if (!store.emailRecords) store.emailRecords = [];
    store.emailRecords.unshift(record);
  });

  return record;
}
