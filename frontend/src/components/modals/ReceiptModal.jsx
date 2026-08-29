import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  Building,
  Calendar,
  CreditCard,
  User,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { jsPDF } from 'jspdf';

export const ReceiptModal = ({ isOpen, onClose, paymentIdOrReceipt }) => {
  const [receiptData, setReceiptData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && paymentIdOrReceipt) {
      fetchReceipt(paymentIdOrReceipt);
    } else {
      setReceiptData(null);
    }
  }, [isOpen, paymentIdOrReceipt]);

  const fetchReceipt = async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/payments/${id}/receipt`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch tax receipt.');
      setReceiptData(data.receipt);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!receiptData) return;

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('CLAXIC INSTITUTE OF ADVANCED TECHNOLOGY', 14, 20);
    doc.setFontSize(12);
    doc.text('OFFICIAL TAX INVOICE & ENROLLMENT RECEIPT', 14, 28);
    doc.text(`Receipt #: ${receiptData.receiptNumber}`, 14, 38);
    doc.text(`Date: ${new Date(receiptData.date).toLocaleDateString()}`, 14, 46);
    doc.text(`Customer Name: ${receiptData.customer.name}`, 14, 56);
    doc.text(`Customer Email: ${receiptData.customer.email}`, 14, 64);
    doc.text(`Course Enrolled: ${receiptData.course.title}`, 14, 76);
    doc.text(`Batch Start Date: ${receiptData.course.startDate}`, 14, 84);
    doc.text(`Subtotal: INR ${receiptData.taxBreakup.subtotal.toLocaleString('en-IN')}`, 14, 96);
    doc.text(`CGST (9%): INR ${receiptData.taxBreakup.cgst.toLocaleString('en-IN')}`, 14, 104);
    doc.text(`SGST (9%): INR ${receiptData.taxBreakup.sgst.toLocaleString('en-IN')}`, 14, 112);
    doc.text(`Total Amount Paid: INR ${receiptData.amount.toLocaleString('en-IN')}`, 14, 124);
    doc.text('Status: PAID & VERIFIED', 14, 134);

    doc.save(`Claxic-Receipt-${receiptData.receiptNumber}.pdf`);
  };

  const handleCopyReceiptNumber = () => {
    if (receiptData?.receiptNumber) {
      navigator.clipboard.writeText(receiptData.receiptNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tax Invoice & Enrollment Receipt"
      subtitle={receiptData ? `Official Invoice #${receiptData.receiptNumber}` : 'Loading receipt details...'}
      maxWidth="max-w-3xl"
    >
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-400 font-mono">Generating tax receipt document...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : receiptData ? (
        <div className="space-y-6 font-sans">
          {/* Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Badge variant="gold">PAID & VERIFIED</Badge>
              <span className="text-xs font-mono text-slate-500 font-medium">
                GSTIN: {receiptData.organization.gstin}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyReceiptNumber}
                leftIcon={<Copy className="w-3.5 h-3.5 text-slate-600" />}
              >
                {copied ? 'Copied!' : 'Copy Receipt #'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadPDF}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download PDF
              </Button>
            </div>
          </div>

          {/* Printable Invoice Container */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-300 space-y-6 shadow-sm">
            {/* Header branding & CIN */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-display uppercase tracking-tight">
                  {receiptData.organization.name}
                </h2>
                <p className="text-xs text-slate-600 max-w-sm mt-1">
                  {receiptData.organization.address}
                </p>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 mt-2 font-medium">
                  <span>CIN: {receiptData.organization.cin}</span>
                  <span>GSTIN: {receiptData.organization.gstin}</span>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-xs font-mono text-slate-500 uppercase font-semibold">INVOICE NUMBER</div>
                <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {receiptData.receiptNumber}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  Date: {new Date(receiptData.date).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Customer & Course Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1">
                <span className="font-mono text-slate-500 uppercase block font-semibold">Billed To</span>
                <p className="font-bold text-slate-900 text-sm">{receiptData.customer.name}</p>
                <p className="text-slate-600">{receiptData.customer.email}</p>
                <p className="text-slate-600">{receiptData.customer.mobile}</p>
                <p className="text-slate-500">{receiptData.customer.institution}</p>
              </div>
              <div className="space-y-1 sm:text-right">
                <span className="font-mono text-slate-500 uppercase block font-semibold">Course Program</span>
                <p className="font-bold text-slate-900 text-sm">{receiptData.course.title}</p>
                <p className="text-slate-600">Duration: {receiptData.course.duration}</p>
                <p className="text-slate-600">Mode: {receiptData.course.mode}</p>
                <p className="text-slate-600">Cohort Start: {receiptData.course.startDate}</p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 font-mono text-slate-600 uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">SAC Code</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="py-3 px-4 font-medium">
                      {receiptData.course.title} — Academic Tuition & Lab Access
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">999293</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      ₹{receiptData.taxBreakup.subtotal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-600">Central GST (CGST @ 9%)</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">999293</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      ₹{receiptData.taxBreakup.cgst.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-600">State GST (SGST @ 9%)</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">999293</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      ₹{receiptData.taxBreakup.sgst.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-mono">
                Payment Gateway ID: {receiptData.paymentId}
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-slate-500 block uppercase font-semibold">Total Paid</span>
                <span className="text-2xl font-black font-mono text-emerald-700">
                  ₹{receiptData.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
