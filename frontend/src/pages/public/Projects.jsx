import { useState, useEffect } from 'react';
import { projectAPI, imageAPI, analyticsAPI } from '../../services/api';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await projectAPI.getAll({ published: true });
        setProjects(response.data.data);
        setFilteredProjects(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter projects by category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(
        projects.filter((project) => project.category === selectedCategory)
      );
    }
  }, [selectedCategory, projects]);

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
          page: '/projects',
          sessionId
        });
      } catch (error) {
        console.error('Analytics tracking error:', error);
      }
    };

    trackPageView();
  }, []);

  // Get unique categories from projects
  const categories = ['all', ...new Set(projects.map((p) => p.category).filter(Boolean))];

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const openProjectModal = (project) => {
    setSelectedProject(project);
  };

  const closeProjectModal = () => {
    setSelectedProject(null);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && selectedProject) {
        closeProjectModal();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [selectedProject]);

  return (
    <div className="projects">
      <section className="projects-hero">
        <div className="projects-hero-content">
          <h1>My Projects</h1>
          <p>Click on the projects to see more!</p>
        </div>
      </section>

      <section className="projects-content">
        <div className="projects-container">
          {categories.length > 1 && (
            <div className="projects-filters">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="projects-loading">
              <div className="spinner"></div>
              <p>Loading projects...</p>
            </div>
          ) : error ? (
            <div className="projects-error">
              <p>{error}</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="projects-empty">
              <p>No projects found{selectedCategory !== 'all' ? ` in category "${selectedCategory}"` : ''}.</p>
            </div>
          ) : (
            <div className="projects-grid">
              {filteredProjects.map((project) => (
                <div
                  key={project._id}
                  className="project-card"
                  onClick={() => openProjectModal(project)}
                >
                  <div className="project-info">
                    <h3>{project.title}</h3>
                    {project.category && (
                      <span className="project-category">{project.category}</span>
                    )}
                    <p className="project-description">{project.shortDescription}</p>
                    {project.tags && project.tags.length > 0 && (
                      <div className="project-technologies">
                        {project.tags.map((tech, index) => (
                          <span key={index} className="tech-tag">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {project.thumbnailImageId && (
                    <div className="project-thumbnail">
                      <img
                        src={imageAPI.getUrl(project.thumbnailImageId)}
                        alt={project.title}
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Project Modal */}
      {selectedProject && (
        <div className="project-modal-overlay" onClick={closeProjectModal}>
          <div className="project-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeProjectModal}>
              ×
            </button>
            <div className="modal-content">
              <h2 className="modal-title">{selectedProject.title}</h2>

              <div className="modal-text-content">
                {selectedProject.category && (
                  <span className="modal-category">{selectedProject.category}</span>
                )}

                <div className="modal-description">
                  <p>{selectedProject.fullDescription}</p>
                </div>

                {selectedProject.tags && selectedProject.tags.length > 0 && (
                  <div className="modal-technologies">
                    <h3>Technologies Used</h3>
                    <div className="tech-tags">
                      {selectedProject.tags.map((tech, index) => (
                        <span key={index} className="tech-tag">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProject.externalLinks && selectedProject.externalLinks.length > 0 && (
                  <div className="modal-links">
                    {selectedProject.externalLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-link"
                      >
                        {link.label} →
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {selectedProject.detailImageIds && selectedProject.detailImageIds.length > 0 && (
                <img
                  src={imageAPI.getUrl(selectedProject.detailImageIds[0])}
                  alt={selectedProject.title}
                  className="modal-image"
                  loading="lazy"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
