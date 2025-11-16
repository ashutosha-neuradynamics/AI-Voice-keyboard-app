export function removeOverlap(text1: string, text2: string): string {
  if (!text1 || !text2) return text1;

  const words1 = text1.trim().toLowerCase().split(/\s+/);
  const words2 = text2.trim().toLowerCase().split(/\s+/);

  if (words1.length === 0 || words2.length === 0) return text1;

  let maxOverlap = 0;
  const minLength = Math.min(words1.length, words2.length);

  for (let i = 1; i <= minLength; i++) {
    const suffix1 = words1.slice(-i).join(' ');
    const prefix2 = words2.slice(0, i).join(' ');

    if (suffix1 === prefix2) {
      maxOverlap = i;
    }
  }

  if (maxOverlap > 0) {
    const wordsToKeep = words1.slice(0, -maxOverlap);
    const originalWords = text1.trim().split(/\s+/);
    const keepCount = originalWords.length - maxOverlap;

    if (keepCount > 0) {
      return originalWords.slice(0, keepCount).join(' ') + ' ';
    }
    return '';
  }

  return text1.trim() + ' ';
}

export function mergeTranscriptions(transcriptions: string[]): string {
  if (transcriptions.length === 0) return '';
  if (transcriptions.length === 1) return transcriptions[0].trim();

  let merged = transcriptions[0].trim();

  for (let i = 1; i < transcriptions.length; i++) {
    const current = transcriptions[i].trim();
    if (!current) continue;

    const withoutOverlap = removeOverlap(merged, current);
    merged = withoutOverlap + current;
  }

  return merged.trim();
}

