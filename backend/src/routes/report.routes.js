import express from 'express';
import { protect, requireModule } from '../middleware/auth.middleware.js';
import { getDailyCallReports, getConversionReports, getLeadsAbstract } from '../controllers/report.controller.js';

const router = express.Router();

// All routes require authentication and Reports module access
router.use(protect);
router.use(requireModule('reports'));

// Report routes
router.get('/calls/daily', getDailyCallReports);
router.get('/conversions', getConversionReports);
router.get('/leads-abstract', getLeadsAbstract);

export default router;

