import { useState, useRef, useEffect } from 'react';
import { BookOpen, Volume2, Loader2, Settings, Sparkles, Square, Play, Pause, Rewind, FastForward, X } from 'lucide-react';
import { motion } from 'motion/react';
import { generateArticle, generateSpeech } from './services/gemini';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export default function App() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [article, setArticle] = useState<string>('');
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);
  
  // Track which paragraph is currently being spoken
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<number | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setIsLoadingArticle(true);
    setArticle('');
    stopSpeaking();
    
    try {
      const text = await generateArticle(topic, difficulty);
      setArticle(text);
    } catch (error) {
      console.error("Failed to generate article:", error);
      alert("Failed to generate article. Please try again.");
    } finally {
      setIsLoadingArticle(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeakingIndex(null);
    setIsLoadingAudio(null);
    setIsAudioPaused(false);
  };

  const playParagraph = async (text: string, index: number) => {
    // If clicking the currently speaking paragraph, stop it
    if (speakingIndex === index) {
      stopSpeaking();
      return;
    }

    // Stop any current speech before starting new one
    stopSpeaking();
    
    setIsLoadingAudio(index);
    
    try {
      const audioUrl = await generateSpeech(text);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onplay = () => {
        setSpeakingIndex(index);
        setIsLoadingAudio(null);
        setIsAudioPaused(false);
      };
      
      audio.onpause = () => {
        setIsAudioPaused(true);
      };
      
      audio.onended = () => {
        setSpeakingIndex(null);
        setIsAudioPaused(false);
        URL.revokeObjectURL(audioUrl); // Clean up
      };
      
      audio.onerror = (e) => {
        console.error("Audio playback error", e);
        setIsLoadingAudio(null);
        setIsAudioPaused(false);
        URL.revokeObjectURL(audioUrl); // Clean up
      };
      
      await audio.play();
    } catch (error) {
      console.error("Failed to generate/play audio:", error);
      alert("Failed to generate audio. Please try again.");
      setIsLoadingAudio(null);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };

  const skipAudio = (seconds: number) => {
    if (audioRef.current) {
      const newTime = audioRef.current.currentTime + seconds;
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration || 0, newTime));
    }
  };

  // Helper to render text with a TTS button
  const renderParagraph = (text: string, index: number) => {
    const isSpeaking = speakingIndex === index;
    const isLoading = isLoadingAudio === index;

    return (
      <div key={index} className="mb-6 relative group flex gap-4">
        <div className="shrink-0 pt-1">
          <button
            onClick={() => playParagraph(text, index)}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
              isSpeaking || isLoading
                ? 'bg-indigo-100 text-indigo-600 shadow-inner' 
                : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500'
            }`}
            title={isSpeaking ? "Stop reading" : "Read paragraph"}
            aria-label={isSpeaking ? "Stop reading" : "Read paragraph"}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSpeaking ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className={`text-lg leading-relaxed font-serif transition-colors duration-300 ${
          isSpeaking ? 'text-indigo-900' : 'text-slate-800'
        }`}>
          {text}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <BookOpen className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">LingoReader</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Generator Form */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-1">
                What do you want to read about?
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
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
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
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
              disabled={isLoadingArticle || !topic.trim()}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoadingArticle ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              Generate
            </button>
          </form>
        </section>

        {/* Article Display */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 min-h-[400px]">
          {isLoadingArticle ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p>Crafting your custom article...</p>
            </div>
          ) : article ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-lg max-w-none"
            >
              <div className="mb-8 pb-4 border-b border-slate-100">
                <h2 className="text-3xl font-bold text-slate-900 capitalize">{topic}</h2>
                <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-medium">
                    {difficulty} Level
                  </span>
                  <span>•</span>
                  <span>Click the speaker icon to listen to a paragraph</span>
                </div>
              </div>
              
              <div className="article-content max-w-3xl">
                {article.split('\n').filter(p => p.trim() !== '').map((paragraph, idx) => 
                  renderParagraph(paragraph, idx)
                )}
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 text-center">
              <BookOpen className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-600">Ready to read?</p>
              <p className="text-sm mt-1 max-w-sm">Enter a topic above and we'll generate a custom article tailored to your level.</p>
            </div>
          )}
        </section>
      </main>

      {/* Floating Audio Controller */}
      {speakingIndex !== null && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-full px-6 py-3 flex items-center gap-6 border border-slate-200 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <button 
            onClick={() => skipAudio(-3)} 
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" 
            title="Rewind 3 seconds"
          >
            <Rewind className="w-5 h-5" />
          </button>
          
          <button 
            onClick={togglePlayPause} 
            className="p-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full transition-colors shadow-md flex items-center justify-center"
            title={isAudioPaused ? "Play" : "Pause"}
          >
            {isAudioPaused ? <Play className="w-6 h-6 ml-1" /> : <Pause className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={() => skipAudio(3)} 
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" 
            title="Forward 3 seconds"
          >
            <FastForward className="w-5 h-5" />
          </button>
          
          <div className="w-px h-8 bg-slate-200 mx-2"></div>
          
          <button 
            onClick={stopSpeaking} 
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" 
            title="Stop"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
