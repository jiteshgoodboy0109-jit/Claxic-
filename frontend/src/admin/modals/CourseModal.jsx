import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  Plus,
  BookOpen,
  User,
  HelpCircle,
  Layers,
  Calendar,
  X,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';

export const CourseModal = ({ isOpen, onClose, courseToEdit, onSaved }) => {
  const [activeSection, setActiveSection] = useState('basic'); // 'basic' | 'curriculum' | 'faculty' | 'faq'

  // Basic Details
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('AI & Full Stack');
  const [level, setLevel] = useState('Intermediate');
  const [mode, setMode] = useState('Live Interactive');
  const [duration, setDuration] = useState('10 Weeks');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-09-25');
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState(14999);
  const [originalPrice, setOriginalPrice] = useState(24999);
  const [capacity, setCapacity] = useState(40);
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [status, setStatus] = useState('PUBLISHED');
  const [featured, setFeatured] = useState(false);
  const [tags, setTags] = useState('GenAI, FullStack, React, Python');

  // Curriculum Modules
  const [modules, setModules] = useState([
    {
      id: 'mod_1',
      title: 'Foundations & Architecture Core',
      duration: 'Weeks 1-3 (24 Live Hours)',
      topics: ['System Design Patterns', 'API Layer Construction', 'Performance Optimization'],
    },
  ]);

  // Lead Faculty - strictly bound to real appointed staff in the platform
  const [appointedStaff, setAppointedStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [instructorTitle, setInstructorTitle] = useState('');
  const [instructorCompany, setInstructorCompany] = useState('');
  const [instructorAvatar, setInstructorAvatar] = useState('');
  const [instructorBio, setInstructorBio] = useState('');

  // Fetch appointed staff accounts from DB
  useEffect(() => {
    if (!isOpen) return;
    const loadStaff = async () => {
      try {
        const token = localStorage.getItem('claxic_token');
        const res = await fetch('/api/admin/staff', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const staffArr = data.staff || [];
          setAppointedStaff(staffArr);
        }
      } catch (e) {
        console.warn('Failed loading staff for course modal', e);
      }
    };
    loadStaff();
  }, [isOpen]);

  // Program FAQs
  const [faqList, setFaqList] = useState([
    {
      question: 'What are the hardware prerequisites?',
      answer: 'A laptop with at least 8GB RAM, modern web browser, and NodeJS installed.',
    },
    {
      question: 'Will sessions be recorded for asynchronous review?',
      answer: 'Yes, all live cohorts are recorded in 4K resolution and made available within 2 hours.',
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (courseToEdit) {
      setTitle(courseToEdit.title || '');
      setCategory(courseToEdit.category || 'AI & Full Stack');
      setLevel(courseToEdit.level || 'Intermediate');
      setMode(courseToEdit.mode || 'Live Interactive');
      setDuration(courseToEdit.duration || '10 Weeks');
      setStartDate(courseToEdit.startDate || '2026-10-01');
      setRegistrationDeadline(courseToEdit.registrationDeadline || '2026-09-25');
      const courseIsFree = Boolean(courseToEdit.isFree || Number(courseToEdit.price) === 0);
      setIsFree(courseIsFree);
      setPrice(courseIsFree ? 0 : (courseToEdit.price || 14999));
      setOriginalPrice(courseToEdit.originalPrice || 24999);
      setCapacity(courseToEdit.capacity || 40);
      setShortDescription(courseToEdit.shortDescription || '');
      setFullDescription(courseToEdit.fullDescription || '');
      setBannerImage(courseToEdit.bannerImage || '');
      setStatus(courseToEdit.status || 'PUBLISHED');
      setFeatured(Boolean(courseToEdit.featured));
      setTags(Array.isArray(courseToEdit.tags) ? courseToEdit.tags.join(', ') : 'Engineering, Claxic');

      if (courseToEdit.modules && Array.isArray(courseToEdit.modules)) {
        setModules(courseToEdit.modules);
      } else {
        setModules([]);
      }

      // Match instructor with real appointed staff
      const matchingStaff = appointedStaff.find(
        (s) =>
          s.id === courseToEdit.instructor?.id ||
          (s.email && courseToEdit.instructor?.email && s.email.toLowerCase() === courseToEdit.instructor?.email.toLowerCase()) ||
          (s.name && courseToEdit.instructor?.name && s.name.trim().toLowerCase() === courseToEdit.instructor?.name.trim().toLowerCase())
      );

      if (matchingStaff) {
        setSelectedStaffId(matchingStaff.id);
        setInstructorName(matchingStaff.name);
        setInstructorTitle(matchingStaff.degree || courseToEdit.instructor?.title || 'Faculty Member');
        setInstructorCompany(matchingStaff.institution || courseToEdit.instructor?.company || 'Claxic Academic Faculty');
        setInstructorAvatar(matchingStaff.avatar || courseToEdit.instructor?.avatar || '');
        setInstructorBio(courseToEdit.instructor?.bio || `${matchingStaff.name} is a designated faculty mentor and instructor at Claxic.`);
      } else if (courseToEdit.instructor && typeof courseToEdit.instructor === 'object' && courseToEdit.instructor.name) {
        setSelectedStaffId('');
        setInstructorName(courseToEdit.instructor.name);
        setInstructorTitle(courseToEdit.instructor.title || 'Faculty Lead');
        setInstructorCompany(courseToEdit.instructor.company || 'Claxic Academic Faculty');
        setInstructorAvatar(courseToEdit.instructor.avatar || '');
        setInstructorBio(courseToEdit.instructor.bio || '');
      } else {
        setSelectedStaffId('');
        setInstructorName('Claxic Faculty Lead');
        setInstructorTitle('Faculty Lead');
        setInstructorCompany('Claxic Directorate');
        setInstructorAvatar('https://api.dicebear.com/7.x/initials/svg?seed=Claxic');
        setInstructorBio('Accredited curriculum managed by the Claxic Academic Directorate.');
      }

      if (courseToEdit.faq && Array.isArray(courseToEdit.faq)) {
        setFaqList(courseToEdit.faq);
      } else {
        setFaqList([]);
      }
    } else {
      setTitle('');
      setCategory('AI & Full Stack');
      setLevel('Intermediate');
      setMode('Live Interactive');
      setDuration('10 Weeks');
      setStartDate('2026-10-01');
      setRegistrationDeadline('2026-09-25');
      setIsFree(false);
      setPrice(14999);
      setOriginalPrice(24999);
      setCapacity(40);
      setShortDescription('');
      setFullDescription('');
      setBannerImage('');
      setStatus('PUBLISHED');
      setFeatured(false);
      setTags('GenAI, FullStack, React, Python');
      setModules([
        {
          id: 'mod_1',
          title: 'Foundations & Architecture Core',
          duration: 'Weeks 1-3 (24 Live Hours)',
          topics: ['System Design Patterns', 'API Layer Construction', 'Performance Optimization'],
        },
      ]);

      // When creating a course, default to real appointed staff if available
      if (appointedStaff.length > 0) {
        const staff = appointedStaff[0];
        setSelectedStaffId(staff.id);
        setInstructorName(staff.name);
        setInstructorTitle(staff.degree || 'Faculty Member & Mentor');
        setInstructorCompany(staff.institution || 'Claxic Academic Faculty');
        setInstructorAvatar(staff.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(staff.name)}`);
        setInstructorBio(staff.bio || `${staff.name} is a designated faculty mentor and instructor at Claxic.`);
      } else {
        setSelectedStaffId('');
        setInstructorName('Claxic Faculty Lead');
        setInstructorTitle('Faculty Lead');
        setInstructorCompany('Claxic Directorate');
        setInstructorAvatar('https://api.dicebear.com/7.x/initials/svg?seed=Claxic');
        setInstructorBio('Accredited curriculum managed by the Claxic Academic Directorate.');
      }

      setFaqList([
        {
          question: 'What are the hardware prerequisites?',
          answer: 'A laptop with at least 8GB RAM, modern web browser, and NodeJS installed.',
        },
      ]);
    }
    setActiveSection('basic');
    setError(null);
  }, [courseToEdit, isOpen, appointedStaff]);

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setBannerImage(uploadEvent.target.result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setBannerImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Module Handlers
  const handleAddModule = () => {
    setModules([
      ...modules,
      {
        id: 'mod_' + Math.random().toString(36).substring(2, 7),
        title: 'New Specialized Module',
        duration: '2 Weeks (16 Live Hours)',
        topics: ['Core Architecture', 'Hands-on Labs', 'Capstone Evaluation'],
      },
    ]);
  };

  const handleUpdateModule = (idx, field, value) => {
    const next = [...modules];
    next[idx] = { ...next[idx], [field]: value };
    setModules(next);
  };

  const handleUpdateModuleTopics = (idx, topicsString) => {
    const next = [...modules];
    next[idx] = {
      ...next[idx],
      topics: topicsString.split(',').map((t) => t.trim()).filter(Boolean),
    };
    setModules(next);
  };

  const handleRemoveModule = (idx) => {
    setModules(modules.filter((_, i) => i !== idx));
  };

  // FAQ Handlers
  const handleAddFaq = () => {
    setFaqList([
      ...faqList,
      {
        question: 'New Question?',
        answer: 'Detailed programmatic answer goes here.',
      },
    ]);
  };

  const handleUpdateFaq = (idx, field, value) => {
    const next = [...faqList];
    next[idx] = { ...next[idx], [field]: value };
    setFaqList(next);
  };

  const handleRemoveFaq = (idx) => {
    setFaqList(faqList.filter((_, i) => i !== idx));
  };

  const handleSelectStaff = (staffId) => {
    setSelectedStaffId(staffId);
    if (!staffId) {
      setInstructorName('Claxic Faculty Lead');
      setInstructorTitle('Faculty Lead');
      setInstructorCompany('Claxic Directorate');
      setInstructorAvatar('https://api.dicebear.com/7.x/initials/svg?seed=Claxic');
      setInstructorBio('Curated by Claxic Academic Directorate.');
      return;
    }
    const staff = appointedStaff.find((s) => s.id === staffId);
    if (staff) {
      setInstructorName(staff.name);
      setInstructorTitle(staff.degree || 'Faculty Member & Mentor');
      setInstructorCompany(staff.institution || 'Claxic Academic Faculty');
      setInstructorAvatar(staff.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(staff.name)}`);
      setInstructorBio(staff.bio || `${staff.name} is a designated faculty mentor and instructor at Claxic.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('claxic_token');
      const url = courseToEdit ? `/api/admin/courses/${courseToEdit.id}` : '/api/admin/courses';
      const method = courseToEdit ? 'PUT' : 'POST';

      const tagArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        category,
        level,
        mode,
        duration: duration.trim(),
        startDate,
        registrationDeadline,
        isFree: Boolean(isFree),
        price: isFree ? 0 : Number(price),
        originalPrice: isFree ? 0 : Number(originalPrice),
        capacity: Number(capacity),
        shortDescription: shortDescription.trim(),
        fullDescription: fullDescription.trim(),
        bannerImage: bannerImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
        status,
        featured,
        tags: tagArray.length > 0 ? tagArray : ['Engineering', 'Claxic'],
        modules: modules.map((m, idx) => ({
          id: m.id || `mod_${idx + 1}`,
          title: m.title || `Module ${idx + 1}`,
          duration: m.duration || '2 Weeks',
          topics: Array.isArray(m.topics) ? m.topics : [],
        })),
        staffId: selectedStaffId || undefined,
        instructor: {
          id: selectedStaffId || undefined,
          name: instructorName.trim() || 'Claxic Faculty Lead',
          title: instructorTitle.trim() || 'Faculty Lead',
          company: instructorCompany.trim() || 'Claxic Directorate',
          avatar: instructorAvatar.trim() || 'https://api.dicebear.com/7.x/initials/svg?seed=Claxic',
          bio: instructorBio.trim() || 'Accredited curriculum managed by the Claxic Academic Directorate.',
        },
        faq: faqList.map((f) => ({
          question: f.question || '',
          answer: f.answer || '',
        })),
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save course.');

      onClose();
      window.dispatchEvent(new CustomEvent('claxic_course_updated'));
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourseFromModal = async () => {
    if (!courseToEdit) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${courseToEdit.title}"? All curriculum classes, video lessons, faculty allotments, and enrolled progress will be completely wiped.`)) {
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('claxic_token');
      const res = await fetch(`/api/admin/courses/${courseToEdit.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onClose();
        if (onSaved) onSaved();
        window.dispatchEvent(new CustomEvent('claxic_course_updated'));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete course.');
      }
    } catch (err) {
      alert('Network error while deleting course.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={courseToEdit ? `Edit: ${courseToEdit.title}` : 'Create New Course Offering'}
      subtitle="Complete Course Curriculum, Faculty, Pricing & Media Editor"
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 font-sans text-slate-900">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-[#E8E3DC] gap-2 pb-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSection('basic')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'basic'
                ? 'bg-[#F59E0B] text-white shadow-xs font-bold'
                : 'bg-[#FAFAF7] text-[#6B6258] hover:text-[#1F1F1F] hover:bg-[#FFF7E6]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Basic & Pricing</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('curriculum')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'curriculum'
                ? 'bg-[#F59E0B] text-white shadow-xs font-bold'
                : 'bg-[#FAFAF7] text-[#6B6258] hover:text-[#1F1F1F] hover:bg-[#FFF7E6]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Syllabus Breakdown ({modules.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('faculty')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'faculty'
                ? 'bg-[#F59E0B] text-white shadow-xs font-bold'
                : 'bg-[#FAFAF7] text-[#6B6258] hover:text-[#1F1F1F] hover:bg-[#FFF7E6]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>3. Lead Faculty Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('faq')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'faq'
                ? 'bg-[#F59E0B] text-white shadow-xs font-bold'
                : 'bg-[#FAFAF7] text-[#6B6258] hover:text-[#1F1F1F] hover:bg-[#FFF7E6]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>4. Program FAQs ({faqList.length})</span>
          </button>
        </div>

        {/* SECTION 1: BASIC DETAILS & PRICING */}
        {activeSection === 'basic' && (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Course Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Applied GenAI & Full-Stack Systems"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all font-semibold"
              />
            </div>

            {/* Short Headline */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Short Headline Description *
              </label>
              <input
                type="text"
                required
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="High-level single sentence summary..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-3.5 py-2 text-sm text-slate-900 outline-none"
              />
            </div>

            {/* Full Course Overview Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Full Curriculum Overview Description *
              </label>
              <textarea
                rows={3}
                required
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="Comprehensive description of the cohort methodology, architectural mastery, and outcomes..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl p-3 text-xs sm:text-sm text-slate-900 outline-none leading-relaxed"
              />
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Course Banner Cover Photo
              </label>
              <div className="border-2 border-dashed border-amber-300/80 bg-amber-50/40 rounded-2xl p-4 transition-all">
                {bannerImage ? (
                  <div className="space-y-3">
                    <div className="relative h-40 sm:h-48 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
                      <img src={bannerImage} alt="Course Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center py-6 px-4 text-center cursor-pointer hover:bg-amber-50/80 rounded-xl transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-amber-200 flex items-center justify-center text-[#D97706] mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      Click to upload course photo from your device
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Supports JPG, PNG, WEBP up to 5MB</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="url"
                  value={bannerImage.startsWith('data:') ? '' : bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  placeholder="Or paste an image URL directly..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Pricing Model Selection */}
            <div className="space-y-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Course Tuition Model</span>
                    {isFree && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
                        100% FREE
                      </span>
                    )}
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Choose whether this course requires paid tuition or is offered completely free for students.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFree(false);
                      if (price === 0) setPrice(14999);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      !isFree
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    Paid Program
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFree(true);
                      setPrice(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isFree
                        ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400'
                        : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    Free Course
                  </button>
                </div>
              </div>

              {isFree ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Free Course Active: </span>
                    <span>Students can enroll directly without payment gateway checkout. Tuition is ₹0.</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Tuition (₹) *
                    </label>
                    <input
                      type="number"
                      required={!isFree}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Original (₹)
                    </label>
                    <input
                      type="number"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 font-mono outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cohort Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Cohort Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Registration Deadline
                </label>
                <input
                  type="date"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>
            </div>

            {/* Feature checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="featured"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#D97706] accent-[#D97706] cursor-pointer"
              />
              <label htmlFor="featured" className="text-xs text-slate-700 cursor-pointer font-medium select-none">
                Feature this course in spotlight banners
              </label>
            </div>
          </div>
        )}

        {/* SECTION 2: SYLLABUS & MODULES */}
        {activeSection === 'curriculum' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Curriculum Modules</h4>
                <p className="text-xs text-slate-500">Add detailed module titles, durations, and key study topics</p>
              </div>
              <button
                type="button"
                onClick={handleAddModule}
                className="px-3.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Module</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {modules.map((mod, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D97706] uppercase">Module {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveModule(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Module Title</label>
                      <input
                        type="text"
                        value={mod.title}
                        onChange={(e) => handleUpdateModule(idx, 'title', e.target.value)}
                        placeholder="e.g. Agentic AI & RAG Architectures"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Duration & Live Hours</label>
                      <input
                        type="text"
                        value={mod.duration}
                        onChange={(e) => handleUpdateModule(idx, 'duration', e.target.value)}
                        placeholder="e.g. Weeks 1-2 (16 Live Hours)"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Topics (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(mod.topics) ? mod.topics.join(', ') : ''}
                      onChange={(e) => handleUpdateModuleTopics(idx, e.target.value)}
                      placeholder="Prompt Engineering, Vector DBs, LangChain, Evaluation Pipelines"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: LEAD FACULTY PROFILE */}
        {activeSection === 'faculty' && (
          <div className="space-y-4">
            {/* Appointed Staff Selector */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-2">
              <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center justify-between">
                <span>Appoint Real Faculty Member</span>
                <span className="text-[10px] text-amber-800 lowercase font-mono">
                  {appointedStaff.length} faculty registered
                </span>
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => handleSelectStaff(e.target.value)}
                className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none font-semibold shadow-xs"
              >
                <option value="">-- Select Appointed Faculty Member --</option>
                {appointedStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email}) — {s.degree || 'Faculty Member'}
                  </option>
                ))}
              </select>
              {appointedStaff.length === 0 ? (
                <p className="text-[11px] text-amber-900 font-medium">
                  Notice: No faculty members appointed yet. Please appoint staff members in the Staff Directorate tab first.
                </p>
              ) : (
                <p className="text-[11px] text-amber-900">
                  Selecting a staff member automatically allots this program to them and showcases their verified credentials on the course card.
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Name *</label>
                  <input
                    type="text"
                    required
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    placeholder="Faculty Member Name"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic / Corporate Title</label>
                  <input
                    type="text"
                    value={instructorTitle}
                    onChange={(e) => setInstructorTitle(e.target.value)}
                    placeholder="Faculty Member & Mentor"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Institution</label>
                  <input
                    type="text"
                    value={instructorCompany}
                    onChange={(e) => setInstructorCompany(e.target.value)}
                    placeholder="Claxic Academic Faculty"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Photo / Avatar URL</label>
                  <input
                    type="url"
                    value={instructorAvatar}
                    onChange={(e) => setInstructorAvatar(e.target.value)}
                    placeholder="https://api.dicebear.com/..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Biography & Background</label>
                <textarea
                  rows={4}
                  value={instructorBio}
                  onChange={(e) => setInstructorBio(e.target.value)}
                  placeholder="Designated faculty mentor and instructor at Claxic..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-900 outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: PROGRAM FAQS */}
        {activeSection === 'faq' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Frequently Asked Questions (FAQs)</h4>
                <p className="text-xs text-slate-500">Provide direct answers regarding hardware, recordings, and certifications</p>
              </div>
              <button
                type="button"
                onClick={handleAddFaq}
                className="px-3.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {faqList.map((f, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D97706]">Question {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={f.question}
                      onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)}
                      placeholder="e.g. Will I receive a verified certificate upon completion?"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      value={f.answer}
                      onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)}
                      placeholder="e.g. Yes, upon finishing all module assignments and the capstone project..."
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="pt-4 flex items-center justify-between border-t border-[#E8E3DC]">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} type="button">
              Cancel
            </Button>
            {courseToEdit && (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleDeleteCourseFromModal}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                title="Permanently Delete Course"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Program</span>
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? 'Saving Program...' : courseToEdit ? 'Save Changes' : 'Publish Course'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
