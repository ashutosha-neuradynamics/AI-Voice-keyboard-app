export interface AudioSlicerOptions {
  sliceIntervalMs?: number;
}

export interface AudioSlicer {
  start(initialBlob: Blob): void;
  stop(): void;
  addChunk(chunk: Blob): void;
  onSlice(callback: (slice: Blob) => void): void;
  isSlicing(): boolean;
  getSliceInterval(): number;
  getBuffer(): Blob[];
  getBufferBlob(): Blob;
  clearBuffer(): void;
}

export function createAudioSlicer(options: AudioSlicerOptions = {}): AudioSlicer {
  const sliceIntervalMs = options.sliceIntervalMs || 5000;
  let buffer: Blob[] = [];
  let sliceCallbacks: ((slice: Blob) => void)[] = [];
  let intervalId: NodeJS.Timeout | null = null;
  let isActive = false;

  const emitSlice = () => {
    if (buffer.length === 0 || !isActive) return;

    const sliceBlob = new Blob(buffer, { type: 'audio/webm' });
    sliceCallbacks.forEach((callback) => callback(sliceBlob));
  };

  const start = (initialBlob: Blob) => {
    if (isActive) return;

    buffer = [initialBlob];
    isActive = true;

    intervalId = setInterval(() => {
      emitSlice();
    }, sliceIntervalMs);
  };

  const stop = () => {
    if (!isActive) return;

    isActive = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const addChunk = (chunk: Blob) => {
    if (!isActive) return;
    buffer.push(chunk);
  };

  const onSlice = (callback: (slice: Blob) => void) => {
    sliceCallbacks.push(callback);
  };

  const isSlicing = () => isActive;

  const getSliceInterval = () => sliceIntervalMs;

  const getBuffer = () => [...buffer];

  const getBufferBlob = () => {
    if (buffer.length === 0) {
      return new Blob([], { type: 'audio/webm' });
    }
    return new Blob(buffer, { type: 'audio/webm' });
  };

  const clearBuffer = () => {
    buffer = [];
  };

  return {
    start,
    stop,
    addChunk,
    onSlice,
    isSlicing,
    getSliceInterval,
    getBuffer,
    getBufferBlob,
    clearBuffer,
  };
}

