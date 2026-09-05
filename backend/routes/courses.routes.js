import express from 'express';
import { db } from '../db/index.js';

const router = express.Router();

// Get Public Course Catalog
router.get('/', (req, res) => {
  try {
    const { category, level, search, featured, sort } = req.query;
    let courses = Array.isArray(db.raw.courses) ? [...db.raw.courses] : [];

    // Filtering
    if (category && category !== 'All') {
      const targetCat = String(category).toLowerCase();
      courses = courses.filter((c) => c.category && String(c.category).toLowerCase() === targetCat);
    }

    if (level && level !== 'All') {
      const targetLvl = String(level).toLowerCase();
      courses = courses.filter((c) => c.level && String(c.level).toLowerCase() === targetLvl);
    }

    if (featured === 'true') {
      courses = courses.filter((c) => Boolean(c.featured));
    }

    if (search) {
      const q = String(search).toLowerCase();
      courses = courses.filter(
        (c) =>
          (c.title && String(c.title).toLowerCase().includes(q)) ||
          (c.shortDescription && String(c.shortDescription).toLowerCase().includes(q)) ||
          (Array.isArray(c.tags) && c.tags.some((t) => t && String(t).toLowerCase().includes(q)))
      );
    }

    // Sorting
    if (sort === 'price-asc') {
      courses.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sort === 'price-desc') {
      courses.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sort === 'rating') {
      courses.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    } else {
      // Default sort by start date
      courses.sort((a, b) => {
        const tA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const tB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return tA - tB;
      });
    }

    return res.json({ courses, total: courses.length });
  } catch (err) {
    console.error('Course catalog retrieval error:', err);
    return res.status(500).json({ error: 'Failed to retrieve course catalog.' });
  }
});

// Get Distinct Categories & Statistics
router.get('/categories', (req, res) => {
  try {
    const rawCourses = Array.isArray(db.raw.courses) ? db.raw.courses : [];
    const categories = Array.from(new Set(rawCourses.map((c) => c.category).filter(Boolean)));
    const categoryStats = categories.map((cat) => ({
      name: cat,
      count: rawCourses.filter((c) => c.category === cat).length,
    }));
    return res.json({ categories, stats: categoryStats });
  } catch (err) {
    console.error('Course categories error:', err);
    return res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});

// Get Single Course Detail by ID or Slug
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const rawCourses = Array.isArray(db.raw.courses) ? db.raw.courses : [];
    const course = rawCourses.find((c) => c.id === id || c.slug === id);

    if (!course) {
      return res.status(404).json({ error: 'Course offering not found.' });
    }

    return res.json({ course });
  } catch (err) {
    console.error('Course detail error:', err);
    return res.status(500).json({ error: 'Failed to retrieve course.' });
  }
});

// Get Course Classes / Episodes
router.get('/:id/classes', (req, res) => {
  try {
    const { id } = req.params;
    const rawCourses = Array.isArray(db.raw.courses) ? db.raw.courses : [];
    const course = rawCourses.find((c) => c.id === id || c.slug === id);

    if (!course) {
      return res.status(404).json({ error: 'Course offering not found.' });
    }

    const publishedClasses = (course.classes || []).filter((cls) => cls.status === 'PUBLISHED');
    return res.json({ success: true, courseId: course.id, classes: publishedClasses });
  } catch (err) {
    console.error('Course classes error:', err);
    return res.status(500).json({ error: 'Failed to retrieve course classes.' });
  }
});

export default router;
