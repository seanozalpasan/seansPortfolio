import { Project } from '../models/index.js';
import mongoose from 'mongoose';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public (published only) / Private (all if admin)
export const getProjects = async (req, res) => {
  try {
    const {
      published,
      category,
      featured,
      sort = 'order',
      limit = 100,
      skip = 0
    } = req.query;

    // Build query
    const query = {};

    // If not admin, only show published projects
    if (!req.user || req.user.role !== 'admin') {
      query.published = true;
    } else if (published !== undefined) {
      query.published = published === 'true';
    }

    if (category) {
      query.category = category.toLowerCase();
    }

    if (featured !== undefined) {
      query.featured = featured === 'true';
    }

    // Build sort
    const sortOption = {};
    if (sort === 'order') {
      sortOption.order = 1;
    } else if (sort === 'date') {
      sortOption.createdAt = -1;
    } else if (sort === '-date') {
      sortOption.createdAt = 1;
    }

    const projects = await Project.find(query)
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Project.countDocuments(query);

    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      data: projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects'
    });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Public
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // If not admin and project is not published, deny access
    if ((!req.user || req.user.role !== 'admin') && !project.published) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project'
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin)
export const createProject = async (req, res) => {
  try {
    const projectData = req.body;

    // Validate required fields
    if (!projectData.title || !projectData.shortDescription || !projectData.fullDescription) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, short description, and full description'
      });
    }

    if (!projectData.thumbnailImageId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a thumbnail image'
      });
    }

    // Create project
    const project = await Project.create(projectData);

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create project'
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin)
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    const project = await Project.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update project'
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin)
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
};

// @desc    Reorder projects
// @route   PATCH /api/projects/reorder
// @access  Private (Admin)
export const reorderProjects = async (req, res) => {
  try {
    const { projects } = req.body;

    if (!Array.isArray(projects)) {
      return res.status(400).json({
        success: false,
        message: 'Projects must be an array'
      });
    }

    // Update order for each project
    const updatePromises = projects.map(({ id, order }) =>
      Project.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Projects reordered successfully'
    });
  } catch (error) {
    console.error('Reorder projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder projects'
    });
  }
};

// @desc    Toggle project published status
// @route   PATCH /api/projects/:id/toggle-publish
// @access  Private (Admin)
export const togglePublish = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.published = !project.published;
    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle publish status'
    });
  }
};
