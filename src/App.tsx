import React, { useState, useMemo } from 'react';
import { generateArticle, generateImage, IMG_MARKER_RE } from './services/gemini';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useArticleHistory } from './hooks/useArticleHistory';
import { Header } from './components/Header';
import { HistoryPanel } from './components/HistoryPanel';
import { GeneratorForm } from './components/GeneratorForm';
import { ArticleView } from './components/ArticleView';
import { AudioController } from './components/AudioController';
import { STORAGE_KEY_STATE, STORAGE_KEY_IMAGES } from './constants';
import type { Difficulty, Segment, HistoryItem } from './types';

const savedState = (() => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_STATE) || 'null'); } catch { return null; }
})();

const savedImages = (() => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_IMAGES) || '{}'); } catch { return {}; }
})();

export default function App() {
  const [topic, setTopic] = useState(savedState?.topic ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>(savedState?.difficulty ?? 'Beginner');
  const [article, setArticle] = useState<string>(savedState?.article ?? '');
  const [articleTitle, setArticleTitle] = useState<string>(savedState?.title ?? savedState?.topic ?? '');
  const [segments, setSegments] = useState<Segment[]>(savedState?.segments ?? []);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);
  const [imageMap, setImageMap] = useState<Record<string, string>>(savedImages);
  const [imagesLoaded, setImagesLoaded] = useState(true);

  const audio = useAudioPlayer(difficulty);
  const historyStore = useArticleHistory();

  const speakingSnippet = useMemo(() => {
    if (audio.speakingIndex === null || !article) return '';
    const paragraphs = article.split('\n').filter(p => p.trim() !== '');
    const text = paragraphs[audio.speakingIndex] ?? '';
    return text.length > 60 ? text.slice(0, 57) + '...' : text;
  }, [audio.speakingIndex, article]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoadingArticle(true);
    setArticle('');
    setSegments([]);
    setImageMap({});
    setImagesLoaded(false);
    audio.stopSpeaking();

    try {
      const { title, content, segments: newSegments } = await generateArticle(topic, difficulty);
      const now = new Date().toISOString();

      historyStore.saveToHistory(topic, title, difficulty, content, now, newSegments);

      setArticle(content);
      setArticleTitle(title);
      setSegments(newSegments);
      audio.clearAudioCache();
      try {
        localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify({ topic, title, difficulty, article: content, segments: newSegments, createdAt: now }));
      } catch { /* quota exceeded, skip */ }

      // Extract image prompts and generate images in background
      const imgPrompts = newSegments
        .map(s => s.en.match(IMG_MARKER_RE)?.[1])
        .filter((p): p is string => !!p);

      if (imgPrompts.length > 0) {
        try { localStorage.removeItem(STORAGE_KEY_IMAGES); } catch { /* skip */ }

        const results = await Promise.allSettled(
          imgPrompts.map(prompt => generateImage(prompt))
        );

        const newImageMap: Record<string, string> = {};
        results.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            newImageMap[imgPrompts[i]] = result.value;
          } else {
            console.error(`Image generation failed for: ${imgPrompts[i]}`, result.reason);
          }
        });

        setImageMap(newImageMap);
        try {
          localStorage.setItem(STORAGE_KEY_IMAGES, JSON.stringify(newImageMap));
        } catch { /* quota exceeded, skip */ }
      }
      setImagesLoaded(true);
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
    setSegments(item.segments ?? []);
    audio.clearAudioCache();
    // Restore image cache if available
    const cachedImages = (() => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY_IMAGES) || '{}'); } catch { return {}; }
    })();
    setImageMap(cachedImages);
    historyStore.setShowHistory(false);
    try {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify({ topic: item.topic, title: item.title, difficulty: item.difficulty, article: item.article, segments: item.segments, createdAt: item.createdAt }));
    } catch { /* quota exceeded, skip */ }
  };

  return (
    <div className="min-h-screen bg-cream-50 text-walnut-800 font-sans flex flex-col">
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

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-24 flex flex-col gap-8">
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
          segments={segments}
          imageMap={imageMap}
          imagesLoaded={imagesLoaded}
        />
      </main>

      <AudioController
        visible={audio.speakingIndex !== null}
        isPaused={audio.isAudioPaused}
        paragraphSnippet={speakingSnippet}
        onTogglePlayPause={audio.togglePlayPause}
        onSkip={audio.skipAudio}
        onStop={audio.stopSpeaking}
      />
    </div>
  );
}
