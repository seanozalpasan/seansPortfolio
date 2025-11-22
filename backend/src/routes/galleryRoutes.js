import express from 'express';
import {
  getGalleries,
  createGallery,
  deleteGallery,
  addImagesToGallery,
  updateGalleryImage,
  removeImageFromGallery,
  reorderGalleryImages,
  updateGalleryMetadata,
  updateGallerySettings
} from '../controllers/galleryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getGalleries);
router.get('/:name', getGalleries);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin'), createGallery);
router.put('/:name', protect, authorize('admin'), updateGalleryMetadata);
router.delete('/:name', protect, authorize('admin'), deleteGallery);
router.post('/:name/images', protect, authorize('admin'), addImagesToGallery);
router.put('/:name/images/:imageId', protect, authorize('admin'), updateGalleryImage);
router.delete('/:name/images/:imageId', protect, authorize('admin'), removeImageFromGallery);
router.patch('/:name/reorder', protect, authorize('admin'), reorderGalleryImages);
router.put('/:name/settings', protect, authorize('admin'), updateGallerySettings);

export default router;
