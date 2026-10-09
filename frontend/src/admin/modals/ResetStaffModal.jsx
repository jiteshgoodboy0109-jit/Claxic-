import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import {
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const ResetStaffModal = ({
  isOpen,
  onClose,
  onStaffResetSuccess,
}) => {
  const [confirmKeyword, setConfirmKeyword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState(null);

  const REQUIRED_KEYWORD = 'RESET STAFF';

  const handleReset = async (e) => {
    e.preventDefault();
    if (confirmKeyword.trim() !== REQUIRED_KEYWORD) {
      setError(`Please type "${REQUIRED_KEYWORD}" exactly to confirm this action.`);
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch('/api/admin/staff/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmReset: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute staff reset.');
      }

      if (onStaffResetSuccess) {
        onStaffResetSuccess(data);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-[#E8E3DC]">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Reset All Faculty & Staff Accounts
            </h3>
            <p className="text-xs text-rose-600 font-semibold font-mono">
              Irreversible Administrative Operation
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 text-xs text-slate-700 space-y-2">
          <p className="font-bold text-rose-900">
            What will be affected:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-600">
            <li>All existing faculty & staff user accounts will be permanently deleted.</li>
            <li>All active course allotments and staff assignments will be cleared.</li>
            <li>All active staff login sessions will be immediately terminated.</li>
          </ul>
          <p className="font-semibold text-emerald-800 pt-1">
            ✓ Student accounts, admissions, student progress, payments, and course catalog are strictly preserved.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Type <span className="font-mono text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">{REQUIRED_KEYWORD}</span> to authorize:
            </label>
            <input
              type="text"
              required
              value={confirmKeyword}
              onChange={(e) => setConfirmKeyword(e.target.value)}
              placeholder="Type RESET STAFF here"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-rose-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8E3DC]">
            <button
              type="button"
              onClick={onClose}
              disabled={isResetting}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isResetting || confirmKeyword.trim() !== REQUIRED_KEYWORD}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
            >
              {isResetting ? (
                <>
                  <LoadingSpinner size="xs" color="rose" minHeight="min-h-0" />
                  <span>Resetting Staff...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Execute Staff Reset</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
