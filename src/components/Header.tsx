import { BookOpen, History } from 'lucide-react';

interface HeaderProps {
  historyCount: number;
  onShowHistory: () => void;
}

export function Header({ historyCount, onShowHistory }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-600">
          <BookOpen className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">ReadLingo</h1>
        </div>
        <button
          onClick={onShowHistory}
          className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">History</span>
          {historyCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {historyCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
