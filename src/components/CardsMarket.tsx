'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, X, AlertCircle, BookOpen, Activity, Volume2 } from 'lucide-react';
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
  const [statusColor, setStatusColor] = useState('text-slate-400');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const isRecordingRef = useRef(false);

  // Vibratsiya va Shake funksiyasi
  const triggerFeedback = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const connectWebSocket = () => {
    if (!accessToken) return;

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
        setStatus('Qidirilmoqda...');
        setStatusColor('text-blue-400');
        setSubStatus(data.msg || '');
        break;
      
      case 'ready':
        // --- MUHIM O'ZGARISH ---
        // Kitob topilishi bilan eski foiz va hintni darhol ko'rsatamiz
        setStatus(data.percent !== undefined ? `${data.percent}%` : '0%');
        setStatusColor('text-emerald-400');
        
        if (data.book_title) setBookTitle(data.book_title);
        if (data.hint) setHint(`... ${data.hint} ...`); // Eski hintni chiqaramiz
        if (data.percent) setProgress(data.percent); // Progress barni to'ldiramiz
        
        setSubStatus("Davom eting, eshityapman...");
        break;
      
      case 'reading':
        const percentDisplay = data.percent !== undefined ? `${data.percent}%` : '0%';
        setStatus(percentDisplay);
        setStatusColor('text-blue-400');
        setHint(`... ${data.hint} ...`);
        setRecoveryHint('');
        if (data.percent) setProgress(data.percent);
        break;
      
      case 'lost':
        setStatus("Diqqat!");
        setStatusColor('text-amber-500');
        setSubStatus("Matndan chetlashdingiz");
        setRecoveryHint(data.recovery_hint || '');
        triggerFeedback();
        break;
      
      case 'error':
        setStatus('Xatolik');
        setStatusColor('text-red-400');
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
        for (let i = 0; i < inputData.length; i++) pcmData[i] = Math.min(1, inputData[i]) * 0x7fff;
        if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(pcmData.buffer);
      };

      setIsRecording(true);
      setStatus('Eshityapman...');
      setStatusColor('text-blue-400');
    } catch (err) {
      alert('Mikrofonga ruxsat bering!');
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setStatus('To\'xtatildi');
    setStatusColor('text-slate-400');
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const toggleRecording = () => isRecording ? stopRecording() : startRecording();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) setAccessToken(token);
  }, []);

  useEffect(() => {
    if (accessToken) connectWebSocket();
    return () => stopRecording();
  }, [accessToken]);

  return (
    <div className={`min-h-screen bg-[#0f172a] flex flex-col items-center relative overflow-hidden font-sans transition-colors duration-300 ${isShaking ? 'bg-red-950/30' : ''}`}>
      
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[80px]" />
      </div>

      {/* Top Bar */}
      <div className="w-full fixed top-0 z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5">
        <div className="h-1 w-full bg-slate-800">
          <div className="h-full bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
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

      {/* Main Content */}
      <div className={`flex-1 w-full max-w-lg flex flex-col items-center justify-center p-6 mt-10 transition-transform duration-100 ${isShaking ? 'translate-x-[-5px]' : ''} ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        
        {/* Status Text */}
        <div className="text-center mb-10 min-h-[120px] flex flex-col justify-center">
            <h1 className={`text-5xl md:text-6xl font-bold tracking-tight mb-2 transition-colors ${statusColor}`}>
                {status}
            </h1>
            <p className="text-slate-400 text-lg animate-pulse-slow">{subStatus}</p>
        </div>

        {/* Mic Button */}
        <div className="relative mb-12 group">
            {isRecording && (
                <>
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    <div className="absolute inset-[-15px] border border-blue-500/30 rounded-full animate-[spin_4s_linear_infinite]" />
                </>
            )}
            
            <button
                onClick={toggleRecording}
                className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-95 touch-manipulation
                    ${isRecording 
                        ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/40' 
                        : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                    }
                    ${status === 'Diqqat!' ? 'bg-red-600 animate-pulse' : ''}
                `}
            >
                {isRecording ? <Activity size={40} /> : <Mic size={32} />}
            </button>
        </div>

        {/* Hint Box */}
        <div className={`w-full p-6 rounded-3xl border backdrop-blur-sm transition-all duration-300 min-h-[160px] flex flex-col justify-center items-center text-center
            ${recoveryHint 
                ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
                : 'bg-slate-800/40 border-white/5'
            }
        `}>
            {recoveryHint ? (
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
                        <AlertCircle size={12} /> Adashdingiz
                    </div>
                    <p className="text-2xl text-white font-medium leading-snug">
                        "{recoveryHint}"
                    </p>
                    <p className="text-sm text-red-200/60">Shu so'zdan davom eting</p>
                </div>
            ) : (
                <>
                  <Volume2 size={24} className="text-slate-500 mb-2 opacity-50" />
                  <p className="text-xl md:text-2xl text-slate-200/80 italic font-light leading-relaxed">
                      {hint}
                  </p>
                </>
            )}
        </div>

      </div>

      <div className="mb-8"><ReaderHelpModal /></div>
      
      <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px) rotate(-1deg); }
            75% { transform: translateX(5px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
}