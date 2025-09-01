import React from 'react';
import { Trophy, Medal, Award, User } from 'lucide-react';
import { QuizParticipant } from '../../types/quiz';

interface QuizResultsProps {
  participants: QuizParticipant[];
  currentUserId?: number;
  onRestart?: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  participants,
  currentUserId,
  onRestart
}) => {
  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);
  const currentUserResult = sortedParticipants.find(p => p.user.id === currentUserId);
  const currentUserRank = sortedParticipants.findIndex(p => p.user.id === currentUserId) + 1;

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 1: return <Medal className="w-8 h-8 text-gray-500" />;
      case 2: return <Award className="w-8 h-8 text-orange-500" />;
      default: return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">{index + 1}</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
          <p className="text-gray-600">
            Congratulations to all participants
          </p>
        </div>

        {/* Current User Result */}
        {currentUserResult && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8 border border-indigo-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Result</h3>
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">{currentUserResult.score}</p>
                  <p className="text-sm text-gray-600">Points</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">#{currentUserRank}</p>
                  <p className="text-sm text-gray-600">Rank</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Leaderboard */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 mb-6 text-center">Final Leaderboard</h3>
          <div className="space-y-4">
            {sortedParticipants.map((participant, index) => (
              <div 
                key={participant.id} 
                className={`
                  flex items-center justify-between p-4 rounded-lg transition-all duration-200
                  ${participant.user.id === currentUserId 
                    ? 'bg-indigo-100 border-2 border-indigo-300' 
                    : 'bg-white border border-gray-200'
                  }
                `}
              >
                <div className="flex items-center space-x-4">
                  {getRankIcon(index)}
                  <div className="flex items-center space-x-3">
                    {participant.user.profile_image ? (
                      <img 
                        src={participant.user.profile_image} 
                        alt={participant.user.username}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">
                        {participant.user.username}
                        {participant.user.id === currentUserId && (
                          <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        Joined {new Date(participant.joined_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">{participant.score}</p>
                  <p className="text-sm text-gray-500">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {onRestart && (
          <div className="text-center mt-8">
            <button
              onClick={onRestart}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start New Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizResults;