import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share } from 'lucide-react';

interface Story {
  id: number;
  user: {
    username: string;
    user_profile_image: string;
  };
  type: 'test' | 'question';
  content: any;
  created_at: string;
}

interface StoriesViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  theme: string;
}

const StoriesViewer: React.FC<StoriesViewerProps> = ({ stories, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setPaused] = useState(false);

  const currentStory = stories[currentIndex];
  const STORY_DURATION = 5000; // 5 seconds

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused]);

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const renderStoryContent = () => {
    if (currentStory.type === 'test') {
      return (
        <div className="text-center text-white p-8">
          <div className="bg-black bg-opacity-30 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-4">📝 New Test Created!</h2>
            <h3 className="text-xl font-semibold mb-2">{currentStory.content.title}</h3>
            <p className="text-gray-200 mb-4">{currentStory.content.description}</p>
            <div className="flex justify-center space-x-4 text-sm">
              <span className="bg-blue-500 px-3 py-1 rounded-full">
                {currentStory.content.category}
              </span>
              <span className="bg-green-500 px-3 py-1 rounded-full">
                {currentStory.content.questions_count} questions
              </span>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center text-white p-8">
          <div className="bg-black bg-opacity-30 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-4">❓ New Question Added!</h2>
            <p className="text-lg mb-4">{currentStory.question_text}</p>
            <div className="space-y-2">
              {currentStory.answers?.map((answer: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-left ${
                    answer.is_correct 
                      ? 'bg-green-500 bg-opacity-80' 
                      : 'bg-gray-500 bg-opacity-50'
                  }`}
                >
                  {answer.answer_text}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-green-600"
        style={{
          backgroundImage: `url(${currentStory.user_profile_image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px) brightness(0.3)'
        }}
      />

      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100"
              style={{
                width: index < currentIndex ? '100%' : 
                       index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <img
            src={`http://127.0.0.1:8000${currentStory.user_profile_image}`}
            alt={currentStory.username}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div>
            <p className="text-white font-semibold">{currentStory.username}</p>
            <p className="text-white text-sm opacity-75">
              {new Date(currentStory.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 bg-black bg-opacity-30 rounded-full text-white hover:bg-opacity-50 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation areas */}
      <div className="absolute inset-0 flex">
        <div 
          className="flex-1 cursor-pointer"
          onClick={prevStory}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        />
        <div 
          className="flex-1 cursor-pointer"
          onClick={nextStory}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        />
      </div>

      {/* Navigation buttons */}
      {currentIndex > 0 && (
        <button
          onClick={prevStory}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-30 rounded-full text-white hover:bg-opacity-50 transition-all z-10"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      
      {currentIndex < stories.length - 1 && (
        <button
          onClick={nextStory}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-30 rounded-full text-white hover:bg-opacity-50 transition-all z-10"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Story content */}
      <div className="relative z-10 max-w-md w-full mx-4">
        {renderStoryContent()}
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4 z-10">
        <button className="p-3 bg-black bg-opacity-30 rounded-full text-white hover:bg-opacity-50 transition-all">
          <Heart size={20} />
        </button>
        <button className="p-3 bg-black bg-opacity-30 rounded-full text-white hover:bg-opacity-50 transition-all">
          <MessageCircle size={20} />
        </button>
        <button className="p-3 bg-black bg-opacity-30 rounded-full text-white hover:bg-opacity-50 transition-all">
          <Share size={20} />
        </button>
      </div>
    </div>
  );
};

export default StoriesViewer;