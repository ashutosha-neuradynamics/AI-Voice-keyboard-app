export type AudioRecorderState = 'idle' | 'recording';

export interface AudioRecorderOptions {
  mimeType?: string;
}

export interface AudioRecorder {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  isRecording: () => boolean;
  getChunks: () => Blob[];
  getBlob: () => Promise<Blob>;
}

export async function createAudioRecorder(
  options: AudioRecorderOptions = {},
): Promise<AudioRecorder> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Media devices are not available in this environment');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const mimeType = options.mimeType || 'audio/webm';
  let recorder: MediaRecorder;
  
  try {
    recorder = new MediaRecorder(stream, { mimeType });
  } catch (err) {
    recorder = new MediaRecorder(stream);
  }

  let state: AudioRecorderState = 'idle';
  const chunks: Blob[] = [];

  recorder.addEventListener('dataavailable', (event: BlobEvent) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  const start = async () => {
    if (state === 'recording') return;
    chunks.length = 0;
    recorder.start(1000);
    state = 'recording';
  };

  const stop = async () => {
    if (state !== 'recording') return;
    return new Promise<void>((resolve) => {
      const handleStop = () => {
        recorder.removeEventListener('stop', handleStop);
        stream.getTracks().forEach((track) => track.stop());
        state = 'idle';
        resolve();
      };
      recorder.addEventListener('stop', handleStop);
      recorder.stop();
    });
  };

  const isRecording = () => state === 'recording';

  const getChunks = () => [...chunks];

  const getBlob = async () => {
    if (chunks.length === 0) {
      // Ensure at least one chunk exists
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return new Blob(chunks, { type: options.mimeType || 'audio/webm' });
  };

  return {
    start,
    stop,
    isRecording,
    getChunks,
    getBlob,
  };
}


