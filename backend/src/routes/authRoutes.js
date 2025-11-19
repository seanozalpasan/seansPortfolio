import express from 'express';
import { login, verifyToken, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    message: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes
router.post('/login', loginLimiter, login);

// Protected routes
router.get('/verify', protect, verifyToken);
router.get('/me', protect, getMe);

export default router;
