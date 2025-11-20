import { useState, useEffect } from 'react';
import api from '../../services/api';
import './ContactsPage.css';

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Fetch all contacts
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/contact/messages');
      setContacts(response.data.data);
      setFilteredContacts(response.data.data);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.response?.data?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Filter contacts by status
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredContacts(contacts);
    } else {
      setFilteredContacts(contacts.filter(c => c.status === activeFilter));
    }
  }, [activeFilter, contacts]);

  // Update contact status
  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/contact/messages/${id}`, { status: newStatus });
      await fetchContacts();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Delete contact
  const deleteContact = async (id) => {
    try {
      await api.delete(`/contact/messages/${id}`);
      await fetchContacts();
      setShowDeleteConfirm(null);
      if (selectedContact?._id === id) {
        setSelectedContact(null);
      }
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError(err.response?.data?.message || 'Failed to delete contact');
    }
  };

  // Get status badge class
  const getStatusClass = (status) => {
    const statusMap = {
      new: 'status-new',
      read: 'status-read',
      replied: 'status-replied',
      archived: 'status-archived'
    };
    return statusMap[status] || 'status-read';
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get counts for each filter
  const getCounts = () => {
    return {
      all: contacts.length,
      new: contacts.filter(c => c.status === 'new').length,
      read: contacts.filter(c => c.status === 'read').length,
      replied: contacts.filter(c => c.status === 'replied').length,
      archived: contacts.filter(c => c.status === 'archived').length
    };
  };

  const counts = getCounts();

  if (loading) {
    return (
      <div className="contacts-page">
        <div className="loading">Loading contacts...</div>
      </div>
    );
  }

  return (
    <div className="contacts-page">
      <div className="contacts-header">
        <h1>Contact Messages</h1>
        <div className="contacts-stats">
          <span className="stat">
            Total: <strong>{counts.all}</strong>
          </span>
          <span className="stat stat-new">
            New: <strong>{counts.new}</strong>
          </span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All ({counts.all})
        </button>
        <button
          className={`filter-tab ${activeFilter === 'new' ? 'active' : ''}`}
          onClick={() => setActiveFilter('new')}
        >
          New ({counts.new})
        </button>
        <button
          className={`filter-tab ${activeFilter === 'read' ? 'active' : ''}`}
          onClick={() => setActiveFilter('read')}
        >
          Read ({counts.read})
        </button>
        <button
          className={`filter-tab ${activeFilter === 'replied' ? 'active' : ''}`}
          onClick={() => setActiveFilter('replied')}
        >
          Replied ({counts.replied})
        </button>
        <button
          className={`filter-tab ${activeFilter === 'archived' ? 'active' : ''}`}
          onClick={() => setActiveFilter('archived')}
        >
          Archived ({counts.archived})
        </button>
      </div>

      {/* Messages List */}
      <div className="contacts-content">
        {filteredContacts.length === 0 ? (
          <div className="no-messages">
            <p>No messages found</p>
          </div>
        ) : (
          <div className="messages-list">
            {filteredContacts.map((contact) => (
              <div
                key={contact._id}
                className={`message-item ${contact.status} ${selectedContact?._id === contact._id ? 'selected' : ''}`}
                onClick={() => setSelectedContact(contact)}
              >
                <div className="message-header">
                  <div className="message-from">
                    <strong>{contact.name}</strong>
                    <span className="message-email">{contact.email}</span>
                  </div>
                  <span className={`status-badge ${getStatusClass(contact.status)}`}>
                    {contact.status}
                  </span>
                </div>
                <div className="message-subject">{contact.subject}</div>
                <div className="message-preview">{contact.message.substring(0, 100)}...</div>
                <div className="message-footer">
                  <span className="message-date">{formatDate(contact.sentAt)}</span>
                  <div className="message-actions">
                    {contact.status === 'new' && (
                      <button
                        className="btn-mark-read"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(contact._id, 'read');
                        }}
                      >
                        Mark Read
                      </button>
                    )}
                    {contact.status === 'read' && (
                      <button
                        className="btn-mark-unread"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(contact._id, 'new');
                        }}
                      >
                        Mark Unread
                      </button>
                    )}
                    <button
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(contact._id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm === contact._id && (
                  <div
                    className="delete-confirm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p>Delete this message?</p>
                    <div className="confirm-actions">
                      <button
                        className="btn-confirm-delete"
                        onClick={() => deleteContact(contact._id)}
                      >
                        Yes, Delete
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => setShowDeleteConfirm(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message Detail Panel */}
        {selectedContact && (
          <div className="message-detail">
            <div className="detail-header">
              <h2>Message Details</h2>
              <button
                className="btn-close"
                onClick={() => setSelectedContact(null)}
              >
                ×
              </button>
            </div>

            <div className="detail-content">
              <div className="detail-field">
                <label>From:</label>
                <div className="detail-value">
                  <strong>{selectedContact.name}</strong>
                  <a href={`mailto:${selectedContact.email}`} className="email-link">
                    {selectedContact.email}
                  </a>
                </div>
              </div>

              <div className="detail-field">
                <label>Subject:</label>
                <div className="detail-value">{selectedContact.subject}</div>
              </div>

              <div className="detail-field">
                <label>Sent:</label>
                <div className="detail-value">{formatDate(selectedContact.sentAt)}</div>
              </div>

              <div className="detail-field">
                <label>Status:</label>
                <div className="detail-value">
                  <span className={`status-badge ${getStatusClass(selectedContact.status)}`}>
                    {selectedContact.status}
                  </span>
                </div>
              </div>

              <div className="detail-field">
                <label>Message:</label>
                <div className="detail-value message-text">{selectedContact.message}</div>
              </div>

              <div className="detail-actions">
                <a
                  href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject}`}
                  className="btn-reply"
                  onClick={() => updateStatus(selectedContact._id, 'replied')}
                >
                  Reply via Email
                </a>
                {selectedContact.status !== 'archived' && (
                  <button
                    className="btn-archive"
                    onClick={() => updateStatus(selectedContact._id, 'archived')}
                  >
                    Archive
                  </button>
                )}
                <button
                  className="btn-delete"
                  onClick={() => setShowDeleteConfirm(selectedContact._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsPage;
