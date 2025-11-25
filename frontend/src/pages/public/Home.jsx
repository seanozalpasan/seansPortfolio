import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../../services/api';
import './Home.css';

const Home = () => {
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
          page: '/',
          sessionId
        });
      } catch (error) {
        console.error('Analytics tracking error:', error);
      }
    };

    trackPageView();
  }, []);

  return (
    <div className="home-landing">
      <div className="landing-container">
        {/* Left side - Navigation Links */}
        <div className="landing-nav">
          <Link to="/about" className="nav-card">
            <h2>About</h2>
          </Link>
          <Link to="/projects" className="nav-card">
            <h2>Projects</h2>
          </Link>
          <Link to="/hobbies" className="nav-card">
            <h2>Hobbies</h2>
          </Link>
          <Link to="/contact" className="nav-card">
            <h2>Contact</h2>
          </Link>
        </div>

        {/* Right side - Profile Picture */}
        <div className="landing-profile">
          <img
            src="/aboutphoto.jpg"
            alt="Sean Ozalpasan"
            className="profile-image"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
