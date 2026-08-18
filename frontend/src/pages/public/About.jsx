import { useState, useEffect } from 'react';
import { galleryAPI, imageAPI, analyticsAPI } from '../../services/api';
import './About.css';

const About = () => {
  const [age, setAge] = useState('');
  const [gallery, setGallery] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Birthdate: October 1, 2006 at 4:00 PM
  const birthDate = new Date(2006, 9, 1, 16, 0, 0); // Month is 0-indexed

  // Calculate age in years, days, hours, minutes, seconds
  useEffect(() => {
    const calculateAge = () => {
      const now = new Date();
      const diff = now - birthDate;

      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const years = Math.floor(days / 365.25);

      const remainingDays = Math.floor(days - (years * 365.25));
      const remainingHours = hours % 24;
      const remainingMinutes = minutes % 60;
      const remainingSeconds = seconds % 60;

      setAge(
        `I am ${years} years, ${remainingDays} days, ${remainingHours} hours, ${remainingMinutes} minutes, and ${remainingSeconds} seconds old`
      );
    };

    calculateAge();
    const interval = setInterval(calculateAge, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch "about" gallery
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await galleryAPI.getByName('about');
        setGallery(response.data.data);
      } catch (err) {
        console.error('Error fetching about gallery:', err);
      }
    };

    fetchGallery();
  }, []);

  // Auto-advance carousel every 2 seconds
  useEffect(() => {
    if (!gallery || gallery.images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === gallery.images.length - 1 ? 0 : prev + 1
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [gallery]);

  // Track page view
  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Get or create session ID
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          sessionStorage.setItem('sessionId', sessionId);
        }

        await analyticsAPI.track({
          type: 'pageview',
          page: '/about',
          sessionId
        });
      } catch (error) {
        console.error('Analytics tracking error:', error);
      }
    };

    trackPageView();
  }, []);


  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>Hi! I'm Sean</h1>
        </div>
      </section>

      <section className="about-content">
        <div className="about-container">
          {/* About Text */}
          <div className="about-section">
            <h2>Who I Am</h2>
            <p>I attend <strong>Tufts University</strong> in Boston, MA</p>
            <p>My passions are Embedded Systems, Turkish-American activism, and hanging with friends 🤞</p>
            <p className="age-display">{age}</p>
          </div>

          {/* Photo Carousel */}
          {gallery && gallery.images.length > 0 && (
            <div className="about-section">
              <div className="carousel-container">
                <div className="carousel-image-wrapper">
                  <img
                    key={currentImageIndex}
                    src={imageAPI.getUrl(gallery.images[currentImageIndex].imageId)}
                    alt={gallery.images[currentImageIndex].caption || `Photo ${currentImageIndex + 1}`}
                    className="carousel-image"
                    style={{ transform: `rotate(${gallery.images[currentImageIndex].rotation || 0}deg)` }}
                  />
                  {gallery.images[currentImageIndex].caption && (
                    <p className="carousel-caption">
                      {gallery.images[currentImageIndex].caption}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  );
};

export default About;
