'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UserSettings {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/settings');
      const data = await response.json();

      if (data.success) {
        setSettings(data.user);
        setFormData({ name: data.user.name });
      } else {
        setError(data.error || 'Failed to load settings');
      }
    } catch (err) {
      setError('Failed to load settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.user);
        setSuccess('Settings updated successfully');
        await update();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update settings');
      }
    } catch (err) {
      setError('Failed to update settings');
      console.error('Error updating settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '2rem' }}>Settings</h1>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Settings</h1>

      <div style={{
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        marginBottom: '2rem',
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Profile Information</h2>

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

        {success && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '4px',
            fontSize: '0.9rem',
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={settings?.email || ''}
              disabled
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem',
                backgroundColor: '#e9ecef',
                color: '#6c757d',
                cursor: 'not-allowed',
              }}
            />
            <small style={{ display: 'block', marginTop: '0.25rem', color: '#6c757d' }}>
              Email cannot be changed
            </small>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              maxLength={255}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>

          {settings && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>
                Account created: {formatDate(settings.created_at)}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving || formData.name === settings?.name}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: saving || formData.name === settings?.name ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: saving || formData.name === settings?.name ? 'not-allowed' : 'pointer',
              fontWeight: '500',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div style={{
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>About</h2>
        <p style={{ color: '#6c757d', marginBottom: '0.5rem' }}>
          <strong>Voice Keyboard App</strong> - AI-powered voice transcription with real-time processing.
        </p>
        <p style={{ color: '#6c757d', fontSize: '0.875rem', margin: 0 }}>
          Use the dictionary feature to improve transcription accuracy for specific terms and phrases.
        </p>
      </div>
    </div>
  );
}
