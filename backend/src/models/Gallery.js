import mongoose from 'mongoose';

const imageInGallerySchema = new mongoose.Schema({
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: true
  },
  caption: {
    type: String,
    trim: true,
    maxlength: [500, 'Caption cannot exceed 500 characters']
  },
  order: {
    type: Number,
    default: 0
  },
  metadata: {
    dateTaken: Date,
    location: String,
    tags: [String]
  }
}, { _id: false });

const gallerySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Gallery name is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Only allow alphanumeric characters and hyphens
        return /^[a-z0-9-]+$/.test(v);
      },
      message: 'Gallery name can only contain lowercase letters, numbers, and hyphens'
    }
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  images: [imageInGallerySchema],
  settings: {
    carouselSpeed: {
      type: Number,
      default: 1600, // milliseconds
      min: [500, 'Carousel speed must be at least 500ms'],
      max: [10000, 'Carousel speed cannot exceed 10000ms']
    },
    displayType: {
      type: String,
      enum: ['carousel', 'grid', 'masonry'],
      default: 'carousel'
    },
    showCaptions: {
      type: Boolean,
      default: false
    }
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
gallerySchema.index({ name: 1 }, { unique: true });
gallerySchema.index({ active: 1 });

const Gallery = mongoose.model('Gallery', gallerySchema);

export default Gallery;
