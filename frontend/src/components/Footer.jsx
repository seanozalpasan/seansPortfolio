import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-title">Sean Ozalpasan</h3>
          <p className="footer-subtitle">Computer Engineer</p>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/projects">Projects</Link></li>
            <li><Link to="/hobbies">Hobbies</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Connect</h4>
          <div className="footer-social">
            <a
              href="https://github.com/seanozalpasan"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="GitHub"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/sean-ozalpasan-a3763a33a/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="LinkedIn"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          © {currentYear} Sean Ozalpasan. All rights reserved.
        </p>
        <button
          onClick={scrollToTop}
          className="footer-scroll-top"
          aria-label="Scroll to top"
        >
          ↑ Back to Top
        </button>
      </div>
    </footer>
  );
};

export default Footer;
