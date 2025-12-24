import React from 'react';
import { X, Check, Clock } from 'lucide-react';
import { QuizParticipant } from '../../types/quiz.ts';

// interface QuizParticipant {
//   id: number;
//   username: string;
//   profile_image: string | null;
//   answered: boolean;
//   correct_answers: number;
//   wrong_answers: number;
//   total_answered: number;
//   is_online: boolean;
// }

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: QuizParticipant[];
  totalQuestions: number;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, users, totalQuestions }) => {
  if (!isOpen) return null;

  const answeredUsers = users.filter(user => user.answered);
  const notAnsweredUsers = users.filter(user => !user.answered);

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-gray-800 rounded-2xl p-6 z-50 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Ishtirokchilar ({users.length})</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Javob berganlar */}
          {answeredUsers.length > 0 && (
            <div>
              <h4 className="text-green-400 font-medium mb-3 flex items-center gap-2">
                <Check size={16} />
                Javob berganlar ({answeredUsers.length})
              </h4>
              <div className="space-y-2">
                {answeredUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                    <div className="relative">
                      <img
                        src={user.profile_image || "https://backend.testabd.uz/media/defaultuseravatar.png"}
                        alt={user.username}
                        className="w-10 h-10 rounded-full"
                      />
                      {user.is_online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">@{user.username}</div>
                      <div className="text-sm text-gray-400">
                        {user.total_answered}/{totalQuestions} savol
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 text-sm font-medium">
                        ✓ {user.correct_answers}
                      </div>
                      <div className="text-red-400 text-sm">
                        ✗ {user.wrong_answers}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Javob bermaganlar */}
          {notAnsweredUsers.length > 0 && (
            <div>
              <h4 className="text-yellow-400 font-medium mb-3 flex items-center gap-2">
                <Clock size={16} />
                Javob kutilmoqda ({notAnsweredUsers.length})
              </h4>
              <div className="space-y-2">
                {notAnsweredUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                    <div className="relative">
                      <img
                        src={user.profile_image || "https://backend.testabd.uz/media/defaultuseravatar.png"}
                        alt={user.username}
                        className="w-10 h-10 rounded-full opacity-70"
                      />
                      {user.is_online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium opacity-70">@{user.username}</div>
                      <div className="text-sm text-gray-500">
                        {user.total_answered}/{totalQuestions} savol
                      </div>
                    </div>
                    <div className="text-yellow-400">
                      <Clock size={16} className="animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserModal;