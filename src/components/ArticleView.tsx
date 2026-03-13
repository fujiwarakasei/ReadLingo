import { BookOpen, Loader2, Volume2, Square } from 'lucide-react';
import { motion } from 'motion/react';
import type { Difficulty } from '../types';

interface ArticleViewProps {
  article: string;
  articleTitle: string;
  difficulty: Difficulty;
  isLoading: boolean;
  speakingIndex: number | null;
  isLoadingAudio: number | null;
  onPlayParagraph: (text: string, index: number) => void;
}

function ParagraphRow({
  text, index, isSpeaking, isLoading, onPlay,
}: {
  text: string; index: number; isSpeaking: boolean; isLoading: boolean; onPlay: () => void;
}) {
  return (
    <div className="mb-6 relative group flex gap-4">
      <div className="shrink-0 pt-1">
        <button
          onClick={onPlay}
          className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
            isSpeaking || isLoading
              ? 'bg-indigo-100 text-indigo-600 shadow-inner'
              : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500'
          }`}
          title={isSpeaking ? "Stop reading" : "Read paragraph"}
          aria-label={isSpeaking ? "Stop reading" : "Read paragraph"}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isSpeaking ? (
            <Square className="w-5 h-5 fill-current" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className={`text-lg leading-relaxed font-serif transition-colors duration-300 ${
        isSpeaking ? 'text-indigo-900' : 'text-slate-800'
      }`}>
        {text}
      </p>
    </div>
  );
}

export function ArticleView({ article, articleTitle, difficulty, isLoading, speakingIndex, isLoadingAudio, onPlayParagraph }: ArticleViewProps) {
  if (isLoading) {
    return (
      <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 min-h-[400px]">
        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p>Crafting your custom article...</p>
        </div>
      </section>
    );
  }

  if (!article) {
    return (
      <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 min-h-[400px]">
        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 text-center">
          <BookOpen className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-lg font-medium text-slate-600">Ready to read?</p>
          <p className="text-sm mt-1 max-w-sm">Enter a topic above and we&apos;ll generate a custom article tailored to your level.</p>
        </div>
      </section>
    );
  }

  const paragraphs = article.split('\n').filter(p => p.trim() !== '');

  return (
    <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 min-h-[400px]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="prose prose-lg max-w-none"
      >
        <div className="mb-8 pb-4 border-b border-slate-100">
          <h2 className="text-3xl font-bold text-slate-900">{articleTitle}</h2>
          <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-medium">
              {difficulty} Level
            </span>
            <span>&bull;</span>
            <span>Click the speaker icon to listen to a paragraph</span>
          </div>
        </div>

        <div className="article-content max-w-3xl">
          {paragraphs.map((paragraph, idx) => (
            <ParagraphRow
              key={idx}
              text={paragraph}
              index={idx}
              isSpeaking={speakingIndex === idx}
              isLoading={isLoadingAudio === idx}
              onPlay={() => onPlayParagraph(paragraph, idx)}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
