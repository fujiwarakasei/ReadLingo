import React from 'react';
import { Loader2, Sparkles, BarChart3 } from 'lucide-react';
import type { Difficulty } from '../types';

interface GeneratorFormProps {
  topic: string;
  difficulty: Difficulty;
  isLoading: boolean;
  onTopicChange: (value: string) => void;
  onDifficultyChange: (value: Difficulty) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const difficultyIconColor: Record<string, string> = {
  Beginner: 'text-sage-500',
  Intermediate: 'text-amber-500',
  Advanced: 'text-rosewood-500',
};

export function GeneratorForm({ topic, difficulty, isLoading, onTopicChange, onDifficultyChange, onSubmit }: GeneratorFormProps) {
  return (
    <section className="pb-6 border-b border-cream-300">
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label htmlFor="topic" className="block text-sm font-medium text-walnut-600 mb-1.5">
            What do you want to read about?
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="e.g., Artificial Intelligence, Coffee, Space Travel..."
            className="w-full px-4 py-2.5 bg-cream-100 border border-cream-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:border-amber-400 transition-shadow text-walnut-800 placeholder:text-walnut-400"
            required
          />
        </div>

        <div className="w-full sm:w-44">
          <label htmlFor="difficulty" className="block text-sm font-medium text-walnut-600 mb-1.5">
            Level
          </label>
          <div className="relative">
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}
              className="w-full appearance-none px-4 py-2.5 bg-cream-100 border border-cream-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:border-amber-400 transition-shadow text-walnut-800"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 transition-colors ${difficultyIconColor[difficulty] || 'text-walnut-400'}`}>
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="w-full sm:w-auto px-6 py-2.5 bg-walnut-700 text-cream-50 font-medium rounded-lg hover:bg-walnut-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 focus-visible:ring-walnut-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          Generate
        </button>
      </form>
    </section>
  );
}
