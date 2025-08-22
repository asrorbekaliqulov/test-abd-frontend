import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from '../contexts/ThemeContext';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, Sun, Moon, Search, Send, Menu, X, Users, 
  MoreVertical, Paperclip, Smile, Brain, Plus, CheckCheck, 
  Clock, UserPlus, FileText, Image as ImageIcon, 
  Wifi, WifiOff
} from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';
import { chatAPI, quizAPI, authAPI, accountsAPI } from '../utils/api';

// useWebSocket hook
function useWebSocket({ onMessage, autoConnect = true }) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const wsRef = useRef(null);

  const connect = () => {
    // const token = localStorage.getItem('access_token');
    const wsUrl = `wss://backend.testabd.uz/ws/chat/`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
      if (data.type === 'typing') {
        setTypingUsers(prev => ({
          ...prev,
          [data.room_id]: data.users
        }));
      }
    };

    wsRef.current.onerror = (error) => {
      setConnectionError(error);
      setIsConnected(false);
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
    };
  };

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [autoConnect]);

  const send = (data) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  const joinRoom = (roomId) => {
    send({ type: 'join', room_id: roomId });
  };

  const leaveRoom = (roomId) => {
    send({ type: 'leave', room_id: roomId });
  };

  const sendTyping = (roomId, isTyping) => {
    send({ type: 'typing', room_id: roomId, is_typing: isTyping });
  };

  const startQuiz = (roomId, quizId) => {
    send({ type: 'quiz_started', room_id: roomId, quiz_id: quizId });
  };

  return { isConnected, connectionError, typingUsers, joinRoom, leaveRoom, sendTyping, startQuiz };
}

// Types
interface User {
  id: string;
  username: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
  isFollowing?: boolean;
  followers?: number;
  following?: number;
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
  avatar?: string;
  isLiveQuiz?: boolean;
  lastMessage?: Message;
  unreadCount?: number;
  members?: User[];
}

interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  content?: string;
  type: 'text' | 'file' | 'quiz' | 'quiz_result' | 'system';
  metadata?: any;
  createdAt?: Date;
  sender?: User;
  reactions?: Array<{ id: string; emoji: string; user?: User }>;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

interface Quiz {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    type: 'single' | 'multiple' | 'text';
    correctAnswers?: number[];
  }>;
  isLive?: boolean;
  timeLimit?: number;
  participants?: number;
}

export default function ChatApp() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ChatAppContent />
    </QueryClientProvider>
  );
}

function ChatAppContent() {
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const qc = useQueryClient();
  
  // States
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [questionId: string]: any }>({});
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // WebSocket message handler
  function handleWebSocketMessage(data: any) {
    switch (data.action) {
      case 'chat_message':
        qc.invalidateQueries({ queryKey: ['/chat/messages', data.chatroom_id] });
        break;
      case 'quiz_started':
        setActiveQuiz(data.quiz);
        break;
      case 'quiz_finished':
        setActiveQuiz(null);
        setQuizAnswers({});
        break;
      case 'user_joined':
      case 'user_left':
        qc.invalidateQueries({ queryKey: ['/chat/chatrooms'] });
        break;
    }
  }

  // WebSocket connection
  const { 
    isConnected, 
    connectionError, 
    typingUsers, 
    joinRoom,
    leaveRoom,
    sendTyping,
    startQuiz: wsStartQuiz
  } = useWebSocket({
    onMessage: handleWebSocketMessage,
    autoConnect: true
  });

  // Get current user profile
  const { data: profileData } = useQuery({
    queryKey: ['/accounts/me'],
    queryFn: () => authAPI.getMe(),
    enabled: !!localStorage.getItem('access_token'),
    select: (response) => response.data,
    retry: false
  });

  useEffect(() => {
    if (profileData) {
      setCurrentUser({
        id: profileData.id.toString(),
        username: profileData.username,
        status: 'online',
        avatar: profileData.avatar,
        followers: profileData.followers_count,
        following: profileData.following_count
      });
    }
  }, [profileData]);

  // Queries
  const { data: chatRooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['/chat/chatrooms'],
    queryFn: () => chatAPI.getChatRooms(),
    enabled: !!currentUser,
    select: (response) => response.data.results || response.data,
    retry: false
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/chat/messages', currentRoom?.id],
    queryFn: () => chatAPI.getMessages({ chatroom: Number(currentRoom?.id) }),
    enabled: !!currentRoom?.id && !!currentUser,
    select: (response) => response.data.results || response.data,
    retry: false
  });

  const { data: availableUsers = [] } = useQuery({
    queryKey: ['/accounts/search', searchQuery],
    queryFn: () => accountsAPI.searchUsers(searchQuery),
    enabled: !!searchQuery && searchQuery.length > 2,
    select: (response) => response.data.results || response.data,
    retry: false
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/quiz/categories'],
    queryFn: () => quizAPI.fetchCategories(),
    select: (response) => response.data.results || response.data,
    retry: false
  });

  // Mutations
  const loginMutation = useMutation({
    mutationFn: (data: { username: string; password: string }) => authAPI.login(data),
    onSuccess: (response) => {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setShowLoginModal(false);
      qc.invalidateQueries();
    },
    onError: (error) => {
      console.error('Login error:', error);
      alert('Login failed. Please check your credentials.');
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (messageData: {
      chatroom: number;
      content?: string;
      message_type?: 'text' | 'file' | 'quiz' | 'quiz_result';
      reply_to?: number;
      file?: File;
    }) => chatAPI.sendMessage(messageData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/chat/messages', currentRoom?.id] });
      qc.invalidateQueries({ queryKey: ['/chat/chatrooms'] });
    }
  });

  const createOneOnOneChatMutation = useMutation({
    mutationFn: (userId: number) => chatAPI.createOneOnOneChat(userId),
    onSuccess: (response) => {
      setCurrentRoom(response.data);
      setShowNewChatModal(false);
      qc.invalidateQueries({ queryKey: ['/chat/chatrooms'] });
    }
  });

  const createGroupChatMutation = useMutation({
    mutationFn: (data: { name: string; participants: number[] }) =>
      chatAPI.createGroupChat(data),
    onSuccess: (response) => {
      setCurrentRoom(response.data);
      setShowGroupModal(false);
      setNewGroupName('');
      setSelectedUsers([]);
      qc.invalidateQueries({ queryKey: ['/chat/chatrooms'] });
    }
  });

  const createTestMutation = useMutation({
    mutationFn: (testData: {
      title: string;
      category_id: number;
      visibility: 'public' | 'unlisted';
      questions: Array<{
        question_text: string;
        question_type: 'single' | 'multiple';
        options: string[];
        correct_answers: number[];
      }>;
    }) => quizAPI.createTest(testData),
    onSuccess: (response) => {
      // Start quiz in current room via WebSocket
      if (currentRoom && isConnected) {
        wsStartQuiz(Number(currentRoom.id), response.data.id);
      }
      setShowQuizModal(false);
    }
  });

  // Effects
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!currentRoom && chatRooms.length > 0) {
      setCurrentRoom(chatRooms[0]);
    }
  }, [chatRooms, currentRoom]);

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token && !showLoginModal) {
      setShowLoginModal(true);
    }
  }, [showLoginModal]);

  // Join/leave room via WebSocket
  useEffect(() => {
    if (currentRoom && isConnected) {
      joinRoom(Number(currentRoom.id));
      return () => {
        if (currentRoom) {
          leaveRoom(Number(currentRoom.id));
        }
      };
    }
  }, [currentRoom, isConnected, joinRoom, leaveRoom]);

  // Handle typing indicator
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (isTyping && currentRoom && isConnected) {
      sendTyping(Number(currentRoom.id), true);
      
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(Number(currentRoom.id), false);
        setIsTyping(false);
      }, 3000);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, currentRoom, isConnected, sendTyping]);

  // Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username && loginForm.password) {
      loginMutation.mutate(loginForm);
    }
  };

  const handleSendMessage = () => {
    if ((!message.trim() && !fileUpload) || !currentRoom || !currentUser) return;

    const messageData: any = {
      chatroom: Number(currentRoom.id),
      message_type: fileUpload ? 'file' : 'text'
    };

    if (message.trim()) {
      messageData.content = message.trim();
    }

    if (fileUpload) {
      messageData.file = fileUpload;
    }

    if (replyingTo) {
      messageData.reply_to = Number(replyingTo.id);
    }

    sendMessageMutation.mutate(messageData);
    setMessage('');
    setReplyingTo(null);
    setFileUpload(null);
    setIsTyping(false);
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
    }
  };

  const handleCreateOneOnOneChat = (userId: number) => {
    createOneOnOneChatMutation.mutate(userId);
  };

  const handleCreateGroupChat = () => {
    if (newGroupName.trim() && selectedUsers.length > 0) {
      createGroupChatMutation.mutate({
        name: newGroupName.trim(),
        participants: selectedUsers
      });
    }
  };

  const handleFileUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('Fayl hajmi 5MB dan kichik bo\'lishi kerak');
      return;
    }

    const fileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    if (!fileTypes.includes(file.type)) {
      alert('Faqat rasm, PDF va matn fayllarini yuklash mumkin');
      return;
    }

    if (!currentRoom) return;

    sendMessageMutation.mutate({
      chatroom: Number(currentRoom.id),
      message_type: 'file',
      file: file,
      content: `📎 ${file.name}`
    });

    setFileUpload(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleQuizAnswer = (questionId: string, answer: any) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitQuiz = () => {
    if (!activeQuiz || !currentRoom || !currentUser) return;
    
    sendMessageMutation.mutate({
      chatroom: Number(currentRoom.id),
      content: `Test yakunlandi! Natija: ${Object.keys(quizAnswers).length}/${activeQuiz.questions.length}`,
      message_type: 'quiz_result',
      metadata: { answers: quizAnswers, quiz: activeQuiz }
    });

    setActiveQuiz(null);
    setQuizAnswers({});
  };

  const startLiveQuiz = () => {
    const newQuiz: Quiz = {
      id: Date.now().toString(),
      title: 'Yangi Jonli Test',
      isLive: true,
      timeLimit: 60,
      participants: 0,
      questions: [{
        id: 'q1',
        question: 'Bu test savoli',
        options: ['Variant A', 'Variant B', 'Variant C', 'Variant D'],
        type: 'single'
      }]
    };

    sendMessageMutation.mutate({
      chatroom: Number(currentRoom?.id),
      content: '',
      message_type: 'quiz',
      metadata: { quiz: newQuiz }
    });

    setShowQuizModal(false);
  };

  const filteredRooms = Array.isArray(chatRooms) ? chatRooms.filter((room: any) =>
    room.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Helper functions
  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Components
  const QuizCard = ({ quiz, messageId }: { quiz: Quiz; messageId: string }) => {
    const [currentAnswer, setCurrentAnswer] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(quiz.timeLimit || 45);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
      if (timeLeft > 0 && !submitted) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      }
    }, [timeLeft, submitted]);

    const currentQuestion = quiz.questions[0];

    return (
      <div className={`rounded-2xl p-4 mb-3 max-w-md ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white' 
          : 'bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 text-white'
      } shadow-xl`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span className="font-semibold">{quiz.isLive ? 'Jonli Test' : 'Test'}</span>
          </div>
          {quiz.isLive && <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>}
        </div>
        
        <h3 className="font-bold mb-3 text-lg">{quiz.title}</h3>
        <p className="mb-4 text-sm opacity-90">{currentQuestion.question}</p>
        
        <div className="space-y-2 mb-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => setCurrentAnswer(index)}
              disabled={submitted}
              className={`w-full text-left p-3 rounded-xl transition-all transform hover:scale-[1.02] ${
                currentAnswer === index 
                  ? 'bg-white/20 backdrop-blur border-2 border-white/30' 
                  : 'bg-white/10 backdrop-blur hover:bg-white/15'
              } ${submitted ? 'opacity-60' : ''}`}
            >
              <span className="text-sm font-medium">{String.fromCharCode(65 + index)}.</span> {option}
            </button>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <span className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{quiz.participants || 0}/12</span>
            </span>
          </div>
          <button
            onClick={() => {
              setSubmitted(true);
              submitQuiz();
            }}
            disabled={currentAnswer === null || submitted}
            className={`px-4 py-2 rounded-xl font-medium transition-all transform hover:scale-105 ${
              currentAnswer !== null && !submitted
                ? 'bg-white text-purple-600 hover:bg-gray-100' 
                : 'bg-white/20 text-white/60 cursor-not-allowed'
            }`}
          >
            {submitted ? <CheckCheck className="w-4 h-4" /> : 'Yuborish'}
          </button>
        </div>
      </div>
    );
  };

  const MessageComponent = ({ msg }: { msg: Message }) => {
    const isOwnMessage = msg.senderId === currentUser?.id;

    if (msg.type === 'quiz') {
      return (
        <div className="flex justify-start mb-6">
          <div className="flex items-start space-x-3 max-w-full">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-purple-600' : 'bg-purple-500'
            }`}>
              <span className="text-white font-semibold text-sm">
                {msg.sender?.username?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <div className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {msg.sender?.username} • {msg.createdAt ? formatTime(new Date(msg.createdAt)) : 'hozir'}
              </div>
              <QuizCard quiz={msg.metadata?.quiz} messageId={msg.id} />
            </div>
          </div>
        </div>
      );
    }

    if (msg.type === 'file') {
      return (
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
          <div className={`flex items-start space-x-3 max-w-[85%] ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
            {!isOwnMessage && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                theme === 'dark' ? 'bg-indigo-600' : 'bg-indigo-500'
              }`}>
                <span className="text-white font-semibold text-xs">
                  {msg.sender?.username?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            <div>
              {!isOwnMessage && (
                <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {msg.sender?.username} • {msg.createdAt ? formatTime(new Date(msg.createdAt)) : 'hozir'}
                </div>
              )}
              <div className={`p-4 rounded-2xl max-w-sm ${
                isOwnMessage 
                  ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
              } ${isOwnMessage ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                <div className="flex items-center space-x-3">
                  {msg.fileName?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <ImageIcon className="w-6 h-6 text-green-500" />
                  ) : (
                    <FileText className="w-6 h-6 text-blue-500" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{msg.fileName}</p>
                    <p className="text-xs opacity-70">{msg.fileSize ? `${(msg.fileSize / 1024).toFixed(1)} KB` : ''}</p>
                  </div>
                </div>
                {msg.fileUrl && msg.fileName?.match(/\.(jpg|jpeg|png|gif)$/i) && (
                  <img src={msg.fileUrl} alt={msg.fileName} className="mt-3 rounded-lg max-w-full h-auto" />
                )}
              </div>
              {isOwnMessage && (
                <div className={`text-xs mt-1 text-right ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {msg.createdAt ? formatTime(new Date(msg.createdAt)) : 'hozir'}
                  <CheckCheck className="w-3 h-3 inline ml-1 text-blue-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex items-start space-x-3 max-w-[85%] ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {!isOwnMessage && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-gradient-to-r from-pink-500 to-violet-500' : 'bg-gradient-to-r from-pink-400 to-violet-400'
            }`}>
              <span className="text-white font-semibold text-xs">
                {msg.sender?.username?.charAt(0) || 'U'}
              </span>
            </div>
          )}
          <div>
            {!isOwnMessage && (
              <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {msg.sender?.username} • {msg.createdAt ? formatTime(new Date(msg.createdAt)) : 'hozir'}
              </div>
            )}
            <div className={`px-4 py-3 rounded-2xl ${
              isOwnMessage 
                ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                : theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
            } ${isOwnMessage ? 'rounded-br-md' : 'rounded-bl-md'}`}>
              {msg.content}
            </div>
            {isOwnMessage && (
              <div className={`text-xs mt-1 text-right ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {msg.createdAt ? formatTime(new Date(msg.createdAt)) : 'hozir'}
                <CheckCheck className="w-3 h-3 inline ml-1 text-blue-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Modals
  const NewChatModal = () => (
    showNewChatModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowNewChatModal(false)} />
        <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl p-6 ${
          theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Yangi Suhbat</h3>
            <button onClick={() => setShowNewChatModal(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {availableUsers.map(user => (
              <div key={user.id} className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`} onClick={() => handleCreateOneOnOneChat(user.id)}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  user.status === 'online' ? 'bg-green-500' : user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}>
                  <span className="text-white font-semibold text-sm">{user.username.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm opacity-70">{user.followers} ta obunachi</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  user.status === 'online' ? 'bg-green-400' : user.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                }`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  );

  const GroupModal = () => (
    showGroupModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowGroupModal(false)} />
        <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl p-6 ${
          theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Yangi Guruh</h3>
            <button onClick={() => setShowGroupModal(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Guruh nomi" 
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className={`w-full p-3 rounded-xl border ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <div className="space-y-2">
              <p className="font-medium">A'zolarni tanlang:</p>
              {availableUsers.map(user => (
                <div key={user.id} className={`flex items-center space-x-3 p-2 rounded-lg ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}>
                  <input 
                    type="checkbox" 
                    className="rounded" 
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(prev => [...prev, user.id]);
                      } else {
                        setSelectedUsers(prev => prev.filter(id => id !== user.id));
                      }
                    }}
                  />
                  <span className="text-sm">{user.username}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={handleCreateGroupChat}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-colors"
            >
              Guruh Yaratish
            </button>
          </div>
        </div>
      </div>
    )
  );

  const QuizModal = () => (
    showQuizModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowQuizModal(false)} />
        <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl p-6 ${
          theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Test Yaratish</h3>
            <button onClick={() => setShowQuizModal(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Test nomi" 
              className={`w-full p-3 rounded-xl border ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
            <textarea 
              placeholder="Savol matni" 
              className={`w-full p-3 rounded-xl border h-24 resize-none ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
            <div className="space-y-2">
              <p className="font-medium">Javob variantlari:</p>
              {['A', 'B', 'C', 'D'].map(letter => (
                <div key={letter} className="flex items-center space-x-2">
                  <span className="w-6 text-center font-medium">{letter}.</span>
                  <input 
                    type="text" 
                    placeholder={`${letter} varianti`}
                    className={`flex-1 p-2 rounded-lg border ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                  <input type="radio" name="correct" className="text-green-500" />
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={startLiveQuiz}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium transition-colors"
              >
                Jonli Test Boshlash
              </button>
              <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-colors">
                Oddiy Savol
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className={`flex h-screen transition-colors ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`${
        isMobile 
          ? `fixed inset-y-0 left-0 z-50 w-80 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : 'w-80'
      } ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col`}>
        
        {/* Header */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>QuizChat</h1>
            </div>
            <div className="flex items-center space-x-1">
              <button 
                onClick={toggleTheme} 
                className={`p-2 rounded-xl transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {isMobile && (
                <button 
                  onClick={() => setSidebarOpen(false)} 
                  className={`p-2 rounded-xl transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Suhbatlarni qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {roomsLoading ? (
            <div>Loading...</div>
          ) : filteredRooms.map((room: ChatRoom) => (
            <div
              key={room.id}
              onClick={() => {
                setCurrentRoom(room);
                if (isMobile) setSidebarOpen(false);
              }}
              className={`p-4 cursor-pointer transition-all hover:scale-[1.02] ${
                currentRoom?.id === room.id 
                  ? `border-l-4 border-blue-500 ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'}` 
                  : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {room.type === 'group' ? (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      room.isLiveQuiz 
                        ? 'bg-gradient-to-r from-green-400 to-blue-500' 
                        : 'bg-gradient-to-r from-purple-400 to-pink-400'
                    }`}>
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-green-500 flex items-center justify-center">
                      <span className="text-white font-semibold">{room.name.charAt(0)}</span>
                    </div>
                  )}
                  {room.isLiveQuiz && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {room.name}
                    </h3>
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {room.lastMessage?.createdAt ? formatTime(new Date(room.lastMessage.createdAt)) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {room.isLiveQuiz ? '🔴 Jonli Test Faol' : room.lastMessage?.content || 'Xabarlar yo\'q'}
                    </p>
                    {room.unreadCount && room.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Actions */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setShowNewChatModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl font-medium transition-all transform hover:scale-105 flex flex-col items-center space-y-1"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs">Chat</span>
            </button>
            <button 
              onClick={() => setShowGroupModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-xl font-medium transition-all transform hover:scale-105 flex flex-col items-center space-y-1"
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Guruh</span>
            </button>
            <button 
              onClick={() => setShowQuizModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl font-medium transition-all transform hover:scale-105 flex flex-col items-center space-y-1"
            >
              <Brain className="w-5 h-5" />
              <span className="text-xs">Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentRoom ? (
          <>
            {/* Chat Header */}
            <div className={`p-4 border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isMobile && (
                    <button 
                      onClick={() => setSidebarOpen(true)} 
                      className={`p-2 rounded-xl ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                  )}
                  <div className="relative">
                    {currentRoom.type === 'group' ? (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        currentRoom.isLiveQuiz 
                          ? 'bg-gradient-to-r from-green-400 to-blue-500' 
                          : 'bg-gradient-to-r from-purple-400 to-pink-400'
                      }`}>
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-green-500 flex items-center justify-center">
                        <span className="text-white font-semibold">{currentRoom.name.charAt(0)}</span>
                      </div>
                    )}
                    {currentRoom.isLiveQuiz && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>}
                  </div>
                  <div>
                    <h2 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {currentRoom.name}
                    </h2>
                    <div className="flex items-center space-x-2">
                      {currentRoom.isLiveQuiz && (
                        <>
                          <span className="text-xs text-green-500 font-medium">🔴 Jonli Test</span>
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>•</span>
                        </>
                      )}
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {currentRoom.type === 'group' ? `${currentRoom.members?.length || 0} a'zo` : 'Onlayn'}
                      </span>
                      
                      {/* Connection Status */}
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>•</span>
                      <div className="flex items-center space-x-1">
                        {isConnected ? (
                          <Wifi className="w-3 h-3 text-green-500" />
                        ) : (
                          <WifiOff className="w-3 h-3 text-red-500" />
                        )}
                        <span className="text-xs text-green-500">
                          {isConnected ? 'Ulangan' : 'Ulanish yo\'q'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Typing Indicator */}
                    {typingUsers[Number(currentRoom.id)]?.length > 0 && (
                      <p className="text-xs text-blue-500 italic mt-1">
                        {typingUsers[Number(currentRoom.id)].slice(0, 3).join(', ')} yozmoqda...
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className={`p-2 rounded-xl transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              className={`flex-1 overflow-y-auto p-4 space-y-2 ${
                dragOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
            >
              {messagesLoading ? <div>Loading messages...</div> : messages.map((msg) => (
                <MessageComponent key={msg.id} msg={msg} />
              ))}
              {typingUsers[Number(currentRoom.id)]?.length > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">T</span>
                  </div>
                  <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div className="flex space-x-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
                      ))}
                    </div>
                  </div>
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>yozmoqda...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className={`p-4 border-t ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {replyingTo && (
                <div className={`mb-3 p-3 rounded-xl border-l-4 border-blue-500 ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {replyingTo.sender?.username}ga javob
                    </span>
                    <button onClick={() => setReplyingTo(null)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {replyingTo.content}
                  </p>
                </div>
              )}
              
              <div className="flex items-end space-x-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3 rounded-xl transition-all hover:scale-110 ${
                    theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Xabar yozing..."
                    className={`w-full p-4 rounded-2xl resize-none border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                    }`}
                    rows={1}
                    style={{ minHeight: '52px', maxHeight: '120px' }}
                  />
                  <button 
                    className="absolute right-3 bottom-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <button 
                  onClick={() => setShowQuizModal(true)}
                  className="p-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-all hover:scale-110"
                  title="Test yuborish"
                >
                  <Brain className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleSendMessage}
                  disabled={(!message.trim() && !fileUpload) || sendMessageMutation.isPending}
                  className={`p-3 rounded-xl font-medium transition-all hover:scale-110 ${
                    (message.trim() || fileUpload) && !sendMessageMutation.isPending
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {sendMessageMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h3 className={`text-2xl font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                QuizChat'ga xush kelibsiz
              </h3>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Suhbatni tanlang va xabar almashishni boshlang
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Details Panel */}
      {showDetails && currentRoom && !isMobile && (
        <div className={`w-80 p-4 border-l ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ma'lumotlar</h3>
            <button onClick={() => setShowDetails(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{currentRoom.name}</h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {currentRoom.members?.length || 0} a'zo • {currentRoom.members?.filter(m => m.status === 'online').length || 0} onlayn
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button 
              onClick={() => setShowQuizModal(true)}
              className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex flex-col items-center transition-all hover:scale-105"
            >
              <Brain className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">Test</span>
            </button>
            <button 
              onClick={() => setShowGroupModal(true)}
              className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl flex flex-col items-center transition-all hover:scale-105"
            >
              <UserPlus className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">Qo'shish</span>
            </button>
          </div>
          
          {currentRoom.type === 'group' && currentRoom.members && (
            <div>
              <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Onlayn a'zolar ({currentRoom.members.filter(m => m.status === 'online').length})
              </h4>
              <div className="space-y-3">
                {currentRoom.members.filter(m => m.status === 'online').map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-semibold text-xs">{member.username.charAt(0)}</span>
                    </div>
                    <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{member.username}</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />

      {/* Modals */}
      <NewChatModal />
      <GroupModal />
      <QuizModal />
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                QuizChat'ga kirish
              </h2>
              <p className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Davom etish uchun hisobingizga kiring
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Parol"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                {loginMutation.isPending ? 'Kirilmoqda...' : 'Kirish'}
              </button>
            </form>

            {connectionError && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm text-center">
                <div className="flex items-center justify-center space-x-2">
                  <WifiOff className="w-4 h-4" />
                  <span>{connectionError}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}