import { createContext, useContext, useState, ReactNode } from 'react';
import { ChatRoom, User } from '../types/chat';

interface ChatContextType {
  currentRoom: ChatRoom | null;
  setCurrentRoom: (room: ChatRoom | null) => void;
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  typingUsers: string[];
  setTypingUsers: (users: string[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const handleSetCurrentUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  return (
    <ChatContext.Provider value={{
      currentRoom,
      setCurrentRoom,
      currentUser,
      setCurrentUser: handleSetCurrentUser,
      typingUsers,
      setTypingUsers
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
