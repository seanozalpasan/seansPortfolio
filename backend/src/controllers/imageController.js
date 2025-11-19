import { uploadToGridFS, streamFromGridFS, getFileMetadata, deleteFromGridFS } from '../utils/gridfs.js';
import { processImage, generateThumbnail, validateImage, getImageMetadata } from '../utils/imageProcessor.js';
import mongoose from 'mongoose';

// @desc    Upload single image
// @route   POST /api/images/upload
// @access  Private (Admin)
export const uploadImageFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { buffer, originalname, mimetype } = req.file;
    const { alt = '', generateThumb = 'true' } = req.body;

    // Validate image
    await validateImage(buffer);

    // Get image metadata
    const metadata = await getImageMetadata(buffer);

    // Process and optimize image
    const processedBuffer = await processImage(buffer);

    // Upload original/processed image to GridFS
    const uploadedFile = await uploadToGridFS(
      processedBuffer,
      originalname,
      mimetype,
      {
        originalName: originalname,
        uploadedBy: req.user._id,
        alt,
        width: metadata.width,
        height: metadata.height,
        optimized: true
      }
    );

    // Generate and upload thumbnail if requested
    let thumbnailId = null;
    if (generateThumb === 'true') {
      const thumbnailBuffer = await generateThumbnail(processedBuffer);
      const thumbnailFile = await uploadToGridFS(
        thumbnailBuffer,
        `thumb_${originalname}`,
        'image/jpeg',
        {
          originalName: originalname,
          uploadedBy: req.user._id,
          isThumbnail: true,
          parentImageId: uploadedFile._id
        }
      );
      thumbnailId = thumbnailFile._id;
    }

    res.status(201).json({
      success: true,
      data: {
        imageId: uploadedFile._id,
        thumbnailId,
        filename: uploadedFile.filename,
        contentType: uploadedFile.contentType,
        size: uploadedFile.length,
        metadata: uploadedFile.metadata,
        url: `/api/images/${uploadedFile._id}`,
        thumbnailUrl: thumbnailId ? `/api/images/${thumbnailId}` : null
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image'
    });
  }
};

// @desc    Upload multiple images
// @route   POST /api/images/upload-multiple
// @access  Private (Admin)
export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { generateThumbs = 'true' } = req.body;
    const uploadedImages = [];

    for (const file of req.files) {
      try {
        const { buffer, originalname, mimetype } = file;

        // Validate image
        await validateImage(buffer);

        // Get metadata
        const metadata = await getImageMetadata(buffer);

        // Process image
        const processedBuffer = await processImage(buffer);

        // Upload to GridFS
        const uploadedFile = await uploadToGridFS(
          processedBuffer,
          originalname,
          mimetype,
          {
            originalName: originalname,
            uploadedBy: req.user._id,
            width: metadata.width,
            height: metadata.height,
            optimized: true
          }
        );

        // Generate thumbnail if requested
        let thumbnailId = null;
        if (generateThumbs === 'true') {
          const thumbnailBuffer = await generateThumbnail(processedBuffer);
          const thumbnailFile = await uploadToGridFS(
            thumbnailBuffer,
            `thumb_${originalname}`,
            'image/jpeg',
            {
              originalName: originalname,
              uploadedBy: req.user._id,
              isThumbnail: true,
              parentImageId: uploadedFile._id
            }
          );
          thumbnailId = thumbnailFile._id;
        }

        uploadedImages.push({
          imageId: uploadedFile._id,
          thumbnailId,
          filename: uploadedFile.filename,
          url: `/api/images/${uploadedFile._id}`,
          thumbnailUrl: thumbnailId ? `/api/images/${thumbnailId}` : null
        });
      } catch (error) {
        console.error(`Failed to upload ${file.originalname}:`, error);
        // Continue with other files
      }
    }

    res.status(201).json({
      success: true,
      data: {
        uploadedCount: uploadedImages.length,
        totalFiles: req.files.length,
        images: uploadedImages
      }
    });
  } catch (error) {
    console.error('Multiple image upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload images'
    });
  }
};

// @desc    Get image by ID
// @route   GET /api/images/:id
// @access  Public
export const getImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image ID'
      });
    }

    // Get file metadata
    const fileMetadata = await getFileMetadata(id);

    if (!fileMetadata) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Set headers
    res.set('Content-Type', fileMetadata.contentType);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Stream file from GridFS
    const downloadStream = streamFromGridFS(id);

    downloadStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(404).json({
          success: false,
          message: 'Image not found'
        });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Get image error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve image'
      });
    }
  }
};

// @desc    Get image metadata
// @route   GET /api/images/:id/metadata
// @access  Public
export const getImageMetadataById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image ID'
      });
    }

    const fileMetadata = await getFileMetadata(id);

    if (!fileMetadata) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: fileMetadata._id,
        filename: fileMetadata.filename,
        contentType: fileMetadata.contentType,
        size: fileMetadata.length,
        uploadDate: fileMetadata.uploadDate,
        metadata: fileMetadata.metadata
      }
    });
  } catch (error) {
    console.error('Get metadata error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metadata'
    });
  }
};

// @desc    Delete image
// @route   DELETE /api/images/:id
// @access  Private (Admin)
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image ID'
      });
    }

    // Check if image exists
    const fileMetadata = await getFileMetadata(id);

    if (!fileMetadata) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete from GridFS
    await deleteFromGridFS(id);

    // TODO: Check if image is referenced in projects/galleries before deleting
    // For now, we'll just delete it

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image'
    });
  }
};
