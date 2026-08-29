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

    default:
      htmlBody = `<p>${JSON.stringify(data)}</p>`;
  }

  const record = {
    id: emailId,
    to,
    subject,
    templateType,
    htmlBody,
    sentAt: now,
    status: 'DELIVERED',
  };

  await db.transaction((store) => {
    if (!store.emailRecords) store.emailRecords = [];
    store.emailRecords.unshift(record);
  });

  return record;
}
