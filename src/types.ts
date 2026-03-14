export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Segment {
  en: string;
  zh: string;
}

export interface WordAlignment {
  word: string;
  start: number;
  end: number;
}

export interface HistoryItem {
  id: string;
  topic: string;
  title?: string;
  difficulty: Difficulty;
  article: string;
  segments?: Segment[];
  createdAt: string;
}
