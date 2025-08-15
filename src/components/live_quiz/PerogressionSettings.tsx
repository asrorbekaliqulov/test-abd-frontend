import React from 'react'
import { UserCog, Zap, Crown, Timer } from 'lucide-react'

interface ProgressionSettingsProps {
  theme: string
  value: 'admin' | 'first_answer'
  onChange: (value: 'admin' | 'first_answer') => void
  adminTimeout: number
  onAdminTimeoutChange: (timeout: number) => void
}

export const ProgressionSettings: React.FC<ProgressionSettingsProps> = ({
  theme,
  value,
  onChange,
  adminTimeout,
  onAdminTimeoutChange
}) => {
  return (
    <div className={`rounded-2xl p-6 border shadow-lg ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
          <UserCog size={24} className="text-white" />
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Keyingi savolga o'tish
          </h3>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Savollar orasida qanday o'tish turini tanlang
          </p>
        </div>
      </div>

      {/* Admin Timeout Settings */}
      {value === 'admin' && (
        <div className={`mt-6 p-6 rounded-xl border ${
          theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <Timer size={16} className="text-orange-500" />
            </div>
            <h4 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Admin kutish vaqti
            </h4>
          </div>
          <p className={`text-sm mb-4 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Admin offline bo'lib qolsa, har necha daqiqada avtomatik keyingi savolga o'tsin?
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Kutish vaqti: {adminTimeout} daqiqa
              </span>
              <div className="flex items-center space-x-2">
                <Timer size={16} className="text-orange-500" />
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  1-10 daqiqa
                </span>
              </div>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="1"
                max="10"
                value={adminTimeout}
                onChange={(e) => onAdminTimeoutChange(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider-orange"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${((adminTimeout - 1) / 9) * 100}%, ${
                    theme === 'dark' ? '#374151' : '#e5e7eb'
                  } ${((adminTimeout - 1) / 9) * 100}%, ${
                    theme === 'dark' ? '#374151' : '#e5e7eb'
                  } 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>1 daqiqa</span>
                <span>5 daqiqa</span>
                <span>10 daqiqa</span>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${
              theme === 'dark' ? 'bg-orange-900/20 border border-orange-500/30' : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-orange-300' : 'text-orange-700'
                }`}>
                  Avtomatik o'tish: {adminTimeout} daqiqa kutiladi
                </span>
              </div>
              <p className={`text-xs mt-1 ${
                theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
              }`}>
                Admin javob bermasa, tizim avtomatik keyingi savolga o'tadi
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button
          onClick={() => onChange('admin')}
          className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] transform group ${
            value === 'admin'
              ? theme === 'dark'
                ? 'border-blue-500 bg-blue-900/20 shadow-lg'
                : 'border-blue-500 bg-blue-50 shadow-lg'
              : theme === 'dark'
                ? 'border-gray-600 bg-gray-700 hover:border-blue-400'
                : 'border-gray-200 bg-gray-50 hover:border-blue-400'
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
              value === 'admin'
                ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                : theme === 'dark'
                  ? 'bg-gray-600 group-hover:bg-gray-500'
                  : 'bg-gray-200 group-hover:bg-gray-300'
            }`}>
              <Crown size={28} className={value === 'admin' ? 'text-white' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
            </div>
            <div className="text-center">
              <h4 className={`font-semibold text-lg mb-2 ${
                value === 'admin'
                  ? 'text-blue-500'
                  : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Admin boshqaruvi
              </h4>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Siz keyingi savolga o'tishni boshqarasiz. Barcha ishtirokchilar kutadilar.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                value === 'admin' ? 'bg-blue-500' : 'bg-gray-400'
              } animate-pulse`} />
              <span className={`text-xs font-medium ${
                value === 'admin' ? 'text-blue-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Nazorat ostida
              </span>
            </div>
          </div>
        </button>

        <button
          onClick={() => onChange('first_answer')}
          className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] transform group ${
            value === 'first_answer'
              ? theme === 'dark'
                ? 'border-green-500 bg-green-900/20 shadow-lg'
                : 'border-green-500 bg-green-50 shadow-lg'
              : theme === 'dark'
                ? 'border-gray-600 bg-gray-700 hover:border-green-400'
                : 'border-gray-200 bg-gray-50 hover:border-green-400'
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
              value === 'first_answer'
                ? 'bg-gradient-to-br from-green-500 to-teal-600'
                : theme === 'dark'
                  ? 'bg-gray-600 group-hover:bg-gray-500'
                  : 'bg-gray-200 group-hover:bg-gray-300'
            }`}>
              <Zap size={28} className={value === 'first_answer' ? 'text-white' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
            </div>
            <div className="text-center">
              <h4 className={`font-semibold text-lg mb-2 ${
                value === 'first_answer'
                  ? 'text-green-500'
                  : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Tezkorlik asosida
              </h4>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Kim birinchi javob bersa, keyingi savolga o'tadi. Tezlik muhim!
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                value === 'first_answer' ? 'bg-green-500' : 'bg-gray-400'
              } animate-pulse`} />
              <span className={`text-xs font-medium ${
                value === 'first_answer' ? 'text-green-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Avtomatik
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Information Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg border ${
          value === 'admin'
            ? theme === 'dark'
              ? 'border-blue-500 bg-blue-900/10'
              : 'border-blue-500 bg-blue-50'
            : theme === 'dark'
              ? 'border-gray-600 bg-gray-700'
              : 'border-gray-200 bg-gray-50'
        } transition-all duration-200`}>
          <div className="flex items-center space-x-2 mb-2">
            <Crown size={16} className={value === 'admin' ? 'text-blue-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
            <span className={`text-sm font-medium ${
              value === 'admin' ? 'text-blue-500' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Admin boshqaruvi
            </span>
          </div>
          <ul className={`text-xs space-y-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <li>• Siz keyingi savolni ochasiz</li>
            <li>• Barcha ishtirokchilar kutadilar</li>
            <li>• To'liq nazorat</li>
          </ul>
        </div>

        <div className={`p-4 rounded-lg border ${
          value === 'first_answer'
            ? theme === 'dark'
              ? 'border-green-500 bg-green-900/10'
              : 'border-green-500 bg-green-50'
            : theme === 'dark'
              ? 'border-gray-600 bg-gray-700'
              : 'border-gray-200 bg-gray-50'
        } transition-all duration-200`}>
          <div className="flex items-center space-x-2 mb-2">
            <Zap size={16} className={value === 'first_answer' ? 'text-green-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
            <span className={`text-sm font-medium ${
              value === 'first_answer' ? 'text-green-500' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Tezkorlik asosida
            </span>
          </div>
          <ul className={`text-xs space-y-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <li>• Avtomatik o'tish</li>
            <li>• Tezlik raqobati</li>
            <li>• Dinamik oqim</li>
          </ul>
        </div>
      </div>
    </div>
  )
}