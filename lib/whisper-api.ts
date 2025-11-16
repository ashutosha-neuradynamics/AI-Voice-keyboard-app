import OpenAI from 'openai';

export interface DictionaryEntry {
  keyword: string;
  spelling: string;
}

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export function buildTranscriptionPrompt(dictionaryEntries: DictionaryEntry[]): string {
  let prompt = 'Please transcribe the following audio accurately. ';

  if (dictionaryEntries.length > 0) {
    prompt += 'Please use the following spellings for specific terms:\n';
    dictionaryEntries.forEach((entry) => {
      prompt += `- "${entry.keyword}" should be spelled as "${entry.spelling}"\n`;
    });
    prompt += '\n';
  }

  prompt += 'Provide a clear, well-formatted transcription with proper punctuation and capitalization.';

  return prompt;
}

export async function transcribeAudio(
  audioBlob: Blob,
  dictionaryEntries: DictionaryEntry[] = []
): Promise<string> {
  const client = getOpenAIClient();
  const prompt = buildTranscriptionPrompt(dictionaryEntries);

  const file = new File([audioBlob], 'audio.webm', { type: audioBlob.type || 'audio/webm' });

  try {
    const response = await client.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      prompt: prompt,
      response_format: 'text',
    });

    return response as unknown as string;
  } catch (error) {
    console.error('Whisper API error:', error);
    throw error;
  }
}

