import type { WordAlignment } from '../types';

export async function requestAlignment(
  audioBase64: string,
  text: string,
): Promise<WordAlignment[]> {
  const res = await fetch('/api/align', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio_base64: audioBase64, text }),
  });

  const data = await res.json();

  if (data.error) {
    console.error('Alignment failed:', data.error);
    return [];
  }

  return data.words as WordAlignment[];
}
