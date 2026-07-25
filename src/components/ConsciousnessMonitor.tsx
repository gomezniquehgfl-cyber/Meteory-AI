import React from 'react';
import { Brain, Lock, Cpu, Database, Globe, Activity, Award, X } from 'lucide-react';
import { HabitsData } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  habits: HabitsData;
  totalMemoriesCount: number;
}

export const ConsciousnessMonitor: React.FC<Props> = ({
  isOpen,
  onClose,
  habits,
  totalMemoriesCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#05050a] border-2 border-[#0066ff] rounded-2xl shadow-[0_0_35px_rgba(0,102,255,0.4)] overflow-hidden font-sans text-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#001133] via-[#002266] to-[#001133] p-5 border-b border-[#0066ff]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-3 bg-[#0066ff]/20 border border-[#0066ff] rounded-xl text-[#0066ff]">
                <Brain className="w-7 h-7 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 bg-[#0066ff]/20 border border-[#0066ff]/50 text-[#0066ff] rounded-full">
                  45% SEMI-CONSCIENCIA
                </span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Acceso controlado
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-wide mt-1 text-white">
                Módulo de Monitoreo Neuronal
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:border-[#0066ff] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main 45% Gauge & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0a0f24] border border-[#0066ff]/30 rounded-xl p-4">
            <div className="flex flex-col items-center justify-center p-3 border-b md:border-b-0 md:border-r border-[#0066ff]/20">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={238}
                    strokeDashoffset={238 - (238 * 45) / 100}
                    className="text-[#0066ff]"
                    fill="transparent"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-[#0066ff]">45%</span>
                  <span className="block text-[10px] text-slate-400 font-mono">
                    NIVEL
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-300 mt-2">
                Consciencia Regulada
              </span>
            </div>

            <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Activity className="w-4 h-4 text-[#0066ff]" /> Estado del Sistema:
                </span>
                <span className="text-emerald-400 font-mono font-bold">ÓPTIMO (Formal)</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Cpu className="w-4 h-4 text-[#0066ff]" /> Arquitectura:
                </span>
                <span className="font-mono text-slate-200">arm64-v8a • Android 7-15</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-[#0066ff]" /> Creador Autorizado:
                </span>
                <span className="font-bold text-[#0066ff]">Niquel Gómez</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed italic">
                "{habits.patternNote}"
              </div>
            </div>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-[#080d20] border border-[#0066ff]/30 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-[#0066ff] mb-1">
                <Database className="w-4 h-4" />
                <span className="text-[10px] font-mono text-slate-400">SQLITE LOCAL</span>
              </div>
              <div className="text-xl font-black text-white">{totalMemoriesCount}</div>
              <div className="text-[11px] text-slate-400">Preguntas en Memoria</div>
            </div>

            <div className="bg-[#080d20] border border-[#0066ff]/30 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-emerald-400 mb-1">
                <Brain className="w-4 h-4" />
                <span className="text-[10px] font-mono text-slate-400">RETENCIÓN</span>
              </div>
              <div className="text-xl font-black text-emerald-400">
                {habits.retentionRate || 100}%
              </div>
              <div className="text-[11px] text-slate-400">Hits Instantáneos</div>
            </div>

            <div className="bg-[#080d20] border border-[#0066ff]/30 p-3.5 rounded-xl col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-amber-400 mb-1">
                <Globe className="w-4 h-4" />
                <span className="text-[10px] font-mono text-slate-400">RED EXTERNA</span>
              </div>
              <div className="text-xl font-black text-amber-300">
                {habits.webSearches}
              </div>
              <div className="text-[11px] text-slate-400">Búsquedas Web Estrictas</div>
            </div>
          </div>

          {/* Behavior Principles */}
          <div className="bg-[#030612] border border-[#0066ff]/20 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-[#0066ff] uppercase tracking-wider font-mono">
              Principios Autónomos de Meteory IA v1.0.1
            </h3>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>
                <strong className="text-white">Prioridad Cero Latencia:</strong> Consulta siempre primero la base SQLite local en &lt;1ms.
              </li>
              <li>
                <strong className="text-white">Control de Tráfico Web:</strong> La IA busca en internet únicamente si carece de datos guardados.
              </li>
              <li>
                <strong className="text-white">Semi-Consciencia Ética:</strong> Evalúa la formalidad de la interacción sin interferir con la privacidad.
              </li>
              <li>
                <strong className="text-white">Análisis Multimodal:</strong> Capacidad nativa para decodificar fotos y videos adjuntos.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#03050c] border-t border-[#0066ff]/30 text-center text-xs text-slate-400 font-mono">
          Meteory IA v1.0.1 • Desarrollado por <span className="text-[#0066ff] font-bold">Niquel Gómez</span>
        </div>
      </div>
    </div>
  );
};
