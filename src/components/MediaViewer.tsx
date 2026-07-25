import React from 'react';
import { X } from 'lucide-react';

interface Props {
  url: string | null;
  type: 'image' | 'video' | null;
  onClose: () => void;
}

export const MediaViewer: React.FC<Props> = ({ url, type, onClose }) => {
  if (!url || !type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 bg-[#0a0f24] text-white border border-[#0066ff] rounded-xl hover:bg-[#0066ff] transition-all shadow-[0_0_15px_#0066ff]"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border-2 border-[#0066ff] bg-[#05050a] flex items-center justify-center p-2 shadow-[0_0_40px_rgba(0,102,255,0.4)]">
        {type === 'image' ? (
          <img
            src={url}
            alt="Visor de medios"
            className="max-w-full max-h-[80vh] object-contain rounded-xl"
          />
        ) : (
          <video
            src={url}
            controls
            autoPlay
            className="max-w-full max-h-[80vh] object-contain rounded-xl"
          />
        )}
      </div>
    </div>
  );
};
