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
  rotation: {
    type: Number,
    default: 0,
    enum: [0, 90, 180, 270]
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
  // Deliberately has no default. Mongoose writes schema defaults back to the
  // document on any .save(), so a default here would stamp order: 0 onto an
  // existing gallery the first time it was edited — silently moving it, since
  // MongoDB sorts a missing field ahead of 0. createGallery sets this
  // explicitly instead, and galleries predating this field sort by createdAt.
  order: {
    type: Number
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
gallerySchema.index({ order: 1 });

const Gallery = mongoose.model('Gallery', gallerySchema);

export default Gallery;
