import { useState, useRef, useEffect, useCallback } from 'react';
import { generateSpeech } from '../services/gemini';
import { base64ToBytes, uint8ToBase64 } from '../utils/audio';
import { getAudio, putAudio, clearAudio as clearAudioDB, getAlignment, putAlignment, clearAlignments } from '../services/db';
import { requestAlignment } from '../services/alignment';
import type { WordAlignment } from '../types';

export function useAudioPlayer(difficulty: string) {
  const audioCacheRef = useRef<Set<string>>(new Set());
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<number | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [alignmentMap, setAlignmentMap] = useState<Record<string, WordAlignment[]>>({});

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startOffsetRef = useRef<number>(0);
  const startCtxTimeRef = useRef<number>(0);
  const alignmentPendingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      stopSourceNode();
      audioCtxRef.current?.close();
    };
  }, []);

  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const getCurrentPosition = (): number => {
    const ctx = audioCtxRef.current;
    if (!ctx) return 0;
    return startOffsetRef.current + (ctx.currentTime - startCtxTimeRef.current);
  };

  const stopSourceNode = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null;
      try { sourceNodeRef.current.stop(); } catch { /* already stopped */ }
      sourceNodeRef.current = null;
    }
  };

  const startPlayback = (buffer: AudioBuffer, offset: number, duration?: number) => {
    const ctx = getAudioContext();
    stopSourceNode();

    const clampedOffset = Math.max(0, Math.min(offset, buffer.duration));
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      const pos = startOffsetRef.current + (ctx.currentTime - startCtxTimeRef.current);
      if (pos >= buffer.duration - 0.1 || duration !== undefined) {
        setSpeakingIndex(null);
        setIsAudioPaused(false);
        startOffsetRef.current = 0;
        sourceNodeRef.current = null;
      }
    };
    if (duration !== undefined) {
      source.start(0, clampedOffset, duration);
    } else {
      source.start(0, clampedOffset);
    }
    startOffsetRef.current = clampedOffset;
    startCtxTimeRef.current = ctx.currentTime;
    sourceNodeRef.current = source;
  };

  const stopSpeaking = useCallback(() => {
    stopSourceNode();
    audioBufferRef.current = null;
    startOffsetRef.current = 0;
    setSpeakingIndex(null);
    setIsLoadingAudio(null);
    setIsAudioPaused(false);
  }, []);

  const clearAudioCache = useCallback(() => {
    audioCacheRef.current.clear();
    clearAudioDB().catch(() => { /* skip */ });
    clearAlignments().catch(() => { /* skip */ });
    setAlignmentMap({});
    alignmentPendingRef.current.clear();
  }, []);

  // Request alignment in background and cache result
  const fetchAlignment = useCallback(async (text: string, wavBase64: string) => {
    if (alignmentPendingRef.current.has(text)) return;
    alignmentPendingRef.current.add(text);

    try {
      // Check IndexedDB cache first
      const cached = await getAlignment(text);
      if (cached && cached.length > 0) {
        setAlignmentMap(prev => ({ ...prev, [text]: cached }));
        return;
      }

      const words = await requestAlignment(wavBase64, text);
      if (words.length > 0) {
        setAlignmentMap(prev => ({ ...prev, [text]: words }));
        putAlignment(text, words).catch(() => { /* skip */ });
      }
    } catch (err) {
      console.error('Alignment request failed:', err);
    } finally {
      alignmentPendingRef.current.delete(text);
    }
  }, []);

  const playParagraph = useCallback(async (text: string, index: number) => {
    if (speakingIndex === index) {
      stopSpeaking();
      return;
    }

    stopSpeaking();
    setIsLoadingAudio(index);

    const ctx = getAudioContext();
    await ctx.resume();

    try {
      let wavBuffer: ArrayBuffer;
      let wavBase64: string | null = null;

      const cached = await getAudio(text);
      if (cached) {
        wavBuffer = cached;
      } else {
        wavBase64 = await generateSpeech(text, difficulty);
        const bytes = base64ToBytes(wavBase64);
        wavBuffer = bytes.buffer.slice(0) as ArrayBuffer;
        audioCacheRef.current.add(text);
        putAudio(text, wavBuffer.slice(0)).catch(() => { /* quota exceeded, skip */ });
      }

      const audioBuffer = await ctx.decodeAudioData(wavBuffer.slice(0));
      audioBufferRef.current = audioBuffer;

      setSpeakingIndex(index);
      setIsLoadingAudio(null);
      setIsAudioPaused(false);
      startPlayback(audioBuffer, 0);

      // Request alignment in background if not already available
      if (!alignmentMap[text]) {
        if (!wavBase64) {
          // Convert cached ArrayBuffer to base64 for alignment API
          const cachedBuf = await getAudio(text);
          if (cachedBuf) {
            wavBase64 = uint8ToBase64(new Uint8Array(cachedBuf));
          }
        }
        if (wavBase64) {
          fetchAlignment(text, wavBase64);
        }
      }
    } catch (error) {
      console.error("Failed to generate/play audio:", error);
      alert("Failed to generate audio. Please try again.");
      setIsLoadingAudio(null);
    }
  }, [speakingIndex, difficulty, stopSpeaking, alignmentMap, fetchAlignment]);

  const playWordAudio = useCallback(async (paragraphText: string, start: number, end: number) => {
    const ctx = getAudioContext();
    await ctx.resume();

    try {
      const cached = await getAudio(paragraphText);
      if (!cached) return;

      const audioBuffer = await ctx.decodeAudioData(cached.slice(0));
      stopSourceNode();

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => { sourceNodeRef.current = null; };
      source.start(0, start, end - start);
      sourceNodeRef.current = source;
    } catch (err) {
      console.error('Failed to play word audio:', err);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    const buffer = audioBufferRef.current;
    if (!buffer) return;

    if (isAudioPaused) {
      startPlayback(buffer, startOffsetRef.current);
      setIsAudioPaused(false);
    } else {
      const pos = getCurrentPosition();
      stopSourceNode();
      startOffsetRef.current = pos;
      setIsAudioPaused(true);
    }
  }, [isAudioPaused]);

  const skipAudio = useCallback((seconds: number) => {
    const buffer = audioBufferRef.current;
    if (!buffer) return;

    const newOffset = Math.max(0, Math.min(buffer.duration, getCurrentPosition() + seconds));
    if (isAudioPaused) {
      startOffsetRef.current = newOffset;
    } else {
      startPlayback(buffer, newOffset);
    }
  }, [isAudioPaused]);

  return {
    speakingIndex,
    isLoadingAudio,
    isAudioPaused,
    alignmentMap,
    stopSpeaking,
    clearAudioCache,
    playParagraph,
    playWordAudio,
    togglePlayPause,
    skipAudio,
  };
}
