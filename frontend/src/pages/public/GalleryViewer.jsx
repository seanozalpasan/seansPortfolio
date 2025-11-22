import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { galleryAPI, imageAPI } from '../../services/api';
import './GalleryViewer.css';

const GalleryViewer = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Format gallery name for display
  const displayName = gallery?.displayName ||
    (name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Gallery');

  // Fetch gallery data
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true);
        const response = await galleryAPI.getByName(name);
        setGallery(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching gallery:', err);
        if (err.response?.status === 404) {
          setError(`Gallery "${name}" not found.`);
        } else {
          setError('Failed to load gallery. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (name) {
      fetchGallery();
    }
  }, [name]);

  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const goToPrevious = (e) => {
    e.stopPropagation();
    if (lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const goToNext = (e) => {
    e.stopPropagation();
    if (gallery && lightboxIndex < gallery.images.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;

      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        if (lightboxIndex > 0) {
          setLightboxIndex(lightboxIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (gallery && lightboxIndex < gallery.images.length - 1) {
          setLightboxIndex(lightboxIndex + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, gallery]);

  return (
    <div className="gallery-viewer">
      <section className="gallery-hero">
        <div className="gallery-hero-content">
          <h1>{displayName}</h1>
          <p className="gallery-tagline">
            {gallery?.description || 'A visual journey'}
          </p>
        </div>
      </section>

      <section className="gallery-content">
        <div className="gallery-container">
          {loading ? (
            <div className="gallery-loading">
              <div className="spinner"></div>
              <p>Loading gallery...</p>
            </div>
          ) : error ? (
            <div className="gallery-error">
              <p>{error}</p>
              <button onClick={() => navigate('/')} className="btn-back">
                ← Back to Home
              </button>
            </div>
          ) : !gallery || gallery.images.length === 0 ? (
            <div className="gallery-empty">
              <p>This gallery is currently empty.</p>
            </div>
          ) : (
            <div className="gallery-grid">
              {gallery.images.map((image, index) => (
                <div
                  key={image._id}
                  className="gallery-image-wrapper"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={imageAPI.getUrl(image.imageId)}
                    alt={image.caption || `Gallery image ${index + 1}`}
                    loading="lazy"
                    className="gallery-image"
                  />
                  {image.caption && (
                    <div className="image-caption">{image.caption}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && gallery && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>
            ×
          </button>

          {lightboxIndex > 0 && (
            <button className="lightbox-nav lightbox-prev" onClick={goToPrevious}>
              ‹
            </button>
          )}

          {lightboxIndex < gallery.images.length - 1 && (
            <button className="lightbox-nav lightbox-next" onClick={goToNext}>
              ›
            </button>
          )}

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={imageAPI.getUrl(gallery.images[lightboxIndex].imageId)}
              alt={gallery.images[lightboxIndex].caption || `Image ${lightboxIndex + 1}`}
              className="lightbox-image"
            />
            {gallery.images[lightboxIndex].caption && (
              <div className="lightbox-caption">
                {gallery.images[lightboxIndex].caption}
              </div>
            )}
            <div className="lightbox-counter">
              {lightboxIndex + 1} / {gallery.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryViewer;
