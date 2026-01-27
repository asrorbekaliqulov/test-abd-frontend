'use client';

import { useEffect, useState } from 'react';
import { X, HelpCircle, Mic, BookOpen, BarChart3, ShieldCheck, Zap } from 'lucide-react';

export function ReaderHelpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('aiReaderHelpSeen');
    if (!hasSeenHelp) {
      setIsOpen(true);
      localStorage.setItem('aiReaderHelpSeen', 'true');
    } else {
      setShowButton(true);
    }
  }, []);

  return (
    <>
      {showButton && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 right-4 z-40 w-10 h-10 rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 hover:border-blue-400 flex items-center justify-center transition-all duration-300 shadow-lg shadow-blue-500/20"
          aria-label="Yordam"
        >
          <HelpCircle className="w-5 h-5 text-blue-300" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 border border-blue-400/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar">

            {/* Header */}
            <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-blue-400/20 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                    <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                AI Kitobxon Yo'riqnomasi
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-slate-400 hover:text-red-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">

              {/* Introduction */}
              <section className="relative">
                <div className="absolute -left-4 top-0 w-1 h-full bg-blue-500 rounded-full" />
                <h3 className="text-xl font-semibold text-blue-300 mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5" /> Tizim Haqida
                </h3>
                <p className="text-blue-100/70 leading-relaxed">
                  Bu tizim sizning nutqingizni real vaqtda tahlil qilib, kitobdagi o'rningizni so'zma-so'z aniqlaydi. Nutqni aniqlash 16,000Hz chastotada amalga oshiriladi va hatto kirill/lotin alifbosidagi farqlarni ham o'zi to'g'rilaydi.
                </p>
              </section>

              {/* Status Indicators */}
              <section>
                <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" /> Holat Indikatorlari
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                    <span className="flex items-center gap-2 text-blue-400 font-medium mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> Qidiruv
                    </span>
                    <p className="text-xs text-blue-100/60">Kitob nomini aytganingizda, AI bazadan eng mos variantni (80%+ o'xshashlik) qidiradi.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                    <span className="flex items-center gap-2 text-emerald-400 font-medium mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" /> Tayyor
                    </span>
                    <p className="text-xs text-blue-100/60">Kitob yuklandi va keshlandi. Endi xohlagan joyingizdan o'qishni boshlashingiz mumkin.</p>
                  </div>
                </div>
              </section>

              {/* Advanced Logic */}
              <section className="bg-blue-500/5 border border-blue-400/20 rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> Aqlli Kuzatuv Texnologiyasi
                </h3>
                <ul className="space-y-4 text-sm">
                  <li className="flex gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-blue-100/80"><strong>Tashlab ketish (Skip):</strong> Agar bir nechta gapni o'qimasdan o'tib ketsangiz, progress-bar ularni hisobga olmaydi. Faqat haqiqiy o'qilgan so'zlar statistikaga qo'shiladi.</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-blue-100/80"><strong>Xatolarga bardosh:</strong> Agar 1-2 ta so'zda adashsangiz yoki STT xato aniqlasa, "Fuzzy Match" algoritmi buni kechiradi va progressni to'xtatmaydi.</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-blue-100/80"><strong>Xavfsizlik:</strong> Sessiyangiz <strong>AccessToken</strong> bilan himoyalangan. Ma'lumotlar faqat sizning shaxsiy dashboardingizga saqlanadi.</span>
                  </li>
                </ul>
              </section>

              {/* Quick Guide Steps */}
              <section>
                <h3 className="text-lg font-semibold text-blue-300 mb-4">4 Qadamda Boshlash</h3>
                <div className="space-y-4 relative">
                  {[
                    { t: "Ulanish", d: "Katta ko'k mikrofon tugmasini bosing (Shazam animatsiyasi yoqiladi)." },
                    { t: "Kitobni ayting", d: "Kitob nomini aniq ayting. Masalan: 'O'tgan kunlar' yoki 'Ufq'." },
                    { t: "Mutolaa", d: "Ekran o'rtasidagi 'Hint' (keyingi so'zlar) yordamida o'qishni davom ettiring." },
                    { t: "Natija", d: "Dashboard bo'limida o'qish tezligi (WPM) va foizlarni kuzating." }
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0 border border-blue-400/20">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-blue-200">{step.t}</p>
                        <p className="text-sm text-blue-100/60">{step.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Technical Requirements */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-amber-300 font-semibold text-sm mb-2 flex items-center gap-2">
                    <Mic className="w-4 h-4" /> Muhim Eslatmalar:
                </p>
                <ul className="text-xs text-amber-200/70 space-y-1 list-disc list-inside">
                  <li>Tinch muhitda o'qish aniqlikni 98% gacha oshiradi.</li>
                  <li>Brauzerdan chiqib ketish seansni avtomatik yakunlaydi.</li>
                  <li>Mikrofon ruxsati berilmagan bo'lsa, tizim qizil holatga o'tadi.</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-950/90 backdrop-blur-md border-t border-blue-400/20 p-6 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-bold shadow-lg shadow-blue-600/30 active:scale-95"
              >
                Tushunarli, Boshladik!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}