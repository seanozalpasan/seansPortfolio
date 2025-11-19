import { useState, useEffect } from 'react';
import { galleryAPI, imageAPI } from '../../services/api';
import './GalleriesPage.css';

function GalleriesPage() {
  const [galleries, setGalleries] = useState([]);
  const [activeGallery, setActiveGallery] = useState(null);
  const [currentGallery, setCurrentGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingImage, setEditingImage] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [newGalleryDisplayName, setNewGalleryDisplayName] = useState('');

  // Fetch all galleries on mount
  useEffect(() => {
    fetchGalleries();
  }, []);

  // Fetch specific gallery when activeGallery changes
  useEffect(() => {
    if (activeGallery) {
      fetchGalleryDetails(activeGallery);
    }
  }, [activeGallery]);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      const response = await galleryAPI.getAll();
      const galleriesData = response.data.data || [];
      setGalleries(galleriesData);

      // Set first gallery as active if no active gallery is set
      if (!activeGallery && galleriesData.length > 0) {
        setActiveGallery(galleriesData[0].name);
      }
    } catch (err) {
      setError('Failed to load galleries: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGallery = async (e) => {
    e.preventDefault();

    if (!newGalleryName || !newGalleryDisplayName) {
      setError('Both gallery name and display name are required');
      return;
    }

    try {
      setError('');
      await galleryAPI.create({
        name: newGalleryName.toLowerCase(),
        displayName: newGalleryDisplayName,
        description: ''
      });

      setSuccess('Gallery created successfully!');
      setShowCreateModal(false);
      setNewGalleryName('');
      setNewGalleryDisplayName('');
      fetchGalleries();
    } catch (err) {
      setError('Failed to create gallery: ' + err.response?.data?.message || err.message);
    }
  };

  const handleDeleteGallery = async (galleryName) => {
    if (!window.confirm(`Are you sure you want to delete the "${galleryName}" gallery? This will remove all images from this gallery.`)) {
      return;
    }

    try {
      setError('');
      await galleryAPI.delete(galleryName);
      setSuccess('Gallery deleted successfully');

      // If deleted gallery was active, switch to first gallery
      if (activeGallery === galleryName) {
        const remainingGalleries = galleries.filter(g => g.name !== galleryName);
        setActiveGallery(remainingGalleries.length > 0 ? remainingGalleries[0].name : null);
      }

      fetchGalleries();
    } catch (err) {
      setError('Failed to delete gallery: ' + err.message);
    }
  };

  const fetchGalleryDetails = async (name) => {
    try {
      setLoading(true);
      const response = await galleryAPI.getByName(name);
      setCurrentGallery(response.data.data);
    } catch (err) {
      setError('Failed to load gallery: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Upload multiple images
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      // Upload and get the image IDs
      const uploadResponse = await imageAPI.uploadMultiple(formData);
      const uploadedImages = uploadResponse.data.data.images;

      // Prepare images array for gallery
      const imagesToAdd = uploadedImages.map(img => ({
        imageId: img.imageId,
        caption: '',
        metadata: {}
      }));

      // Add all images to the gallery in one call
      await galleryAPI.addImages(activeGallery, imagesToAdd);

      setSuccess(`Successfully uploaded ${files.length} image(s)`);
      fetchGalleryDetails(activeGallery);

      // Clear the file input
      e.target.value = '';
    } catch (err) {
      setError('Failed to upload images: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      setError('');
      await galleryAPI.removeImage(activeGallery, imageId);
      setSuccess('Image deleted successfully');
      fetchGalleryDetails(activeGallery);
    } catch (err) {
      setError('Failed to delete image: ' + err.message);
    }
  };

  const handleUpdateCaption = async (imageId, newCaption) => {
    try {
      setError('');
      await galleryAPI.updateImage(activeGallery, imageId, { caption: newCaption });
      setSuccess('Caption updated successfully');
      setEditingImage(null);
      fetchGalleryDetails(activeGallery);
    } catch (err) {
      setError('Failed to update caption: ' + err.message);
    }
  };

  const handleReorder = async (imageId, direction) => {
    try {
      setError('');
      const images = currentGallery.images;
      const currentIndex = images.findIndex(img => img.imageId === imageId);

      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= images.length) return;

      // Create new order array
      const newOrder = [...images];
      const [movedItem] = newOrder.splice(currentIndex, 1);
      newOrder.splice(newIndex, 0, movedItem);

      // Update order on server
      const orderData = newOrder.map((img, idx) => ({
        imageId: img.imageId,
        order: idx
      }));

      await galleryAPI.reorderImages(activeGallery, orderData);
      setSuccess('Image order updated');
      fetchGalleryDetails(activeGallery);
    } catch (err) {
      setError('Failed to reorder images: ' + err.message);
    }
  };

  if (loading && !currentGallery) {
    return (
      <div className="galleries-page">
        <div className="loading">Loading galleries...</div>
      </div>
    );
  }

  return (
    <div className="galleries-page">
      <div className="galleries-header">
        <h1>Gallery Manager</h1>
        <p className="subtitle">Manage your photo galleries</p>
      </div>

      {/* Gallery Tabs */}
      <div className="gallery-tabs">
        {galleries.map(gallery => (
          <div key={gallery.name} className="gallery-tab-wrapper">
            <button
              className={`gallery-tab ${activeGallery === gallery.name ? 'active' : ''}`}
              onClick={() => setActiveGallery(gallery.name)}
            >
              {gallery.displayName}
              {currentGallery && activeGallery === gallery.name && (
                <span className="image-count">
                  {currentGallery.images?.length || 0}
                </span>
              )}
            </button>
            <button
              className="delete-gallery-btn"
              onClick={() => handleDeleteGallery(gallery.name)}
              title="Delete gallery"
            >
              ×
            </button>
          </div>
        ))}
        <button
          className="gallery-tab new-gallery-btn"
          onClick={() => setShowCreateModal(true)}
        >
          + New Gallery
        </button>
      </div>

      {/* Create Gallery Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Gallery</h2>
            <form onSubmit={handleCreateGallery}>
              <div className="form-group">
                <label htmlFor="gallery-name">Gallery Name (URL-friendly)</label>
                <input
                  id="gallery-name"
                  type="text"
                  value={newGalleryName}
                  onChange={(e) => setNewGalleryName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="e.g., costarica, new-york, surfing"
                  required
                />
                <small>Only lowercase letters, numbers, and hyphens allowed</small>
              </div>
              <div className="form-group">
                <label htmlFor="gallery-display-name">Display Name</label>
                <input
                  id="gallery-display-name"
                  type="text"
                  value={newGalleryDisplayName}
                  onChange={(e) => setNewGalleryDisplayName(e.target.value)}
                  placeholder="e.g., Costa Rica 2024, New York Trip"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-create">Create Gallery</button>
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        <label htmlFor="file-upload" className="upload-button">
          {uploading ? 'Uploading...' : '+ Upload Images'}
        </label>
        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ display: 'none' }}
        />
        <p className="upload-hint">
          Select one or more images to upload to the {activeGallery} gallery
        </p>
      </div>

      {/* Images Grid */}
      {currentGallery && (
        <div className="images-section">
          {currentGallery.images && currentGallery.images.length > 0 ? (
            <div className="images-grid">
              {currentGallery.images.map((image, index) => (
                <div key={image.imageId} className="image-card">
                  <div className="image-preview">
                    <img
                      src={`http://localhost:5001/api/images/${image.imageId}`}
                      alt={image.caption || 'Gallery image'}
                      loading="lazy"
                    />
                  </div>

                  <div className="image-info">
                    {editingImage === image.imageId ? (
                      <div className="caption-edit">
                        <input
                          type="text"
                          defaultValue={image.caption}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateCaption(image.imageId, e.target.value);
                            } else if (e.key === 'Escape') {
                              setEditingImage(null);
                            }
                          }}
                          autoFocus
                          placeholder="Enter caption..."
                        />
                        <div className="caption-actions">
                          <button
                            onClick={(e) => {
                              const input = e.target.closest('.caption-edit').querySelector('input');
                              handleUpdateCaption(image.imageId, input.value);
                            }}
                            className="btn-save"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingImage(null)}
                            className="btn-cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className="image-caption"
                        onClick={() => setEditingImage(image.imageId)}
                        title="Click to edit caption"
                      >
                        {image.caption || <em>Click to add caption</em>}
                      </p>
                    )}
                  </div>

                  <div className="image-actions">
                    <button
                      onClick={() => handleReorder(image.imageId, 'up')}
                      disabled={index === 0}
                      className="btn-reorder"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleReorder(image.imageId, 'down')}
                      disabled={index === currentGallery.images.length - 1}
                      className="btn-reorder"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleDeleteImage(image.imageId)}
                      className="btn-delete"
                      title="Delete image"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No images in this gallery yet.</p>
              <p>Upload some images to get started!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GalleriesPage;
