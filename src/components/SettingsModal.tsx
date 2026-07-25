import React, { useState } from 'react';
import { Volume2, Mic, Eye, ShieldCheck, Sparkles, X, VolumeX, User } from 'lucide-react';
import { VoiceSettings } from '../types';
import { localDB } from '../lib/db';

interface Props {
  voiceSettings: VoiceSettings;
  onUpdateVoiceSettings: (settings: VoiceSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({
  voiceSettings,
  onUpdateVoiceSettings,
  onClose,
}) => {
  const [settings, setSettings] = useState<VoiceSettings>(voiceSettings);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const handleSave = async (updated: VoiceSettings) => {
    setSettings(updated);
    await localDB.saveVoiceSettings(updated);
    onUpdateVoiceSettings(updated);
  };

  const playTestVoice = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    setIsPlayingTest(true);
    const text =
      settings.gender === 'male'
        ? 'Hola, soy la voz masculina de Meteory IA. Procesando tu información de forma natural y fluida.'
        : 'Hola, soy la voz femenina de Meteory IA. Ajustada con tono cálido, dulce y alta calidad natural.';

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = settings.rate;
    utter.pitch = settings.gender === 'male' ? 0.8 : 1.25;
    utter.volume = 1.0;

    utter.onend = () => setIsPlayingTest(false);
    utter.onerror = () => setIsPlayingTest(false);

    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#050814] border-2 border-[#0066ff] rounded-3xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(0,102,255,0.3)] text-slate-100 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff] rounded-2xl shadow-[0_0_15px_rgba(0,102,255,0.4)]">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Ajustes de Voz & Superposición</h2>
            <p className="text-xs text-slate-400">Personaliza la síntesis TTS natural y flotante</p>
          </div>
        </div>

        <div className="space-y-6 text-xs">
          {/* Section 1: Voice Natural Customization */}
          <div className="p-4 bg-[#091026] border border-[#0066ff]/30 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-[#0066ff] flex items-center gap-2">
              🗣️ Selección de Voz Natural (Sin Robotización)
            </h3>

            {/* Voice Gender Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSave({ ...settings, gender: 'male' })}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  settings.gender === 'male'
                    ? 'bg-[#0066ff]/30 border-[#0066ff] text-white font-bold shadow-[0_0_15px_rgba(0,102,255,0.3)]'
                    : 'bg-[#030612] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-lg">👨</span>
                <span>Voz Hombre</span>
                <span className="text-[10px] text-slate-400 font-normal">Tono Grave y Natural</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave({ ...settings, gender: 'female' })}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  settings.gender === 'female'
                    ? 'bg-[#0066ff]/30 border-[#0066ff] text-white font-bold shadow-[0_0_15px_rgba(0,102,255,0.3)]'
                    : 'bg-[#030612] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-lg">👩</span>
                <span>Voz Mujer</span>
                <span className="text-[10px] text-slate-400 font-normal">Tono Dulce y Dulce</span>
              </button>
            </div>

            {/* Speed Rate Slider */}
            <div>
              <div className="flex justify-between font-mono mb-1 text-slate-300">
                <span>Velocidad de Habla:</span>
                <span className="text-[#0066ff] font-bold">{settings.rate}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.1"
                value={settings.rate}
                onChange={(e) => handleSave({ ...settings, rate: parseFloat(e.target.value) })}
                className="w-full accent-[#0066ff] cursor-pointer"
              />
            </div>

            {/* Auto Read Toggle */}
            <div className="flex items-center justify-between p-2 bg-[#030612] rounded-xl">
              <span className="text-slate-300 font-medium">
                Leer respuestas en voz alta automáticamente
              </span>
              <input
                type="checkbox"
                checked={settings.autoRead}
                onChange={(e) => handleSave({ ...settings, autoRead: e.target.checked })}
                className="w-4 h-4 accent-[#0066ff] cursor-pointer"
              />
            </div>

            {/* Test Voice Button */}
            <button
              onClick={playTestVoice}
              disabled={isPlayingTest}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              <Volume2 className={`w-4 h-4 ${isPlayingTest ? 'animate-bounce text-[#0066ff]' : ''}`} />
              <span>{isPlayingTest ? 'Reproduciendo Voz...' : '▶️ Probar Voz Natural'}</span>
            </button>
          </div>

          {/* Section 2: Overlay & Wake Word */}
          <div className="p-4 bg-[#091026] border border-[#0066ff]/30 rounded-2xl space-y-3">
            <h3 className="font-bold text-sm text-[#0066ff] flex items-center gap-2">
              🪟 Permiso de Superposición y Manos Libres
            </h3>

            <div className="flex items-center justify-between p-2 bg-[#030612] rounded-xl">
              <div>
                <p className="text-slate-200 font-medium">Círculo Flotante (50x50px)</p>
                <p className="text-[10px] text-slate-400">Mostrar sobre otras aplicaciones (<code className="text-[#0066ff]">SYSTEM_ALERT_WINDOW</code>)</p>
              </div>
              <input
                type="checkbox"
                checked={settings.overlayEnabled}
                onChange={(e) => handleSave({ ...settings, overlayEnabled: e.target.checked })}
                className="w-4 h-4 accent-[#0066ff] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-[#030612] rounded-xl">
              <div>
                <p className="text-slate-200 font-medium">Palabra clave "Oye Meteory"</p>
                <p className="text-[10px] text-slate-400">Escucha continua en segundo plano</p>
              </div>
              <input
                type="checkbox"
                checked={settings.wakeWordEnabled}
                onChange={(e) => handleSave({ ...settings, wakeWordEnabled: e.target.checked })}
                className="w-4 h-4 accent-[#0066ff] cursor-pointer"
              />
            </div>
          </div>

          {/* Section 10: Android Manifest Permissions List */}
          <div className="p-4 bg-[#030612] border border-slate-800 rounded-2xl space-y-2">
            <p className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Manifest de Permisos Android Registrados:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-mono text-slate-400">
              <li className="text-emerald-400">✓ SYSTEM_ALERT_WINDOW</li>
              <li className="text-emerald-400">✓ RECORD_AUDIO</li>
              <li className="text-emerald-400">✓ SCHEDULE_EXACT_ALARM</li>
              <li className="text-emerald-400">✓ POST_NOTIFICATIONS</li>
              <li className="text-emerald-400">✓ WAKE_LOCK</li>
              <li className="text-emerald-400">✓ RECEIVE_BOOT_COMPLETED</li>
              <li className="text-emerald-400">✓ MODIFY_AUDIO_SETTINGS</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
