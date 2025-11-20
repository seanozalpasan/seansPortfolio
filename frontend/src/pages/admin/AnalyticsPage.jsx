import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './AnalyticsPage.css';

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // Days
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Fetch analytics stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const response = await api.get('/analytics/stats', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });

      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  // Clear all analytics data
  const clearAnalytics = async () => {
    try {
      setClearing(true);
      await api.delete('/analytics/clear');
      setShowClearConfirm(false);
      await fetchStats(); // Refresh stats
      alert('All analytics data has been cleared successfully!');
    } catch (err) {
      console.error('Error clearing analytics:', err);
      alert(err.response?.data?.message || 'Failed to clear analytics data');
    } finally {
      setClearing(false);
    }
  };

  // Chart colors
  const COLORS = ['#ff9955', '#ffbb88', '#66bb6a', '#42a5f5', '#ab47bc', '#ffa726'];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{label}</p>
          <p className="value">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <div className="header-actions">
          <div className="date-range-selector">
            <label>Time Period:</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <button
            className="btn-clear-data"
            onClick={() => setShowClearConfirm(true)}
            disabled={clearing}
          >
            Clear All Data
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Clear All Analytics Data?</h2>
            <p>
              This will permanently delete all analytics data including pageviews, visitor stats,
              and country information. This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn-confirm-clear"
                onClick={clearAnalytics}
                disabled={clearing}
              >
                {clearing ? 'Clearing...' : 'Yes, Clear All Data'}
              </button>
              <button
                className="btn-cancel-clear"
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-info">
            <h3>Total Pageviews</h3>
            <p className="stat-value">{stats.totalPageViews.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Unique Visitors</h3>
            <p className="stat-value">{stats.uniqueVisitors.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Avg. Views/Visitor</h3>
            <p className="stat-value">
              {stats.uniqueVisitors > 0
                ? (stats.totalPageViews / stats.uniqueVisitors).toFixed(1)
                : '0'}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <h3>Pages Tracked</h3>
            <p className="stat-value">{stats.popularPages.length}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Pageviews Over Time */}
        <div className="chart-card full-width">
          <h2>Pageviews Over Time</h2>
          {stats.dailyViews && stats.dailyViews.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyViews}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                  dataKey="date"
                  stroke="#aaa"
                  tick={{ fill: '#aaa' }}
                />
                <YAxis stroke="#aaa" tick={{ fill: '#aaa' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#ff9955"
                  strokeWidth={2}
                  dot={{ fill: '#ff9955', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No pageview data available for this period</div>
          )}
        </div>
      </div>

      {/* Device & Browser Charts */}
      <div className="charts-row">
        {/* Device Breakdown */}
        <div className="chart-card half-width">
          <h2>Device Breakdown</h2>
          {stats.deviceBreakdown && stats.deviceBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.deviceBreakdown}
                  dataKey="count"
                  nameKey="device"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ device, count }) => `${device}: ${count}`}
                >
                  {stats.deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No device data available</div>
          )}
        </div>

        {/* Browser Breakdown */}
        <div className="chart-card half-width">
          <h2>Browser Breakdown</h2>
          {stats.browserBreakdown && stats.browserBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.browserBreakdown}
                  dataKey="count"
                  nameKey="browser"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ browser, count }) => `${browser}: ${count}`}
                >
                  {stats.browserBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No browser data available</div>
          )}
        </div>
      </div>

      {/* Country Breakdown */}
      <div className="charts-row">
        <div className="chart-card">
          <h2>Visitors by Country (Top 10)</h2>
          {stats.countryBreakdown && stats.countryBreakdown.length > 0 ? (
            <div className="table-container">
              <table className="country-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Country</th>
                    <th>Visitors</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.countryBreakdown.map((country, index) => (
                    <tr key={index}>
                      <td className="rank">#{index + 1}</td>
                      <td className="country-name">{country.country}</td>
                      <td>{country.count.toLocaleString()}</td>
                      <td className="percentage">
                        {((country.count / stats.totalPageViews) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">No country data available</div>
          )}
        </div>
      </div>

      {/* Popular Pages Table */}
      <div className="chart-card">
        <h2>Popular Pages</h2>
        {stats.popularPages && stats.popularPages.length > 0 ? (
          <div className="table-container">
            <table className="popular-pages-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Views</th>
                  <th>Unique Visitors</th>
                  <th>Avg. Views/Visitor</th>
                </tr>
              </thead>
              <tbody>
                {stats.popularPages.map((page, index) => (
                  <tr key={index}>
                    <td className="page-url">{page.page}</td>
                    <td>{page.views.toLocaleString()}</td>
                    <td>{page.uniqueVisitors.toLocaleString()}</td>
                    <td>
                      {page.uniqueVisitors > 0
                        ? (page.views / page.uniqueVisitors).toFixed(1)
                        : '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">No page data available</div>
        )}
      </div>

      {/* Info Message */}
      {stats.totalPageViews === 0 && (
        <div className="info-message">
          <h3>No Analytics Data Yet</h3>
          <p>
            Analytics tracking will begin once your public website is live and visitors start
            browsing your pages. The tracking is privacy-focused and only collects anonymous
            visitor statistics.
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
