import { useState, useRef, useEffect, useCallback } from 'react';
import { generateSpeech } from '../services/gemini';
import { base64ToBytes } from '../utils/audio';
import { STORAGE_KEY_AUDIO } from '../constants';

export function useAudioPlayer(difficulty: string) {
  const [audioCache, setAudioCache] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_AUDIO) || '{}') as Record<string, string>; } catch { return {}; }
  });
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
    setAudioCache({});
    try { localStorage.removeItem(STORAGE_KEY_AUDIO); } catch { /* skip */ }
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
      let wavBase64: string;
      if (audioCache[text]) {
        wavBase64 = audioCache[text];
      } else {
        wavBase64 = await generateSpeech(text, difficulty);
        const newCache = { ...audioCache, [text]: wavBase64 };
        setAudioCache(newCache);
        try {
          localStorage.setItem(STORAGE_KEY_AUDIO, JSON.stringify(newCache));
        } catch { /* quota exceeded, skip */ }
      }

      const bytes = base64ToBytes(wavBase64);
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0) as ArrayBuffer);
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
  }, [speakingIndex, audioCache, difficulty, stopSpeaking]);

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
