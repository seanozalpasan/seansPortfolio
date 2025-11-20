import { Analytics } from '../models/index.js';
import crypto from 'crypto';

// Helper to hash IP address
const hashIP = (ip) => {
  const salt = process.env.JWT_SECRET; // Reuse JWT secret as salt
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
};

// Helper to get country from IP address using geojs.io
const getCountryFromIP = async (ip) => {
  try {
    // Don't lookup localhost IPs
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.')) {
      return 'Local';
    }

    // Clean IPv6-wrapped IPv4
    const cleanIP = ip.replace('::ffff:', '');

    const response = await fetch(`https://get.geojs.io/v1/ip/country/${cleanIP}.json`, {
      timeout: 2000 // 2 second timeout
    });

    if (!response.ok) {
      return 'Unknown';
    }

    const data = await response.json();
    return data.country || 'Unknown';
  } catch (error) {
    console.error('GeoIP lookup error:', error.message);
    return 'Unknown';
  }
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

    // Get country from IP (async)
    const country = await getCountryFromIP(ipAddress);

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
        referrer: req.get('Referer') || req.get('Referrer') || 'direct',
        country
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

    // Get country breakdown
    const countryBreakdown = await Analytics.aggregate([
      { $match: query },
      { $group: {
        _id: '$visitorInfo.country',
        count: { $sum: 1 }
      }},
      { $project: {
        country: '$_id',
        count: 1
      }},
      { $sort: { count: -1 } },
      { $limit: 10 } // Top 10 countries
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
        browserBreakdown,
        countryBreakdown
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

// @desc    Clear all analytics data
// @route   DELETE /api/analytics/clear
// @access  Private (Admin)
export const clearAnalytics = async (req, res) => {
  try {
    const result = await Analytics.deleteMany({});

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} analytics entries`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear analytics'
    });
  }
};
