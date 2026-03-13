export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Segment {
  en: string;
  zh: string;
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
