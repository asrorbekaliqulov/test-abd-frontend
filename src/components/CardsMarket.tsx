'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, X, AlertCircle, BookOpen, Activity, CheckCircle2 } from 'lucide-react';
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
  // Statuslar: 'Kutish', 'Qidirish', 'Topildi', 'O'qish', 'Yo'qotish'
  const [uiState, setUiState] = useState<'idle' | 'searching' | 'found' | 'reading' | 'lost'>('idle');
  
  const [mainText, setMainText] = useState('Kutish...');
  const [subText, setSubText] = useState('Mikrofonni yoqing va kitob nomini ayting');
  const [hint, setHint] = useState("");
  const [progress, setProgress] = useState(0);
  const [bookTitle, setBookTitle] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const isRecordingRef = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // --- EKRAN O'CHIB QOLMASLIGI UCHUN (Wake Lock) ---
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.log('Wake Lock error:', err);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  const connectWebSocket = () => {
    if (!accessToken) return;

    // Tokenni URL ga to'g'ri joylash
    const wsUrl = `wss://reader.testabd.uz/ws/read/${accessToken}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onmessage = (event) => {
      try {
        const data: ServerData = JSON.parse(event.data);
        handleServerData(data);
      } catch (err) {
        console.error('Data parsing error:', err);
      }
    };

    socketRef.current.onclose = () => {
        stopRecording();
    };
  };

  const handleServerData = (data: ServerData) => {
    switch (data.status) {
      case 'searching':
        setUiState('searching');
        setMainText('Qidirilmoqda...');
        setSubText(data.msg || 'Kitob bazadan qidirilmoqda');
        break;
      
      case 'ready':
        setUiState('found');
        setMainText('Topildi!');
        setSubText("O'qishni boshlashingiz mumkin");
        if (data.book_title) setBookTitle(data.book_title);
        if (data.percent !== undefined) setProgress(data.percent);
        if (data.hint) setHint(data.hint);
        
        // 2 sekunddan keyin 'reading' rejimiga o'tish vizual chiroyli bo'lishi uchun
        setTimeout(() => {
            setUiState('reading');
            setMainText(`${data.percent}%`);
        }, 1500);
        break;
      
      case 'reading':
        setUiState('reading');
        if (data.percent !== undefined) {
            setMainText(`${data.percent}%`);
            setProgress(data.percent);
        }
        if (data.hint) setHint(data.hint);
        setSubText("Eshityapman, davom eting...");
        break;
      
      case 'lost':
        // Faqat reading paytida lost bo'lsa ko'rsatamiz
        setUiState('lost');
        setMainText("Diqqat!");
        setSubText("Matndan biroz chetlashdingiz, davom eting...");
        if (data.recovery_hint) setHint(`"${data.recovery_hint}" so'zini qidiring`);
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
      // Bu yerda buffer size ni kichraytirish (4096 -> 2048) tezroq javob olishga yordam beradi
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      isRecordingRef.current = true;

      processorRef.current.onaudioprocess = (e) => {
        if (!isRecordingRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Vosk uchun formatlash (PCM 16-bit)
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.min(1, inputData[i]) * 0x7fff;
        }
        
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(pcmData.buffer);
        }
      };

      setIsRecording(true);
      requestWakeLock(); // Ekranni yoqib qo'yish
      
      if (uiState === 'idle') {
          setMainText('Eshityapman...');
          setSubText('Kitob nomini ayting');
      }

    } catch (err) {
      alert('Mikrofonga ruxsat bering!');
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    releaseWakeLock(); // Ekranni qo'yib yuborish
    setMainText('To\'xtatildi');
    setUiState('idle');
    
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    if (socketRef.current) socketRef.current.close();
  };

  const toggleRecording = () => {
      if (isRecording) {
          stopRecording();
      } else {
          // Qayta ulanish logikasi
          if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
              connectWebSocket();
          }
          // Biroz kutib keyin yozishni boshlash (socket ulanishi uchun)
          setTimeout(startRecording, 500);
      }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) setAccessToken(token);

    // Tozalash
    return () => {
        stopRecording();
        releaseWakeLock();
    };
  }, []);

  // --- UI RANG BOSHQARUVI ---
  const getStatusColor = () => {
      switch (uiState) {
          case 'searching': return 'text-blue-400';
          case 'found': return 'text-emerald-400';
          case 'reading': return 'text-blue-400';
          case 'lost': return 'text-amber-500'; // Qizil emas, sariq (yumshoqroq)
          default: return 'text-slate-400';
      }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center relative overflow-hidden font-sans">
      
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[80px] transition-colors duration-700
            ${uiState === 'found' ? 'bg-emerald-600/20' : 'bg-blue-600/10'}
        `} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[80px]" />
      </div>

      {/* Top Bar with Progress */}
      <div className="w-full fixed top-0 z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-white/5">
        <div className="h-1 w-full bg-slate-800">
          <div 
            className={`h-full transition-all duration-700 ease-out ${uiState === 'found' ? 'bg-emerald-500' : 'bg-blue-500'}`} 
            style={{ width: `${progress}%` }} 
          />
        </div>
        {bookTitle && (
            <div className="py-3 px-4 flex items-center justify-between max-w-2xl mx-auto">
                <span className="text-blue-200 text-sm font-medium flex items-center gap-2 truncate">
                    <BookOpen size={16} /> {bookTitle}
                </span>
                <button onClick={() => window.location.reload()} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
        )}
      </div>

      {/* Main Center Content */}
      <div className="flex-1 w-full max-w-lg flex flex-col items-center justify-center p-6 mt-10">
        
        {/* Status Text Area */}
        <div className="text-center mb-10 min-h-[120px] flex flex-col justify-center">
            <h1 className={`text-5xl md:text-6xl font-bold tracking-tight mb-3 transition-colors duration-300 ${getStatusColor()}`}>
                {mainText}
            </h1>
            <p className="text-slate-400 text-lg animate-pulse-slow font-medium">{subText}</p>
        </div>

        {/* Mic Button Area */}
        <div className="relative mb-12 group">
            {/* Visual Rings */}
            {isRecording && (
                <>
                    <div className={`absolute inset-0 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-30
                        ${uiState === 'found' ? 'bg-emerald-500' : 'bg-blue-500'}
                    `} />
                    <div className={`absolute inset-[-15px] border rounded-full animate-[spin_4s_linear_infinite] opacity-40
                        ${uiState === 'found' ? 'border-emerald-500' : 'border-blue-500'}
                    `} />
                </>
            )}
            
            <button
                onClick={toggleRecording}
                className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 touch-manipulation
                    ${isRecording 
                        ? (uiState === 'found' ? 'bg-gradient-to-tr from-emerald-600 to-teal-600' : 'bg-gradient-to-tr from-blue-600 to-indigo-600')
                        : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                    }
                    text-white
                `}
            >
                {uiState === 'found' ? <CheckCircle2 size={40} /> : (isRecording ? <Activity size={40} /> : <Mic size={32} />)}
            </button>
        </div>

        {/* Context/Hint Box */}
        <div className={`w-full p-6 rounded-3xl border backdrop-blur-sm transition-all duration-500 min-h-[140px] flex flex-col justify-center items-center text-center
            ${uiState === 'lost' 
                ? 'bg-amber-900/10 border-amber-500/20' 
                : 'bg-slate-800/40 border-white/5'
            }
        `}>
            {uiState === 'lost' ? (
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider mx-auto">
                        <AlertCircle size={12} /> Qidirilmoqda
                    </div>
                    <p className="text-xl text-slate-200 font-medium">
                        {hint || "Matnni davom ettiring..."}
                    </p>
                </div>
            ) : (
                <>
                  <p className="text-xl md:text-2xl text-slate-200/90 font-light leading-relaxed">
                      {hint ? `"... ${hint} ..."` : (isRecording ? "Eshityapman..." : "Boshlash uchun mikrafonni bosing")}
                  </p>
                </>
            )}
        </div>

      </div>

      <div className="mb-8"><ReaderHelpModal /></div>
    </div>
  );
}