import { Analytics } from '../models/index.js';
import crypto from 'crypto';

// Helper to hash IP address
const hashIP = (ip) => {
  const salt = process.env.JWT_SECRET; // Reuse JWT secret as salt
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
};

// Helper to detect device type from user agent
const detectDevice = (userAgent) => {
  if (!userAgent) return 'unknown';
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
};

// Helper to detect browser from user agent
const detectBrowser = (userAgent) => {
  if (!userAgent) return 'unknown';
  if (/chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent)) return 'Chrome';
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/edge|edg/i.test(userAgent)) return 'Edge';
  return 'Other';
};

// Helper to detect OS from user agent
const detectOS = (userAgent) => {
  if (!userAgent) return 'unknown';
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/ios|iphone|ipad/i.test(userAgent)) return 'iOS';
  return 'Other';
};

// @desc    Track visitor action
// @route   POST /api/analytics/track
// @access  Public (rate-limited)
export const trackEvent = async (req, res) => {
  try {
    const {
      type,
      page,
      elementId,
      sessionId,
      duration
    } = req.body;

    if (!type || !page || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, page, sessionId'
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const analytics = await Analytics.create({
      type,
      page,
      elementId,
      sessionId,
      visitorInfo: {
        ipHash: hashIP(ipAddress),
        userAgent,
        browser: detectBrowser(userAgent),
        os: detectOS(userAgent),
        device: detectDevice(userAgent),
        referrer: req.get('Referer') || req.get('Referrer') || 'direct'
      },
      duration: duration || null
    });

    res.status(201).json({
      success: true,
      message: 'Event tracked'
    });
  } catch (error) {
    console.error('Track event error:', error);
    // Fail silently for analytics - don't disrupt user experience
    res.status(200).json({
      success: true,
      message: 'Event received'
    });
  }
};

// @desc    Get analytics stats
// @route   GET /api/analytics/stats
// @access  Private (Admin)
export const getStats = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      page,
      type = 'pageview'
    } = req.query;

    // Build query
    const query = { type };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (page) {
      query.page = page;
    }

    // Get total pageviews
    const totalPageViews = await Analytics.countDocuments(query);

    // Get unique visitors (by sessionId)
    const uniqueVisitors = await Analytics.distinct('sessionId', query);

    // Get popular pages
    const popularPages = await Analytics.aggregate([
      { $match: query },
      { $group: {
        _id: '$page',
        views: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$sessionId' }
      }},
      { $project: {
        page: '$_id',
        views: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' }
      }},
      { $sort: { views: -1 } },
      { $limit: 10 }
    ]);

    // Get device breakdown
    const deviceBreakdown = await Analytics.aggregate([
      { $match: query },
      { $group: {
        _id: '$visitorInfo.device',
        count: { $sum: 1 }
      }},
      { $project: {
        device: '$_id',
        count: 1
      }}
    ]);

    // Get daily views
    const dailyViews = await Analytics.aggregate([
      { $match: query },
      { $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
        },
        views: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $limit: 90 } // Last 90 days
    ]);

    // Get browser breakdown
    const browserBreakdown = await Analytics.aggregate([
      { $match: query },
      { $group: {
        _id: '$visitorInfo.browser',
        count: { $sum: 1 }
      }},
      { $project: {
        browser: '$_id',
        count: 1
      }}
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPageViews,
        uniqueVisitors: uniqueVisitors.length,
        popularPages,
        deviceBreakdown,
        dailyViews: dailyViews.map(d => ({
          date: d._id,
          views: d.views
        })),
        browserBreakdown
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

// @desc    Get recent analytics events
// @route   GET /api/analytics/events
// @access  Private (Admin)
export const getRecentEvents = async (req, res) => {
  try {
    const { limit = 50, type } = req.query;

    const query = {};
    if (type) {
      query.type = type;
    }

    const events = await Analytics.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
};
