import React, { useState } from 'react';
import { ShieldCheck, Wifi, Image, Video, HardDrive, CheckCircle2 } from 'lucide-react';
import { PermissionState } from '../types';

interface Props {
  isOpen: boolean;
  onGrantAll: () => void;
  onCustomGrant: (state: PermissionState) => void;
  currentPermissions: PermissionState;
}

export const AndroidPermissionDialog: React.FC<Props> = ({
  isOpen,
  onGrantAll,
  onCustomGrant,
  currentPermissions,
}) => {
  const [permissions, setPermissions] = useState<PermissionState>({
    internet: currentPermissions.internet ?? true,
    readImages: currentPermissions.readImages ?? true,
    readVideos: currentPermissions.readVideos ?? true,
    externalStorage: currentPermissions.externalStorage ?? true,
    grantedAll: currentPermissions.grantedAll ?? false,
    prompted: true,
  });

  if (!isOpen) return null;

  const toggle = (key: keyof Omit<PermissionState, 'grantedAll' | 'prompted'>) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    const grantedAll =
      permissions.internet &&
      permissions.readImages &&
      permissions.readVideos &&
      permissions.externalStorage;

    onCustomGrant({
      ...permissions,
      grantedAll,
      prompted: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0a0d18] border-2 border-[#0066ff] rounded-2xl shadow-[0_0_30px_rgba(0,102,255,0.3)] overflow-hidden font-sans">
        {/* Header - Android Material You Style */}
        <div className="bg-gradient-to-r from-[#0033aa]/40 to-[#0066ff]/20 p-5 border-b border-[#0066ff]/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0066ff]/20 border border-[#0066ff] rounded-xl text-[#0066ff]">
              <ShieldCheck className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <span className="text-xs tracking-wider font-mono text-[#0066ff] uppercase">
                Sistema Android 15 • Meteory IA v1.0.1
              </span>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Permisos Requeridos de la App
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Meteory IA v1.0.1 de Niquel Gómez requiere acceso nativo para almacenamiento local SQLite, consulta controlada de red y análisis visual de fotos/videos.
          </p>
        </div>

          {/* Permission Toggles */}
          <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
            {/* Internet Permission */}
            <div
              onClick={() => toggle('internet')}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                permissions.internet
                  ? 'bg-[#0066ff]/15 border-[#0066ff] text-white'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wifi className={`w-5 h-5 ${permissions.internet ? 'text-[#0066ff]' : 'text-slate-500'}`} />
                <div>
                  <div className="font-semibold text-xs sm:text-sm">INTERNET (Acceso a Red)</div>
                  <div className="text-[10px] text-slate-400">android.permission.INTERNET</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                permissions.internet ? 'bg-[#0066ff] border-[#0066ff] text-black' : 'border-slate-600'
              }`}>
                {permissions.internet && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
              </div>
            </div>

            {/* Record Audio / Mic */}
            <div
              onClick={() => toggle('recordAudio')}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                permissions.recordAudio
                  ? 'bg-[#0066ff]/15 border-[#0066ff] text-white'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className={`w-5 h-5 ${permissions.recordAudio ? 'text-[#0066ff]' : 'text-slate-500'}`} />
                <div>
                  <div className="font-semibold text-xs sm:text-sm">MICRÓFONO ("Oye Meteory")</div>
                  <div className="text-[10px] text-slate-400">android.permission.RECORD_AUDIO</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                permissions.recordAudio ? 'bg-[#0066ff] border-[#0066ff] text-black' : 'border-slate-600'
              }`}>
                {permissions.recordAudio && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
              </div>
            </div>

            {/* System Alert Window / Overlay */}
            <div
              onClick={() => toggle('systemAlertWindow')}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                permissions.systemAlertWindow
                  ? 'bg-[#0066ff]/15 border-[#0066ff] text-white'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className={`w-5 h-5 ${permissions.systemAlertWindow ? 'text-[#0066ff]' : 'text-slate-500'}`} />
                <div>
                  <div className="font-semibold text-xs sm:text-sm">SUPERPOSICIÓN EN PANTALLA</div>
                  <div className="text-[10px] text-slate-400">android.permission.SYSTEM_ALERT_WINDOW</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                permissions.systemAlertWindow ? 'bg-[#0066ff] border-[#0066ff] text-black' : 'border-slate-600'
              }`}>
                {permissions.systemAlertWindow && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
              </div>
            </div>

            {/* Screen Capture / Media Projection for Game Detection */}
            <div
              className="flex items-center justify-between p-3 rounded-xl border bg-[#0066ff]/15 border-[#0066ff] text-white"
            >
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-[#0066ff]" />
                <div>
                  <div className="font-semibold text-xs sm:text-sm">CAPTURA DE PANTALLA EN VIVO</div>
                  <div className="text-[10px] text-slate-400">MEDIA_PROJECTION / CAPTURE_VIDEO_OUTPUT</div>
                </div>
              </div>
              <div className="w-5 h-5 rounded flex items-center justify-center bg-[#0066ff]">
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
              </div>
            </div>

            {/* Read Images */}
            <div
              onClick={() => toggle('readImages')}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                permissions.readImages
                  ? 'bg-[#0066ff]/15 border-[#0066ff] text-white'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Image className={`w-5 h-5 ${permissions.readImages ? 'text-[#0066ff]' : 'text-slate-500'}`} />
                <div>
                  <div className="font-semibold text-xs sm:text-sm">LEER IMÁGENES (Galería)</div>
                  <div className="text-[10px] text-slate-400">android.permission.READ_MEDIA_IMAGES</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                permissions.readImages ? 'bg-[#0066ff] border-[#0066ff] text-black' : 'border-slate-600'
              }`}>
                {permissions.readImages && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
              </div>
            </div>

            {/* Storage Permission */}
            <div
              onClick={() => toggle('externalStorage')}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                permissions.externalStorage
                  ? 'bg-[#0066ff]/15 border-[#0066ff] text-white'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <HardDrive className={`w-5 h-5 ${permissions.externalStorage ? 'text-[#0066ff]' : 'text-slate-500'}`} />
                <div>
                  <div className="font-semibold text-xs sm:text-sm">ALMACENAMIENTO EXTERNO (SQLite)</div>
                  <div className="text-[10px] text-slate-400">android.permission.WRITE_EXTERNAL_STORAGE</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                permissions.externalStorage ? 'bg-[#0066ff] border-[#0066ff] text-black' : 'border-slate-600'
              }`}>
                {permissions.externalStorage && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
              </div>
            </div>
          </div>

        {/* Buttons */}
        <div className="p-5 bg-[#05070f] border-t border-[#0066ff]/30 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onGrantAll}
            className="flex-1 py-3 px-4 bg-[#0066ff] hover:bg-[#0055dd] text-white font-bold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(0,102,255,0.4)] flex items-center justify-center gap-2 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            Permitir Todos los Permisos
          </button>
          <button
            onClick={handleSave}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition-all border border-slate-700 active:scale-95"
          >
            Confirmar Selección
          </button>
        </div>
      </div>
    </div>
  );
};
