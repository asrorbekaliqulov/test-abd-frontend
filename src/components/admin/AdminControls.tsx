import React from 'react';
import { Play, Pause, SkipForward, Square } from 'lucide-react';

interface AdminControlsProps {
  isAdmin: boolean;
  isQuizActive: boolean;
  onToggleQuiz: () => void;
  onNextQuestion: () => void;
  onStopQuiz: () => void;
  timeRemaining: number;
}

const AdminControls: React.FC<AdminControlsProps> = ({
  isAdmin,
  isQuizActive,
  onToggleQuiz,
  onNextQuestion,
  onStopQuiz,
  timeRemaining
}) => {
  if (!isAdmin) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-black/60 backdrop-blur-lg border border-white/30 rounded-xl p-4 z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-purple-500/30 border border-purple-400/50 rounded-lg">
            <span className="text-purple-300 text-sm font-medium">Admin</span>
          </div>
          
          {isQuizActive && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/30 border border-blue-400/50 rounded-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-blue-300 text-sm font-mono">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleQuiz}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              isQuizActive
                ? 'bg-yellow-500/30 border border-yellow-400/50 text-yellow-300 hover:bg-yellow-500/40'
                : 'bg-green-500/30 border border-green-400/50 text-green-300 hover:bg-green-500/40'
            }`}
          >
            {isQuizActive ? <Pause size={16} /> : <Play size={16} />}
            {isQuizActive ? 'Pauza' : 'Boshlash'}
          </button>

          {isQuizActive && (
            <button
              onClick={onNextQuestion}
              className="px-4 py-2 bg-blue-500/30 border border-blue-400/50 text-blue-300 rounded-lg font-medium hover:bg-blue-500/40 transition-all flex items-center gap-2"
            >
              <SkipForward size={16} />
              Keyingisi
            </button>
          )}

          <button
            onClick={onStopQuiz}
            className="px-4 py-2 bg-red-500/30 border border-red-400/50 text-red-300 rounded-lg font-medium hover:bg-red-500/40 transition-all flex items-center gap-2"
          >
            <Square size={16} />
            To'xtatish
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminControls;