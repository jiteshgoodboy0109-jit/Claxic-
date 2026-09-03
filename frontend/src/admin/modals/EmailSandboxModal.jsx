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
        <div className="border border-[#E8E3DC] rounded-xl bg-[#FFFFFF] overflow-y-auto divide-y divide-[#EEEAE4]">
          <div className="p-3 bg-[#FFF7E6] border-b border-[#E8E3DC] flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#1F1F1F]">Outbox History</span>
            <button
              onClick={fetchEmails}
              className="p-1 text-[#6B6258] hover:text-[#D97706] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {emails.length === 0 ? (
            <p className="p-4 text-xs text-[#6B6258] text-center">No email records sent yet.</p>
          ) : (
            emails.map((em) => (
              <button
                key={em.id}
                onClick={() => setSelectedEmail(em)}
                className={`w-full text-left p-3 transition-colors cursor-pointer ${
                  selectedEmail?.id === em.id ? 'bg-[#FFF7E6] border-l-3 border-[#F59E0B]' : 'hover:bg-[#FAFAF7]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-[#6B6258]">
                  <span className="truncate">{em.to}</span>
                  <span className="shrink-0">{new Date(em.sentAt).toLocaleTimeString()}</span>
                </div>
                <h5 className="text-xs font-bold text-[#1F1F1F] truncate mt-1">{em.subject}</h5>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFF1D6] text-[#D97706] border border-[#FEDDAA]">
                  {em.templateType}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Email Preview Pane */}
        <div className="md:col-span-2 border border-[#E8E3DC] rounded-xl bg-[#FFFFFF] p-4 flex flex-col overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          {selectedEmail ? (
            <>
              <div className="pb-4 border-b border-[#E8E3DC] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#6B6258]">To: <strong className="text-[#1F1F1F]">{selectedEmail.to}</strong></span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7E6] text-[#D97706] border border-[#FEDDAA]">
                    {selectedEmail.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1F1F1F] font-display">{selectedEmail.subject}</h3>
                <p className="text-[11px] font-mono text-[#6B6258]">
                  Dispatched: {new Date(selectedEmail.sentAt).toLocaleString()}
                </p>
              </div>

              <div className="flex-1 pt-4 overflow-y-auto">
                <div
                  className="bg-[#FAFAF7] p-4 rounded-xl border border-[#E8E3DC] text-[#1F1F1F] text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#6B6258]">
              <Mail className="w-8 h-8 mb-2 opacity-40 text-[#82684D]" />
              <p className="text-xs font-mono">Select an email record from the history list to preview rendered HTML content.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

