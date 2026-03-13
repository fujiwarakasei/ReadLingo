import { Play, Pause, Rewind, FastForward, X } from 'lucide-react';

interface AudioControllerProps {
  visible: boolean;
  isPaused: boolean;
  onTogglePlayPause: () => void;
  onSkip: (seconds: number) => void;
  onStop: () => void;
}

export function AudioController({ visible, isPaused, onTogglePlayPause, onSkip, onStop }: AudioControllerProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-full px-6 py-3 flex items-center gap-6 border border-slate-200 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <button
        onClick={() => onSkip(-3)}
        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
        title="Rewind 3 seconds"
      >
        <Rewind className="w-5 h-5" />
      </button>

      <button
        onClick={onTogglePlayPause}
        className="p-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full transition-colors shadow-md flex items-center justify-center"
        title={isPaused ? "Play" : "Pause"}
      >
        {isPaused ? <Play className="w-6 h-6 ml-1" /> : <Pause className="w-6 h-6" />}
      </button>

      <button
        onClick={() => onSkip(3)}
        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
        title="Forward 3 seconds"
      >
        <FastForward className="w-5 h-5" />
      </button>

      <div className="w-px h-8 bg-slate-200 mx-2"></div>

      <button
        onClick={onStop}
        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
        title="Stop"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
