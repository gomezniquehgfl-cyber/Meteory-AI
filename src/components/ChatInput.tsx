import React, { useRef, useState } from 'react';
import { Paperclip, Send, X, Video, Lock, AlertCircle } from 'lucide-react';
import { MediaAttachment } from '../types';

interface Props {
  onSendMessage: (text: string, attachments: MediaAttachment[]) => void;
  disabled: boolean;
  onOpenPermissionPrompt: () => void;
  hasPermissions: boolean;
}

export const ChatInput: React.FC<Props> = ({
  onSendMessage,
  disabled,
  onOpenPermissionPrompt,
  hasPermissions,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        alert('Solo se admiten archivos de FOTO o VIDEO.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAttachment: MediaAttachment = {
          id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          name: file.name,
          mimeType: file.type,
          type: isImage ? 'image' : 'video',
          dataUrl,
          sizeFormatted: formatFileSize(file.size),
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && attachments.length === 0) || disabled) return;

    onSendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);
  };

  return (
    <div className="p-3 sm:p-4 bg-[#05050a] border-t-2 border-[#0066ff]/40 shadow-[0_-5px_25px_rgba(0,102,255,0.15)] font-sans">
      {/* Permanent Unified System Banner */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-2 text-xs font-mono px-1">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-[#0066ff]/20 border-[#0066ff] text-[#0066ff] font-bold shadow-[0_0_12px_rgba(0,102,255,0.3)]">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>🔒 SISTEMA: MEMORIA LOCAL + BÚSQUEDA WEB AUTOMÁTICA</span>
        </div>

        {!hasPermissions && (
          <button
            onClick={onOpenPermissionPrompt}
            className="flex items-center gap-1 text-amber-400 hover:underline"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Permisos Android pendientes</span>
          </button>
        )}
      </div>

      {/* Attachment Previews Bar */}
      {attachments.length > 0 && (
        <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto pb-2.5 mb-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative group bg-[#0a0f24] border border-[#0066ff] rounded-xl p-1.5 flex items-center gap-2 shrink-0 max-w-[200px]"
            >
              {att.type === 'image' ? (
                <img
                  src={att.dataUrl}
                  alt={att.name}
                  className="w-10 h-10 object-cover rounded-lg border border-[#0066ff]/40"
                />
              ) : (
                <div className="w-10 h-10 bg-[#0066ff]/20 rounded-lg flex items-center justify-center border border-[#0066ff]/40 text-[#0066ff]">
                  <Video className="w-5 h-5" />
                </div>
              )}
              <div className="overflow-hidden text-[11px] font-mono">
                <div className="text-white truncate max-w-[100px] font-semibold">{att.name}</div>
                <div className="text-slate-400 text-[10px]">{att.sizeFormatted}</div>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="p-1 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors border border-red-500/40"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form Input */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center gap-2">
        {/* Gallery File Input Hidden */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          multiple
          className="hidden"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Adjuntar fotos y videos de la galería"
          className="p-3 bg-[#0a0f24] hover:bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff] rounded-xl transition-all disabled:opacity-50 active:scale-95 shadow-[0_0_12px_rgba(0,102,255,0.2)] shrink-0 flex items-center justify-center"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text Field */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje para Meteory IA v1.0.1..."
          disabled={disabled}
          className="flex-1 bg-[#030612] border-2 border-[#0066ff]/70 focus:border-[#0066ff] focus:outline-none focus:ring-2 focus:ring-[#0066ff]/50 text-white placeholder-slate-500 px-4 py-3 rounded-xl text-sm font-sans transition-all"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={disabled || (!text.trim() && attachments.length === 0)}
          className="py-3 px-5 bg-[#0066ff] hover:bg-[#0055dd] disabled:opacity-40 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,102,255,0.5)] active:scale-95 shrink-0 flex items-center gap-2"
        >
          <span className="hidden sm:inline text-xs uppercase font-mono tracking-wider">Enviar</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
