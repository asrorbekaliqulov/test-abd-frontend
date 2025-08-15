import React from 'react'
import { User, Globe, Clock, Hash, Loader2, CheckCircle } from 'lucide-react'

interface Test {
  id: number
  title: string
  description?: string
  question_count: number
  user: {
    id: number
    username: string
    profile_image?: string
  }
  created_at: string
  difficulty_level?: string
  is_public: boolean
}

interface TestSelectorProps {
  theme: string
  tests: {
    myTests: Test[]
    publicTests: Test[]
  }
  loading: boolean
  onTestSelect: (test: Test) => void
  selectedMode: 'immediate' | 'scheduled'
}

export const TestSelector: React.FC<TestSelectorProps> = ({
  theme,
  tests,
  loading,
  onTestSelect,
  selectedMode
}) => {
  const getDifficultyColor = (level?: string) => {
    switch (level) {
      case 'oson':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300'
      case 'o\'rta':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'qiyin':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const TestCard: React.FC<{ test: Test; isOwn: boolean }> = ({ test, isOwn }) => (
    <div
      onClick={() => onTestSelect(test)}
      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] transform group ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-600 hover:border-blue-500 hover:shadow-2xl'
          : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-2xl'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isOwn ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            {isOwn ? (
              <User size={20} className="text-blue-500" />
            ) : (
              <Globe size={20} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold text-lg group-hover:text-blue-500 transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {test.title}
            </h3>
            {test.description && (
              <p className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {test.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Hash size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {test.question_count} ta savol
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {formatDate(test.created_at)}
              </span>
            </div>
          </div>
          {test.difficulty_level && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(test.difficulty_level)}`}>
              {test.difficulty_level}
            </span>
          )}
        </div>

        {!isOwn && (
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <img
              src={test.user.profile_image || '/media/defaultuseravatar.png'}
              alt={test.user.username}
              className="w-6 h-6 rounded-full"
            />
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {test.user.username}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className={`text-xs px-2 py-1 rounded-full ${
          test.is_public
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {test.is_public ? 'Ommaviy' : 'Shaxsiy'}
        </div>
        <CheckCircle size={20} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Test tanlash
          </h2>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 size={24} className="animate-spin text-blue-500" />
            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              Testlar yuklanmoqda...
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Test tanlash
        </h2>
        <p className={`text-base ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {selectedMode === 'immediate' ? 'Hoziroq' : 'Rejalashtirilgan'} jonli viktorina uchun test tanlang
        </p>
      </div>

      {/* My Tests */}
      {tests.myTests.length > 0 && (
        <section>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <User size={18} className="text-blue-500" />
            </div>
            <h3 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Mening testlarim
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {tests.myTests.length} ta
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tests.myTests.map((test) => (
              <TestCard key={test.id} test={test} isOwn={true} />
            ))}
          </div>
        </section>
      )}

      {/* Public Tests */}
      {tests.publicTests.length > 0 && (
        <section>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Globe size={18} className="text-green-500" />
            </div>
            <h3 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Boshqa testlar
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {tests.publicTests.length} ta
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tests.publicTests.map((test) => (
              <TestCard key={test.id} test={test} isOwn={false} />
            ))}
          </div>
        </section>
      )}

      {tests.myTests.length === 0 && tests.publicTests.length === 0 && (
        <div className={`text-center py-12 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <Globe size={48} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Testlar topilmadi</h3>
          <p className="text-sm">Avval test yarating yoki boshqa foydalanuvchilar testlarini kuting</p>
        </div>
      )}
    </div>
  )
}