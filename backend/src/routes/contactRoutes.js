import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  submitContact,
  getContacts,
  getContact,
  updateContactStatus,
  deleteContact
} from '../controllers/contactController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Rate limiter for contact form
const contactLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // Max 3 submissions per IP per day
  message: {
    success: false,
    message: 'Too many contact form submissions. Please try again tomorrow.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public route
router.post('/', contactLimiter, submitContact);

// Protected routes (Admin only)
router.get('/messages', protect, authorize('admin'), getContacts);
router.get('/messages/:id', protect, authorize('admin'), getContact);
router.patch('/messages/:id', protect, authorize('admin'), updateContactStatus);
router.delete('/messages/:id', protect, authorize('admin'), deleteContact);

export default router;
