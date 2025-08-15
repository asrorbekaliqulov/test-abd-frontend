import React from 'react';
import { Users, Check, X, Clock } from 'lucide-react';

interface QuizStatsProps {
  totalUsers: number;
  answeredUsers: number;
  correctAnswers: number;
  wrongAnswers: number;
  onUsersClick: () => void;
}

const QuizStats: React.FC<QuizStatsProps> = ({
  totalUsers,
  answeredUsers,
  correctAnswers,
  wrongAnswers,
  onUsersClick
}) => {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {/* Umumiy ishtirokchilar */}
      <button
        onClick={onUsersClick}
        className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-lg border border-white/30 rounded-lg hover:bg-black/50 transition-all"
      >
        <Users size={16} className="text-blue-400" />
        <span className="text-white text-sm font-medium">{totalUsers}</span>
      </button>

      {/* Javob berganlar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-lg border border-white/30 rounded-lg">
        <Clock size={16} className="text-yellow-400" />
        <span className="text-white text-sm font-medium">{answeredUsers}/{totalUsers}</span>
      </div>

      {/* To'g'ri javoblar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-lg border border-white/30 rounded-lg">
        <Check size={16} className="text-green-400" />
        <span className="text-white text-sm font-medium">{correctAnswers}</span>
      </div>

      {/* Noto'g'ri javoblar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-lg border border-white/30 rounded-lg">
        <X size={16} className="text-red-400" />
        <span className="text-white text-sm font-medium">{wrongAnswers}</span>
      </div>
    </div>
  );
};

export default QuizStats;