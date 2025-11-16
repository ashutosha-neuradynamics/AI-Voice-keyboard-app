'use client';

import { useState, useEffect } from 'react';

interface DictionaryEntry {
  id: number;
  keyword: string;
  spelling: string;
  created_at: string;
  updated_at: string;
}

export default function DictionaryPage() {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ keyword: '', spelling: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/dictionary');
      const data = await response.json();

      if (data.success) {
        setEntries(data.entries);
      } else {
        setError(data.error || 'Failed to load dictionary entries');
      }
    } catch (err) {
      setError('Failed to load dictionary entries');
      console.error('Error fetching dictionary entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url = editingId ? '/api/dictionary' : '/api/dictionary';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({ keyword: '', spelling: '' });
        setEditingId(null);
        await fetchEntries();
      } else {
        setError(data.error || 'Failed to save dictionary entry');
      }
    } catch (err) {
      setError('Failed to save dictionary entry');
      console.error('Error saving dictionary entry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (entry: DictionaryEntry) => {
    setFormData({ keyword: entry.keyword, spelling: entry.spelling });
    setEditingId(entry.id);
    setError('');
  };

  const handleCancel = () => {
    setFormData({ keyword: '', spelling: '' });
    setEditingId(null);
    setError('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this dictionary entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/dictionary?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchEntries();
      } else {
        setError(data.error || 'Failed to delete dictionary entry');
      }
    } catch (err) {
      setError('Failed to delete dictionary entry');
      console.error('Error deleting dictionary entry:', err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Dictionary</h1>
      <p style={{ marginBottom: '2rem', color: '#6c757d' }}>
        Add special words or phrases to improve transcription accuracy. The AI will use these spellings when transcribing your voice.
      </p>

      <div style={{
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        marginBottom: '2rem',
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>
          {editingId ? 'Edit Entry' : 'Add New Entry'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="keyword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Keyword
            </label>
            <input
              type="text"
              id="keyword"
              value={formData.keyword}
              onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
              required
              maxLength={255}
              placeholder="e.g., API, JavaScript, company name"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="spelling" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Spelling/Definition
            </label>
            <input
              type="text"
              id="spelling"
              value={formData.spelling}
              onChange={(e) => setFormData({ ...formData, spelling: e.target.value })}
              required
              placeholder="How it should be spelled in transcriptions"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '4px',
              fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: isSubmitting ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: '500',
              }}
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Update Entry' : 'Add Entry'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h2 style={{ marginBottom: '1rem' }}>Your Dictionary Entries</h2>

        {loading && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
            Loading dictionary entries...
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            color: '#6c757d',
          }}>
            <p>No dictionary entries yet.</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Add entries above to improve transcription accuracy for specific terms.
            </p>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#fff',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '1.125rem', color: '#0070f3' }}>
                      {entry.keyword}
                    </strong>
                  </div>
                  <div style={{ color: '#6c757d', marginBottom: '0.5rem' }}>
                    → {entry.spelling}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#999' }}>
                    Added {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                  <button
                    onClick={() => handleEdit(entry)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
