import { Play, Pause, Rewind, FastForward, X } from 'lucide-react';

interface AudioControllerProps {
  visible: boolean;
  isPaused: boolean;
  paragraphSnippet: string;
  onTogglePlayPause: () => void;
  onSkip: (seconds: number) => void;
  onStop: () => void;
}

export function AudioController({ visible, isPaused, paragraphSnippet, onTogglePlayPause, onSkip, onStop }: AudioControllerProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-8 left-1/2 bg-walnut-800 shadow-xl rounded-2xl px-5 py-3 flex items-center gap-4 border border-walnut-700 z-50 audio-controller-enter max-w-[min(28rem,calc(100vw-2rem))]">
      {paragraphSnippet && (
        <p className="hidden sm:block text-xs text-cream-400 truncate max-w-[10rem] leading-tight italic font-serif">
          {paragraphSnippet}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => onSkip(-3)}
          className="w-10 h-10 flex items-center justify-center text-cream-300 hover:text-amber-400 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          title="Back 3s"
          aria-label="Rewind 3 seconds"
        >
          <Rewind className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlayPause}
          className="w-11 h-11 bg-amber-500 text-walnut-900 hover:bg-amber-400 rounded-full transition-colors shadow-md flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-walnut-800"
          title={isPaused ? "Resume" : "Pause"}
          aria-label={isPaused ? "Resume playback" : "Pause playback"}
        >
          {isPaused ? <Play className="w-5 h-5 ml-0.5" /> : <Pause className="w-5 h-5" />}
        </button>

        <button
          onClick={() => onSkip(3)}
          className="w-10 h-10 flex items-center justify-center text-cream-300 hover:text-amber-400 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          title="Skip 3s"
          aria-label="Forward 3 seconds"
        >
          <FastForward className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-7 bg-walnut-600"></div>

      <button
        onClick={onStop}
        className="w-9 h-9 flex items-center justify-center text-walnut-400 hover:text-red-400 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        title="Stop"
        aria-label="Stop playback"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
