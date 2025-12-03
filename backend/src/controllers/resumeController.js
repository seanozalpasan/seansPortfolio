import { uploadToGridFS, streamFromGridFS, getFileMetadata, deleteFromGridFS } from '../utils/gridfs.js';
import mongoose from 'mongoose';

// @desc    Get current active resume
// @route   GET /api/resume
// @access  Public
export const getResume = async (req, res) => {
  try {
    // Get the most recent resume (sorted by upload date)
    const db = mongoose.connection.db;
    const files = await db.collection('resume.files')
      .find({ 'metadata.active': true })
      .sort({ uploadDate: -1 })
      .limit(1)
      .toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No resume found'
      });
    }

    const file = files[0];

    // Set headers
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${file.filename}"`);
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Allow iframe embedding from frontend domains
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : ['http://localhost:5173'];

    // Add www version if not already included
    const allAllowedOrigins = [...new Set([
      ...allowedOrigins,
      ...allowedOrigins.map(origin => origin.replace('://', '://www.')),
      ...allowedOrigins.map(origin => origin.replace('://www.', '://')),
      'http://localhost:5173'
    ])];

    // Modern CSP header for iframe embedding
    res.set('Content-Security-Policy', `frame-ancestors 'self' ${allAllowedOrigins.join(' ')}`);

    // Remove deprecated X-Frame-Options to avoid conflicts
    res.removeHeader('X-Frame-Options');

    // Stream file from GridFS
    const downloadStream = streamFromGridFS(file._id, 'resume');

    downloadStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Get resume error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve resume'
      });
    }
  }
};

// @desc    Get resume metadata
// @route   GET /api/resume/info
// @access  Private (Admin)
export const getResumeInfo = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const files = await db.collection('resume.files')
      .find({ 'metadata.active': true })
      .sort({ uploadDate: -1 })
      .limit(1)
      .toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No resume found'
      });
    }

    const file = files[0];

    res.status(200).json({
      success: true,
      data: {
        id: file._id,
        filename: file.filename,
        contentType: file.contentType,
        size: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata
      }
    });
  } catch (error) {
    console.error('Get resume info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve resume info'
    });
  }
};

// @desc    Get all resume versions
// @route   GET /api/resume/versions
// @access  Private (Admin)
export const getResumeVersions = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const files = await db.collection('resume.files')
      .find({})
      .sort({ uploadDate: -1 })
      .toArray();

    const versions = files.map(file => ({
      id: file._id,
      filename: file.filename,
      size: file.length,
      uploadDate: file.uploadDate,
      active: file.metadata?.active || false,
      version: file.metadata?.version || 1
    }));

    res.status(200).json({
      success: true,
      data: versions,
      count: versions.length
    });
  } catch (error) {
    console.error('Get resume versions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve resume versions'
    });
  }
};

// @desc    Upload new resume
// @route   POST /api/resume/upload
// @access  Private (Admin)
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { buffer, originalname, mimetype } = req.file;

    // Validate PDF
    if (mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Only PDF files are allowed'
      });
    }

    // Validate file size (max 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size must be less than 10MB'
      });
    }

    const db = mongoose.connection.db;

    // Get current version number
    const latestFile = await db.collection('resume.files')
      .find({})
      .sort({ 'metadata.version': -1 })
      .limit(1)
      .toArray();

    const newVersion = latestFile.length > 0 ? (latestFile[0].metadata?.version || 0) + 1 : 1;

    // Deactivate all previous resumes
    await db.collection('resume.files').updateMany(
      {},
      { $set: { 'metadata.active': false } }
    );

    // Upload new resume to GridFS
    const uploadedFile = await uploadToGridFS(
      buffer,
      originalname,
      mimetype,
      {
        uploadedBy: req.user._id,
        active: true,
        version: newVersion
      },
      'resume'
    );

    // Keep only last 5 versions (delete older ones)
    const allFiles = await db.collection('resume.files')
      .find({})
      .sort({ uploadDate: -1 })
      .toArray();

    if (allFiles.length > 5) {
      const filesToDelete = allFiles.slice(5);
      for (const file of filesToDelete) {
        await deleteFromGridFS(file._id, 'resume');
      }
    }

    res.status(201).json({
      success: true,
      data: {
        id: uploadedFile._id,
        filename: uploadedFile.filename,
        size: uploadedFile.length,
        version: newVersion,
        url: `/api/resume`
      },
      message: 'Resume uploaded successfully'
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload resume'
    });
  }
};

// @desc    Delete resume
// @route   DELETE /api/resume
// @access  Private (Admin)
export const deleteResume = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const files = await db.collection('resume.files')
      .find({ 'metadata.active': true })
      .toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active resume found'
      });
    }

    const file = files[0];
    await deleteFromGridFS(file._id, 'resume');

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resume'
    });
  }
};

// @desc    Set a specific version as active
// @route   PATCH /api/resume/activate/:id
// @access  Private (Admin)
export const activateResumeVersion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume ID'
      });
    }

    const db = mongoose.connection.db;

    // Check if the resume exists
    const file = await db.collection('resume.files').findOne({ _id: new mongoose.Types.ObjectId(id) });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Resume version not found'
      });
    }

    // Deactivate all versions
    await db.collection('resume.files').updateMany(
      {},
      { $set: { 'metadata.active': false } }
    );

    // Activate the selected version
    await db.collection('resume.files').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { 'metadata.active': true } }
    );

    res.status(200).json({
      success: true,
      message: 'Resume version activated successfully',
      data: {
        id: file._id,
        filename: file.filename,
        version: file.metadata?.version
      }
    });
  } catch (error) {
    console.error('Activate resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate resume version'
    });
  }
};
