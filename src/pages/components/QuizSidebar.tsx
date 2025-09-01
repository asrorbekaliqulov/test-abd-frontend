import React from 'react';
import { Users, X, ChevronRight, Trophy, User, Wifi, WifiOff } from 'lucide-react';
import { QuizParticipant } from '../../types/quiz';

interface QuizSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  participants: QuizParticipant[];
  isConnected: boolean;
  currentUserId?: number;
}

const QuizSidebar: React.FC<QuizSidebarProps> = ({
  isOpen,
  onClose,
  onOpen,
  participants,
  isConnected,
  currentUserId
}) => {
  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);

  return (
    <>
      {/* Sidebar Toggle Button for Mobile */}
      {!isOpen && (
        <button
          onClick={onOpen}
          className="fixed top-4 left-4 z-40 p-3 bg-white rounded-xl shadow-lg border border-gray-200 lg:hidden hover:shadow-xl transition-all duration-200"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-gray-100
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:shadow-none
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800">Participants</h2>
                <p className="text-sm text-gray-500">{participants.length} joined</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:shadow-md rounded-lg transition-all duration-200 lg:hidden"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Connection Status */}
          <div className="px-6 py-3 border-b border-gray-50">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">Disconnected</span>
                </>
              )}
            </div>
          </div>

          {/* Participants List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {sortedParticipants.map((participant, index) => (
                <div
                  key={participant.id}
                  className={`
                    p-4 rounded-xl border transition-all duration-200 hover:shadow-md
                    ${participant.user.id === currentUserId 
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-sm' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Rank Badge */}
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm
                        ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' : 
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800' :
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' :
                          'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800'
                        }
                      `}>
                        {index === 0 ? <Trophy className="w-5 h-5" /> : index + 1}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {participant.user.profile_image ? (
                            <img 
                              src={participant.user.profile_image} 
                              alt={participant.user.username}
                              className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {participant.user.username}
                              {participant.user.id === currentUserId && (
                                <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              Score: {participant.score} pts
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Answer Status */}
                    <div className="flex items-center space-x-2">
                      {participant.is_answered && (
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Live Quiz • Real-time Results
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}
    </>
  );
};

export default QuizSidebar;