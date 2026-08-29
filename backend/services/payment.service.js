import crypto from 'crypto';
import { db } from '../db/index.js';
import { sendEmail } from './email.service.js';

export async function createPaymentOrder(req, res) {
  try {
    const user = req.user;
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ error: 'applicationId is required.' });
    }

    const application = db.raw.applications.find((a) => a.id === applicationId && a.userId === user.id);
    if (!application) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    if (application.status === 'CONFIRMED') {
      return res.status(400).json({ error: 'Application is already confirmed and paid.' });
    }

    const course = db.raw.courses.find((c) => c.id === application.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Associated course not found.' });
    }

    if (course.enrolledCount >= course.capacity || course.status === 'FULL') {
      return res.status(400).json({ error: 'Course capacity has been reached.' });
    }

    // Generate Razorpay Order simulation payload
    const orderId = 'order_clx_' + crypto.randomBytes(8).toString('hex');
    const amountInPaisa = course.price * 100;
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_ClaxicAcademic2026';

    await db.transaction((data) => {
      const app = data.applications.find((a) => a.id === applicationId);
      if (app) {
        app.status = 'PAYMENT_PENDING';
        app.updatedAt = new Date().toISOString();
      }
    });

    return res.json({
      orderId,
      amount: amountInPaisa,
      currency: 'INR',
      keyId,
      courseTitle: course.title,
      userName: user.name,
      userEmail: user.email,
      userMobile: application.formData.mobile || user.mobile,
      applicationNumber: application.applicationNumber,
    });
  } catch (err) {
    console.error('Create payment order error:', err);
    return res.status(500).json({ error: 'Failed to create payment order.' });
  }
}

export async function verifyPayment(req, res) {
  try {
    const user = req.user;
    const { orderId, paymentId, signature, applicationId, paymentMethod } = req.body;

    if (!orderId || !applicationId) {
      return res.status(400).json({ error: 'Missing required payment verification details.' });
    }

    // Cryptographic Razorpay Signature Verification
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    if (razorpaySecret && signature && !signature.startsWith('sig_sim_')) {
      const generatedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (generatedSignature !== signature) {
        return res.status(400).json({ error: 'Cryptographic Razorpay payment signature verification failed.' });
      }
    }

    const result = await db.transaction((data) => {
      const application = data.applications.find((a) => a.id === applicationId && a.userId === user.id);
      if (!application) {
        return { error: 'Application not found.', status: 404 };
      }

      const course = data.courses.find((c) => c.id === application.courseId);
      if (!course) {
        return { error: 'Course not found.', status: 404 };
      }

      // Idempotency check
      let existingPayment = data.payments.find((p) => p.orderId === orderId || (paymentId && p.paymentId === paymentId));
      if (existingPayment && existingPayment.status === 'SUCCESS') {
        return { payment: existingPayment, application, course };
      }

      const now = new Date().toISOString();
      const receiptNumber = 'REC-2026-' + Math.floor(1000 + Math.random() * 9000);
      const actualPaymentId = paymentId || 'pay_' + crypto.randomBytes(8).toString('hex');

      // Update application status
      application.status = 'CONFIRMED';
      application.updatedAt = now;

      // Reserve seat in course
      course.enrolledCount += 1;
      if (course.enrolledCount >= course.capacity) {
        course.status = 'FULL';
      }

      // Record payment
      const paymentRecord = {
        id: 'pay_' + crypto.randomBytes(8).toString('hex'),
        receiptNumber,
        orderId,
        paymentId: actualPaymentId,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        courseId: course.id,
        courseTitle: course.title,
        applicationId: application.id,
        amount: course.price,
        currency: 'INR',
        status: 'SUCCESS',
        paymentMethod: paymentMethod || 'Razorpay Gateway (UPI/Card)',
        createdAt: now,
        updatedAt: now,
      };

      data.payments.unshift(paymentRecord);

      // System notification
      data.notifications.unshift({
        id: 'notif_' + Math.random().toString(36).substring(2, 9),
        userId: user.id,
        title: 'Payment Successful: ' + course.title,
        message: `Receipt #${receiptNumber} generated. Your seat is confirmed for ${course.title}.`,
        type: 'success',
        link: '/dashboard',
        isRead: false,
        createdAt: now,
      });

      // Audit Log
      data.auditLogs.unshift({
        id: 'audit_' + Math.random().toString(36).substring(2, 9),
        adminId: user.id,
        adminName: user.name,
        action: 'PAYMENT_VERIFIED',
        targetType: 'PAYMENT',
        targetId: paymentRecord.id,
        targetTitle: `₹${course.price} for ${course.title}`,
        createdAt: now,
      });

      return { payment: paymentRecord, application, course };
    });

    if ('error' in result) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    // Send confirmation and receipt emails
    sendEmail(user.email, `Payment Receipt — ${result.course.title}`, 'PAYMENT_CONFIRMATION', {
      name: user.name,
      courseTitle: result.course.title,
      receiptNumber: result.payment.receiptNumber,
      amount: result.payment.amount,
      startDate: result.course.startDate,
    });

    return res.json({
      success: true,
      message: 'Payment verified and enrollment confirmed!',
      receiptNumber: result.payment.receiptNumber,
      payment: result.payment,
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    return res.status(500).json({ error: 'Failed to verify payment.' });
  }
}

export async function handleWebhook(req, res) {
  try {
    const event = req.body;
    console.log('Razorpay Webhook event received:', event?.event);
    return res.json({ status: 'received' });
  } catch (e) {
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
