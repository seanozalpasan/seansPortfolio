import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['pageview', 'click', 'download', 'form_submit'],
    index: true
  },
  page: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  elementId: {
    type: String,
    trim: true
  },
  sessionId: {
    type: String,
    required: true
  },
  visitorInfo: {
    ipHash: {
      type: String,
      required: true
    },
    userAgent: String,
    browser: String,
    os: String,
    device: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown'
    },
    referrer: String,
    country: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  duration: {
    type: Number, // Time on page in seconds
    min: 0
  }
}, {
  timestamps: false // We're using custom timestamp field
});

// Compound indexes for efficient queries
analyticsSchema.index({ timestamp: -1 });
analyticsSchema.index({ page: 1, timestamp: -1 });
analyticsSchema.index({ sessionId: 1 });
analyticsSchema.index({ type: 1, timestamp: -1 });

// TTL index - automatically delete analytics data older than 1 year
analyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
