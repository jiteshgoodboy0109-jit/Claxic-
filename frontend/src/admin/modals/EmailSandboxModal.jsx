import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

export const EmailSandboxModal = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/admin/system/emails', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emailRecords || []);
        if (data.emailRecords?.length > 0 && !selectedEmail) {
          setSelectedEmail(data.emailRecords[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="System Transactional Email Sandbox"
      subtitle="Inspect outbound automated notifications, receipts, and verification codes"
      maxWidth="max-w-4xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px] font-sans">
        {/* Email Sidebar */}
        <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-y-auto divide-y divide-slate-200">
          <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-700">Outbox History</span>
            <button
              onClick={fetchEmails}
              className="p-1 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {emails.length === 0 ? (
            <p className="p-4 text-xs text-slate-500 text-center">No email records sent yet.</p>
          ) : (
            emails.map((em) => (
              <button
                key={em.id}
                onClick={() => setSelectedEmail(em)}
                className={`w-full text-left p-3 transition-colors ${
                  selectedEmail?.id === em.id ? 'bg-indigo-50 border-l-2 border-indigo-600' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span className="truncate">{em.to}</span>
                  <span className="shrink-0">{new Date(em.sentAt).toLocaleTimeString()}</span>
                </div>
                <h5 className="text-xs font-semibold text-slate-900 truncate mt-1">{em.subject}</h5>
                <Badge variant="info" size="sm" className="mt-1">
                  {em.templateType}
                </Badge>
              </button>
            ))
          )}
        </div>

        {/* Email Preview Pane */}
        <div className="md:col-span-2 border border-slate-200 rounded-xl bg-white p-4 flex flex-col overflow-hidden shadow-2xs">
          {selectedEmail ? (
            <>
              <div className="pb-4 border-b border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500">To: <strong className="text-slate-900">{selectedEmail.to}</strong></span>
                  <Badge variant="success">{selectedEmail.status}</Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 font-display">{selectedEmail.subject}</h3>
                <p className="text-[11px] font-mono text-slate-500">
                  Dispatched: {new Date(selectedEmail.sentAt).toLocaleString()}
                </p>
              </div>

              <div className="flex-1 pt-4 overflow-y-auto">
                <div
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Mail className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
              <p className="text-xs font-mono">Select an email record from the history list to preview rendered HTML content.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
