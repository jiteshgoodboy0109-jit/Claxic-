import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import {
  Layers,
  BookOpen,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Search,
  Check,
  X,
  Users,
  Lock,
} from 'lucide-react';

export const ManageAllotmentsModal = ({
  isOpen,
  onClose,
  staffMember,
  allCourses = [],
  allStaff = [],
  allotmentsList = [],
  onAllotmentsSaved,
}) => {
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync initial allotments when staffMember changes
  useEffect(() => {
    if (staffMember) {
      const initialIds = (staffMember.allottedCourses || []).map((c) => (typeof c === 'string' ? c : c.id));
      setSelectedCourseIds(initialIds);
      setError(null);
      setSearchTerm('');
    }
  }, [staffMember, isOpen]);

  if (!staffMember) return null;

  // Check if a course is already allotted to another faculty member
  const getOtherStaffAllotment = (courseId) => {
    const matchFromAllotments = (allotmentsList || []).find(
      (a) => a.courseId === courseId && a.staffId !== staffMember.id && a.status === 'ACTIVE'
    );
    if (matchFromAllotments) {
      return matchFromAllotments.staffName || 'Another Faculty Member';
    }

    const other = (allStaff || []).find(
      (s) =>
        s.id !== staffMember.id &&
        (s.allottedCourses || []).some((ac) =>
          typeof ac === 'string' ? ac === courseId : ac.id === courseId
        )
    );
    return other ? other.name : null;
  };

  const toggleCourse = (courseId, otherStaffName) => {
    if (otherStaffName) {
      setError(`This course is already allotted to ${otherStaffName}. A course can only be allotted to one staff member.`);
      return;
    }
    setError(null);
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleSelectAll = () => {
    // Only select courses that are either unassigned or already assigned to this staff member
    const availableCourses = allCourses.filter((c) => !getOtherStaffAllotment(c.id));
    if (selectedCourseIds.length === availableCourses.length) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(availableCourses.map((c) => c.id));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/admin/staff/${staffMember.id}/allotments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseIds: selectedCourseIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save course allotments.');
      }

      if (onAllotmentsSaved) {
        onAllotmentsSaved({
          staffId: staffMember.id,
          allottedCourses: data.allottedCourses,
          allotmentsCount: selectedCourseIds.length,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCourses = allCourses.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.title || '').toLowerCase().includes(term) ||
      (c.category || '').toLowerCase().includes(term)
    );
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E8E3DC]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF7E6] border border-[#FEDDAA] text-[#D97706] flex items-center justify-center font-bold text-lg shrink-0">
              {(staffMember.name || staffMember.email || 'S')[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97706] bg-[#FFF7E6] px-2.5 py-0.5 rounded-full border border-[#FEDDAA]">
                  Curriculum Allotment Authority
                </span>
                <span className="text-[10px] font-mono font-semibold text-stone-500">
                  {selectedCourseIds.length} of {allCourses.length} Assigned
                </span>
              </div>
              <h3 className="text-base font-bold text-[#1F1F1F] mt-1">
                Allot Courses for {staffMember.name}
              </h3>
              <p className="text-xs text-[#6B6258] font-mono">{staffMember.email}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Notice */}
        <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E3DC] text-xs text-[#6B6258] leading-relaxed flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#D97706] shrink-0" />
          <span>
            Staff members will <strong>strictly</strong> see and manage only the courses checked below. All backend endpoints enforce this allotment.
          </span>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search programs by title or category..."
              className="w-full bg-[#FAFAF7] border border-[#E8E3DC] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1F1F1F] placeholder-stone-400 focus:bg-white focus:border-[#F59E0B] outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSelectAll}
            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#1F1F1F] text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            {selectedCourseIds.length === allCourses.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Courses Checklist */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 [scrollbar-width:thin]">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((c) => {
              const otherStaff = getOtherStaffAllotment(c.id);
              const isSelected = selectedCourseIds.includes(c.id);
              const isBlocked = Boolean(otherStaff);

              return (
                <div
                  key={c.id}
                  onClick={() => toggleCourse(c.id, otherStaff)}
                  title={
                    isBlocked
                      ? `Already allotted to ${otherStaff}. A course can only be allotted to one faculty member.`
                      : isSelected
                      ? 'Click to remove allotment'
                      : 'Click to allot this course'
                  }
                  className={`p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-3 ${
                    isBlocked
                      ? 'bg-stone-50/80 border-stone-200/90 text-stone-400 cursor-not-allowed select-none'
                      : isSelected
                      ? 'bg-[#FFF9EF] border-[#FEDDAA] shadow-2xs cursor-pointer'
                      : 'bg-white border-[#E8E3DC] hover:border-stone-400 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                        isBlocked
                          ? 'bg-stone-200 border-stone-300 text-stone-500'
                          : isSelected
                          ? 'bg-[#D97706] border-[#D97706] text-white'
                          : 'bg-white border-stone-300'
                      }`}
                    >
                      {isBlocked ? (
                        <Lock className="w-3 h-3 text-stone-600" />
                      ) : isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold block truncate ${isBlocked ? 'text-stone-600 line-through' : 'text-[#1F1F1F]'}`}>
                          {c.title}
                        </span>
                        {isBlocked && (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                            Locked
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#6B6258] font-mono mt-0.5">
                        <span>{c.category}</span>
                        <span>•</span>
                        <span>{c.duration || '10 Days'}</span>
                        <span>•</span>
                        <span>{c.capacity || 40} Seats</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase shrink-0 ${
                      isBlocked
                        ? 'bg-stone-100 text-stone-600 border border-stone-200'
                        : isSelected
                        ? 'bg-[#FEDDAA] text-[#B45309]'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isBlocked ? `Allotted to ${otherStaff}` : isSelected ? 'Allotted' : 'Available'}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-[#6B6258] bg-[#FAFAF7] rounded-xl border border-dashed border-[#E8E3DC]">
              No courses matching search filter.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E8E3DC]">
          <span className="text-xs text-[#6B6258] font-medium">
            <strong>{selectedCourseIds.length}</strong> programs selected
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#1F1F1F] text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="xs" color="amber" minHeight="min-h-0" />
                  <span>Saving Allotments...</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  <span>Save Course Allotments</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
