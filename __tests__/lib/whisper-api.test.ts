import { transcribeAudio, buildTranscriptionPrompt } from '@/lib/whisper-api';
import OpenAI from 'openai';

jest.mock('openai');

describe('Whisper API', () => {
  const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      audio: {
        transcriptions: {
          create: jest.fn(),
        },
      },
    };
    mockOpenAI.mockImplementation(() => mockClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('buildTranscriptionPrompt', () => {
    it('should build prompt without dictionary entries', () => {
      const prompt = buildTranscriptionPrompt([]);
      expect(prompt).toContain('transcribe');
      expect(prompt).toContain('accurate');
    });

    it('should include dictionary entries in prompt', () => {
      const dictionary = [
        { keyword: 'API', spelling: 'API' },
        { keyword: 'JavaScript', spelling: 'JavaScript' },
      ];
      const prompt = buildTranscriptionPrompt(dictionary);
      expect(prompt).toContain('API');
      expect(prompt).toContain('JavaScript');
    });

    it('should format dictionary entries correctly', () => {
      const dictionary = [
        { keyword: 'test', spelling: 'test word' },
      ];
      const prompt = buildTranscriptionPrompt(dictionary);
      expect(prompt).toMatch(/test.*test word/i);
    });
  });

  describe('transcribeAudio', () => {
    it('should transcribe audio successfully', async () => {
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const mockResponse = {
        text: 'This is a test transcription',
      };

      mockClient.audio.transcriptions.create.mockResolvedValue(mockResponse);

      const result = await transcribeAudio(mockAudioBlob, []);

      expect(result).toBe('This is a test transcription');
      expect(mockClient.audio.transcriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.any(File),
          model: 'whisper-1',
        })
      );
    });

    it('should include dictionary entries in prompt', async () => {
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const dictionary = [
        { keyword: 'test', spelling: 'test word' },
      ];
      const mockResponse = {
        text: 'This is a test word transcription',
      };

      mockClient.audio.transcriptions.create.mockResolvedValue(mockResponse);

      await transcribeAudio(mockAudioBlob, dictionary);

      const callArgs = mockClient.audio.transcriptions.create.mock.calls[0][0];
      expect(callArgs.prompt).toContain('test');
      expect(callArgs.prompt).toContain('test word');
    });

    it('should handle API errors gracefully', async () => {
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const error = new Error('API Error');

      mockClient.audio.transcriptions.create.mockRejectedValue(error);

      await expect(transcribeAudio(mockAudioBlob, [])).rejects.toThrow('API Error');
    });

    it('should handle missing API key', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/webm' });

      await expect(transcribeAudio(mockAudioBlob, [])).rejects.toThrow();

      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      }
    });

    it('should convert blob to File correctly', async () => {
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const mockResponse = {
        text: 'Transcription',
      };

      mockClient.audio.transcriptions.create.mockResolvedValue(mockResponse);

      await transcribeAudio(mockAudioBlob, []);

      const callArgs = mockClient.audio.transcriptions.create.mock.calls[0][0];
      expect(callArgs.file).toBeInstanceOf(File);
      expect(callArgs.file.name).toBe('audio.webm');
    });
  });
});

