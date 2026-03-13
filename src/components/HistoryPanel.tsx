import { History, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { HistoryItem } from '../types';

interface HistoryPanelProps {
  show: boolean;
  history: HistoryItem[];
  onClose: () => void;
  onRestore: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

const difficultyDot: Record<string, string> = {
  Beginner: 'bg-sage-500',
  Intermediate: 'bg-amber-500',
  Advanced: 'bg-rosewood-500',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function HistoryPanel({ show, history, onClose, onRestore, onDelete }: HistoryPanelProps) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-walnut-900/30 z-20"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-cream-50 shadow-2xl z-30 flex flex-col border-l border-cream-300"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream-300">
              <div className="flex items-center gap-2 text-walnut-700 font-semibold">
                <History className="w-5 h-5 text-amber-500" />
                History
                <span className="text-sm font-normal text-walnut-400">({history.length})</span>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center text-walnut-400 hover:text-walnut-600 hover:bg-cream-200 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label="Close history"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-walnut-400 py-20 text-center px-6">
                  <History className="w-10 h-10 mb-3 opacity-15" />
                  <p className="text-sm">No history yet.</p>
                  <p className="text-xs mt-1 text-walnut-300">Generated articles will appear here.</p>
                </div>
              ) : (
                <ul className="divide-y divide-cream-200">
                  {history.map(item => (
                    <li key={item.id} className="group flex items-start gap-3 px-5 py-4 hover:bg-cream-100 transition-colors">
                      <button
                        onClick={() => onRestore(item)}
                        className="flex-1 text-left min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                      >
                        <p className="font-medium text-walnut-700 truncate">{item.title ?? item.topic}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-cream-200 text-walnut-500 font-medium">
                            <span className={`w-1.5 h-1.5 rounded-full ${difficultyDot[item.difficulty] || 'bg-walnut-400'}`} />
                            {item.difficulty}
                          </span>
                          <span className="text-[11px] text-walnut-400">{formatDate(item.createdAt)}</span>
                        </div>
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Delete "${item.title ?? item.topic}"?`)) onDelete(item.id); }}
                        className="shrink-0 w-9 h-9 flex items-center justify-center text-walnut-300 hover:text-red-500 hover:bg-red-50 rounded-lg sm:opacity-0 sm:group-hover:opacity-100 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        title="Delete"
                        aria-label={`Delete ${item.title ?? item.topic}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
