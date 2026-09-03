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

  // Lead Faculty
  const [instructorName, setInstructorName] = useState('Dr. Alex Morgan');
  const [instructorTitle, setInstructorTitle] = useState('Principal AI Architect');
  const [instructorCompany, setInstructorCompany] = useState('Ex-Google & DeepMind Fellow');
  const [instructorAvatar, setInstructorAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300');
  const [instructorBio, setInstructorBio] = useState('Principal architect with 14+ years designing high-scale AI applications.');

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
      setPrice(courseToEdit.price || 14999);
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

      if (courseToEdit.instructor) {
        setInstructorName(courseToEdit.instructor.name || '');
        setInstructorTitle(courseToEdit.instructor.title || '');
        setInstructorCompany(courseToEdit.instructor.company || '');
        setInstructorAvatar(courseToEdit.instructor.avatar || '');
        setInstructorBio(courseToEdit.instructor.bio || '');
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
      setInstructorName('Dr. Alex Morgan');
      setInstructorTitle('Principal AI Architect');
      setInstructorCompany('Ex-Google & DeepMind Fellow');
      setInstructorAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300');
      setInstructorBio('Principal architect with 14+ years designing high-scale AI applications.');
      setFaqList([
        {
          question: 'What are the hardware prerequisites?',
          answer: 'A laptop with at least 8GB RAM, modern web browser, and NodeJS installed.',
        },
      ]);
    }
    setActiveSection('basic');
    setError(null);
  }, [courseToEdit, isOpen]);

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
        price: Number(price),
        originalPrice: Number(originalPrice),
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
        instructor: {
          name: instructorName.trim() || 'Dr. Alex Morgan',
          title: instructorTitle.trim() || 'Lead Faculty',
          company: instructorCompany.trim() || 'Claxic Directorate',
          avatar: instructorAvatar.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
          bio: instructorBio.trim() || 'Distinguished academic lead and faculty director.',
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
      if (onSaved) onSaved();
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
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B4F50] focus:ring-4 focus:ring-[#0B4F50]/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all font-semibold"
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
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B4F50] rounded-xl px-3.5 py-2 text-sm text-slate-900 outline-none"
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
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B4F50] rounded-xl p-3 text-xs sm:text-sm text-slate-900 outline-none leading-relaxed"
              />
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Course Banner Cover Photo
              </label>
              <div className="border-2 border-dashed border-[#b4dede] bg-[#f4f9f9] rounded-2xl p-4 transition-all">
                {bannerImage ? (
                  <div className="space-y-3">
                    <div className="relative h-40 sm:h-48 w-full rounded-xl overflow-hidden bg-slate-100 border border-[#b4dede] shadow-xs">
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
                    className="flex flex-col items-center justify-center py-6 px-4 text-center cursor-pointer hover:bg-[#eaf4f4] rounded-xl transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-[#b4dede] flex items-center justify-center text-[#0B4F50] mb-2">
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
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B4F50] rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Category, Level, Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B4F50] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none font-medium"
                >
                  <option value="AI & Full Stack">AI & Full Stack</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="System Architecture">System Architecture</option>
                  <option value="Cyber Security">Cyber Security</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Data & ML">Data & ML</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B4F50] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none font-medium"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Delivery Mode
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B4F50] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none font-medium"
                >
                  <option value="Live Interactive">Live Interactive</option>
                  <option value="Bootcamp">Bootcamp</option>
                  <option value="Hybrid Workshop">Hybrid Workshop</option>
                  <option value="Self-Paced">Self-Paced</option>
                </select>
              </div>
            </div>

            {/* Pricing, Capacity, Dates */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Tuition (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B4F50] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 font-mono outline-none"
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
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B4F50] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Seat Capacity
                </label>
                <input
                  type="number"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B4F50] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B4F50] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none font-medium"
                >
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="FULL">FULL</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            </div>

            {/* Cohort Dates & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Cohort Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B4F50] rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
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
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B4F50] rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Search Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="AI, FullStack, React"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B4F50] rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
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
                className="w-4 h-4 rounded border-slate-300 text-[#0B4F50] accent-[#0B4F50] cursor-pointer"
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
                className="px-3.5 py-1.5 bg-[#0B4F50] hover:bg-[#073637] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Module</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {modules.map((mod, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#f8fbfb] border border-[#d8ecec] space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0B4F50] uppercase">Module {idx + 1}</span>
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
            <div className="p-4 rounded-2xl bg-[#f8fbfb] border border-[#d8ecec] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Name *</label>
                  <input
                    type="text"
                    required
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    placeholder="Dr. Alex Morgan"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic / Corporate Title</label>
                  <input
                    type="text"
                    value={instructorTitle}
                    onChange={(e) => setInstructorTitle(e.target.value)}
                    placeholder="Principal AI Architect"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Affiliation</label>
                  <input
                    type="text"
                    value={instructorCompany}
                    onChange={(e) => setInstructorCompany(e.target.value)}
                    placeholder="Ex-Google & DeepMind Fellow"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Photo / Avatar URL</label>
                  <input
                    type="url"
                    value={instructorAvatar}
                    onChange={(e) => setInstructorAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
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
                  placeholder="Distinguished researcher and course director with 14+ years architecting scalable cloud and AI platforms..."
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
                className="px-3.5 py-1.5 bg-[#0B4F50] hover:bg-[#073637] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {faqList.map((f, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#f8fbfb] border border-[#d8ecec] space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0B4F50]">Question {idx + 1}</span>
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
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
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
