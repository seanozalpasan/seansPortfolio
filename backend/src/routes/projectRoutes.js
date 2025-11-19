import express from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  togglePublish
} from '../controllers/projectController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getProjects);
router.get('/:id', getProject);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin'), createProject);
router.put('/:id', protect, authorize('admin'), updateProject);
router.delete('/:id', protect, authorize('admin'), deleteProject);
router.patch('/reorder', protect, authorize('admin'), reorderProjects);
router.patch('/:id/toggle-publish', protect, authorize('admin'), togglePublish);

export default router;
