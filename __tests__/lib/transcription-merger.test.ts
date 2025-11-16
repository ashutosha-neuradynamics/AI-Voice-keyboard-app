import { mergeTranscriptions, removeOverlap } from '@/lib/transcription-merger';

describe('Transcription Merger', () => {
  describe('removeOverlap', () => {
    it('should remove overlapping text from the end of first string', () => {
      const result = removeOverlap('Hello world this is', 'this is a test');
      expect(result).toBe('Hello world ');
    });

    it('should handle no overlap', () => {
      const result = removeOverlap('Hello world', 'this is a test');
      expect(result).toBe('Hello world');
    });

    it('should handle complete overlap', () => {
      const result = removeOverlap('Hello world', 'Hello world');
      expect(result).toBe('');
    });

    it('should handle partial word overlap', () => {
      const result = removeOverlap('Hello world', 'world test');
      expect(result).toBe('Hello ');
    });

    it('should handle empty strings', () => {
      expect(removeOverlap('', 'test')).toBe('');
      expect(removeOverlap('test', '')).toBe('test');
      expect(removeOverlap('', '')).toBe('');
    });
  });

  describe('mergeTranscriptions', () => {
    it('should merge multiple transcriptions', () => {
      const transcriptions = [
        'Hello world this is',
        'this is a test',
        'a test of the system',
      ];
      const result = mergeTranscriptions(transcriptions);
      expect(result).toBe('Hello world this is a test of the system');
    });

    it('should handle single transcription', () => {
      const transcriptions = ['Hello world'];
      const result = mergeTranscriptions(transcriptions);
      expect(result).toBe('Hello world');
    });

    it('should handle empty array', () => {
      const result = mergeTranscriptions([]);
      expect(result).toBe('');
    });

    it('should handle transcriptions with punctuation', () => {
      const transcriptions = [
        'Hello, world. This is',
        'This is a test.',
        'A test of the system.',
      ];
      const result = mergeTranscriptions(transcriptions);
      expect(result).toContain('Hello, world.');
      expect(result).toContain('This is a test.');
    });

    it('should handle transcriptions with no overlap', () => {
      const transcriptions = [
        'First sentence.',
        'Second sentence.',
        'Third sentence.',
      ];
      const result = mergeTranscriptions(transcriptions);
      expect(result).toBe('First sentence. Second sentence. Third sentence.');
    });

    it('should handle transcriptions with multiple word overlaps', () => {
      const transcriptions = [
        'The quick brown fox',
        'brown fox jumps over',
        'jumps over the lazy dog',
      ];
      const result = mergeTranscriptions(transcriptions);
      expect(result).toBe('The quick brown fox jumps over the lazy dog');
    });

    it('should preserve sentence boundaries', () => {
      const transcriptions = [
        'First sentence. Second',
        'Second sentence starts here.',
      ];
      const result = mergeTranscriptions(transcriptions);
      expect(result).toContain('First sentence.');
    });

    it('should handle case differences in overlap', () => {
      const transcriptions = [
        'Hello world',
        'World test',
      ];
      const result = mergeTranscriptions(transcriptions);
      expect(result.toLowerCase()).toContain('hello world test');
    });
  });
});

