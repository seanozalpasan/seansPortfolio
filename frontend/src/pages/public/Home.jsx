import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
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
