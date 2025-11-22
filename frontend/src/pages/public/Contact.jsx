import { useState, useEffect } from 'react';
import { resumeAPI, contactAPI } from '../../services/api';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [resumeInfo, setResumeInfo] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(true);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch resume info
  useEffect(() => {
    const fetchResumeInfo = async () => {
      try {
        setResumeLoading(true);
        const response = await resumeAPI.getInfo();
        setResumeInfo(response.data.data);
      } catch (err) {
        console.error('Error fetching resume info:', err);
      } finally {
        setResumeLoading(false);
      }
    };

    fetchResumeInfo();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous status
    setFormStatus({ type: '', message: '' });
    setIsSubmitting(true);

    try {
      const response = await contactAPI.submit(formData);

      if (response.data.success) {
        setFormStatus({
          type: 'success',
          message: response.data.message || 'Message sent successfully! I\'ll get back to you soon.'
        });

        // Clear form on success
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      }
    } catch (err) {
      console.error('Error submitting contact form:', err);

      // Handle rate limiting error
      if (err.response?.status === 429) {
        setFormStatus({
          type: 'error',
          message: 'Too many submissions. Please try again tomorrow.'
        });
      } else {
        setFormStatus({
          type: 'error',
          message: err.response?.data?.message || 'Failed to send message. Please try again.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadResume = async () => {
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
    <div className="contact">
      <section className="contact-hero">
        <div className="contact-hero-content">
          <h1>Get In Touch</h1>
          <p className="contact-tagline">
            Send me a message or download my resume
          </p>
        </div>
      </section>

      <section className="contact-content">
        <div className="contact-container">
          <div className="contact-grid-split">
            {/* Left Side - Contact Form */}
            <div className="contact-form-section">
              <h2>Send a Message</h2>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="What's this about?"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Your message here..."
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>

                {/* Status Message */}
                {formStatus.message && (
                  <div className={`form-status ${formStatus.type}`}>
                    {formStatus.message}
                  </div>
                )}
              </form>
            </div>

            {/* Right Side - Resume */}
            <div className="resume-section">
              <h2>My Resume</h2>
              {resumeLoading ? (
                <div className="resume-loading-small">
                  <div className="spinner"></div>
                  <p>Loading resume...</p>
                </div>
              ) : !resumeInfo ? (
                <div className="resume-not-found">
                  <p>Resume not available at the moment.</p>
                </div>
              ) : (
                <>
                  <div className="resume-actions-small">
                    <button onClick={handleDownloadResume} className="download-btn-small">
                      Download PDF
                    </button>
                    {resumeInfo.uploadDate && (
                      <p className="resume-date">
                        Updated: {new Date(resumeInfo.uploadDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="resume-viewer-small">
                    <iframe
                      src={resumeAPI.getUrl()}
                      title="Resume PDF"
                      className="resume-iframe-small"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
