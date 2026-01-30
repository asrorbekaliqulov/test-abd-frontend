'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, X, AlertCircle, Volume2 } from 'lucide-react';
import { ReaderHelpModal } from './reader-help-modal';

interface ServerData {
  status: 'searching' | 'ready' | 'reading' | 'lost' | 'error';
  msg?: string;
  page?: number;
  hint?: string;
  percent?: number;
  book_title?: string;
  recovery_hint?: string;
}

export function AIReader() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Kutish...');
  const [subStatus, setSubStatus] = useState('Mikrofonni yoqing va kitob nomini ayting');
  const [hint, setHint] = useState("O'qilayotgan joydan keyingi so'zlar bu yerda chiqadi...");
  const [recoveryHint, setRecoveryHint] = useState('');
  const [progress, setProgress] = useState(0);
  const [bookTitle, setBookTitle] = useState('');
  const [statusColor, setStatusColor] = useState('text-blue-400');
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const isRecordingRef = useRef(false);
  
  // "Ting" ovozi uchun ref
  const tingSoundRef = useRef<HTMLAudioElement | null>(null);

  // Ovoz faylini yuklash
  useEffect(() => {
    // Bu yerdagi linkni o'zingizdagi mahalliy faylga o'zgartirishingiz mumkin
    tingSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  }, []);

  const playTing = () => {
    if (tingSoundRef.current) {
      tingSoundRef.current.currentTime = 0;
      tingSoundRef.current.play().catch(e => console.error("Audio error:", e));
    }
  };

  // WebSocket ulanishi
  const connectWebSocket = () => {
    if (!accessToken) {
      console.log('[v0] AccessToken topilmadi');
      setStatus('Xatolik');
      setStatusColor('text-red-400');
      setSubStatus('Autentifikatsiya kerak. Iltimos qayta kirish');
      return;
    }

    const wsUrl = `wss://reader.testabd.uz/ws/read/${accessToken}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log('[v0] Backend bilan aloqa o\'rnatildi');
    };

    socketRef.current.onmessage = (event) => {
      try {
        const data: ServerData = JSON.parse(event.data);
        handleServerData(data);
      } catch (err) {
        console.error('[v0] Data parsing error:', err);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error('[v0] WebSocket error:', error);
      setStatus('Xatolik');
      setStatusColor('text-red-400');
      setSubStatus('Backend bilan aloqa kesildi');
    };

    socketRef.current.onclose = () => {
      console.log('[v0] WebSocket yopildi. Qayta ulanish...');
      setTimeout(connectWebSocket, 2000);
    };
  };

  const handleServerData = (data: ServerData) => {
    switch (data.status) {
      case 'searching':
        setStatus('Qidirilmoqda...');
        setStatusColor('text-blue-400');
        setSubStatus(data.msg || '');
        break;
        
      case 'ready':
        setStatus('Tayyor!');
        setStatusColor('text-emerald-400');
        if (data.book_title) {
          setBookTitle(data.book_title);
        }
        setSubStatus("O'qishni boshlashingiz mumkin");
        break;
        
      case 'reading':
        // O'ZGARISH: Sahifa o'rniga foiz ko'rsatiladi
        const percentDisplay = data.percent !== undefined ? `${data.percent}%` : '0%';
        setStatus(percentDisplay);
        setStatusColor('text-blue-400');
        
        setHint(`... ${data.hint} ...`);
        setRecoveryHint(''); // Lost holatidan chiqqan bo'lsa tozalaymiz
        
        if (data.percent) {
          setProgress(data.percent);
        }
        break;
        
      case 'lost':
        // YANGI: Lost holati
        setStatus("To'xtab qoldingiz");
        setStatusColor('text-amber-400');
        setSubStatus(data.msg || "Matndan chetlashdingiz");
        setRecoveryHint(data.recovery_hint || '');
        playTing(); // Ovozli signal
        break;
        
      case 'error':
        setStatus('Xatolik');
        setStatusColor('text-red-400');
        setSubStatus(data.msg || '');
        break;
    }
  };

  const startRecording = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      isRecordingRef.current = true;

      processorRef.current.onaudioprocess = (e) => {
        if (!isRecordingRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);

        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.min(1, inputData[i]) * 0x7fff;
        }

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(pcmData.buffer);
        }
      };

      setIsRecording(true);
      setStatus('Eshityapman...');
      setStatusColor('text-blue-400');
      setSubStatus("Kitob nomini ayting yoki o'qishni boshlang");
    } catch (err) {
      console.error('[v0] Mikrofonga ruxsat berilmadi:', err);
      alert('Mikrofonga ruxsat berishingiz kerak!');
      setStatus('Xatolik');
      setStatusColor('text-red-400');
      setSubStatus('Mikrofonga ruxsat berilmadi');
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setStatus('Sessiya to\'xtatildi');
    setStatusColor('text-blue-400');
    // BookTitleni o'chirmaymiz, user qayta davom ettirishi mumkin
    // setBookTitle(''); 

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  // Handle page unload/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopRecording();
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isRecording) {
        stopRecording();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRecording]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setAccessToken(token);
    } else {
      setStatus('Xatolik');
      setStatusColor('text-red-400');
      setSubStatus('Autentifikatsiya kerak. Iltimos qayta kirish');
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      connectWebSocket();
    }

    return () => {
      stopRecording();
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [accessToken]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Animated background glow - Katta ekranlar uchun optimallashtirilgan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse" />
      </div>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 h-1.5 bg-white/5 w-full z-50">
         <div className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 transition-all duration-700 shadow-[0_0_15px_rgba(56,189,248,0.5)]" style={{ width: `${progress}%` }} />
      </div>

      {/* Book Title Header */}
      {bookTitle && (
        <div className="absolute top-0 left-0 right-0 bg-slate-900/50 backdrop-blur-md border-b border-blue-500/10 p-4 z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <h2 className="text-lg md:text-2xl font-bold text-blue-200 truncate flex items-center gap-2">
              <span className="text-2xl">📖</span> {bookTitle}
            </h2>
            <button
              onClick={() => window.location.reload()}
              className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-red-400"
              aria-label="Sessiyani yopish"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container - Responsive width */}
      <div className={`w-full max-w-5xl flex flex-col items-center z-10 space-y-10 transition-all duration-500 ${bookTitle ? 'mt-20' : ''}`}>

        {/* Status Display - Foizni katta qilib ko'rsatish */}
        <div className="text-center space-y-2">
          <h1 className={`text-5xl md:text-7xl lg:text-8xl font-black tracking-tight transition-colors duration-300 ${statusColor}`}>
            {status}
          </h1>
          <p className="text-base md:text-xl text-blue-200/60 font-medium">{subStatus}</p>
        </div>

        {/* Microphone Button */}
        <button
          onClick={toggleRecording}
          className={`relative transition-all duration-300 focus:outline-none rounded-full ${
            isRecording ? 'scale-100' : 'scale-95 hover:scale-100'
          }`}
        >
          {isRecording && (
            <>
              <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-shazam-wave" />
              <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-shazam-wave" style={{ animationDelay: '0.3s' }} />
            </>
          )}

          <div
            className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 z-10 border-4
             ${isRecording 
                ? 'bg-blue-600 border-blue-400 shadow-blue-500/50' 
                : 'bg-slate-900 border-white/10 hover:border-blue-500/50 shadow-blue-900/20'
             }
            `}
          >
            {isRecording ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1 h-12">
                     {[1,2,3,4,3,2,1].map((h, i) => (
                        <div key={i} className="w-1.5 bg-white rounded-full animate-shazam-bar" style={{height: `${h*100}%`, animationDelay: `${i*0.1}s`}} />
                     ))}
                </div>
                <span className="text-white font-bold uppercase tracking-widest text-sm">Stop</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Mic className="w-16 h-16 text-white/90" strokeWidth={1} />
                <span className="text-blue-200/50 font-bold uppercase tracking-widest text-sm">Boshlash</span>
              </div>
            )}
          </div>
        </button>

        {/* Dynamic Hint Box - Responsive o'lcham va Lost logic */}
        <div className="w-full px-4">
            <div className={`w-full p-8 md:p-12 rounded-[2rem] border backdrop-blur-xl transition-all duration-500 flex flex-col items-center text-center space-y-4
                ${recoveryHint 
                    ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]' 
                    : 'bg-blue-950/30 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
                }
            `}>
                
                {recoveryHint ? (
                    // Lost State UI
                    <>
                        <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                            <AlertCircle size={18} /> Yo'nalish
                        </div>
                        <p className="text-2xl md:text-4xl font-bold text-white leading-tight">
                            "{recoveryHint}"
                        </p>
                        <p className="text-red-300/60 text-sm md:text-base">
                            Shu so'zdan davom eting, men sizni qayta topib olaman.
                        </p>
                    </>
                ) : (
                    // Normal Reading UI
                    <>
                        <div className="flex items-center gap-2 text-blue-400/50 font-bold uppercase tracking-widest text-xs">
                            <Volume2 size={18} /> Keyingi qatorlar
                        </div>
                        <p className="text-2xl md:text-4xl text-blue-100/90 italic font-light leading-relaxed">
                            {hint}
                        </p>
                    </>
                )}
            </div>
        </div>

      </div>

      <div className="mt-8 relative z-10"><ReaderHelpModal /></div>
    </div>
  );
}