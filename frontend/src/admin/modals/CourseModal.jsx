import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';

export const CourseModal = ({ isOpen, onClose, courseToEdit, onSaved }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('AI & Full Stack');
  const [level, setLevel] = useState('Intermediate');
  const [mode, setMode] = useState('Live Interactive');
  const [duration, setDuration] = useState('10 Weeks');
  const [price, setPrice] = useState(14999);
  const [originalPrice, setOriginalPrice] = useState(24999);
  const [capacity, setCapacity] = useState(40);
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [status, setStatus] = useState('PUBLISHED');
  const [featured, setFeatured] = useState(false);

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
      setPrice(courseToEdit.price || 14999);
      setOriginalPrice(courseToEdit.originalPrice || 24999);
      setCapacity(courseToEdit.capacity || 40);
      setShortDescription(courseToEdit.shortDescription || '');
      setFullDescription(courseToEdit.fullDescription || '');
      setBannerImage(courseToEdit.bannerImage || '');
      setStatus(courseToEdit.status || 'PUBLISHED');
      setFeatured(Boolean(courseToEdit.featured));
    } else {
      setTitle('');
      setCategory('AI & Full Stack');
      setLevel('Intermediate');
      setMode('Live Interactive');
      setDuration('10 Weeks');
      setPrice(14999);
      setOriginalPrice(24999);
      setCapacity(40);
      setShortDescription('');
      setFullDescription('');
      setBannerImage('');
      setStatus('PUBLISHED');
      setFeatured(false);
    }
    setError(null);
  }, [courseToEdit, isOpen]);

  // Handle Manual Photo Upload from Device
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('claxic_token');
      const url = courseToEdit ? `/api/admin/courses/${courseToEdit.id}` : '/api/admin/courses';
      const method = courseToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          category,
          level,
          mode,
          duration: duration.trim(),
          price: Number(price),
          originalPrice: Number(originalPrice),
          capacity: Number(capacity),
          shortDescription: shortDescription.trim(),
          fullDescription: fullDescription.trim(),
          bannerImage: bannerImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
          status,
          featured,
        }),
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
      title={courseToEdit ? 'Edit Course Program' : 'Create New Course Program'}
      subtitle="Administrative Course Manager & Media Studio"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-slate-900">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all"
          />
        </div>

        {/* MANUAL PHOTO UPLOAD SECTION */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Course Banner Photo / Cover Image
          </label>
          
          <div className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/40 rounded-2xl p-4 transition-all">
            {bannerImage ? (
              <div className="space-y-3">
                <div className="relative h-40 sm:h-48 w-full rounded-xl overflow-hidden bg-slate-100 border border-purple-200 shadow-xs">
                  <img
                    src={bannerImage}
                    alt="Course Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-700 text-white shadow-md transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Photo attached and ready to publish
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-purple-700 hover:text-purple-900 font-semibold cursor-pointer"
                  >
                    Change photo
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center py-6 px-4 text-center cursor-pointer hover:bg-purple-50/70 rounded-xl transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-purple-200 flex items-center justify-center text-purple-600 mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  Click to upload course photo from your device
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Supports JPG, PNG, WEBP up to 5MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Optional Direct URL Fallback */}
          <div className="flex items-center gap-2 pt-1">
            <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="url"
              value={bannerImage.startsWith('data:') ? '' : bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
              placeholder="Or paste an image URL (e.g. https://images.unsplash.com/...)"
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none"
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
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none font-medium"
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
              Difficulty Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none font-medium"
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
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none font-medium"
            >
              <option value="Live Interactive">Live Interactive</option>
              <option value="Bootcamp">Bootcamp</option>
              <option value="Hybrid Workshop">Hybrid Workshop</option>
              <option value="Self-Paced">Self-Paced</option>
            </select>
          </div>
        </div>

        {/* Pricing, Duration, Capacity, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Tuition (₹) *
            </label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Original Fee (₹)
            </label>
            <input
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono outline-none"
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
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none font-medium"
            >
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="FULL">FULL</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>

        {/* Short Description */}
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
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 outline-none"
          />
        </div>

        {/* Full Course Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Full Curriculum Overview
          </label>
          <textarea
            rows={3}
            value={fullDescription}
            onChange={(e) => setFullDescription(e.target.value)}
            placeholder="Detailed course overview, tools covered, and learning methodology..."
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl p-3 text-sm text-slate-900 outline-none"
          />
        </div>

        {/* Feature checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="featured"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
          />
          <label htmlFor="featured" className="text-xs text-slate-700 cursor-pointer font-medium select-none">
            Feature this course program in public spotlight
          </label>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-sm hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : courseToEdit ? 'Update Course' : 'Create Course'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
