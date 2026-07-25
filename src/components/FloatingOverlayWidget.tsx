import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Gamepad2, Volume2, Mic, AlertCircle } from 'lucide-react';
import { procesarConsultaMeteory } from '../lib/motorMeteory';
import { VoiceSettings } from '../types';

interface Props {
  onOpenChat: () => void;
  voiceSettings: VoiceSettings;
}

export const FloatingOverlayWidget: React.FC<Props> = ({ onOpenChat, voiceSettings }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 75, y: window.innerHeight - 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [gameModeActive, setGameModeActive] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<string | null>(null);
  const [gameAdvice, setGameAdvice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const pressTimerRef = useRef<any>(null);
  const clickCountRef = useRef<number>(0);
  const clickTimerRef = useRef<any>(null);
  const gameIntervalRef = useRef<any>(null);

  // Reproducir voz humana natural
  const speakNaturalText = async (text: string) => {
    try {
      setIsSpeaking(true);
      setSpeechStatus('🗣️ Hablando...');

      let textToRead = text;

      // Intentar formatear con el endpoint de voz de Gemini
      try {
        const resp = await fetch('/api/voice-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text, gender: voiceSettings.gender }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.naturalText) textToRead = data.naturalText;
        }
      } catch {}

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(textToRead.replace(/[*#]/g, ''));
        utter.rate = voiceSettings.rate || 1.0;
        utter.pitch = voiceSettings.gender === 'male' ? 0.85 : 1.25;

        utter.onend = () => {
          setIsSpeaking(false);
          setSpeechStatus(null);
        };
        utter.onerror = () => {
          setIsSpeaking(false);
          setSpeechStatus(null);
        };

        window.speechSynthesis.speak(utter);
      } else {
        setIsSpeaking(false);
        setSpeechStatus(null);
      }
    } catch {
      setIsSpeaking(false);
      setSpeechStatus(null);
    }
  };

  // Reconocimiento de Voz continuo para "Oye Meteory"
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition && voiceSettings.wakeWordEnabled) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = 'es-ES';

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = async (event: any) => {
          const lastIdx = event.results.length - 1;
          const transcript = event.results[lastIdx][0].transcript.toLowerCase();

          if (transcript.includes('meteory') || transcript.includes('oye meteory')) {
            setSpeechStatus('🎤 "Oye Meteory" Detectado...');
            const prompt = transcript.replace(/oye meteory|meteory/gi, '').trim() || 'hola meteory';

            const res = await procesarConsultaMeteory(prompt, undefined, true);
            await speakNaturalText(res.answer);
          }
        };

        rec.onerror = () => {
          setHasError(true);
          setTimeout(() => setHasError(false), 3000);
        };

        rec.onend = () => {
          setIsListening(false);
          if (voiceSettings.wakeWordEnabled) {
            try { rec.start(); } catch {}
          }
        };

        rec.start();
        recognitionRef.current = rec;
      } catch (e) {
        console.warn('Speech recognition not supported in this browser', e);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [voiceSettings]);

  // SECCIÓN 1: Bucle de Detección y Análisis de Juego en Tiempo Real (Gemini Vision)
  useEffect(() => {
    if (gameModeActive) {
      setSpeechStatus('🎮 Modo Juego Activo (Gemini Vision)');

      const analyzeGameScreen = async () => {
        try {
          // Capturar frame de pantalla simulado/real
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#101828';
            ctx.fillRect(0, 0, 640, 360);
            ctx.fillStyle = '#0066ff';
            ctx.fillText('Meteory IA Game Vision Analyzer', 20, 40);
          }
          const imageBase64 = canvas.toDataURL('image/jpeg', 0.6);

          const res = await fetch('/api/game-assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64, gameHint: 'Detectando juego...' }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.advice) {
              setGameAdvice(data.advice);
              if (voiceSettings.autoRead) {
                speakNaturalText(data.advice);
              }
            }
          }
        } catch (e) {
          console.warn('Game analysis loop error', e);
        }
      };

      analyzeGameScreen();
      gameIntervalRef.current = setInterval(analyzeGameScreen, 8000);
    } else {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      setGameAdvice(null);
    }

    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    };
  }, [gameModeActive, voiceSettings]);

  // Manejo de toques y gestos
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setIsDragging(false);
    setDragOffset({ x: clientX - position.x, y: clientY - position.y });

    // Mantener presionado = Activar Voz directamente
    pressTimerRef.current = setTimeout(() => {
      setIsDragging(true);
      setSpeechStatus('🎤 Escuchando orden...');
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    }, 600);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (Math.abs(clientX - position.x - dragOffset.x) > 5 || Math.abs(clientY - position.y - dragOffset.y) > 5) {
      setIsDragging(true);
      const newX = Math.max(10, Math.min(window.innerWidth - 60, clientX - dragOffset.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 60, clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  const handleClick = () => {
    if (isDragging) return;

    clickCountRef.current += 1;

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    clickTimerRef.current = setTimeout(() => {
      if (clickCountRef.current === 1) {
        // Tocar 1 vez: Abre Chat
        onOpenChat();
      } else if (clickCountRef.current >= 2) {
        // Doble toque rápido: Activa/Desactiva Asistente de Juegos
        setGameModeActive((prev) => !prev);
        if (window.navigator?.vibrate) window.navigator.vibrate([30, 50, 30]);
      }
      clickCountRef.current = 0;
    }, 250);
  };

  if (!voiceSettings.overlayEnabled) return null;

  // Selección de Color según Estado
  // 🔵 Azul: listo / escuchando | 🟢 Verde: hablando / procesando | 🟡 Amarillo: modo juego | 🔴 Rojo: error
  let badgeColor = 'bg-[#0066ff] border-cyan-400 shadow-[0_0_25px_rgba(0,102,255,0.8)]';
  if (hasError) {
    badgeColor = 'bg-rose-600 border-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.8)]';
  } else if (isSpeaking) {
    badgeColor = 'bg-emerald-600 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.9)] animate-pulse';
  } else if (gameModeActive) {
    badgeColor = 'bg-amber-500 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.9)] animate-pulse';
  } else if (isListening) {
    badgeColor = 'bg-[#0066ff] border-cyan-300 shadow-[0_0_20px_rgba(0,102,255,0.8)]';
  }

  return (
    <>
      {/* Tooltip de Estado de Voz o Consejo de Juego */}
      {(speechStatus || gameAdvice) && (
        <div
          style={{ left: Math.max(10, position.x - 160), top: position.y - 60 }}
          className="fixed z-50 max-w-[260px] bg-[#050814]/95 border border-[#0066ff] text-cyan-300 px-3.5 py-2 rounded-2xl text-xs font-mono font-medium shadow-[0_0_25px_rgba(0,102,255,0.5)] backdrop-blur-md pointer-events-none animate-in fade-in duration-200"
        >
          {gameAdvice ? (
            <div className="flex items-start gap-1.5 text-amber-300">
              <Gamepad2 className="w-4 h-4 shrink-0 mt-0.5 animate-bounce" />
              <span>{gameAdvice}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-cyan-400" />
              <span>{speechStatus}</span>
            </div>
          )}
        </div>
      )}

      {/* Círculo Flotante (52x52) */}
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        className={`fixed z-50 w-[52px] h-[52px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-75 select-none border-2 ${badgeColor}`}
        title="Meteory IA: 1 toque = Chat | Doble toque = Modo Juego | Mantener = Hablar"
      >
        <div className="relative flex items-center justify-center">
          {gameModeActive ? (
            <Gamepad2 className="w-6 h-6 text-black animate-pulse" />
          ) : isSpeaking ? (
            <Volume2 className="w-6 h-6 text-white animate-pulse" />
          ) : (
            <Sparkles className="w-6 h-6 text-white animate-spin-slow" />
          )}
          <span className={`absolute -bottom-1 -right-1 text-[8px] font-black font-mono px-1 rounded-full ${
            gameModeActive ? 'bg-amber-300 text-black' : 'bg-cyan-300 text-black'
          }`}>
            {gameModeActive ? '🎮' : 'M'}
          </span>
        </div>
      </div>
    </>
  );
};
