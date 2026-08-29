import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [status, setStatus] = useState('PUBLISHED');
  const [featured, setFeatured] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
      setStatus('PUBLISHED');
      setFeatured(false);
    }
    setError(null);
  }, [courseToEdit, isOpen]);

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
      subtitle="Admin Course Manager"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-slate-900">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
            Course Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Applied GenAI & Full-Stack Systems"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
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
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
              Difficulty Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
              Delivery Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
            >
              <option value="Live Interactive">Live Interactive</option>
              <option value="Bootcamp">Bootcamp</option>
              <option value="Hybrid Workshop">Hybrid Workshop</option>
              <option value="Self-Paced">Self-Paced</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
              Tuition Fee (₹) *
            </label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
              Original Fee (₹)
            </label>
            <input
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
              Seat Capacity
            </label>
            <input
              type="number"
              required
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
            >
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="FULL">FULL</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
            Short Description *
          </label>
          <input
            type="text"
            required
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="High-level single sentence summary..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1 font-semibold">
            Full Course Description
          </label>
          <textarea
            rows={3}
            value={fullDescription}
            onChange={(e) => setFullDescription(e.target.value)}
            placeholder="Detailed course overview and methodology..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="featured"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="rounded bg-white border-slate-300 text-indigo-600"
          />
          <label htmlFor="featured" className="text-xs text-slate-700 cursor-pointer font-medium">
            Feature this course on home page hero highlight
          </label>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            {courseToEdit ? 'Save Changes' : 'Create Course Program'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
