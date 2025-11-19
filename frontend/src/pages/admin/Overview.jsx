import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI, contactAPI, analyticsAPI, galleryAPI } from '../../services/api';
import './Overview.css';

const Overview = () => {
  const [stats, setStats] = useState({
    projects: 0,
    contacts: 0,
    galleries: 0,
    visitors: 0,
    loading: true
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [projectsRes, contactsRes, galleriesRes, analyticsRes] = await Promise.all([
        projectAPI.getAll(),
        contactAPI.getAll({ status: 'new' }),
        galleryAPI.getAll(),
        analyticsAPI.getStats({ type: 'pageview' })
      ]);

      setStats({
        projects: projectsRes.data.total || 0,
        contacts: contactsRes.data.total || 0,
        galleries: galleriesRes.data.data?.length || 0,
        visitors: analyticsRes.data.data?.uniqueVisitors || 0,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  if (stats.loading) {
    return (
      <div className="overview-loading">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="overview">
      <h1 className="page-title">Dashboard Overview</h1>
      <p className="page-subtitle">Welcome to your admin panel</p>

      <div className="stats-grid">
        <Link to="/admin/projects" className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-info">
            <div className="stat-value">{stats.projects}</div>
            <div className="stat-label">Total Projects</div>
          </div>
        </Link>

        <Link to="/admin/galleries" className="stat-card">
          <div className="stat-icon">🖼️</div>
          <div className="stat-info">
            <div className="stat-value">{stats.galleries}</div>
            <div className="stat-label">Galleries</div>
          </div>
        </Link>

        <Link to="/admin/contacts" className="stat-card">
          <div className="stat-icon">✉️</div>
          <div className="stat-info">
            <div className="stat-value">{stats.contacts}</div>
            <div className="stat-label">New Messages</div>
          </div>
        </Link>

        <Link to="/admin/analytics" className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.visitors}</div>
            <div className="stat-label">Unique Visitors</div>
          </div>
        </Link>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/admin/projects" className="action-button">
            <span>➕</span>
            Add New Project
          </Link>
          <Link to="/admin/galleries" className="action-button">
            <span>📸</span>
            Upload Photos
          </Link>
          <Link to="/admin/resume" className="action-button">
            <span>📄</span>
            Update Resume
          </Link>
          <Link to="/admin/analytics" className="action-button">
            <span>📊</span>
            View Analytics
          </Link>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Getting Started</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">✅</div>
            <div className="activity-content">
              <p><strong>Backend Setup Complete</strong></p>
              <p className="activity-desc">Your API is running and ready to use</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">🎨</div>
            <div className="activity-content">
              <p><strong>Next Steps</strong></p>
              <p className="activity-desc">Start uploading images and creating projects from the sidebar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
