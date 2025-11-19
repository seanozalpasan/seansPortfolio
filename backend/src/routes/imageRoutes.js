import express from 'express';
import {
  uploadImageFile,
  uploadMultipleImages,
  getImage,
  getImageMetadataById,
  deleteImage
} from '../controllers/imageController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadImage, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/:id', getImage);
router.get('/:id/metadata', getImageMetadataById);

// Protected routes (Admin only)
router.post(
  '/upload',
  protect,
  authorize('admin'),
  uploadImage.single('image'),
  handleUploadError,
  uploadImageFile
);

router.post(
  '/upload-multiple',
  protect,
  authorize('admin'),
  uploadImage.array('images', 20), // Max 20 images at once
  handleUploadError,
  uploadMultipleImages
);

router.delete('/:id', protect, authorize('admin'), deleteImage);

export default router;
