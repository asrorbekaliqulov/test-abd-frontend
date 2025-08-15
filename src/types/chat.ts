export interface User {
  id: string;
  username: string;
  avatar?: string | null;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
  avatar?: string | null;
  isLiveQuiz?: boolean;
  createdBy?: string | null;
  createdAt?: Date;
  participants?: User[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  content?: string | null;
  type: 'text' | 'file' | 'quiz' | 'quiz_result' | 'system';
  metadata?: any;
  replyToId?: string | null;
  createdAt?: Date;
  sender?: User;
  reactions?: Reaction[];
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  user?: User;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  createdBy: string;
  isLive?: boolean;
  createdAt?: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  type: 'single' | 'multiple' | 'text';
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  messageId?: string;
  answers: Record<string, any>;
  score?: number;
  completedAt?: Date;
}

export interface Draft {
  id: string;
  userId: string;
  chatRoomId: string;
  content: string;
  updatedAt?: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'quiz' | 'mention' | 'reaction';
  title: string;
  content?: string | null;
  metadata?: any;
  isRead?: boolean;
  createdAt?: Date;
}
