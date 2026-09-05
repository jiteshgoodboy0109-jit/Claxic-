import express from 'express';
import authRoutes from './auth.routes.js';
import coursesRoutes from './courses.routes.js';
import applicationsRoutes from './applications.routes.js';
import paymentsRoutes from './payments.routes.js';
import adminRoutes from './admin.routes.js';
import staffRoutes from './staff.routes.js';
import learningRoutes from './learning.routes.js';

const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Claxic Admissions Engine',
    database: 'SQLite 3 WAL Engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Directory Index
router.get('/', (req, res) => {
  res.json({
    name: 'Claxic Admissions API',
    version: '1.0.0',
    documentation: 'https://claxic.edu/docs',
    endpoints: {
      auth: '/api/auth',
      courses: '/api/courses',
      applications: '/api/applications',
      payments: '/api/payments',
      admin: '/api/admin',
      staff: '/api/staff',
      learning: '/api/learning',
    },
  });
});

// Mount Route Modules
router.use('/auth', authRoutes);
router.use('/courses', coursesRoutes);
router.use('/applications', applicationsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/admin', adminRoutes);
router.use('/staff', staffRoutes);
router.use('/learning', learningRoutes);

// Compatibility alias for user applications, payments, courses, and projects
router.use('/user/applications', (req, res, next) => {
  req.url = '/user';
  applicationsRoutes(req, res, next);
});

router.use('/user/payments', (req, res, next) => {
  req.url = '/user';
  paymentsRoutes(req, res, next);
});

router.use('/user/courses', (req, res, next) => {
  req.url = '/my-courses';
  learningRoutes(req, res, next);
});

router.use('/user/projects', (req, res, next) => {
  req.url = '/projects';
  learningRoutes(req, res, next);
});

export default router;
