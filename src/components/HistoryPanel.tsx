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
            className="fixed inset-0 bg-black/30 z-20"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-30 flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <History className="w-5 h-5 text-indigo-500" />
                History
                <span className="text-sm font-normal text-slate-400">({history.length})</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20 text-center px-6">
                  <History className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">No history yet.</p>
                  <p className="text-xs mt-1">Articles you replace will appear here.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {history.map(item => (
                    <li key={item.id} className="group flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors">
                      <button
                        onClick={() => onRestore(item)}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="font-medium text-slate-800 truncate capitalize">{item.topic}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                            {item.difficulty}
                          </span>
                          <span className="text-[11px] text-slate-400">{formatDate(item.createdAt)}</span>
                        </div>
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Delete "${item.topic}"?`)) onDelete(item.id); }}
                        className="shrink-0 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete"
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
