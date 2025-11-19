import sharp from 'sharp';

/**
 * Process and optimize image
 * @param {Buffer} buffer - Original image buffer
 * @param {Object} options - Processing options
 * @returns {Promise<Buffer>} Processed image buffer
 */
export const processImage = async (buffer, options = {}) => {
  const {
    maxWidth = 2000,
    maxHeight = 2000,
    quality = 85,
    format = 'jpeg'
  } = options;

  try {
    let pipeline = sharp(buffer);

    // Get image metadata
    const metadata = await pipeline.metadata();

    // Resize if needed (maintain aspect ratio)
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert to desired format and compress
    if (format === 'jpeg' || format === 'jpg') {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (format === 'png') {
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
    } else if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    }

    return await pipeline.toBuffer();
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

/**
 * Generate thumbnail
 * @param {Buffer} buffer - Original image buffer
 * @param {number} size - Thumbnail size (default 300px)
 * @returns {Promise<Buffer>} Thumbnail buffer
 */
export const generateThumbnail = async (buffer, size = 300) => {
  try {
    return await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
  } catch (error) {
    throw new Error(`Thumbnail generation failed: ${error.message}`);
  }
};

/**
 * Get image metadata
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<Object>} Image metadata
 */
export const getImageMetadata = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
      hasAlpha: metadata.hasAlpha
    };
  } catch (error) {
    throw new Error(`Failed to get image metadata: ${error.message}`);
  }
};

/**
 * Validate image file
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Validation options
 * @returns {Promise<boolean>} True if valid
 */
export const validateImage = async (buffer, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp']
  } = options;

  try {
    // Check file size
    if (buffer.length > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    // Check if it's a valid image
    const metadata = await sharp(buffer).metadata();

    // Check format
    if (!allowedFormats.includes(metadata.format)) {
      throw new Error(`Invalid image format. Allowed: ${allowedFormats.join(', ')}`);
    }

    return true;
  } catch (error) {
    throw error;
  }
};
