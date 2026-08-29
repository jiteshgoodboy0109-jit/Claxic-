import express from 'express';
import { db } from '../db/index.js';
import { requireAuth, paymentLimiter } from '../middleware/index.js';
import {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
} from '../services/payment.service.js';

const router = express.Router();

// Generate Razorpay Order
router.post('/create-order', requireAuth, paymentLimiter, createPaymentOrder);

// Verify Cryptographic Signature & Confirm Enrollment
router.post('/verify', requireAuth, paymentLimiter, verifyPayment);

// Razorpay Webhook Receiver
router.post('/webhook', handleWebhook);

// Get Itemized Tax Invoice / Official Receipt by Payment ID
router.get('/:id/receipt', requireAuth, (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const payment = db.raw.payments.find(
    (p) =>
      (p.id === id || p.receiptNumber === id || p.paymentId === id) &&
      (p.userId === user.id || user.role === 'ADMIN')
  );

  if (!payment) {
    return res.status(404).json({ error: 'Receipt record not found.' });
  }

  const course = db.raw.courses.find((c) => c.id === payment.courseId);
  const application = db.raw.applications.find((a) => a.id === payment.applicationId);

  // Compute Itemized GST breakdown (18% inclusive)
  const totalAmount = payment.amount;
  const baseAmount = Math.round((totalAmount / 1.18) * 100) / 100;
  const gstAmount = Math.round((totalAmount - baseAmount) * 100) / 100;
  const cgst = Math.round((gstAmount / 2) * 100) / 100;
  const sgst = Math.round((gstAmount / 2) * 100) / 100;

  return res.json({
    receipt: {
      receiptNumber: payment.receiptNumber,
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      transactionDate: payment.createdAt,
      paymentStatus: payment.status,
      paymentMethod: payment.paymentMethod,
      currency: payment.currency,
      totalAmount,
      baseAmount,
      gstAmount,
      taxBreakup: {
        baseAmount,
        gstAmount,
        cgst,
        sgst,
        rate: '18%',
      },
      student: {
        id: payment.userId,
        name: payment.userName,
        email: payment.userEmail,
        institution: application?.formData?.institution || user.institution || 'Verified Scholar',
        mobile: application?.formData?.mobile || user.mobile,
      },
      course: {
        id: payment.courseId,
        title: payment.courseTitle,
        category: course?.category || 'Engineering Cohort',
        startDate: course?.startDate,
        endDate: course?.endDate,
        mode: course?.mode || 'Live Interactive',
      },
      organization: {
        name: 'Claxic Advanced Engineering Directorate',
        gstin: '29AAACC1206A1Z5',
        pan: 'AAACC1206A',
        address: 'Claxic Tech Tower, 4th Floor, Electronic City Phase 1, Bengaluru, KA 560100',
        supportEmail: 'admissions@claxic.edu',
      },
      issuer: {
        organization: 'Claxic Advanced Engineering Directorate',
        gstin: '29AAACC1206A1Z5',
        pan: 'AAACC1206A',
        address: 'Claxic Tech Tower, 4th Floor, Electronic City Phase 1, Bengaluru, KA 560100',
        supportEmail: 'admissions@claxic.edu',
      },
    },
  });
});

// Get User's Payment History
router.get('/user', requireAuth, (req, res) => {
  const user = req.user;
  const userPayments = db.raw.payments
    .filter((p) => p.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ payments: userPayments });
});

export default router;
