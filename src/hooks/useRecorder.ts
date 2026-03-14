import { useState, useRef, useCallback } from 'react';

type RecordingState = 'idle' | 'recording';

export function useRecorder() {
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const [recordings, setRecordings] = useState<Record<number, Blob>>({});
  const [playingRecording, setPlayingRecording] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async (index: number) => {
    // Stop any current recording first
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordings(prev => ({ ...prev, [index]: blob }));
        setRecordingIndex(null);
        // Release mic
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecordingIndex(index);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('无法访问麦克风，请检查浏览器权限设置。');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const playRecording = useCallback((index: number) => {
    const blob = recordings[index];
    if (!blob) return;

    // Stop any currently playing recording
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current = null;
    }

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioElRef.current = audio;
    setPlayingRecording(index);

    audio.onended = () => {
      setPlayingRecording(null);
      URL.revokeObjectURL(url);
      audioElRef.current = null;
    };
    audio.play();
  }, [recordings]);

  const stopPlayingRecording = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current = null;
    }
    setPlayingRecording(null);
  }, []);

  const deleteRecording = useCallback((index: number) => {
    stopPlayingRecording();
    setRecordings(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }, [stopPlayingRecording]);

  const clearAllRecordings = useCallback(() => {
    stopPlayingRecording();
    setRecordings({});
  }, [stopPlayingRecording]);

  const state = (index: number): RecordingState => {
    if (recordingIndex === index) return 'recording';
    return 'idle';
  };

  return {
    recordingIndex,
    recordings,
    playingRecording,
    startRecording,
    stopRecording,
    playRecording,
    stopPlayingRecording,
    deleteRecording,
    clearAllRecordings,
    state,
  };
}
