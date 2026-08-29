import express from 'express';
import { db } from '../db/index.js';

const router = express.Router();

// Get Public Course Catalog
router.get('/', (req, res) => {
  const { category, level, search, featured, sort } = req.query;
  let courses = [...db.raw.courses];

  // Filtering
  if (category && category !== 'All') {
    courses = courses.filter((c) => c.category.toLowerCase() === category.toLowerCase());
  }

  if (level && level !== 'All') {
    courses = courses.filter((c) => c.level.toLowerCase() === level.toLowerCase());
  }

  if (featured === 'true') {
    courses = courses.filter((c) => c.featured);
  }

  if (search) {
    const q = search.toLowerCase();
    courses = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.shortDescription.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Sorting
  if (sort === 'price-asc') {
    courses.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    courses.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating') {
    courses.sort((a, b) => b.rating - a.rating);
  } else {
    // Default sort by start date
    courses.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  res.json({ courses, total: courses.length });
});

// Get Distinct Categories & Statistics
router.get('/categories', (req, res) => {
  const categories = Array.from(new Set(db.raw.courses.map((c) => c.category)));
  const categoryStats = categories.map((cat) => ({
    name: cat,
    count: db.raw.courses.filter((c) => c.category === cat).length,
  }));
  res.json({ categories, stats: categoryStats });
});

// Get Single Course Detail by ID or Slug
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const course = db.raw.courses.find((c) => c.id === id || c.slug === id);

  if (!course) {
    return res.status(404).json({ error: 'Course offering not found.' });
  }

  res.json({ course });
});

export default router;
