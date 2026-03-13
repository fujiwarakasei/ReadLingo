import { useState } from 'react';
import { BookOpen, Loader2, Volume2, Square, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Difficulty, Segment } from '../types';

interface ArticleViewProps {
  article: string;
  articleTitle: string;
  difficulty: Difficulty;
  isLoading: boolean;
  speakingIndex: number | null;
  isLoadingAudio: number | null;
  onPlayParagraph: (text: string, index: number) => void;
  segments: Segment[];
}

const difficultyBadge: Record<string, string> = {
  Beginner: 'bg-sage-100 text-sage-600',
  Intermediate: 'bg-amber-400/20 text-amber-600',
  Advanced: 'bg-rosewood-100 text-rosewood-600',
};

const difficultyBorder: Record<string, string> = {
  Beginner: 'border-sage-200',
  Intermediate: 'border-amber-400/40',
  Advanced: 'border-rosewood-100',
};

const difficultyAccent: Record<string, string> = {
  Beginner: 'border-l-sage-500',
  Intermediate: 'border-l-amber-500',
  Advanced: 'border-l-rosewood-500',
};

const difficultySpeakingBtn: Record<string, string> = {
  Beginner: 'bg-sage-100 text-sage-600',
  Intermediate: 'bg-amber-400/20 text-amber-600',
  Advanced: 'bg-rosewood-100 text-rosewood-600',
};

function ParagraphRow({
  text, index, isSpeaking, isLoading, onPlay, difficulty, translation,
}: {
  text: string; index: number; isSpeaking: boolean; isLoading: boolean; onPlay: () => void; difficulty: Difficulty; translation?: string;
}) {
  const [showTranslation, setShowTranslation] = useState(false);

  return (
    <div className={`mb-8 relative group flex gap-3 sm:gap-4 transition-all duration-300 ${
      isSpeaking ? `pl-4 border-l-2 ${difficultyAccent[difficulty] || 'border-l-amber-500'}` : 'pl-0 border-l-2 border-l-transparent'
    }`}>
      <div className="shrink-0 pt-1">
        <button
          onClick={onPlay}
          className={`w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 ${
            isSpeaking || isLoading
              ? difficultySpeakingBtn[difficulty] || 'bg-amber-400/20 text-amber-600'
              : 'bg-cream-200 text-walnut-400 hover:bg-amber-400/15 hover:text-amber-500'
          }`}
          title={isSpeaking ? "Stop reading" : "Read paragraph"}
          aria-label={isSpeaking ? "Stop reading" : "Read paragraph"}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isSpeaking ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
      </div>
      <div className="flex-1 pt-1.5">
        <p className={`text-[1.125rem] leading-[1.85] font-serif transition-colors duration-300 ${
          isSpeaking ? 'text-walnut-900' : 'text-walnut-700'
        }`}>
          {text}
        </p>
        {translation && (
          <div className="mt-1.5">
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className="inline-flex items-center gap-1 text-xs text-walnut-400 hover:text-walnut-500 transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showTranslation ? 'rotate-180' : ''}`} />
              {showTranslation ? '隐藏翻译' : '查看翻译'}
            </button>
            <AnimatePresence>
              {showTranslation && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm leading-relaxed text-walnut-400 mt-1 overflow-hidden"
                >
                  {translation}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export function ArticleView({ article, articleTitle, difficulty, isLoading, speakingIndex, isLoadingAudio, onPlayParagraph, segments }: ArticleViewProps) {
  if (isLoading) {
    return (
      <section className="min-h-[400px]">
        <div className="h-full flex flex-col items-center justify-center text-walnut-400 space-y-4 py-24">
          <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
          <p className="font-serif italic text-walnut-500">Preparing your article...</p>
        </div>
      </section>
    );
  }

  if (!article) {
    return (
      <section className="min-h-[400px]">
        <div className="h-full flex flex-col items-center justify-center text-walnut-400 py-24 text-center">
          <BookOpen className="w-10 h-10 mb-4 opacity-15 text-walnut-300" />
          <p className="text-lg font-serif font-medium text-walnut-500">Ready to read?</p>
          <p className="text-sm mt-1.5 max-w-sm text-walnut-400">Enter a topic above and we&apos;ll generate an article tailored to your level.</p>
        </div>
      </section>
    );
  }

  const paragraphs = article.split('\n').filter(p => p.trim() !== '');

  return (
    <section className="min-h-[400px]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={`mb-10 pb-6 border-b ${difficultyBorder[difficulty] || 'border-cream-300'}`}>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-walnut-800 leading-tight">{articleTitle}</h2>
          <div className="flex items-center gap-3 mt-4 text-sm text-walnut-400">
            <span className={`px-2.5 py-0.5 rounded-full font-medium text-xs ${difficultyBadge[difficulty] || 'bg-cream-200 text-walnut-500'}`}>
              {difficulty}
            </span>
            <span className="text-cream-400">&bull;</span>
            <span>Tap any paragraph to hear it read aloud</span>
          </div>
        </div>

        <div className="max-w-[42rem]">
          {paragraphs.map((paragraph, idx) => (
            <ParagraphRow
              key={idx}
              text={paragraph}
              index={idx}
              isSpeaking={speakingIndex === idx}
              isLoading={isLoadingAudio === idx}
              onPlay={() => onPlayParagraph(paragraph, idx)}
              difficulty={difficulty}
              translation={segments[idx]?.zh}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
