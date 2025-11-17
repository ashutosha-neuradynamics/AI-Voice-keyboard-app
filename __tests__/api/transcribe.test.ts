import { NextRequest } from 'next/server';
import { POST } from '@/app/api/transcribe/route';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

jest.mock('next-auth/next');
jest.mock('@/lib/whisper-api');
jest.mock('@/lib/transcription-merger');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('Transcription API', () => {
  let testUserId: number;
  let testSession: any;

  beforeAll(async () => {
    const passwordHash = await hashPassword('TestPassword123!');
    const userResult = await query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
      ['transcribe-test@example.com', passwordHash, 'Test User']
    );
    testUserId = userResult.rows[0].id;

    testSession = {
      user: {
        id: testUserId.toString(),
        email: 'transcribe-test@example.com',
        name: 'Test User',
      },
    };
  });

  afterAll(async () => {
    await query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  beforeEach(() => {
    mockGetServerSession.mockResolvedValue(testSession);
  });

  afterEach(async () => {
    await query('DELETE FROM transcriptions WHERE user_id = $1', [testUserId]);
    await query('DELETE FROM dictionary WHERE user_id = $1', [testUserId]);
    jest.clearAllMocks();
  });

  it('should transcribe audio and store result', async () => {
    const { transcribeAudio } = require('@/lib/whisper-api');
    transcribeAudio.mockResolvedValue('This is a test transcription');

    const formData = new FormData();
    const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
    formData.append('audio', audioBlob, 'audio.webm');
    formData.append('sessionId', 'test-session-123');

    const request = new NextRequest('http://localhost:3000/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.transcription).toBe('This is a test transcription');
    expect(transcribeAudio).toHaveBeenCalled();
  });

  it('should include dictionary entries in transcription', async () => {
    await query(
      'INSERT INTO dictionary (user_id, keyword, spelling) VALUES ($1, $2, $3)',
      [testUserId, 'API', 'API']
    );

    const { transcribeAudio } = require('@/lib/whisper-api');
    transcribeAudio.mockResolvedValue('This is an API test');

    const formData = new FormData();
    const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
    formData.append('audio', audioBlob, 'audio.webm');
    formData.append('sessionId', 'test-session-123');

    const request = new NextRequest('http://localhost:3000/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    await POST(request);

    expect(transcribeAudio).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.arrayContaining([
        expect.objectContaining({ keyword: 'API', spelling: 'API' }),
      ])
    );
  });

  it('should merge with existing transcription', async () => {
    await query(
      'INSERT INTO transcriptions (user_id, text, metadata) VALUES ($1, $2, $3)',
      [testUserId, 'Previous text', JSON.stringify({ sessionId: 'test-session-123' })]
    );

    const { transcribeAudio } = require('@/lib/whisper-api');
    const { mergeTranscriptions } = require('@/lib/transcription-merger');
    transcribeAudio.mockResolvedValue('New text');
    mergeTranscriptions.mockReturnValue('Previous text New text');

    const formData = new FormData();
    const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
    formData.append('audio', audioBlob, 'audio.webm');
    formData.append('sessionId', 'test-session-123');

    const request = new NextRequest('http://localhost:3000/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mergeTranscriptions).toHaveBeenCalled();
  });

  it('should reject unauthenticated requests', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const formData = new FormData();
    const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
    formData.append('audio', audioBlob, 'audio.webm');

    const request = new NextRequest('http://localhost:3000/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('should reject requests without audio file', async () => {
    const formData = new FormData();
    formData.append('sessionId', 'test-session-123');

    const request = new NextRequest('http://localhost:3000/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('audio');
  });

  it('should keep a single transcription row per session', async () => {
    const { transcribeAudio } = require('@/lib/whisper-api');
    transcribeAudio
      .mockResolvedValueOnce('First part')
      .mockResolvedValueOnce('Second part');

    const sessionId = 'test-session-single-row';

    const createRequestWithAudio = (isFinal = false) => {
      const formData = new FormData();
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('sessionId', sessionId);
      if (isFinal) {
        formData.append('isFinal', 'true');
      }

      return new NextRequest('http://localhost:3000/api/transcribe', {
        method: 'POST',
        body: formData,
      });
    };

    const firstResponse = await POST(createRequestWithAudio());
    expect(firstResponse.status).toBe(200);

    const secondResponse = await POST(createRequestWithAudio(true));
    expect(secondResponse.status).toBe(200);

    const dbResult = await query(
      'SELECT text FROM transcriptions WHERE user_id = $1 AND metadata->>\'sessionId\' = $2',
      [testUserId, sessionId]
    );

    expect(dbResult.rows.length).toBe(1);
    expect(dbResult.rows[0].text).toBe('Second part');
  });
});

