import { useState, useEffect } from 'react';
import { galleryAPI, imageAPI } from '../../services/api';
import './Hobbies.css';

const Hobbies = () => {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch all galleries except "about"
  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        setLoading(true);
        const response = await galleryAPI.getAll();
        const allGalleries = response.data.data;
        // Filter out the "about" gallery
        const hobbiesGalleries = allGalleries.filter(g => g.name !== 'about');
        setGalleries(hobbiesGalleries);
        setError(null);
      } catch (err) {
        console.error('Error fetching galleries:', err);
        setError('Failed to load galleries. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchGalleries();
  }, []);

  const openGalleryModal = (gallery) => {
    setSelectedGallery(gallery);
    setCurrentImageIndex(0);
  };

  const closeGalleryModal = () => {
    setSelectedGallery(null);
    setCurrentImageIndex(0);
  };

  const goToPrevious = (e) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const goToNext = (e) => {
    e.stopPropagation();
    if (selectedGallery && currentImageIndex < selectedGallery.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedGallery) return;

      if (e.key === 'Escape') {
        closeGalleryModal();
      } else if (e.key === 'ArrowLeft') {
        if (currentImageIndex > 0) {
          setCurrentImageIndex(currentImageIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentImageIndex < selectedGallery.images.length - 1) {
          setCurrentImageIndex(currentImageIndex + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGallery, currentImageIndex]);

  return (
    <div className="hobbies-page">
      <section className="hobbies-hero">
        <div className="hobbies-hero-content">
          <h1>Hobbies</h1>
          <p className="hobbies-tagline">
            Things I've been up to
          </p>
          <p>Scroll down for more!</p>
        </div>
      </section>

      <section className="hobbies-content">
        <div className="hobbies-container">
          {loading ? (
            <div className="hobbies-loading">
              <div className="spinner"></div>
              <p>Loading galleries...</p>
            </div>
          ) : error ? (
            <div className="hobbies-error">
              <p>{error}</p>
            </div>
          ) : galleries.length === 0 ? (
            <div className="hobbies-empty">
              <p>No hobby galleries found. Check back soon!</p>
            </div>
          ) : (
            <div className="galleries-grid">
              {galleries.map((gallery) => (
                <div
                  key={gallery._id}
                  className="gallery-preview"
                  onClick={() => openGalleryModal(gallery)}
                >
                  <div className="preview-images">
                    {gallery.images.slice(0, 4).map((image, index) => (
                      <div key={image._id} className={`preview-image preview-image-${index + 1}`}>
                        <img
                          src={imageAPI.getUrl(image.imageId)}
                          alt={image.caption || `${gallery.displayName} ${index + 1}`}
                          loading="lazy"
                          style={{ transform: `rotate(${image.rotation || 0}deg)` }}
                        />
                      </div>
                    ))}
                    {gallery.images.length > 4 && (
                      <div className="preview-overlay">
                        <span>+{gallery.images.length - 4}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Instagram-style Modal Carousel */}
      {selectedGallery && (
        <div className="gallery-modal-overlay" onClick={closeGalleryModal}>
          <button className="modal-close" onClick={closeGalleryModal}>
            ×
          </button>

          <div className="modal-carousel" onClick={(e) => e.stopPropagation()}>
            {/* Gallery Title */}
            <div className="modal-header">
              <h2>{selectedGallery.displayName || selectedGallery.name}</h2>
              {selectedGallery.description && (
                <p className="modal-description">{selectedGallery.description}</p>
              )}
            </div>

            {/* Image Container */}
            <div className="modal-image-container">
              {currentImageIndex > 0 && (
                <button className="modal-nav modal-prev" onClick={goToPrevious}>
                  ‹
                </button>
              )}

              <div className="modal-image-wrapper">
                <img
                  src={imageAPI.getUrl(selectedGallery.images[currentImageIndex].imageId)}
                  alt={selectedGallery.images[currentImageIndex].caption || `Image ${currentImageIndex + 1}`}
                  className="modal-image"
                  style={{ transform: `rotate(${selectedGallery.images[currentImageIndex].rotation || 0}deg)` }}
                />
                {selectedGallery.images[currentImageIndex].caption && (
                  <div className="modal-caption">
                    {selectedGallery.images[currentImageIndex].caption}
                  </div>
                )}
              </div>

              {currentImageIndex < selectedGallery.images.length - 1 && (
                <button className="modal-nav modal-next" onClick={goToNext}>
                  ›
                </button>
              )}
            </div>

            {/* Counter */}
            <div className="modal-counter">
              {currentImageIndex + 1} / {selectedGallery.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hobbies;
