import React, { useState } from 'react';
import { generateArticle } from './services/gemini';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useArticleHistory } from './hooks/useArticleHistory';
import { Header } from './components/Header';
import { HistoryPanel } from './components/HistoryPanel';
import { GeneratorForm } from './components/GeneratorForm';
import { ArticleView } from './components/ArticleView';
import { AudioController } from './components/AudioController';
import { STORAGE_KEY_STATE } from './constants';
import type { Difficulty, HistoryItem } from './types';

const savedState = (() => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_STATE) || 'null'); } catch { return null; }
})();

export default function App() {
  const [topic, setTopic] = useState(savedState?.topic ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>(savedState?.difficulty ?? 'Beginner');
  const [article, setArticle] = useState<string>(savedState?.article ?? '');
  const [articleTitle, setArticleTitle] = useState<string>(savedState?.title ?? savedState?.topic ?? '');
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);

  const audio = useAudioPlayer(difficulty);
  const historyStore = useArticleHistory();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoadingArticle(true);
    setArticle('');
    audio.stopSpeaking();

    try {
      const { title, content } = await generateArticle(topic, difficulty);
      const now = new Date().toISOString();

      historyStore.saveToHistory(topic, title, difficulty, content, now);

      setArticle(content);
      setArticleTitle(title);
      audio.clearAudioCache();
      try {
        localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify({ topic, title, difficulty, article: content, createdAt: now }));
      } catch { /* quota exceeded, skip */ }
    } catch (error) {
      console.error("Failed to generate article:", error);
      alert("Failed to generate article. Please try again.");
    } finally {
      setIsLoadingArticle(false);
    }
  };

  const restoreFromHistory = (item: HistoryItem) => {
    audio.stopSpeaking();
    setTopic(item.topic);
    setArticleTitle(item.title ?? item.topic);
    setDifficulty(item.difficulty);
    setArticle(item.article);
    audio.clearAudioCache();
    historyStore.setShowHistory(false);
    try {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify({ topic: item.topic, title: item.title, difficulty: item.difficulty, article: item.article, createdAt: item.createdAt }));
    } catch { /* quota exceeded, skip */ }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 font-sans flex flex-col">
      <Header
        historyCount={historyStore.history.length}
        onShowHistory={() => historyStore.setShowHistory(true)}
      />

      <HistoryPanel
        show={historyStore.showHistory}
        history={historyStore.history}
        onClose={() => historyStore.setShowHistory(false)}
        onRestore={restoreFromHistory}
        onDelete={historyStore.deleteHistoryItem}
      />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        <GeneratorForm
          topic={topic}
          difficulty={difficulty}
          isLoading={isLoadingArticle}
          onTopicChange={setTopic}
          onDifficultyChange={setDifficulty}
          onSubmit={handleGenerate}
        />

        <ArticleView
          article={article}
          articleTitle={articleTitle}
          difficulty={difficulty}
          isLoading={isLoadingArticle}
          speakingIndex={audio.speakingIndex}
          isLoadingAudio={audio.isLoadingAudio}
          onPlayParagraph={audio.playParagraph}
        />
      </main>

      <AudioController
        visible={audio.speakingIndex !== null}
        isPaused={audio.isAudioPaused}
        onTogglePlayPause={audio.togglePlayPause}
        onSkip={audio.skipAudio}
        onStop={audio.stopSpeaking}
      />
    </div>
  );
}
