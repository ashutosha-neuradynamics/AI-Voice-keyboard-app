import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { query } from '@/lib/db';
import { transcribeAudio } from '@/lib/whisper-api';
import { mergeTranscriptions } from '@/lib/transcription-merger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const sessionId = formData.get('sessionId') as string;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'Audio file is required' },
        { status: 400 }
      );
    }

    const dictionaryResult = await query(
      'SELECT keyword, spelling FROM dictionary WHERE user_id = $1',
      [userId]
    );
    const dictionaryEntries = dictionaryResult.rows.map((row) => ({
      keyword: row.keyword,
      spelling: row.spelling,
    }));

    const audioBlob = await audioFile.arrayBuffer();
    const audioBuffer = new Blob([audioBlob], { type: audioFile.type || 'audio/webm' });

    const newTranscription = await transcribeAudio(audioBuffer, dictionaryEntries);

    let finalTranscription = newTranscription;

    if (sessionId) {
      const existingResult = await query(
        'SELECT text FROM transcriptions WHERE user_id = $1 AND metadata->>\'sessionId\' = $2 ORDER BY created_at DESC LIMIT 1',
        [userId, sessionId]
      );

      if (existingResult.rows.length > 0) {
        const existingText = existingResult.rows[0].text;
        finalTranscription = mergeTranscriptions([existingText, newTranscription]);
      }
    }

    const result = await query(
      'INSERT INTO transcriptions (user_id, text, metadata) VALUES ($1, $2, $3) RETURNING id, text, created_at',
      [
        userId,
        finalTranscription,
        JSON.stringify({ sessionId: sessionId || null }),
      ]
    );

    return NextResponse.json({
      success: true,
      transcription: finalTranscription,
      id: result.rows[0].id,
      created_at: result.rows[0].created_at,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred during transcription',
      },
      { status: 500 }
    );
  }
}

