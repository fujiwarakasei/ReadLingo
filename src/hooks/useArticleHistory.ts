import { useState, useCallback } from 'react';
import type { Difficulty, Segment, HistoryItem } from '../types';
import { STORAGE_KEY_HISTORY, MAX_HISTORY } from '../constants';

export function useArticleHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '[]') as HistoryItem[]; } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);

  const saveToHistory = useCallback((topic: string, title: string, difficulty: Difficulty, article: string, createdAt: string, segments?: Segment[]) => {
    const item: HistoryItem = { id: Date.now().toString(), topic, title, difficulty, article, segments, createdAt };
    setHistory(prev => {
      const updated = [item, ...prev].slice(0, MAX_HISTORY);
      try { localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated)); } catch { /* quota exceeded */ }
      return updated;
    });
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      try { localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated)); } catch { /* skip */ }
      return updated;
    });
  }, []);

  return {
    history,
    showHistory,
    setShowHistory,
    saveToHistory,
    deleteHistoryItem,
  };
}
