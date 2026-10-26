import express from 'express';
import { 
  generateVisitorCode, 
  verifyVisitorCode, 
  consumeVisitorCode,
  getRecentVisitors
} from '../controllers/visitorCode.controller.js';
import { protect, requireModule } from '../middleware/auth.middleware.js';

const router = express.Router();

// Generate code - accessible by all staff roles (e.g., Student Counsellor)
router.post('/generate', protect, generateVisitorCode);

// Verify code - accessible by Admins or users with visitors module access
router.get('/verify/:code', protect, requireModule('visitors'), verifyVisitorCode);

// Consume code - accessible by Admins or users with visitors module access (write)
router.post('/consume', protect, requireModule('visitors', 'write'), consumeVisitorCode);

// Get recent visitors - accessible by Admins or users with visitors module access
router.get('/recent', protect, requireModule('visitors'), getRecentVisitors);

export default router;
