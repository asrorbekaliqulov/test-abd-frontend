import React, { useEffect, useRef, useState } from 'react';

interface FloatingLetter {
  id: number;
  letter: string;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  rotation: number; // Added for 3D rotation
  velocityX: number; // For parabolic motion
  velocityY: number; // For parabolic motion
}

interface AnimatedLiveProfileProps {
  profileImage: string;
  username: string;
  size?: number;
}

const AnimatedLiveProfile: React.FC<AnimatedLiveProfileProps> = ({ 
  profileImage, 
  username, 
  size = 64 
}) => {
  const [floatingLetters, setFloatingLetters] = useState<FloatingLetter[]>([]);
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G']; // Expanded letters for variety
  const containerRef = useRef<HTMLDivElement>(null);
  const [intervalTime, setIntervalTime] = useState(1200); // Dynamic interval for interactivity
  const gravity = 0.1; // Simulated gravity for parabolic fountain
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const interval = setInterval(() => {
      const newLetter: FloatingLetter = {
        id: Date.now() + Math.random(),
        letter: letters[Math.floor(Math.random() * letters.length)],
        x: 50 + (Math.random() - 0.5) * 20, // Start near center with slight spread
        y: 80, // Start from lower part like fountain base
        opacity: 1,
        scale: 0.5, // Start small
        rotation: (Math.random() - 0.5) * 90, // Random initial rotation for 3D effect
        velocityX: (Math.random() - 0.5) * 4, // Horizontal velocity
        velocityY: - (8 + Math.random() * 4), // Upward initial velocity
      };

      setFloatingLetters(prev => [...prev, newLetter]);
    }, intervalTime);

    // Animation loop for physics simulation
    const animate = () => {
      setFloatingLetters(prev => 
        prev.map(letter => {
          let newVelocityY = letter.velocityY + gravity;
          let newY = letter.y + newVelocityY;
          let newX = letter.x + letter.velocityX;
          let newOpacity = letter.opacity;
          let newScale = letter.scale;
          let newRotation = letter.rotation + (Math.random() - 0.5) * 10; // Tumble rotation

          // Fade out and scale up as it rises
          if (newY < 50) {
            newOpacity -= 0.01;
            newScale += 0.01;
          }

          // Remove if out of bounds or faded
          if (newY < -50 || newOpacity <= 0) {
            return null;
          }

          return {
            ...letter,
            x: newX,
            y: newY,
            opacity: newOpacity,
            scale: newScale,
            rotation: newRotation,
            velocityY: newVelocityY,
          };
        }).filter(Boolean) as FloatingLetter[]
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      clearInterval(interval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [intervalTime]);

  // Interactivity: Speed up on hover
  const handleMouseEnter = () => {
    setIntervalTime(600); // Faster emission
  };

  const handleMouseLeave = () => {
    setIntervalTime(1200); // Back to normal
  };

  return (
    <div 
      ref={containerRef}
      className="relative" 
      style={{ 
        width: size, 
        height: size, 
        perspective: '500px' // Enable 3D perspective
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Animated gradient border like Instagram live */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-red-400 via-pink-500 to-purple-600"
        style={{ 
          animationDuration: '3s',
          padding: '2px'
        }}
      >
        <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
          <img
            src={profileImage}
            alt={username}
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </div>

      {/* Floating letters fountain effect with 3D */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {floatingLetters.map(letter => (
          <div
            key={letter.id}
            className="absolute text-white font-bold text-sm transition-all duration-50 ease-out"
            style={{
              left: `${letter.x}%`,
              top: `${letter.y}%`,
              transform: `translate(-50%, -50%) scale(${letter.scale}) rotateY(${letter.rotation}deg) rotateX(${letter.rotation / 2}deg)`, // 3D transforms
              opacity: letter.opacity,
              textShadow: '0 0 4px rgba(0,0,0,0.5), 2px 2px 4px rgba(0,0,0,0.3)', // Enhanced shadow for depth
              transformStyle: 'preserve-3d', // Preserve 3D
            }}
          >
            {letter.letter}
          </div>
        ))}
      </div>

      {/* Live indicator */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
        <div className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
          LIVE
        </div>
      </div>
    </div>
  );
};

export default AnimatedLiveProfile;