import { useState, useEffect } from 'react';
import api from '../../services/api';
import './ProjectsPage.css';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    category: 'other',
    tags: '',
    featured: false,
    published: false,
    externalLinks: [],
    metadata: {
      date: '',
      organization: '',
      location: ''
    }
  });

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [detailFiles, setDetailFiles] = useState([]);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingDetails, setUploadingDetails] = useState(false);

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching projects...');

      const response = await api.get('/projects');
      console.log('Projects response:', response.data);

      const projectsData = response.data.data || [];
      setProjects(projectsData);
      console.log(`Loaded ${projectsData.length} projects`);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle thumbnail selection
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle detail images selection
  const handleDetailImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setDetailFiles(files);
    console.log(`Selected ${files.length} detail images`);
  };

  // Upload thumbnail image
  const uploadThumbnail = async () => {
    if (!thumbnailFile) {
      console.log('No thumbnail file to upload');
      return null;
    }

    try {
      setUploadingThumbnail(true);
      console.log('Uploading thumbnail...');

      const formData = new FormData();
      formData.append('image', thumbnailFile);

      const response = await api.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('Thumbnail uploaded:', response.data);
      return response.data.data.imageId;
    } catch (err) {
      console.error('Error uploading thumbnail:', err);
      throw new Error('Failed to upload thumbnail image');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  // Upload detail images
  const uploadDetailImages = async () => {
    if (detailFiles.length === 0) {
      console.log('No detail images to upload');
      return [];
    }

    try {
      setUploadingDetails(true);
      console.log(`Uploading ${detailFiles.length} detail images...`);

      const formData = new FormData();
      detailFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await api.post('/images/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('Detail images uploaded:', response.data);
      return response.data.data.images.map(img => img.imageId);
    } catch (err) {
      console.error('Error uploading detail images:', err);
      throw new Error('Failed to upload detail images');
    } finally {
      setUploadingDetails(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log('Submitting project form...', editingProject ? 'EDIT' : 'CREATE');

      // Upload images first
      const thumbnailId = editingProject?.thumbnailImageId || await uploadThumbnail();

      if (!thumbnailId) {
        alert('Please select a thumbnail image');
        return;
      }

      const detailImageIds = await uploadDetailImages();
      console.log('All images uploaded. Thumbnail:', thumbnailId, 'Details:', detailImageIds);

      // Prepare project data
      const projectData = {
        ...formData,
        thumbnailImageId: thumbnailId,
        detailImageIds: editingProject
          ? [...(editingProject.detailImageIds || []), ...detailImageIds]
          : detailImageIds,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      console.log('Project data:', projectData);

      if (editingProject) {
        console.log('Updating project:', editingProject._id);
        await api.put(`/projects/${editingProject._id}`, projectData);
      } else {
        console.log('Creating new project');
        const response = await api.post('/projects', projectData);
        console.log('Project created:', response.data);
      }

      console.log('Project saved successfully, refreshing list...');
      await fetchProjects();
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error('Error saving project:', err);
      alert(err.message || 'Failed to save project');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      shortDescription: '',
      fullDescription: '',
      category: 'other',
      tags: '',
      featured: false,
      published: false,
      externalLinks: [],
      metadata: {
        date: '',
        organization: '',
        location: ''
      }
    });
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setDetailFiles([]);
    setEditingProject(null);
  };

  // Start editing a project
  const startEdit = (project) => {
    console.log('Editing project:', project._id);
    setEditingProject(project);
    setFormData({
      title: project.title,
      shortDescription: project.shortDescription,
      fullDescription: project.fullDescription,
      category: project.category,
      tags: Array.isArray(project.tags) ? project.tags.join(', ') : '',
      featured: project.featured || false,
      published: project.published || false,
      externalLinks: project.externalLinks || [],
      metadata: project.metadata || { date: '', organization: '', location: '' }
    });
    setThumbnailPreview(`${import.meta.env.VITE_API_URL}/images/${project.thumbnailImageId}`);
    setShowForm(true);
  };

  // Delete project
  const deleteProject = async (id) => {
    try {
      console.log('Deleting project:', id);
      await api.delete(`/projects/${id}`);
      console.log('Project deleted, refreshing list...');
      await fetchProjects();
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  // Toggle published status
  const togglePublish = async (id) => {
    try {
      console.log('Toggling publish status for project:', id);
      await api.patch(`/projects/${id}/toggle-publish`);
      console.log('Publish status toggled, refreshing list...');
      await fetchProjects();
    } catch (err) {
      console.error('Error toggling publish:', err);
      alert('Failed to toggle publish status');
    }
  };

  // Move project up/down
  const moveProject = async (index, direction) => {
    const newProjects = [...projects];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newProjects.length) return;

    console.log(`Moving project from ${index} to ${targetIndex}`);

    // Swap projects
    [newProjects[index], newProjects[targetIndex]] = [newProjects[targetIndex], newProjects[index]];

    // Update order values
    const reorderedProjects = newProjects.map((project, idx) => ({
      id: project._id,
      order: idx
    }));

    console.log('Reordered projects:', reorderedProjects);

    try {
      await api.patch('/projects/reorder', { projects: reorderedProjects });
      console.log('Projects reordered, refreshing list...');
      await fetchProjects();
    } catch (err) {
      console.error('Error reordering projects:', err);
      alert('Failed to reorder projects');
    }
  };

  // Add external link
  const addExternalLink = () => {
    setFormData({
      ...formData,
      externalLinks: [...formData.externalLinks, { type: 'github', url: '', label: '' }]
    });
  };

  // Update external link
  const updateExternalLink = (index, field, value) => {
    const newLinks = [...formData.externalLinks];
    newLinks[index][field] = value;
    setFormData({ ...formData, externalLinks: newLinks });
  };

  // Remove external link
  const removeExternalLink = (index) => {
    const newLinks = formData.externalLinks.filter((_, i) => i !== index);
    setFormData({ ...formData, externalLinks: newLinks });
  };

  if (loading) {
    return (
      <div className="projects-page">
        <div className="loading">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      {/* Header */}
      <div className="projects-header">
        <h1>Projects Manager</h1>
        <button
          className="btn-add-project"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Add Project
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Project Form */}
      {showForm && (
        <div className="project-form-container">
          <div className="project-form-header">
            <h2>{editingProject ? 'Edit Project' : 'New Project'}</h2>
            <button
              className="btn-close-form"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="project-form">
            {/* Basic Info */}
            <div className="form-section">
              <h3>Basic Information</h3>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={200}
                  placeholder="Project title"
                />
              </div>

              <div className="form-group">
                <label>Short Description * (max 500 chars)</label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  required
                  maxLength={500}
                  rows={3}
                  placeholder="Brief description for project cards"
                />
                <span className="char-count">{formData.shortDescription.length}/500</span>
              </div>

              <div className="form-group">
                <label>Full Description *</label>
                <textarea
                  value={formData.fullDescription}
                  onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                  required
                  rows={6}
                  placeholder="Detailed project description"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="research">Research</option>
                    <option value="presentation">Presentation</option>
                    <option value="code">Code</option>
                    <option value="academic">Academic</option>
                    <option value="personal">Personal</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="React, Node.js, MongoDB"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="form-section">
              <h3>Images</h3>

              <div className="form-group">
                <label>Thumbnail Image * {editingProject && '(Leave empty to keep current)'}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  required={!editingProject}
                />
                {thumbnailPreview && (
                  <div className="image-preview">
                    <img src={thumbnailPreview} alt="Thumbnail preview" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Detail Images (optional, multiple)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleDetailImagesChange}
                />
                {detailFiles.length > 0 && (
                  <p className="file-count">{detailFiles.length} file(s) selected</p>
                )}
              </div>
            </div>

            {/* External Links */}
            <div className="form-section">
              <h3>External Links</h3>

              {formData.externalLinks.map((link, index) => (
                <div key={index} className="link-group">
                  <select
                    value={link.type}
                    onChange={(e) => updateExternalLink(index, 'type', e.target.value)}
                  >
                    <option value="github">GitHub</option>
                    <option value="demo">Demo</option>
                    <option value="paper">Paper</option>
                    <option value="video">Video</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateExternalLink(index, 'url', e.target.value)}
                    placeholder="https://..."
                    required
                  />
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateExternalLink(index, 'label', e.target.value)}
                    placeholder="Label (optional)"
                  />
                  <button
                    type="button"
                    className="btn-remove-link"
                    onClick={() => removeExternalLink(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn-add-link"
                onClick={addExternalLink}
              >
                + Add Link
              </button>
            </div>

            {/* Metadata */}
            <div className="form-section">
              <h3>Metadata (optional)</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.metadata.date}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, date: e.target.value }
                    })}
                  />
                </div>

                <div className="form-group">
                  <label>Organization</label>
                  <input
                    type="text"
                    value={formData.metadata.organization}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, organization: e.target.value }
                    })}
                    placeholder="University, Company, etc."
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.metadata.location}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, location: e.target.value }
                    })}
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="form-section">
              <h3>Options</h3>

              <div className="form-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  />
                  Featured Project
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  />
                  Published (visible to public)
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn-save-project"
                disabled={uploadingThumbnail || uploadingDetails}
              >
                {uploadingThumbnail || uploadingDetails
                  ? 'Uploading...'
                  : editingProject
                  ? 'Update Project'
                  : 'Create Project'}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div className="projects-list">
        {projects.length === 0 ? (
          <div className="no-projects">
            <p>No projects yet. Create your first project!</p>
          </div>
        ) : (
          projects.map((project, index) => (
            <div key={project._id} className={`project-card ${!project.published ? 'draft' : ''}`}>
              <div className="project-thumbnail">
                <img
                  src={`${import.meta.env.VITE_API_URL}/images/${project.thumbnailImageId}`}
                  alt={project.title}
                  onError={(e) => {
                    console.error('Image load error for project:', project._id);
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="250" height="140"><rect width="250" height="140" fill="%23333"/><text x="50%" y="50%" fill="%23666" text-anchor="middle" dy=".3em">No Image</text></svg>';
                  }}
                />
                {project.featured && <span className="badge-featured">Featured</span>}
                {!project.published && <span className="badge-draft">Draft</span>}
              </div>

              <div className="project-info">
                <h3>{project.title}</h3>
                <p className="project-short-desc">{project.shortDescription}</p>
                <div className="project-meta">
                  <span className="category">{project.category}</span>
                  {Array.isArray(project.tags) && project.tags.length > 0 && (
                    <span className="tags">{project.tags.join(', ')}</span>
                  )}
                </div>
              </div>

              <div className="project-actions">
                <button
                  className="btn-reorder"
                  onClick={() => moveProject(index, 'up')}
                  disabled={index === 0}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  className="btn-reorder"
                  onClick={() => moveProject(index, 'down')}
                  disabled={index === projects.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  className="btn-edit"
                  onClick={() => startEdit(project)}
                >
                  Edit
                </button>
                <button
                  className={`btn-publish ${project.published ? 'unpublish' : ''}`}
                  onClick={() => togglePublish(project._id)}
                >
                  {project.published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  className="btn-delete"
                  onClick={() => setShowDeleteConfirm(project._id)}
                >
                  Delete
                </button>
              </div>

              {/* Delete Confirmation */}
              {showDeleteConfirm === project._id && (
                <div className="delete-confirm">
                  <p>Delete "{project.title}"?</p>
                  <div className="confirm-actions">
                    <button
                      className="btn-confirm-delete"
                      onClick={() => deleteProject(project._id)}
                    >
                      Yes, Delete
                    </button>
                    <button
                      className="btn-cancel-delete"
                      onClick={() => setShowDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
