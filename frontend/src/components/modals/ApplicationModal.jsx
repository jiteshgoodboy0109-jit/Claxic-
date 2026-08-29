import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  User,
  School,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import confetti from 'canvas-confetti';

export const ApplicationModal = ({ isOpen, onClose, course, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState('form');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('Final Year');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [statementOfIntent, setStatementOfIntent] = useState('');

  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(true);
  const [agreedToRefundPolicy, setAgreedToRefundPolicy] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSavedMessage, setDraftSavedMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submittedApp, setSubmittedApp] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
      setMobile(user.mobile || '');
      setInstitution(user.institution || '');
      setDegree(user.degree || '');
      if (user.yearOfStudy) setYearOfStudy(user.yearOfStudy);
    }

    // Check if there is an existing draft for this user & course
    if (user && course && isOpen) {
      const token = localStorage.getItem('claxic_token');
      if (token) {
        fetch(`/api/applications/draft/${course.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.draft && data.draft.formData) {
              const fd = data.draft.formData;
              if (fd.fullName) setFullName(fd.fullName);
              if (fd.email) setEmail(fd.email);
              if (fd.mobile) setMobile(fd.mobile);
              if (fd.institution) setInstitution(fd.institution);
              if (fd.degree) setDegree(fd.degree);
              if (fd.yearOfStudy) setYearOfStudy(fd.yearOfStudy);
              if (fd.experienceLevel) setExperienceLevel(fd.experienceLevel);
              if (fd.statementOfIntent) setStatementOfIntent(fd.statementOfIntent);
              setDraftSavedMessage('Restored previous saved draft.');
              setTimeout(() => setDraftSavedMessage(null), 3000);
            }
          })
          .catch(() => {});
      }
    }

    setStep('form');
    setError(null);
  }, [user, isOpen, course]);

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setError(null);
    setDraftSavedMessage(null);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/applications/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: course.id,
          formData: {
            fullName: fullName.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            institution: institution.trim(),
            degree: degree.trim(),
            yearOfStudy,
            experienceLevel,
            statementOfIntent: statementOfIntent.trim(),
            agreedToTerms,
            agreedToPrivacy,
            agreedToRefundPolicy,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save draft.');
      setDraftSavedMessage('Draft progress saved! You can resume anytime.');
      setTimeout(() => setDraftSavedMessage(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  if (!course) return null;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!agreedToTerms || !agreedToPrivacy || !agreedToRefundPolicy) {
      setError('You must accept all terms and policy conditions to proceed.');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: course.id,
          formData: {
            fullName: fullName.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            institution: institution.trim(),
            degree: degree.trim(),
            yearOfStudy,
            experienceLevel,
            statementOfIntent: statementOfIntent.trim(),
            agreedToTerms,
            agreedToPrivacy,
            agreedToRefundPolicy,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setSubmittedApp(data.application);

      // Create Razorpay Order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ applicationId: data.application.id }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to initialize payment gateway order.');
      }

      setPaymentOrder(orderData);
      setStep('payment');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRazorpayCheckout = () => {
    if (!paymentOrder) return;

    if (window.Razorpay) {
      const options = {
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'Claxic Institute of Advanced Technology',
        description: `Enrollment Fee — ${course.title}`,
        order_id: paymentOrder.orderId,
        prefill: {
          name: paymentOrder.userName,
          email: paymentOrder.userEmail,
          contact: paymentOrder.userMobile,
        },
        theme: { color: '#4F46E5' },
        handler: async (response) => {
          verifyPaymentOnBackend(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
        },
        modal: {
          ondismiss: () => console.log('Payment modal dismissed'),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      simulatePaymentSuccess();
    }
  };

  const simulatePaymentSuccess = async () => {
    if (!paymentOrder || !submittedApp) return;
    const simOrder = paymentOrder.orderId;
    const simPayment = 'pay_sim_' + Math.random().toString(36).substring(2, 9);
    const simSignature = 'sig_sim_' + Math.random().toString(36).substring(2, 9);

    verifyPaymentOnBackend(simOrder, simPayment, simSignature);
  };

  const verifyPaymentOnBackend = async (orderId, paymentId, signature) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          paymentId,
          signature,
          applicationId: submittedApp.id,
          paymentMethod: 'Razorpay Online Gateway (UPI/Card)',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment verification failed.');
      }

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      onClose();
      if (onSuccess) onSuccess(data.receiptNumber);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'form' ? 'Cohort Registration Form' : 'Payment & Seat Reservation'}
      subtitle={course.title}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 font-sans">
        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Summary Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="gold">{course.category}</Badge>
                  <Badge variant="default">{course.mode}</Badge>
                </div>
                <h4 className="text-base font-bold text-slate-900 font-display uppercase tracking-tight mt-2">
                  {course.title}
                </h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Batch Starts: {course.startDate} • Duration: {course.duration}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-emerald-700">
                  ₹{course.price.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] font-mono text-emerald-600 uppercase font-semibold">
                  Inclusive of 18% GST & Tax Invoice
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                1. Personal & Contact Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                  Mobile Number (WhatsApp Enabled) *
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2 pt-2">
                2. Academic & Background Context
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Institution / University *
                  </label>
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Stanford University / Enterprise Tech"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Degree / Specialization *
                  </label>
                  <input
                    type="text"
                    required
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder="B.S. Computer Science"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Year of Study / Status
                  </label>
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="1st Year">1st Year Undergraduate</option>
                    <option value="2nd Year">2nd Year Undergraduate</option>
                    <option value="3rd Year">3rd Year Undergraduate</option>
                    <option value="Final Year">Final Year Undergraduate</option>
                    <option value="Postgraduate / Master">Postgraduate / Master</option>
                    <option value="Working Professional">Working Professional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                    Technical Proficiency
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Beginner">Beginner (Basic JS/HTML)</option>
                    <option value="Intermediate">Intermediate (React/Node basics)</option>
                    <option value="Advanced">Advanced (Systems & DevOps)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
                  Statement of Intent / Learning Goals
                </label>
                <textarea
                  rows={2}
                  value={statementOfIntent}
                  onChange={(e) => setStatementOfIntent(e.target.value)}
                  placeholder="Share what you hope to build or accomplish during this cohort..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Policy Checkboxes */}
              <div className="space-y-2 pt-2 text-xs">
                <label className="flex items-center gap-2.5 text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>I agree to Claxic Cohort Terms & Code of Conduct.</span>
                </label>
                <label className="flex items-center gap-2.5 text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={agreedToRefundPolicy}
                    onChange={(e) => setAgreedToRefundPolicy(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>I acknowledge the 7-day unconditional 100% money-back guarantee policy.</span>
                </label>
              </div>

              {/* Draft Status Alert */}
              {draftSavedMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{draftSavedMessage}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleSaveDraft}
                isLoading={isSavingDraft}
                className="w-full sm:w-auto shrink-0"
              >
                Save Draft
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Razorpay Secure Payment
              </Button>
            </div>
          </form>
        ) : (
          /* Step 2: Payment Checkout Overview */
          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <Badge variant="gold">Application Confirmed: #{submittedApp?.applicationNumber}</Badge>
                <h3 className="text-xl font-bold text-slate-900 font-display mt-2 uppercase">
                  Complete Payment Order
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 font-normal">
                  Your seat reservation request for <strong className="text-slate-900">{course.title}</strong> is active. Complete payment via Razorpay Gateway.
                </p>
              </div>

              <div className="py-4 border-y border-slate-200 max-w-sm mx-auto space-y-2 font-mono text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tuition Base:</span>
                  <span>₹{Math.round(course.price / 1.18).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18%):</span>
                  <span>₹{(course.price - Math.round(course.price / 1.18)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold text-base pt-2 border-t border-slate-200">
                  <span>Total Due:</span>
                  <span className="text-emerald-700">₹{course.price.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2 max-w-md mx-auto">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handleRazorpayCheckout}
                  isLoading={isLoading}
                  leftIcon={<CreditCard className="w-5 h-5" />}
                >
                  Pay via Razorpay (UPI, Cards, NetBanking, EMI)
                </Button>

                <button
                  onClick={simulatePaymentSuccess}
                  className="w-full text-center text-xs font-mono text-indigo-600 hover:text-indigo-800 underline py-1 font-semibold"
                >
                  ⚡ Instant Demo Payment Simulation (Skip Gateway)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
