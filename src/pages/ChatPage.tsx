import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useChat } from '../contexts/ChatContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatRoom from '../components/chat/ChatRoom';
import ChatDetails from '../components/chat/ChatDetails';
import { useIsMobile } from '../hooks/use-mobile';

export default function ChatPage() {
  const [match, params] = useRoute('/chat/:roomId');
  const roomId = params?.roomId;
  const isMobile = useIsMobile();
  const { currentRoom, setCurrentRoom } = useChat();
  const [showDetails, setShowDetails] = useState(!isMobile);

  // Fetch chat rooms
  const { data: chatRooms, isLoading } = useQuery({
    queryKey: ['/api/chatrooms'],
  });

  // Fetch current room details
  const { data: roomData } = useQuery({
    queryKey: ['/api/chatrooms', roomId],
    enabled: !!roomId,
  });

  useEffect(() => {
    if (roomData) {
      setCurrentRoom(roomData);
    } else if (roomId && chatRooms) {
      const room = chatRooms.find((r: any) => r.id === roomId);
      if (room) {
        setCurrentRoom(room);
      }
    }
  }, [roomData, roomId, chatRooms, setCurrentRoom]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <ChatSidebar chatRooms={chatRooms || []} />
      
      <div className="flex-1 flex">
        <ChatRoom />
        
        {showDetails && currentRoom && !isMobile && (
          <ChatDetails onClose={() => setShowDetails(false)} />
        )}
      </div>

      {isMobile && (
        <button className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-40 flex items-center justify-center">
          <i className="w-6 h-6" data-lucide="plus"></i>
        </button>
      )}
    </div>
  );
}
