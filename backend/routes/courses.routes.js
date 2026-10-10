import express from 'express';
import { db } from '../db/index.js';

const router = express.Router();

// Helper: Strictly ensure course instructor reflects real appointed staff from DB
export function enrichCourseWithRealStaff(course) {
  if (!course) return course;

  const activeAllotments = db.raw.staffCourseAllotments || [];
  const users = db.raw.users || [];

  // 1. Check if course has an active allotment in staffCourseAllotments to an existing active STAFF user
  const allotment = activeAllotments.find(
    (a) => a.courseId === course.id && a.status === 'ACTIVE'
  );

  if (allotment) {
    const staff = users.find(
      (u) => u.id === allotment.staffId && u.role === 'STAFF' && u.isActive !== false
    );
    if (staff) {
      return {
        ...course,
        instructor: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          title: staff.degree || 'Faculty Member & Mentor',
          company: staff.institution || 'Claxic Academic Faculty',
          avatar: staff.avatar,
          bio: `${staff.name} is a designated faculty mentor and instructor at Claxic.`,
        },
      };
    }
  }

  // 2. Check if course.instructor is linked to an existing real staff user
  if (course.instructor && typeof course.instructor === 'object' && course.instructor.name) {
    const matchingStaff = users.find(
      (u) =>
        u.role === 'STAFF' &&
        u.isActive !== false &&
        (u.id === course.instructor.id ||
          (u.email && course.instructor.email && u.email.toLowerCase() === course.instructor.email.toLowerCase()) ||
          u.name.trim().toLowerCase() === course.instructor.name.trim().toLowerCase())
    );
    if (matchingStaff) {
      return {
        ...course,
        instructor: {
          id: matchingStaff.id,
          name: matchingStaff.name,
          email: matchingStaff.email,
          title: matchingStaff.degree || course.instructor.title || 'Faculty Member',
          company: matchingStaff.institution || course.instructor.company || 'Claxic Academic Faculty',
          avatar: matchingStaff.avatar || course.instructor.avatar,
          bio: course.instructor.bio || `${matchingStaff.name} is a designated faculty mentor and instructor at Claxic.`,
        },
      };
    }
  }

  // 3. Fallback: If no real staff is associated, NEVER return a non-existent fake staff member!
  return {
    ...course,
    instructor: {
      name: 'Claxic Academic Faculty',
      title: 'Faculty Lead',
      company: 'Claxic Directorate',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Claxic',
      bio: 'Accredited curriculum managed by the Claxic Academic Directorate.',
    },
  };
}

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

    const enrichedCourses = courses.map(enrichCourseWithRealStaff);
    return res.json({ courses: enrichedCourses, total: enrichedCourses.length });
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

    return res.json({ course: enrichCourseWithRealStaff(course) });
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

    const publishedClasses = (course.classes || [])
      .filter((cls) => cls.status === 'PUBLISHED')
      .map((cls) => ({
        ...cls,
        videoUrl: cls.videoUrl || cls.videoPath || (cls.hasLocalVideo ? `/api/learning/courses/${course.id}/classes/${cls.id}/video-stream` : ''),
        videoPath: cls.videoPath || (cls.hasLocalVideo ? `/api/learning/courses/${course.id}/classes/${cls.id}/video-stream` : ''),
      }));
    return res.json({ success: true, courseId: course.id, classes: publishedClasses });
  } catch (err) {
    console.error('Course classes error:', err);
    return res.status(500).json({ error: 'Failed to retrieve course classes.' });
  }
});

export default router;
