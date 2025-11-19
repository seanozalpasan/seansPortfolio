import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    trim: true,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  fullDescription: {
    type: String,
    required: [true, 'Full description is required'],
    trim: true
  },
  thumbnailImageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: [true, 'Thumbnail image is required']
  },
  detailImageIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],
  pdfFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File' // GridFS reference
  },
  category: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    enum: ['research', 'presentation', 'code', 'academic', 'personal', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  featured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  externalLinks: [{
    type: {
      type: String,
      enum: ['github', 'demo', 'paper', 'video', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    label: String
  }],
  metadata: {
    date: Date,
    organization: String,
    location: String
  },
  published: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
projectSchema.index({ order: 1 });
projectSchema.index({ published: 1, featured: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ tags: 1 });

// Virtual for thumbnail URL
projectSchema.virtual('thumbnailUrl').get(function() {
  return this.thumbnailImageId ? `/api/images/${this.thumbnailImageId}` : null;
});

// Ensure virtuals are included when converting to JSON
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

const Project = mongoose.model('Project', projectSchema);

export default Project;
