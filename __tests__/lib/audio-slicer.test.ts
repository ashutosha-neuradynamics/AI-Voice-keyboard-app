import { createAudioSlicer } from '@/lib/audio-slicer';

describe('Audio Slicer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create an audio slicer with default 5 second interval', () => {
    const slicer = createAudioSlicer();
    expect(slicer).toBeDefined();
    expect(slicer.getSliceInterval()).toBe(5000);
  });

  it('should create an audio slicer with custom interval', () => {
    const slicer = createAudioSlicer({ sliceIntervalMs: 3000 });
    expect(slicer.getSliceInterval()).toBe(3000);
  });

  it('should start slicing and emit slices at intervals', (done) => {
    const slicer = createAudioSlicer({ sliceIntervalMs: 100 });
    const mockBlob = new Blob(['test audio data'], { type: 'audio/webm' });
    const slices: Blob[] = [];

    slicer.onSlice((slice) => {
      slices.push(slice);
      if (slices.length === 2) {
        expect(slices.length).toBe(2);
        slicer.stop();
        done();
      }
    });

    slicer.start(mockBlob);

    jest.advanceTimersByTime(100);
    jest.advanceTimersByTime(100);
  });

  it('should accumulate audio data in buffer', () => {
    const slicer = createAudioSlicer({ sliceIntervalMs: 100 });
    const mockBlob1 = new Blob(['chunk1'], { type: 'audio/webm' });
    const mockBlob2 = new Blob(['chunk2'], { type: 'audio/webm' });

    slicer.start(mockBlob1);
    slicer.addChunk(mockBlob2);

    const buffer = slicer.getBuffer();
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should stop slicing and clear buffer', () => {
    const slicer = createAudioSlicer({ sliceIntervalMs: 100 });
    const mockBlob = new Blob(['test'], { type: 'audio/webm' });

    slicer.start(mockBlob);
    slicer.stop();

    expect(slicer.isSlicing()).toBe(false);
  });

  it('should get current buffer as blob', () => {
    const slicer = createAudioSlicer();
    const mockBlob1 = new Blob(['chunk1'], { type: 'audio/webm' });
    const mockBlob2 = new Blob(['chunk2'], { type: 'audio/webm' });

    slicer.start(mockBlob1);
    slicer.addChunk(mockBlob2);

    const bufferBlob = slicer.getBufferBlob();
    expect(bufferBlob).toBeInstanceOf(Blob);
  });

  it('should clear buffer', () => {
    const slicer = createAudioSlicer();
    const mockBlob = new Blob(['test'], { type: 'audio/webm' });

    slicer.start(mockBlob);
    slicer.addChunk(mockBlob);
    slicer.clearBuffer();

    const buffer = slicer.getBuffer();
    expect(buffer.length).toBe(0);
  });

  it('should handle multiple slice callbacks', (done) => {
    const slicer = createAudioSlicer({ sliceIntervalMs: 50 });
    const mockBlob = new Blob(['test'], { type: 'audio/webm' });
    let callbackCount = 0;

    const callback1 = () => {
      callbackCount++;
    };
    const callback2 = () => {
      callbackCount++;
      if (callbackCount === 2) {
        slicer.stop();
        done();
      }
    };

    slicer.onSlice(callback1);
    slicer.onSlice(callback2);

    slicer.start(mockBlob);
    jest.advanceTimersByTime(50);
  });

  it('should not emit slices after stopping', () => {
    const slicer = createAudioSlicer({ sliceIntervalMs: 100 });
    const mockBlob = new Blob(['test'], { type: 'audio/webm' });
    let sliceCount = 0;

    slicer.onSlice(() => {
      sliceCount++;
    });

    slicer.start(mockBlob);
    slicer.stop();
    jest.advanceTimersByTime(200);

    expect(sliceCount).toBe(0);
  });
});

