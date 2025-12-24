import React from 'react';
import { Trophy, Medal, Award, Users } from 'lucide-react';
import { QuizResult, LeaderboardEntry } from '../../types/quiz.ts';

interface QuizResultsProps {
  result: QuizResult;
  leaderboard: LeaderboardEntry[];
  onClose: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ result, leaderboard, onClose }) => {
  const userRank = leaderboard.findIndex(entry => entry.username === result.username) + 1;
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-500" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Award className="text-orange-500" size={24} />;
      default:
        return <Users className="text-blue-400" size={24} />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-500';
      case 2:
        return 'text-gray-400';
      case 3:
        return 'text-orange-500';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {getRankIcon(userRank)}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Viktorina tugadi!</h2>
          <p className="text-gray-400">Sizning natijangiz</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{result.correct}</div>
              <div className="text-sm text-gray-400">To'g'ri</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{result.wrong}</div>
              <div className="text-sm text-gray-400">Noto'g'ri</div>
            </div>
          </div>
          
          <div className="text-center border-t border-gray-700 pt-4">
            <div className="text-3xl font-bold text-blue-400 mb-1">{result.score}</div>
            <div className="text-sm text-gray-400">Umumiy ball</div>
          </div>
          
          {userRank > 0 && (
            <div className="text-center mt-4 pt-4 border-t border-gray-700">
              <div className={`text-xl font-bold ${getRankColor(userRank)} mb-1`}>
                #{userRank}
              </div>
              <div className="text-sm text-gray-400">O'rindiq</div>
            </div>
          )}
        </div>

        {leaderboard.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Leaderboard</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {leaderboard.slice(0, 5).map((entry, index) => (
                <div
                  key={entry.username}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    entry.username === result.username 
                      ? 'bg-blue-500/20 border border-blue-500/30' 
                      : 'bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6">
                      {index < 3 ? getRankIcon(index + 1) : (
                        <span className="text-gray-400 font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span className="text-white font-medium">{entry.username}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{entry.score}</div>
                    <div className="text-xs text-gray-400">
                      {entry.correct}✓ {entry.wrong}✗
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
        >
          Yopish
        </button>
      </div>
    </div>
  );
};

export default QuizResults;