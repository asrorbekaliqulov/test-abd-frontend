import React, { useState } from 'react';
import { Search, Filter, X, Clock, TrendingUp, Users, BookOpen, Star, ChevronRight } from 'lucide-react';

interface SearchPageProps {
  theme: string;
}

interface SearchResult {
  id: string;
  type: 'user' | 'test' | 'question';
  title: string;
  subtitle?: string;
  avatar?: string;
  stats?: {
    rating?: number;
    participants?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  };
  verified?: boolean;
}

const SearchPage: React.FC<SearchPageProps> = ({  }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchHistory, setSearchHistory] = useState<string[]>([
    'JavaScript basics',
    'React hooks',
    'CSS flexbox',
    'Python programming',
    'Data structures'
  ]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const categories = [
    { id: 'all', name: 'All', icon: '🔍' },
    { id: 'programming', name: 'Programming', icon: '💻' },
    { id: 'mathematics', name: 'Mathematics', icon: '📊' },
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'languages', name: 'Languages', icon: '🌍' },
    { id: 'history', name: 'History', icon: '📚' },
    { id: 'geography', name: 'Geography', icon: '🗺️' }
  ];

  const trendingSearches = [
    'JavaScript ES6',
    'React Native',
    'Machine Learning',
    'Web Development',
    'Data Science',
    'Mobile Development'
  ];

  const popularUsers = [
    {
      id: 'user1',
      type: 'user' as const,
      title: 'Alex Developer',
      subtitle: '@alexdev • 1.2k followers',
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
      verified: true,
      stats: { rating: 4.8 }
    },
    {
      id: 'user2',
      type: 'user' as const,
      title: 'Sarah Quiz Master',
      subtitle: '@sarahquiz • 890 followers',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
      verified: false,
      stats: { rating: 4.6 }
    },
    {
      id: 'user3',
      type: 'user' as const,
      title: 'Mike Coder',
      subtitle: '@mikecodes • 2.1k followers',
      avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
      verified: true,
      stats: { rating: 4.9 }
    }
  ];

  const popularTests = [
    {
      id: 'test1',
      type: 'test' as const,
      title: 'Advanced JavaScript Concepts',
      subtitle: 'Programming • 25 questions',
      stats: { rating: 4.7, participants: 1250, difficulty: 'hard' as const }
    },
    {
      id: 'test2',
      type: 'test' as const,
      title: 'React Hooks Mastery',
      subtitle: 'Frontend • 20 questions',
      stats: { rating: 4.5, participants: 890, difficulty: 'medium' as const }
    },
    {
      id: 'test3',
      type: 'test' as const,
      title: 'CSS Grid & Flexbox',
      subtitle: 'Web Design • 15 questions',
      stats: { rating: 4.3, participants: 650, difficulty: 'easy' as const }
    }
  ];

  const mockSearch = (query: string): SearchResult[] => {
    if (!query.trim()) return [];
    
    const allResults = [...popularUsers, ...popularTests];
    return allResults.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      // Simulate API call
      setTimeout(() => {
        setSearchResults(mockSearch(query));
        setIsSearching(false);
      }, 300);
    } else {
      setSearchResults([]);
    }
  };

  const addToHistory = (query: string) => {
    if (query.trim() && !searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev.slice(0, 4)]);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const renderSearchResult = (result: SearchResult) => {
    if (result.type === 'user') {
      return (
        <div key={result.id} className="flex items-center space-x-3 p-4 bg-theme-primary rounded-lg hover:bg-theme-tertiary transition-theme-normal cursor-pointer">
          <img
            src={result.avatar}
            alt={result.title}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-theme-primary">{result.title}</h3>
              {result.verified && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <p className="text-sm text-theme-secondary">{result.subtitle}</p>
            {result.stats?.rating && (
              <div className="flex items-center space-x-1 mt-1">
                <Star size={12} className="text-yellow-500 fill-current" />
                <span className="text-xs text-theme-secondary">{result.stats.rating}</span>
              </div>
            )}
          </div>
          <ChevronRight size={16} className="text-theme-tertiary" />
        </div>
      );
    }

    if (result.type === 'test') {
      return (
        <div key={result.id} className="p-4 bg-theme-primary rounded-lg hover:bg-theme-tertiary transition-theme-normal cursor-pointer">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-theme-primary">{result.title}</h3>
            {result.stats?.difficulty && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(result.stats.difficulty)}`}>
                {result.stats.difficulty}
              </span>
            )}
          </div>
          <p className="text-sm text-theme-secondary mb-3">{result.subtitle}</p>
          <div className="flex items-center justify-between text-xs text-theme-tertiary">
            <div className="flex items-center space-x-4">
              {result.stats?.rating && (
                <div className="flex items-center space-x-1">
                  <Star size={12} className="text-yellow-500 fill-current" />
                  <span>{result.stats.rating}</span>
                </div>
              )}
              {result.stats?.participants && (
                <div className="flex items-center space-x-1">
                  <Users size={12} />
                  <span>{result.stats.participants}</span>
                </div>
              )}
            </div>
            <ChevronRight size={16} className="text-theme-tertiary" />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-theme-secondary pt-20 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Search Header */}
        <div className="flex space-x-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-secondary" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addToHistory(searchQuery)}
              placeholder="Search tests, users, questions..."
              className="w-full pl-10 pr-10 py-3 border-2 border-theme-primary rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:border-accent-primary transition-theme-normal"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-secondary hover:text-theme-primary"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 border-2 rounded-lg transition-theme-normal ${
              showFilters 
                ? 'border-accent-primary text-accent-primary bg-accent-primary bg-opacity-10' 
                : 'border-theme-primary text-theme-secondary hover:border-border-secondary'
            }`}
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-theme-normal ${
                  activeCategory === category.id
                    ? 'bg-accent-primary text-white'
                    : 'bg-theme-primary text-theme-secondary hover:bg-theme-tertiary'
                }`}
              >
                <span>{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-theme-primary rounded-lg p-4 mb-6 border border-theme-primary">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-theme-primary">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-theme-secondary hover:text-theme-primary"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-2">Difficulty</label>
                <div className="flex space-x-2">
                  {['easy', 'medium', 'hard'].map(level => (
                    <button
                      key={level}
                      className="px-3 py-1 text-sm border border-theme-primary rounded-full hover:bg-accent-primary hover:text-white hover:border-accent-primary transition-theme-normal"
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-2">Sort by</label>
                <select className="w-full p-2 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary">
                  <option>Most Popular</option>
                  <option>Newest</option>
                  <option>Highest Rated</option>
                  <option>Most Participants</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchQuery ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-theme-primary">
              {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
            </h2>
            {isSearching ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map(renderSearchResult)}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search size={48} className="mx-auto text-theme-tertiary mb-4" />
                <p className="text-theme-secondary">No results found</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Recent Searches */}
            {searchHistory.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock size={20} className="text-theme-secondary" />
                  <h2 className="text-lg font-semibold text-theme-primary">Recent Searches</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(item)}
                      className="px-3 py-2 bg-theme-primary text-theme-secondary rounded-lg hover:bg-theme-tertiary transition-theme-normal text-sm"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp size={20} className="text-theme-secondary" />
                <h2 className="text-lg font-semibold text-theme-primary">Trending</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {trendingSearches.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(item)}
                    className="p-3 bg-theme-primary text-theme-secondary rounded-lg hover:bg-theme-tertiary transition-theme-normal text-left text-sm"
                  >
                    #{item}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Users */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Users size={20} className="text-theme-secondary" />
                <h2 className="text-lg font-semibold text-theme-primary">Popular Users</h2>
              </div>
              <div className="space-y-3">
                {popularUsers.map(renderSearchResult)}
              </div>
            </div>

            {/* Popular Tests */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen size={20} className="text-theme-secondary" />
                <h2 className="text-lg font-semibold text-theme-primary">Popular Tests</h2>
              </div>
              <div className="space-y-3">
                {popularTests.map(renderSearchResult)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;