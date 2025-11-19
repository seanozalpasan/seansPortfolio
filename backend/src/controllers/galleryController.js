import { Gallery } from '../models/index.js';
import mongoose from 'mongoose';

// @desc    Create new gallery
// @route   POST /api/galleries
// @access  Private (Admin)
export const createGallery = async (req, res) => {
  try {
    const { name, displayName, description } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Gallery name and display name are required'
      });
    }

    // Check if gallery already exists
    const existingGallery = await Gallery.findOne({ name: name.toLowerCase() });
    if (existingGallery) {
      return res.status(400).json({
        success: false,
        message: 'Gallery with this name already exists'
      });
    }

    const gallery = await Gallery.create({
      name: name.toLowerCase(),
      displayName,
      description: description || '',
      images: [],
      settings: {
        carouselSpeed: 1600,
        displayType: 'carousel',
        showCaptions: false
      },
      active: true
    });

    res.status(201).json({
      success: true,
      data: gallery,
      message: 'Gallery created successfully'
    });
  } catch (error) {
    console.error('Create gallery error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create gallery'
    });
  }
};

// @desc    Delete gallery
// @route   DELETE /api/galleries/:name
// @access  Private (Admin)
export const deleteGallery = async (req, res) => {
  try {
    const { name } = req.params;

    const gallery = await Gallery.findOne({ name: name.toLowerCase() });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }

    await Gallery.deleteOne({ name: name.toLowerCase() });

    res.status(200).json({
      success: true,
      message: 'Gallery deleted successfully'
    });
  } catch (error) {
    console.error('Delete gallery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gallery'
    });
  }
};

// @desc    Get all galleries or specific gallery by name
// @route   GET /api/galleries OR /api/galleries/:name
// @access  Public (active only) / Private (all if admin)
export const getGalleries = async (req, res) => {
  try {
    const { name } = req.params;
    const { active } = req.query;

    let query = {};

    if (name) {
      query.name = name.toLowerCase();
    }

    // If not admin, only show active galleries
    if (!req.user || req.user.role !== 'admin') {
      query.active = true;
    } else if (active !== undefined) {
      query.active = active === 'true';
    }

    let galleries = await Gallery.find(query);

    // Sort images by order field
    galleries = galleries.map(gallery => {
      if (gallery.images && gallery.images.length > 0) {
        gallery.images.sort((a, b) => a.order - b.order);
      }
      return gallery;
    });

    if (name && galleries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }

    res.status(200).json({
      success: true,
      data: name ? galleries[0] : galleries
    });
  } catch (error) {
    console.error('Get galleries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch galleries'
    });
  }
};

// @desc    Add images to gallery
// @route   POST /api/galleries/:name/images
// @access  Private (Admin)
export const addImagesToGallery = async (req, res) => {
  try {
    const { name } = req.params;
    const { images } = req.body; // Array of { imageId, caption, metadata }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of images'
      });
    }

    const gallery = await Gallery.findOne({ name: name.toLowerCase() });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }

    // Add images with order numbers
    const currentMaxOrder = gallery.images.length > 0
      ? Math.max(...gallery.images.map(img => img.order))
      : -1;

    const newImages = images.map((img, index) => ({
      imageId: img.imageId,
      caption: img.caption || '',
      order: currentMaxOrder + 1 + index,
      metadata: img.metadata || {}
    }));

    gallery.images.push(...newImages);
    await gallery.save();

    res.status(201).json({
      success: true,
      data: {
        addedCount: newImages.length,
        gallery
      }
    });
  } catch (error) {
    console.error('Add images error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add images'
    });
  }
};

// @desc    Update image in gallery
// @route   PUT /api/galleries/:name/images/:imageId
// @access  Private (Admin)
export const updateGalleryImage = async (req, res) => {
  try {
    const { name, imageId } = req.params;
    const { caption, order, metadata } = req.body;

    const gallery = await Gallery.findOne({ name: name.toLowerCase() });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }

    const imageIndex = gallery.images.findIndex(
      img => img.imageId.toString() === imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in gallery'
      });
    }

    // Update fields
    if (caption !== undefined) gallery.images[imageIndex].caption = caption;
    if (order !== undefined) gallery.images[imageIndex].order = order;
    if (metadata !== undefined) gallery.images[imageIndex].metadata = { ...gallery.images[imageIndex].metadata, ...metadata };

    await gallery.save();

    res.status(200).json({
      success: true,
      data: gallery
    });
  } catch (error) {
    console.error('Update image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update image'
    });
  }
};

// @desc    Remove image from gallery
// @route   DELETE /api/galleries/:name/images/:imageId
// @access  Private (Admin)
export const removeImageFromGallery = async (req, res) => {
  try {
    const { name, imageId } = req.params;

    const gallery = await Gallery.findOne({ name: name.toLowerCase() });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }

    const initialLength = gallery.images.length;
    gallery.images = gallery.images.filter(
      img => img.imageId.toString() !== imageId
    );

    if (gallery.images.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in gallery'
      });
    }

    await gallery.save();

    res.status(200).json({
      success: true,
      message: 'Image removed from gallery',
      data: gallery
    });
  } catch (error) {
    console.error('Remove image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove image'
    });
  }
};

// @desc    Reorder images in gallery
// @route   PATCH /api/galleries/:name/reorder
// @access  Private (Admin)
export const reorderGalleryImages = async (req, res) => {
  try {
    const { name } = req.params;
    const { images } = req.body; // Array of { imageId, order }

    if (!Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: 'Images must be an array'
      });
    }

    const gallery = await Gallery.findOne({ name: name.toLowerCase() });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }

    // Update order for each image
    images.forEach(({ imageId, order }) => {
      const imageIndex = gallery.images.findIndex(
        img => img.imageId.toString() === imageId
      );
      if (imageIndex !== -1) {
        gallery.images[imageIndex].order = order;
      }
    });

    await gallery.save();

    res.status(200).json({
      success: true,
      message: 'Images reordered successfully',
      data: gallery
    });
  } catch (error) {
    console.error('Reorder images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder images'
    });
  }
};

// @desc    Update gallery settings
// @route   PUT /api/galleries/:name/settings
// @access  Private (Admin)
export const updateGallerySettings = async (req, res) => {
  try {
    const { name } = req.params;
    const { carouselSpeed, displayType, showCaptions } = req.body;

    const gallery = await Gallery.findOne({ name: name.toLowerCase() });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }

    // Update settings
    if (carouselSpeed !== undefined) gallery.settings.carouselSpeed = carouselSpeed;
    if (displayType !== undefined) gallery.settings.displayType = displayType;
    if (showCaptions !== undefined) gallery.settings.showCaptions = showCaptions;

    await gallery.save();

    res.status(200).json({
      success: true,
      data: gallery
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update settings'
    });
  }
};
