import React, { useState } from 'react';

interface QuizDescriptionProps {
  title: string;
  description: string;
}

const QuizDescription: React.FC<QuizDescriptionProps> = ({ title, description }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const words = description.split(' ');
  const shortDescription = words.slice(0, 5).join(' ');
  const hasMoreWords = words.length > 5;

  return (
    <div className="bg-black/40 backdrop-blur-lg border border-white/30 rounded-xl p-4 sm:p-5">
      <h2 className="text-white font-bold text-lg sm:text-xl mb-2">{title}</h2>
      
      {!isExpanded ? (
        <div className="text-white/90 text-sm sm:text-base">
          {shortDescription}
          {hasMoreWords && (
            <>
              ...{' '}
              <button
                onClick={() => setIsExpanded(true)}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                ko'proq
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="max-h-32 overflow-y-auto">
          <p className="text-white/90 text-sm sm:text-base leading-relaxed">
            {description}
          </p>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-blue-400 hover:text-blue-300 font-medium mt-2"
          >
            yashirish
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizDescription;