import { useState, useEffect } from 'react';
import { resumeAPI } from '../../services/api';
import './Resume.css';

const Resume = () => {
  const [resumeInfo, setResumeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch resume info
  useEffect(() => {
    const fetchResumeInfo = async () => {
      try {
        setLoading(true);
        const response = await resumeAPI.getInfo();
        setResumeInfo(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching resume info:', err);
        if (err.response?.status === 404) {
          setError('No resume has been uploaded yet.');
        } else {
          setError('Failed to load resume. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResumeInfo();
  }, []);

  const handleDownload = async () => {
    try {
      const response = await resumeAPI.get();
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resumeInfo?.filename || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading resume:', err);
      alert('Failed to download resume. Please try again.');
    }
  };

  return (
    <div className="resume-page">
      <section className="resume-hero">
        <div className="resume-hero-content">
          <h1>Resume</h1>
          <p className="resume-tagline">My professional experience and skills</p>
        </div>
      </section>

      <section className="resume-content">
        <div className="resume-container">
          {loading ? (
            <div className="resume-loading">
              <div className="spinner"></div>
              <p>Loading resume...</p>
            </div>
          ) : error ? (
            <div className="resume-error">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className="resume-actions">
                <button className="download-btn" onClick={handleDownload}>
                  Download PDF
                </button>
                {resumeInfo?.uploadedAt && (
                  <p className="resume-note">
                    Last updated: {new Date(resumeInfo.uploadedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="resume-viewer">
                <iframe
                  src={resumeAPI.getUrl()}
                  title="Resume PDF"
                  className="resume-iframe"
                />
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Resume;
