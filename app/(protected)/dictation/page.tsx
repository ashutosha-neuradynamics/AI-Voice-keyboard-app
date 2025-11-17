'use client';

import { useState, useEffect, useRef } from 'react';
import { createAudioRecorder } from '@/lib/audio-recorder';
import { createAudioSlicer } from '@/lib/audio-slicer';
import type { AudioRecorder } from '@/lib/audio-recorder';
import type { AudioSlicer } from '@/lib/audio-slicer';
import TranscriptionHistory from '@/components/TranscriptionHistory';

export default function DictationPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [error, setError] = useState('');
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const slicerRef = useRef<AudioSlicer | null>(null);
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
      }
      if (recorderRef.current && recorderRef.current.isRecording()) {
        recorderRef.current.stop();
      }
      if (slicerRef.current) {
        slicerRef.current.stop();
      }
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      setError('');
      setCurrentTranscription('');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Edge.');
        return;
      }

      const recorder = await createAudioRecorder({ mimeType: 'audio/webm' });
      recorderRef.current = recorder;

      const slicer = createAudioSlicer({ sliceIntervalMs: 5000 });
      slicerRef.current = slicer;

      slicer.onSlice(async (sliceBlob) => {
        if (sliceBlob.size === 0) return;

        setIsProcessing(true);
        try {
          const formData = new FormData();
          formData.append('audio', sliceBlob, 'audio.webm');
          formData.append('sessionId', sessionId);

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (data.success) {
            setCurrentTranscription(data.transcription);
          } else {
            setError(data.error || 'Transcription failed');
          }
        } catch (err) {
          setError('Failed to transcribe audio slice');
          console.error('Transcription error:', err);
        } finally {
          setIsProcessing(false);
        }
      });

      await recorder.start();

      let lastChunkCount = 0;
      chunkIntervalRef.current = setInterval(() => {
        if (recorderRef.current && recorderRef.current.isRecording() && slicerRef.current) {
          const chunks = recorderRef.current.getChunks();
          
          if (chunks.length > lastChunkCount) {
            const newChunks = chunks.slice(lastChunkCount);
            
            if (!slicerRef.current.isSlicing()) {
              if (newChunks.length > 0) {
                const initialBlob = new Blob(newChunks, { type: 'audio/webm' });
                slicerRef.current.start(initialBlob);
              }
            } else {
              newChunks.forEach((chunk) => {
                if (chunk && chunk.size > 0) {
                  slicerRef.current?.addChunk(chunk);
                }
              });
            }
            
            lastChunkCount = chunks.length;
          }
        } else {
          if (chunkIntervalRef.current) {
            clearInterval(chunkIntervalRef.current);
            chunkIntervalRef.current = null;
          }
        }
      }, 500);

      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      console.error('Recording error:', err);
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);

      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
        chunkIntervalRef.current = null;
      }

      if (slicerRef.current) {
        slicerRef.current.stop();
      }

      if (recorderRef.current) {
        await recorderRef.current.stop();
      }

      if (slicerRef.current) {
        const finalBlob = slicerRef.current.getBufferBlob();
        if (finalBlob.size > 0) {
          setIsProcessing(true);
          try {
            const formData = new FormData();
            formData.append('audio', finalBlob, 'audio.webm');
            formData.append('sessionId', sessionId);
            formData.append('isFinal', 'true');

            const response = await fetch('/api/transcribe', {
              method: 'POST',
              body: formData,
            });

            const data = await response.json();

            if (data.success) {
              setCurrentTranscription(data.transcription);
              setRefreshHistory((prev) => prev + 1);
            } else {
              setError(data.error || 'Final transcription failed');
            }
          } catch (err) {
            setError('Failed to transcribe final audio');
            console.error('Final transcription error:', err);
          } finally {
            setIsProcessing(false);
          }
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      console.error('Stop recording error:', err);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '2rem' }}>Voice Dictation</h1>

          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={handleToggleRecording}
              disabled={isProcessing}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.125rem',
                backgroundColor: isRecording ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                minWidth: '200px',
              }}
            >
              {isRecording ? '⏹ Stop Recording' : '🎤 Start Recording'}
            </button>
          </div>

          {isRecording && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '4px',
              marginBottom: '1rem',
            }}>
              <strong>Recording...</strong> Speak into your microphone.
            </div>
          )}

          {isProcessing && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#d1ecf1',
              border: '1px solid #0c5460',
              borderRadius: '4px',
              marginBottom: '1rem',
            }}>
              <strong>Processing...</strong> Transcribing audio...
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
              <strong>Error:</strong> {error}
            </div>
          )}

          {currentTranscription && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              minHeight: '200px',
            }}>
              <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Current Transcription</h2>
              <p style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                lineHeight: '1.6',
                margin: 0,
              }}>
                {currentTranscription}
              </p>
            </div>
          )}

          {!isRecording && !currentTranscription && (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#6c757d',
            }}>
              <p>Click &quot;Start Recording&quot; to begin transcribing your voice.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                The transcription will appear here as you speak.
              </p>
            </div>
          )}
        </div>

        <div>
          <TranscriptionHistory refreshTrigger={refreshHistory} />
        </div>
      </div>
    </div>
  );
}
