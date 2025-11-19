import { Contact } from '../models/index.js';
import mongoose from 'mongoose';

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public (rate-limited)
export const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and message'
      });
    }

    // Get IP address
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Create contact
    const contact = await Contact.create({
      name,
      email,
      subject: subject || '(No subject)',
      message,
      ipAddress,
      userAgent: req.get('User-Agent'),
      status: 'new'
    });

    // TODO: Send email notification when SMTP is configured
    // For now, just save to database

    res.status(201).json({
      success: true,
      message: 'Message sent successfully. Thank you for reaching out!',
      data: {
        id: contact._id,
        sentAt: contact.sentAt
      }
    });
  } catch (error) {
    console.error('Submit contact error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message. Please try again later.'
    });
  }
};

// @desc    Get all contact messages
// @route   GET /api/contact/messages
// @access  Private (Admin)
export const getContacts = async (req, res) => {
  try {
    const {
      status,
      sort = '-sentAt',
      limit = 50,
      skip = 0
    } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    // Build sort
    const sortOption = {};
    if (sort.startsWith('-')) {
      sortOption[sort.substring(1)] = -1;
    } else {
      sortOption[sort] = 1;
    }

    const contacts = await Contact.find(query)
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Contact.countDocuments(query);

    res.status(200).json({
      success: true,
      count: contacts.length,
      total,
      data: contacts
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts'
    });
  }
};

// @desc    Get single contact message
// @route   GET /api/contact/messages/:id
// @access  Private (Admin)
export const getContact = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID'
      });
    }

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact'
    });
  }
};

// @desc    Update contact message status
// @route   PATCH /api/contact/messages/:id
// @access  Private (Admin)
export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID'
      });
    }

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Update status
    if (status) {
      contact.status = status;

      // Update timestamps based on status
      if (status === 'read' && !contact.readAt) {
        contact.readAt = new Date();
      } else if (status === 'replied' && !contact.repliedAt) {
        contact.repliedAt = new Date();
      }
    }

    // Update notes
    if (notes !== undefined) {
      contact.notes = notes;
    }

    await contact.save();

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update contact'
    });
  }
};

// @desc    Delete contact message
// @route   DELETE /api/contact/messages/:id
// @access  Private (Admin)
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID'
      });
    }

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact'
    });
  }
};
