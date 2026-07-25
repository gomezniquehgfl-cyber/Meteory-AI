import React from 'react';
import {
  MessageSquare,
  Code,
  Clock,
  Key,
  Sparkles,
  Settings,
  Lock,
  X,
  Bot,
  Brain,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { ApiKeyInfo } from '../types';

interface Props {
  isOpen: boolean;
  activeView: string;
  onSelectView: (view: string) => void;
  onClose: () => void;
  apiKeyInfo: ApiKeyInfo;
}

export const SidebarDrawer: React.FC<Props> = ({
  isOpen,
  activeView,
  onSelectView,
  onClose,
  apiKeyInfo,
}) => {
  if (!isOpen) return null;

  const menuItems = [
    { id: 'chat', label: '💬 Chat Conversacional', icon: MessageSquare },
    { id: 'code', label: '💻 Ejecutar Código', icon: Code },
    { id: 'alarms', label: '⏰ Mis Alarmas & Recordatorios', icon: Clock },
    { id: 'apikey', label: '🔑 Clave API Local & Usos', icon: Key },
    { id: 'pro', label: '✨ Activar MODO PRO (3 USD)', icon: Sparkles, highlight: true },
    { id: 'settings', label: '⚙️ Ajustes de Voz & Superposición', icon: Settings },
    { id: 'admin', label: '🔒 Panel Admin (Niquel Gómez)', icon: Lock },
  ];

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-out Panel */}
      <div className="relative w-80 max-w-[85vw] bg-[#030612] border-r-2 border-[#0066ff]/50 h-full p-5 flex flex-col justify-between text-slate-100 shadow-[0_0_50px_rgba(0,102,255,0.3)] z-10">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#0066ff]/30 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0066ff] to-cyan-500 p-0.5 shadow-[0_0_15px_rgba(0,102,255,0.5)]">
                <div className="w-full h-full bg-[#050814] rounded-[14px] flex items-center justify-center text-[#0066ff]">
                  <Bot className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h2 className="font-extrabold text-base tracking-wider text-white">
                  METEORY IA <span className="text-[10px] text-[#0066ff] font-mono">v1.0.1</span>
                </h2>
                <p className="text-[11px] text-slate-400">Creador: Niquel Gómez</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Indicator */}
          <div className="p-3 bg-[#080d22] border border-[#0066ff]/30 rounded-2xl mb-5 text-xs font-mono space-y-1">
            <div className="flex justify-between items-center text-slate-300">
              <span>Semi-Consciencia:</span>
              <span className="text-[#0066ff] font-bold">45% Activo</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Estado Clave:</span>
              {apiKeyInfo.isPro ? (
                <span className="text-emerald-400 font-bold">MODO PRO (Ilimitado)</span>
              ) : (
                <span className="text-[#0066ff] font-bold">{apiKeyInfo.usesLeft} / 3 Usos</span>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-2xl text-xs font-medium transition flex items-center justify-between ${
                    item.highlight
                      ? 'bg-gradient-to-r from-[#0066ff]/20 to-cyan-500/20 border border-[#0066ff] text-cyan-300 hover:brightness-125 font-bold shadow-[0_0_15px_rgba(0,102,255,0.2)]'
                      : isActive
                      ? 'bg-[#0066ff] text-white font-bold shadow-[0_0_20px_rgba(0,102,255,0.4)]'
                      : 'text-slate-300 hover:bg-[#080e26] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800/80 pt-4 text-[11px] text-slate-400 space-y-1 text-center font-mono">
          <p>🔒 SQLite Local + Búsqueda Web</p>
          <p className="text-[10px] text-slate-500">Android arm64-v8a • Sin Claves API</p>
        </div>
      </div>
    </div>
  );
};
