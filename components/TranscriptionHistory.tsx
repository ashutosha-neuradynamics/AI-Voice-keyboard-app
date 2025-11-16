'use client';

import { useState, useEffect } from 'react';

interface Transcription {
  id: number;
  text: string;
  created_at: string;
  metadata?: any;
}

interface TranscriptionHistoryProps {
  refreshTrigger?: number;
}

export default function TranscriptionHistory({ refreshTrigger = 0 }: TranscriptionHistoryProps) {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const fetchTranscriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/transcriptions?limit=20');
      const data = await response.json();

      if (data.success) {
        setTranscriptions(data.transcriptions);
      } else {
        setError(data.error || 'Failed to load transcriptions');
      }
    } catch (err) {
      setError('Failed to load transcriptions');
      console.error('Error fetching transcriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranscriptions();
  }, [refreshTrigger]);

  const handleCopy = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Transcription History</h2>

      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
          Loading transcriptions...
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8d7da',
          border: '1px solid #dc3545',
          borderRadius: '4px',
          marginBottom: '1rem',
          color: '#721c24',
        }}>
          {error}
        </div>
      )}

      {!loading && !error && transcriptions.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
          <p>No transcriptions yet.</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Start recording to see your transcriptions here.
          </p>
        </div>
      )}

      {!loading && !error && transcriptions.length > 0 && (
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {transcriptions.map((transcription) => (
            <div
              key={transcription.id}
              onMouseEnter={() => setHoveredId(transcription.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                position: 'relative',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.5rem',
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#6c757d',
                }}>
                  {formatDate(transcription.created_at)}
                </span>
                {hoveredId === transcription.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(transcription.text, transcription.id);
                    }}
                    style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.875rem',
                      backgroundColor: copiedId === transcription.id ? '#28a745' : '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    {copiedId === transcription.id ? '✓ Copied!' : '📋 Copy'}
                  </button>
                )}
              </div>
              <p style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                lineHeight: '1.6',
                margin: 0,
                color: '#333',
              }}>
                {transcription.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

