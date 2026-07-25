import React from 'react';
import { ChatMessage } from '../types';
import { Database, Globe, Bot, User, Image as ImageIcon, Video, ExternalLink, Cpu } from 'lucide-react';

interface Props {
  message: ChatMessage;
  onPreviewAttachment?: (url: string, type: 'image' | 'video') => void;
}

export const ChatMessageItem: React.FC<Props> = ({ message, onPreviewAttachment }) => {
  const isUser = message.sender === 'user';

  return (
    <div
      className={`flex flex-col my-3.5 max-w-[88%] ${
        isUser ? 'ml-auto items-end' : 'mr-auto items-start'
      } animate-in fade-in slide-in-from-bottom-2 duration-200`}
    >
      {/* Sender Header */}
      <div className="flex items-center gap-1.5 mb-1 px-1 text-xs font-mono">
        {isUser ? (
          <>
            <span className="text-slate-300 font-semibold">Tú</span>
            <User className="w-3.5 h-3.5 text-[#0066ff]" />
          </>
        ) : (
          <>
            <Bot className="w-3.5 h-3.5 text-[#0066ff]" />
            <span className="text-[#0066ff] font-bold">Meteory IA v1.0.1</span>
            <span className="text-[10px] text-slate-400">by Niquel Gómez</span>
          </>
        )}
      </div>

      {/* Bubble Container */}
      <div
        className={`p-4 rounded-2xl border text-sm leading-relaxed ${
          isUser
            ? 'bg-[#0033aa]/20 border-[#0066ff] text-white shadow-[0_0_15px_rgba(0,102,255,0.15)] rounded-tr-xs'
            : 'bg-[#060a17] border-[#0066ff]/60 text-slate-100 shadow-[0_0_20px_rgba(0,102,255,0.2)] rounded-tl-xs'
        }`}
      >
        {/* Source Badge (For IA Responses) */}
        {!isUser && message.source && (
          <div className="mb-2.5 pb-2 border-b border-[#0066ff]/20 flex flex-wrap items-center gap-2 text-xs font-mono">
            {message.source === 'memory' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-bold">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                ⚡ Resuelto desde Memoria SQLite (0ms)
              </span>
            )}
            {message.source === 'public_web' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0066ff]/20 border border-[#0066ff]/60 text-[#0066ff] font-semibold">
                <Globe className="w-3.5 h-3.5" />
                🌐 Consulta de Red Pública Realizada
              </span>
            )}
            {message.source === 'rules' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-semibold">
                <Cpu className="w-3.5 h-3.5" />
                🧠 Procesamiento Neuronal Local
              </span>
            )}
            {message.matchedQuery && (
              <span className="text-[11px] text-slate-400 italic">
                (Coincidencia guardada previamente)
              </span>
            )}
          </div>
        )}

        {/* Media Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                onClick={() => onPreviewAttachment && onPreviewAttachment(att.dataUrl, att.type)}
                className="relative group border border-[#0066ff]/40 rounded-xl overflow-hidden bg-black/60 cursor-pointer hover:border-[#0066ff] transition-all max-w-[200px]"
              >
                {att.type === 'image' ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="max-h-40 object-cover w-full group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <video
                    src={att.dataUrl}
                    className="max-h-40 object-cover w-full"
                    controls={false}
                  />
                )}
                <div className="p-1.5 bg-black/80 backdrop-blur-xs text-[10px] text-slate-300 font-mono truncate flex items-center justify-between">
                  <span className="truncate flex items-center gap-1">
                    {att.type === 'image' ? (
                      <ImageIcon className="w-3 h-3 text-[#0066ff]" />
                    ) : (
                      <Video className="w-3 h-3 text-[#0066ff]" />
                    )}
                    {att.name}
                  </span>
                  <span className="text-slate-400">{att.sizeFormatted}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Text Content */}
        <div className="whitespace-pre-wrap font-sans space-y-2">
          {message.text}
        </div>

        {/* Web Search Sources / Grounding Links */}
        {!isUser && message.searchSources && message.searchSources.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-[#0066ff]/30 text-xs">
            <span className="text-[#0066ff] font-mono font-bold block mb-1">
              Fuentes consultadas en red pública:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {message.searchSources.map((src, i) => (
                <a
                  key={i}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#0066ff]/10 hover:bg-[#0066ff]/30 border border-[#0066ff]/40 rounded-md text-[11px] text-[#0066ff] hover:text-white transition-all truncate max-w-[220px]"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{src.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`text-[10px] font-mono mt-2 text-right ${
            isUser ? 'text-slate-300' : 'text-slate-400'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};
