import { useState, useRef, useEffect, useCallback } from 'react';
import { generateSpeech } from '../services/gemini';
import { base64ToBytes } from '../utils/audio';
import { getAudio, putAudio, clearAudio as clearAudioDB } from '../services/db';

export function useAudioPlayer(difficulty: string) {
  const audioCacheRef = useRef<Set<string>>(new Set());
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<number | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startOffsetRef = useRef<number>(0);
  const startCtxTimeRef = useRef<number>(0);

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

  const startPlayback = (buffer: AudioBuffer, offset: number) => {
    const ctx = getAudioContext();
    stopSourceNode();

    const clampedOffset = Math.max(0, Math.min(offset, buffer.duration));
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      const pos = startOffsetRef.current + (ctx.currentTime - startCtxTimeRef.current);
      if (pos >= buffer.duration - 0.1) {
        setSpeakingIndex(null);
        setIsAudioPaused(false);
        startOffsetRef.current = 0;
        sourceNodeRef.current = null;
      }
    };
    source.start(0, clampedOffset);
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
      const cached = await getAudio(text);
      if (cached) {
        wavBuffer = cached;
      } else {
        const wavBase64 = await generateSpeech(text, difficulty);
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
    } catch (error) {
      console.error("Failed to generate/play audio:", error);
      alert("Failed to generate audio. Please try again.");
      setIsLoadingAudio(null);
    }
  }, [speakingIndex, difficulty, stopSpeaking]);

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
    stopSpeaking,
    clearAudioCache,
    playParagraph,
    togglePlayPause,
    skipAudio,
  };
}
