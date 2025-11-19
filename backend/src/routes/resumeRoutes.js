import express from 'express';
import {
  getResume,
  getResumeInfo,
  getResumeVersions,
  uploadResume,
  deleteResume,
  activateResumeVersion
} from '../controllers/resumeController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadResume as uploadResumeMiddleware, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getResume);

// Protected routes (Admin only)
router.get('/info', protect, authorize('admin'), getResumeInfo);
router.get('/versions', protect, authorize('admin'), getResumeVersions);
router.post(
  '/upload',
  protect,
  authorize('admin'),
  uploadResumeMiddleware.single('resume'),
  handleUploadError,
  uploadResume
);
router.delete('/', protect, authorize('admin'), deleteResume);
router.patch('/activate/:id', protect, authorize('admin'), activateResumeVersion);

export default router;
