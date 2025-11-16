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

  const recorder = new MediaRecorder(stream, {
    mimeType: options.mimeType || 'audio/webm',
  });

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
    recorder.start();
    state = 'recording';
  };

  const stop = async () => {
    if (state !== 'recording') return;
    return new Promise<void>((resolve) => {
      const handleStop = () => {
        recorder.removeEventListener('stop', handleStop);
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


