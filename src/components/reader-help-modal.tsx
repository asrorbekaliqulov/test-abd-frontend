'use client';

import { useEffect, useState } from 'react';
import { X, HelpCircle, Mic, BookOpen, Brain, MessageCircle, Lightbulb, Target } from 'lucide-react';

export function ReaderHelpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Foydalanuvchi birinchi marta kirganda avtomatik ochiladi
    const hasSeenHelp = localStorage.getItem('aiReaderHelpSeen_v2'); // Versiyani yangiladik
    if (!hasSeenHelp) {
      setIsOpen(true);
      localStorage.setItem('aiReaderHelpSeen_v2', 'true');
    } else {
      setShowButton(true);
    }
  }, []);

  return (
    <>
      {/* Doimiy yordam tugmasi (faqat modal yopilganda chiqadi) */}
      {showButton && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 right-4 z-40 w-10 h-10 rounded-full bg-blue-600/20 hover:bg-blue-600/40 border border-blue-400/50 hover:border-blue-400 flex items-center justify-center transition-all duration-300 shadow-lg shadow-blue-500/20 animate-fade-in"
          aria-label="Yordam"
        >
          <HelpCircle className="w-5 h-5 text-blue-300" />
        </button>
      )}

      {/* Modal oynasi */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-[#0b1121] border border-blue-500/30 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            
            {/* Orqa fon bezagi */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="sticky top-0 bg-[#0b1121]/95 backdrop-blur-md border-b border-white/5 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-900/20">
                    <BookOpen className="w-6 h-6 text-white" />
                </div>
                Foydalanuvchi Qo'llanmasi
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Asosiy Kontent */}
            <div className="p-6 md:p-8 space-y-8">

              {/* 1. AI bilan ishlash sirlari */}
              <section className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" /> 
                    AI aniq ishlashi uchun tavsiyalar
                </h3>
                <ul className="space-y-4">
                  <li className="flex gap-4 items-start">
                    <div className="mt-1 p-1 bg-blue-500/20 rounded-md shrink-0">
                        <Mic className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <strong className="text-blue-100 block mb-1">Tinch muhit tanlang</strong>
                        <p className="text-sm text-slate-400">Ortiqcha shovqinlar (TV, suhbat) AI ni chalg'itishi mumkin. Tinch xonada natija 2 barobar aniqroq bo'ladi.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="mt-1 p-1 bg-blue-500/20 rounded-md shrink-0">
                        <Target className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <strong className="text-blue-100 block mb-1">Dona-dona o'qing</strong>
                        <p className="text-sm text-slate-400">Juda tez o'qish shart emas. So'zlarni aniq talaffuz qilib, o'rtacha tezlikda o'qisangiz, tizim sizni yo'qotib qo'ymaydi.</p>
                    </div>
                  </li>
                </ul>
              </section>

              {/* 2. O'quvchi uchun foydasi */}
              <section>
                <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5" /> 
                    Bu sizga nima beradi?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-xl">
                        <h4 className="font-bold text-emerald-200 mb-1">Diqqatni jamlash</h4>
                        <p className="text-xs text-slate-400">Kitobdan chalg'imaslikka yordam beradi. Agar hayolingiz bo'linib o'qishdan to'xtasangiz, tizim ham to'xtaydi.</p>
                    </div>
                    <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-xl">
                        <h4 className="font-bold text-emerald-200 mb-1">Nutq ravonligi</h4>
                        <p className="text-xs text-slate-400">Ovoz chiqarib o'qish va uni ekranda kuzatish nutqingizni ravonlashtiradi va talaffuzni yaxshilaydi.</p>
                    </div>
                    <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-xl">
                        <h4 className="font-bold text-emerald-200 mb-1">Haqiqiy statistika</h4>
                        <p className="text-xs text-slate-400">Necha foiz o'qiganingiz va o'qish tezligingiz haqida aniq ma'lumotga ega bo'lasiz.</p>
                    </div>
                </div>
              </section>

              {/* 3. Feedback / Telegram */}
              <section className="relative overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-center relative z-10 shadow-lg shadow-blue-900/50">
                    <div className="mb-4 inline-flex p-3 bg-white/10 rounded-full backdrop-blur-sm">
                        <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Xatolik topdingizmi?</h3>
                    <p className="text-blue-100 text-sm mb-6 max-w-md mx-auto">
                        Dastur sinov rejimida ishlamoqda. Agar biror xatolik yoki kamchilik sezsangiz, iltimos bizga xabar bering. Sizning fikringiz biz uchun muhim!
                    </p>
                    
                    <a 
                        href="https://t.me/+vaofTv3R6GtmN2Qy" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all active:scale-95 shadow-lg"
                    >
                        Telegram Chatga Yozish
                    </a>
                </div>
              </section>

            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-[#0b1121]/95 backdrop-blur-md border-t border-white/5 p-6 flex justify-center md:justify-end z-10">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full md:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-semibold border border-white/10 hover:border-white/20 active:scale-95"
              >
                Tushunarli, Rahmat
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}