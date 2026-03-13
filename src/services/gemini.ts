import { GoogleGenAI, Modality } from "@google/genai";
import { base64ToBytes, uint8ToBase64, createWavFile } from "../utils/audio";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

import type { Segment } from '../types';

export async function generateArticle(topic: string, difficulty: string): Promise<{ title: string; content: string; segments: Segment[] }> {
  const prompt = `Generate a short English article (around 150-200 words) about "${topic}" at a "${difficulty}" reading level.

Requirements:
1. Create an appropriate, corrected title for the article. If the topic contains typos, grammatical errors, or unclear phrasing, fix them in the title.
2. Write engaging, educational content with vocabulary appropriate for the ${difficulty} level.
3. Split the article into segments. Each segment should typically be ONE sentence. However, if a sentence is very short (e.g., under 6 words), combine it with an adjacent sentence into one segment. Use your judgment to keep segments natural for reading aloud.
4. For each segment, provide a natural Chinese translation.
5. Insert 1-2 image markers in the segments array at appropriate positions to illustrate the article. Use the format: {"en": "[IMG: descriptive English prompt for image generation]", "zh": ""}. The image prompt should be specific, vivid, and relevant to the surrounding content. Place them between text segments where a visual would enhance understanding.

Return a JSON object with exactly this structure (no markdown, no code blocks):
{"title": "The Article Title", "segments": [{"en": "First sentence.", "zh": "第一句。"}, {"en": "[IMG: a vivid description of an illustration]", "zh": ""}, {"en": "Second sentence.", "zh": "第二句。"}]}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  const text = response.text || "";
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const rawSegments: Array<string | Segment> = parsed.segments || [];

    // Handle both old format (string[]) and new format (Segment[])
    const segments: Segment[] = rawSegments.map(s =>
      typeof s === 'string' ? { en: s, zh: '' } : s
    );
    const content = segments.map(s => s.en).join('\n');
    return { title: parsed.title || topic, content, segments };
  } catch {
    return { title: topic, content: text, segments: [{ en: text, zh: '' }] };
  }
}

export const IMG_MARKER_RE = /^\[IMG:\s*(.+?)\]$/;

export async function generateImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: `Generate an illustration: ${prompt}. Style: clean, friendly, suitable for an educational reading app. No text or letters in the image.`,
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find(
    (p: { inlineData?: { data?: string } }) => p.inlineData?.data
  );
  if (!imgPart?.inlineData?.data) {
    console.error("Image generation failed, response parts:", parts);
    throw new Error("Failed to generate image");
  }

  return imgPart.inlineData.data;
}

export async function generateSpeech(text: string, difficulty: string): Promise<string> {
  const speedInstruction =
    difficulty === 'Beginner'
      ? 'Read the following text slowly and clearly, with natural pauses between sentences.'
      : difficulty === 'Intermediate'
      ? 'Read the following text at a moderate, steady pace.'
      : 'Read the following text at a natural, conversational pace.';

  const fullText = `${speedInstruction}\n\n${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: fullText }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inlineData || !inlineData.data) {
    console.error("Invalid audio response:", response);
    throw new Error("Failed to generate audio");
  }

  const bytes = base64ToBytes(inlineData.data);

  let wavBytes: Uint8Array;

  // Check if it's already a WAV file (starts with "RIFF")
  if (bytes.length > 4 && bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70) {
    wavBytes = bytes;
  } else {
    // Assume raw PCM 16-bit 24000Hz mono
    const wavBlob = createWavFile(bytes, 24000);
    const ab = await wavBlob.arrayBuffer();
    wavBytes = new Uint8Array(ab);
  }

  return uint8ToBase64(wavBytes);
}
