import { useState, useEffect } from 'react';
import { resumeAPI } from '../../services/api';
import './ResumePage.css';

function ResumePage() {
  const [resumeInfo, setResumeInfo] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    fetchResumeInfo();
    fetchVersions();
  }, []);

  const fetchResumeInfo = async () => {
    try {
      setLoading(true);
      const response = await resumeAPI.getInfo();
      setResumeInfo(response.data.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setResumeInfo(null);
      } else {
        setError('Failed to load resume info: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await resumeAPI.getVersions();
      setVersions(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch versions:', err);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      e.target.value = '';
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      e.target.value = '';
      return;
    }

    // Confirm replacement if there's an existing resume
    if (resumeInfo) {
      if (!window.confirm('Are you sure you want to replace the current resume?')) {
        e.target.value = '';
        return;
      }
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      await resumeAPI.upload(formData);

      setSuccess('Resume uploaded successfully!');
      fetchResumeInfo();
      fetchVersions();
      e.target.value = '';
    } catch (err) {
      setError('Failed to upload resume: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!window.confirm('Are you sure you want to delete the current resume?')) {
      return;
    }

    try {
      setError('');
      await resumeAPI.delete();
      setSuccess('Resume deleted successfully');
      setResumeInfo(null);
      fetchVersions();
    } catch (err) {
      setError('Failed to delete resume: ' + err.message);
    }
  };

  const handleActivateVersion = async (id) => {
    if (!window.confirm('Are you sure you want to activate this version?')) {
      return;
    }

    try {
      setError('');
      await resumeAPI.activateVersion(id);
      setSuccess('Resume version activated successfully');
      fetchResumeInfo();
      fetchVersions();
    } catch (err) {
      setError('Failed to activate version: ' + err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="resume-page">
        <div className="loading">Loading resume...</div>
      </div>
    );
  }

  return (
    <div className="resume-page">
      <div className="resume-header">
        <h1>Resume Manager</h1>
        <p className="subtitle">Upload and manage your resume PDF</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="message error">
          {error}
          <button onClick={() => setError('')} className="close-message">×</button>
        </div>
      )}
      {success && (
        <div className="message success">
          {success}
          <button onClick={() => setSuccess('')} className="close-message">×</button>
        </div>
      )}

      {/* Upload Section */}
      <div className="upload-section">
        <label htmlFor="resume-upload" className="upload-button">
          {uploading ? 'Uploading...' : resumeInfo ? '↑ Replace Resume' : '+ Upload Resume'}
        </label>
        <input
          id="resume-upload"
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ display: 'none' }}
        />
        <p className="upload-hint">
          PDF only, max 10MB
        </p>
      </div>

      {/* Current Resume */}
      {resumeInfo ? (
        <div className="resume-section">
          <div className="resume-info-card">
            <h2>Current Resume</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Filename:</span>
                <span className="info-value">{resumeInfo.filename}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Size:</span>
                <span className="info-value">{formatFileSize(resumeInfo.size)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Uploaded:</span>
                <span className="info-value">{formatDate(resumeInfo.uploadDate)}</span>
              </div>
            </div>
            <div className="info-actions">
              <a
                href={resumeAPI.getUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-download"
              >
                📥 Download
              </a>
              <button onClick={handleDeleteResume} className="btn-delete">
                🗑️ Delete
              </button>
            </div>
          </div>

          {/* PDF Preview */}
          <div className="resume-preview">
            <h3>Preview</h3>
            <iframe
              src={`${resumeAPI.getUrl()}#toolbar=0`}
              title="Resume Preview"
              className="pdf-iframe"
            />
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>No resume uploaded yet.</p>
          <p>Upload a PDF resume to get started!</p>
        </div>
      )}

      {/* Version History */}
      {versions.length > 0 && (
        <div className="versions-section">
          <div className="versions-header">
            <h2>Version History</h2>
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="btn-toggle"
            >
              {showVersions ? 'Hide' : 'Show'} ({versions.length})
            </button>
          </div>

          {showVersions && (
            <div className="versions-table-container">
              <table className="versions-table">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Filename</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((version) => (
                    <tr key={version.id} className={version.active ? 'active-version' : ''}>
                      <td>v{version.version}</td>
                      <td>{version.filename}</td>
                      <td>{formatFileSize(version.size)}</td>
                      <td>{formatDate(version.uploadDate)}</td>
                      <td>
                        {version.active ? (
                          <span className="badge badge-active">Active</span>
                        ) : (
                          <span className="badge badge-inactive">Inactive</span>
                        )}
                      </td>
                      <td>
                        {!version.active && (
                          <button
                            onClick={() => handleActivateVersion(version.id)}
                            className="btn-activate"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ResumePage;
