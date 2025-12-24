import React from "react";

const QuizSkeletonLoader: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black">
            {/* Skeleton Styles */}
            <style>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.05) 25%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.05) 75%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite linear;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .skeleton-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .gradient-border {
          border: 1px solid;
          border-image: linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)) 1;
        }
      `}</style>

            {/* Main Content Skeleton */}
            <div className="h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col justify-between h-full">
                    {/* Ad Banner Skeleton */}
                    <div className="mb-8">
                        <div className="gradient-border rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                                <div className="h-4 w-32 bg-gray-800 rounded skeleton-shimmer" />
                                <div className="flex gap-2">
                                    <div className="h-6 w-12 bg-gray-800 rounded skeleton-pulse" />
                                    <div className="h-6 w-12 bg-gray-800 rounded skeleton-pulse" />
                                    <div className="h-6 w-12 bg-gray-800 rounded skeleton-pulse" />
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <div className="h-3 w-24 bg-gray-800 rounded skeleton-pulse" />
                                <div className="h-3 w-32 bg-gray-800 rounded skeleton-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Question Card Skeleton */}
                    <div className="glass-morphism rounded-xl p-4 sm:p-6 mb-8 shadow-xl skeleton-pulse">
                        {/* Answer options skeleton */}
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/50 border border-white/10">
                                    <div className="w-10 h-10 rounded-full bg-gray-800 skeleton-shimmer" />
                                    <div className="flex-1">
                                        <div className="h-5 w-3/4 bg-gray-800 rounded skeleton-shimmer" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* User Info Skeleton */}
                    <div className="glass-morphism rounded-xl p-4 w-full">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-800 skeleton-pulse" />
                                <div>
                                    <div className="h-4 w-24 bg-gray-800 rounded mb-1 skeleton-shimmer" />
                                    <div className="h-3 w-32 bg-gray-800 rounded skeleton-shimmer" />
                                </div>
                            </div>
                            <div className="w-20 h-8 bg-gray-800 rounded skeleton-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizSkeletonLoader;