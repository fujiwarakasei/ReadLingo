import React from 'react';
import { Loader2, Settings, Sparkles } from 'lucide-react';
import type { Difficulty } from '../types';

interface GeneratorFormProps {
  topic: string;
  difficulty: Difficulty;
  isLoading: boolean;
  onTopicChange: (value: string) => void;
  onDifficultyChange: (value: Difficulty) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function GeneratorForm({ topic, difficulty, isLoading, onTopicChange, onDifficultyChange, onSubmit }: GeneratorFormProps) {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-1">
            What do you want to read about?
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="e.g., Artificial Intelligence, Coffee, Space Travel..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            required
          />
        </div>

        <div className="w-full sm:w-48">
          <label htmlFor="difficulty" className="block text-sm font-medium text-slate-700 mb-1">
            Level
          </label>
          <div className="relative">
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}
              className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <Settings className="w-4 h-4" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
