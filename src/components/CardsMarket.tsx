'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, AlertCircle, BookOpen, Activity, CheckCircle2, Sparkles, WifiOff } from 'lucide-react';
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
  const [uiState, setUiState] = useState<'idle' | 'searching' | 'found' | 'reading' | 'lost'>('idle');
  
  const [mainText, setMainText] = useState('0%');
  const [statusMsg, setStatusMsg] = useState('Kutish...');
  const [subText, setSubText] = useState('Mikrofonni bosing va kitob nomini ayting');
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

  // --- WAKE LOCK (Ekran o'chmasligi uchun) ---
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
    if (socketRef.current) socketRef.current.close();

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
  };

  const handleServerData = (data: ServerData) => {
    switch (data.status) {
      case 'searching':
        setUiState('searching');
        setStatusMsg('Qidirilmoqda...');
        setSubText(data.msg || 'Kitob bazadan qidirilmoqda');
        break;
      
      case 'ready':
        setUiState('found');
        setStatusMsg('Topildi!');
        setSubText("O'qishni boshlashingiz mumkin");
        if (data.book_title) setBookTitle(data.book_title);
        if (data.percent !== undefined) {
            setProgress(data.percent);
            setMainText(`${data.percent}%`);
        }
        if (data.hint) setHint(data.hint);
        
        // Silliq o'tish uchun biroz ushlab turamiz
        setTimeout(() => {
            setUiState('reading');
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
        setUiState('lost');
        setStatusMsg("Diqqat!");
        setSubText("Matndan biroz chetlashdingiz");
        if (data.recovery_hint) setHint(`"${data.recovery_hint}" so'zini qidiring`);
        break;
    }
  };

  const startRecording = async () => {
    try {
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
          connectWebSocket();
          await new Promise(resolve => setTimeout(resolve, 500));
      }

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      isRecordingRef.current = true;
      setIsRecording(true);
      requestWakeLock();
      
      if (uiState === 'idle') {
          setStatusMsg('Eshityapman...');
          setSubText('Kitob nomini ayting');
      }

      processorRef.current.onaudioprocess = (e) => {
        if (!isRecordingRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.min(1, inputData[i]) * 0x7fff;
        }
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(pcmData.buffer);
        }
      };

    } catch (err) {
      alert('Mikrofonga ruxsat bering!');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    releaseWakeLock();
    setStatusMsg('To\'xtatildi');
    setUiState('idle');
    setBookTitle('');
    
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
    }
  };

  const toggleRecording = () => isRecording ? stopRecording() : startRecording();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) setAccessToken(token);

    const handleBeforeUnload = () => {
        if (socketRef.current) socketRef.current.close();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        stopRecording();
        releaseWakeLock();
    };
  }, []);

  // --- UI RENDER HELPERS ---
  const isReadingMode = uiState === 'reading' || uiState === 'found';
  
  return (
    <div className="min-h-screen bg-[#0b1121] flex flex-col items-center relative overflow-hidden font-sans text-white selection:bg-blue-500/30">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[100px] transition-all duration-1000 ease-in-out opacity-40
            ${uiState === 'found' || uiState === 'reading' ? 'bg-emerald-600/30 scale-110' : 
              uiState === 'lost' ? 'bg-orange-600/30 scale-90' : 'bg-blue-600/20'}
        `} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]" />
        
        {/* Particles/Noise Overlay (Optional for texture) */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      {/* Progress Bar (Top) */}
      <div className="w-full fixed top-0 z-50">
        <div className="h-1.5 w-full bg-white/5 backdrop-blur-sm">
          <div 
            className={`h-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-700 ease-out 
                ${uiState === 'found' || uiState === 'reading' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-blue-500'}
            `} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center p-6 mt-6 z-10">
        
        {/* 1. STATUS & PERCENTAGE DISPLAY */}
        <div className="relative w-full h-[200px] flex flex-col items-center justify-center mb-8">
            {/* Animatsiya uchun container */}
            <div className={`absolute transition-all duration-700 ease-out flex flex-col items-center
                ${isReadingMode ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}
            `}>
                {/* --- KITOB NOMI (TEPADA) --- */}
                <div className="flex items-center gap-2 mb-1 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <BookOpen size={14} className="text-emerald-400" />
                    <span className="text-slate-300 text-sm font-medium tracking-wide max-w-[200px] truncate">
                        {bookTitle}
                    </span>
                </div>

                {/* --- KATTA FOIZ --- */}
                <h1 className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-2xl">
                    {mainText}
                </h1>
                
                <p className="text-emerald-400/80 text-sm font-medium mt-2 animate-pulse">
                    Jarayon saqlanmoqda
                </p>
            </div>

            {/* Boshqa holatlar uchun (Kutish, Qidirish, Xato) */}
            <div className={`absolute transition-all duration-500 ease-out flex flex-col items-center text-center
                ${!isReadingMode ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}
            `}>
                <h2 className={`text-4xl font-bold mb-3 transition-colors duration-300
                    ${uiState === 'searching' ? 'text-blue-400' : 
                      uiState === 'lost' ? 'text-orange-500' : 'text-slate-200'}
                `}>
                    {statusMsg}
                </h2>
                <p className="text-slate-400 text-base max-w-[250px] leading-relaxed">
                    {subText}
                </p>
            </div>
        </div>


        {/* 2. MICROPHONE BUTTON */}
        <div className="relative mb-12 group">
            {/* Waves Effect */}
            {isRecording && (
                <>
                    <div className={`absolute inset-0 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-20
                        ${uiState === 'found' || uiState === 'reading' ? 'bg-emerald-500' : 'bg-blue-500'}
                    `} />
                    <div className={`absolute inset-[-12px] rounded-full animate-[spin_3s_linear_infinite] border border-dashed opacity-30
                         ${uiState === 'found' || uiState === 'reading' ? 'border-emerald-400' : 'border-blue-400'}
                    `} />
                </>
            )}
            
            <button
                onClick={toggleRecording}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.3)] transition-all duration-300 active:scale-90 z-20
                    ${isRecording 
                        ? (uiState === 'found' || uiState === 'reading' 
                            ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-emerald-500/30' 
                            : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/30')
                        : 'bg-slate-800/80 border border-white/10 text-slate-400 hover:bg-slate-700 hover:text-white hover:border-white/20'
                    }
                `}
            >
                {uiState === 'found' ? (
                    <CheckCircle2 size={36} className="animate-bounce" />
                ) : isRecording ? (
                    <Activity size={36} className="animate-pulse" />
                ) : (
                    <Mic size={32} />
                )}
            </button>
        </div>


        {/* 3. HINT BOX (Pastki qism) */}
        <div className={`w-full relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-500 ease-out
            ${uiState === 'lost' 
                ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.1)] min-h-[140px]' 
                : 'bg-white/5 border-white/5 min-h-[120px]'
            }
        `}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
            
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                {uiState === 'lost' ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="inline-flex items-center gap-1.5 text-orange-400 text-xs font-bold uppercase tracking-widest">
                            <AlertCircle size={14} /> Diqqat
                        </div>
                        <p className="text-xl text-white font-medium leading-relaxed">
                            {hint || "Matnni davom ettiring..."}
                        </p>
                    </div>
                ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                         {hint ? (
                             <p className="text-xl md:text-2xl text-slate-200 font-light italic leading-relaxed opacity-90">
                                "... {hint} ..."
                             </p>
                         ) : (
                             <div className="flex flex-col items-center gap-2 opacity-40">
                                 {isRecording ? <Sparkles size={24} /> : <WifiOff size={24} />}
                                 <span className="text-sm font-medium">
                                    {isRecording ? "So'zlarni tinglayapman..." : "Mikrofon o'chiq"}
                                 </span>
                             </div>
                         )}
                    </div>
                )}
            </div>
        </div>

      </div>

      <div className="mb-6 opacity-60 hover:opacity-100 transition-opacity">
        <ReaderHelpModal />
      </div>
    </div>
  );
}