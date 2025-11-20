import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  trackEvent,
  getStats,
  getRecentEvents,
  clearAnalytics
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Rate limiter for tracking
const trackingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Max 60 requests per minute per IP
  message: {
    success: false,
    message: 'Too many tracking requests'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development' // Skip in development
});

// Public route
router.post('/track', trackingLimiter, trackEvent);

// Protected routes (Admin only)
router.get('/stats', protect, authorize('admin'), getStats);
router.get('/events', protect, authorize('admin'), getRecentEvents);
router.delete('/clear', protect, authorize('admin'), clearAnalytics);

export default router;
