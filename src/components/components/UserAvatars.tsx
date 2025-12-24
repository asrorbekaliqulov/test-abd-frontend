import React from 'react';
import { QuizParticipant } from '../../types/quiz.ts';


// interface User {
//   id: number;
//   username: string;
//   profile_image: string | null;
//   is_online: boolean;
// }

interface UserAvatarsProps {
  users: QuizParticipant[];
  onUsersClick: () => void;
}

const UserAvatars: React.FC<UserAvatarsProps> = ({ users, onUsersClick }) => {
  const displayUsers = users.slice(0, 3);
  const remainingCount = users.length - 3;

  return (
    <button
      onClick={onUsersClick}
      className="flex items-center -space-x-2 hover:scale-105 transition-transform"
    >
      {displayUsers.map((user, index) => (
        <div key={user.id} className="relative">
          <img
            src={user.profile_image || "https://backend.testabd.uz/media/defaultuseravatar.png"}
            alt={user.username}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-lg"
            style={{ zIndex: displayUsers.length - index }}
          />
          {user.is_online && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-600 border-2 border-white flex items-center justify-center shadow-lg">
          <span className="text-white text-xs font-bold">+{remainingCount}</span>
        </div>
      )}
    </button>
  );
};

export default UserAvatars;