export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface HistoryItem {
  id: string;
  topic: string;
  title?: string;
  difficulty: Difficulty;
  article: string;
  createdAt: string;
}
