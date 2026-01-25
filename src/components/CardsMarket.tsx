'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, X } from 'lucide-react';
import { ReaderHelpModal } from './reader-help-modal';

interface ServerData {
  status: 'searching' | 'ready' | 'reading' | 'error';
  msg?: string;
  page?: number;
  hint?: string;
  percent?: number;
  book_title?: string;
}


export function AIReader() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Kutish...');
  const [subStatus, setSubStatus] = useState('Mikrofonni yoqing va kitob nomini ayting');
  const [hint, setHint] = useState("O'qilayotgan joydan keyingi so'zlar bu yerda chiqadi...");
  const [progress, setProgress] = useState(0);
  const [bookTitle, setBookTitle] = useState('');
  const [statusColor, setStatusColor] = useState('text-blue-400');
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const isRecordingRef = useRef(false);

  // WebSocket ulanishi
  const connectWebSocket = () => {
    if (!accessToken) {
      console.log('[v0] AccessToken topilmadi');
      setStatus('Xatolik');
      setStatusColor('text-red-400');
      setSubStatus('Autentifikatsiya kerak. Iltimos qayta kirish');
      return;
    }

    const wsUrl = `ws://127.0.0.1:8001/ws/read/${accessToken}`;
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
        setSubStatus(data.msg || '');
        break;
      case 'reading':
        setStatus(`Sahifa: ${data.page}`);
        setStatusColor('text-blue-400');
        setHint(`... ${data.hint} ...`);
        if (data.percent) {
          setProgress(data.percent);
        }
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
    setBookTitle('');

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
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />

      {/* Book Title Header */}
      {bookTitle && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-900/80 to-transparent backdrop-blur-md border-b border-blue-500/20 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-300 truncate">
              📖 {bookTitle}
            </h2>
            <button
              onClick={stopRecording}
              className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-red-400"
              aria-label="Sessiyani yopish"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Status Container */}
      <div className={`w-full max-w-md mb-8 sm:mb-10 lg:mb-12 text-center ${bookTitle ? 'mt-24' : ''} relative z-10`}>
        <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 transition-colors duration-300 ${statusColor}`}>
          {status}
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-blue-200/70">{subStatus}</p>
      </div>

      {/* Microphone Button with Shazam Animation */}
      <button
        onClick={toggleRecording}
        className={`relative mb-8 sm:mb-10 lg:mb-12 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full ${
          isRecording ? 'scale-100' : 'scale-95 hover:scale-100'
        }`}
        aria-label={isRecording ? 'Mikrofonni to\'xtatish' : 'Mikrofonni yoqish'}
        type="button"
      >
        {/* Shazam Wave Animation */}
        {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-shazam-wave" />
            <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-shazam-wave" style={{ animationDelay: '0.3s' }} />
            <div className="absolute inset-0 rounded-full bg-cyan-400/10 animate-shazam-wave" style={{ animationDelay: '0.6s' }} />
          </>
        )}

        {/* Shazam Bars Background */}
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1.5 bg-gradient-to-t from-cyan-400 to-blue-500 rounded-full animate-shazam-bar"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  height: '60px',
                }}
              />
            ))}
          </div>
        )}

        {/* Main Button */}
        <div
          className={`relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 z-10 ${
            isRecording
              ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 shadow-blue-600/60'
              : 'bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 shadow-blue-500/40 hover:shadow-blue-400/60'
          }`}
        >
          {isRecording ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                <Mic className="w-12 h-12 sm:w-14 sm:h-14 text-white" strokeWidth={1.5} />
              </div>
              <span className="text-sm sm:text-base font-semibold text-white">Stop</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Mic className="w-16 h-16 sm:w-20 sm:h-20 text-white" strokeWidth={1} />
              <span className="text-sm sm:text-base font-semibold text-white">Boshlash</span>
            </div>
          )}
        </div>
      </button>

      {/* Hint Box */}
      <div className="w-full max-w-3xl px-4 sm:px-6 py-6 sm:py-8 bg-blue-950/40 border border-blue-400/30 rounded-2xl backdrop-blur-lg relative z-10">
        <p className="text-lg sm:text-xl lg:text-2xl text-blue-100/80 italic text-center leading-relaxed font-light">
          {hint}
        </p>
      </div>

      {/* Status Indicator Dots */}
      <div className="mt-10 sm:mt-12 flex gap-3 justify-center relative z-10">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              isRecording ? 'bg-blue-400 scale-125 shadow-lg shadow-blue-400' : 'bg-blue-600'
            }`}
          />
          <span className="text-xs sm:text-sm text-blue-300">
            {isRecording ? 'Eshityapman' : 'Tayyor'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              socketRef.current?.readyState === WebSocket.OPEN ? 'bg-emerald-400 shadow-lg shadow-emerald-400' : 'bg-slate-600'
            }`}
          />
          <span className="text-xs sm:text-sm text-blue-300">
            {socketRef.current?.readyState === WebSocket.OPEN ? 'Ulanib' : 'Disconnected'}
          </span>
        </div>
      </div>
     <ReaderHelpModal />
    </div>
  );
}
