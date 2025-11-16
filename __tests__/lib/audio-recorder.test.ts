/**
 * Tests for the audio recorder utility.
 * These rely on the presence of MediaRecorder and navigator.mediaDevices in the environment.
 */
import { createAudioRecorder } from '@/lib/audio-recorder';

function mockMediaRecorder() {
  class MockMediaRecorder {
    public state: 'inactive' | 'recording' | 'paused' = 'inactive';
    private listeners: Record<string, Function[]> = {};
    private intervalId: any = null;

    constructor(public stream: MediaStream) {}

    start() {
      this.state = 'recording';
      this.emit('start');
      // Simulate dataavailable events
      this.intervalId = setInterval(() => {
        const blob = new Blob(['test'], { type: 'audio/webm' });
        this.emit('dataavailable', { data: blob });
      }, 50);
    }

    stop() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      this.state = 'inactive';
      this.emit('stop');
    }

    addEventListener(event: string, handler: Function) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(handler);
    }

    removeEventListener(event: string, handler: Function) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
    }

    private emit(event: string, payload?: unknown) {
      if (!this.listeners[event]) return;
      for (const handler of this.listeners[event]) {
        // @ts-ignore
        handler(payload);
      }
    }
  }

  // @ts-ignore
  global.MediaRecorder = MockMediaRecorder;
}

describe('createAudioRecorder', () => {
  beforeAll(() => {
    // Mock getUserMedia
    // @ts-ignore
    global.navigator = {
      mediaDevices: {
        getUserMedia: jest.fn(async () => {
          // Minimal stub MediaStream
          return {} as MediaStream;
        }),
      },
    };

    mockMediaRecorder();
  });

  it('should request microphone access and start recording', async () => {
    const recorder = await createAudioRecorder();

    expect(recorder.isRecording()).toBe(false);

    await recorder.start();
    expect(recorder.isRecording()).toBe(true);

    await recorder.stop();
    expect(recorder.isRecording()).toBe(false);
  });

  it('should capture audio chunks while recording', async () => {
    const recorder = await createAudioRecorder();

    await recorder.start();

    // Allow some time for mock data events
    await new Promise((resolve) => setTimeout(resolve, 160));

    const chunks = recorder.getChunks();
    expect(chunks.length).toBeGreaterThan(0);

    await recorder.stop();
  });

  it('should return a Blob from getBlob', async () => {
    const recorder = await createAudioRecorder();

    await recorder.start();

    // Allow some time for at least one chunk
    await new Promise((resolve) => setTimeout(resolve, 100));

    const blob = await recorder.getBlob();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);

    await recorder.stop();
  });

  it('should not fail when stopping without starting', async () => {
    const recorder = await createAudioRecorder();

    await recorder.stop();
    expect(recorder.isRecording()).toBe(false);
  });
});


