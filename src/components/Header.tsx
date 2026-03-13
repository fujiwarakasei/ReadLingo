import { BookOpen, History } from 'lucide-react';

interface HeaderProps {
  historyCount: number;
  onShowHistory: () => void;
}

export function Header({ historyCount, onShowHistory }: HeaderProps) {
  return (
    <header className="border-b border-cream-300 sticky top-0 z-10 bg-cream-50/90 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 text-walnut-700">
          <BookOpen className="w-5 h-5 text-amber-500" />
          <h1 className="text-lg font-serif font-bold tracking-tight">ReadLingo</h1>
        </div>
        <button
          onClick={onShowHistory}
          className="relative flex items-center gap-1.5 h-9 px-3 text-sm text-walnut-500 hover:text-walnut-700 hover:bg-cream-200 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          aria-label="View history"
        >
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">History</span>
          {historyCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-cream-50 text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {historyCount > 99 ? '99+' : historyCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
