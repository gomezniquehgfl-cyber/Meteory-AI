import React, { useState, useEffect } from 'react';
import { AlarmItem } from '../types';
import { localDB } from '../lib/db';
import { Bell, Clock, Plus, Trash2, CheckCircle2, Volume2, ShieldCheck } from 'lucide-react';

export const AlarmsView: React.FC = () => {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [time, setTime] = useState('07:30');
  const [label, setLabel] = useState('Recordatorio Meteory IA');
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadAlarms();
  }, []);

  const loadAlarms = async () => {
    const list = await localDB.getAlarms();
    setAlarms(list);
  };

  const handleAddAlarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time) return;

    const newAlarm: AlarmItem = {
      id: 'alarm-' + Date.now(),
      time,
      label: label.trim() || 'Recordatorio Meteory IA',
      days: ['Diario'],
      active: true,
      createdAt: new Date().toISOString(),
    };

    await localDB.addAlarm(newAlarm);
    await loadAlarms();
    setIsAdding(false);
    setToast(`✅ Alarma guardada para las ${time} ("${label}")`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = async (id: string) => {
    await localDB.toggleAlarm(id);
    await loadAlarms();
  };

  const handleDelete = async (id: string) => {
    await localDB.deleteAlarm(id);
    await loadAlarms();
  };

  const playTestAlarmSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
      setToast('🔔 Tono de Alarma Android Probado');
      setTimeout(() => setToast(null), 2500);
    } catch {
      // Audio context fail
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 text-slate-100 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0066ff] text-white px-5 py-2.5 rounded-2xl font-bold text-xs shadow-[0_0_25px_rgba(0,102,255,0.6)] animate-in fade-in">
          {toast}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 bg-[#050814] border border-[#0066ff]/40 rounded-3xl shadow-[0_0_20px_rgba(0,102,255,0.15)]">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff] rounded-2xl shadow-[0_0_15px_rgba(0,102,255,0.3)]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              ⏰ Alarmas y Recordatorios Nativos
            </h2>
            <p className="text-xs text-slate-400">
              Integrado con <code className="text-[#0066ff]">SCHEDULE_EXACT_ALARM</code> y SQLite local
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={playTestAlarmSound}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-xl transition flex items-center gap-1.5"
          >
            <Volume2 className="w-4 h-4 text-[#0066ff]" />
            <span>Probar Sonido</span>
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 bg-[#0066ff] hover:bg-[#0052cc] text-xs font-bold text-white rounded-xl transition shadow-[0_0_15px_rgba(0,102,255,0.4)] flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Alarma</span>
          </button>
        </div>
      </div>

      {/* Voice commands guide */}
      <div className="p-4 bg-[#091026] border border-[#0066ff]/30 rounded-2xl text-xs space-y-2">
        <p className="font-bold text-[#0066ff] flex items-center gap-1.5">
          <Bell className="w-4 h-4" /> Comandos de Voz o Chat Comprendidos:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
          <p>• "Pon una alarma a las 7:30 de la mañana"</p>
          <p>• "Recuérdame a las 14:00 ir al gimnasio"</p>
          <p>• "Borra la alarma de las 7am"</p>
          <p>• "¿Qué alarmas tengo activas?"</p>
        </div>
      </div>

      {/* Add Alarm Form */}
      {isAdding && (
        <form onSubmit={handleAddAlarm} className="p-4 bg-[#050814] border border-[#0066ff]/50 rounded-2xl space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-white">Configurar Nueva Alarma</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Hora (Formato 24h)</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-3 bg-[#030612] border border-slate-700 focus:border-[#0066ff] rounded-xl text-white font-mono text-base focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Etiqueta / Motivo</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ej: Estudiar para examen"
                className="w-full p-3 bg-[#030612] border border-slate-700 focus:border-[#0066ff] rounded-xl text-white focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0066ff] text-xs font-bold text-white rounded-xl shadow-md"
            >
              Guardar Alarma
            </button>
          </div>
        </form>
      )}

      {/* Alarms List */}
      <div className="space-y-3">
        {alarms.length === 0 ? (
          <div className="p-8 text-center bg-[#050814] border border-slate-800 rounded-3xl text-slate-400 text-xs space-y-2">
            <Clock className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-300">No hay alarmas activas guardadas</p>
            <p>Pídele a Meteory IA por voz o chat: "Pon una alarma a las 7:30 AM"</p>
          </div>
        ) : (
          alarms.map((a) => (
            <div
              key={a.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                a.active
                  ? 'bg-[#060c20] border-[#0066ff]/50 shadow-[0_0_15px_rgba(0,102,255,0.15)]'
                  : 'bg-[#03050e] border-slate-800/80 opacity-60'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-2xl font-black font-mono text-white tracking-wider">
                  {a.time}
                </span>
                <p className="text-xs text-slate-300 font-medium">{a.label}</p>
                <p className="text-[10px] text-slate-500 font-mono">Repetir: {a.days.join(', ')}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(a.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono transition ${
                    a.active
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {a.active ? '🟢 Activa' : '🔴 Inactiva'}
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-[#030612] border border-slate-800 rounded-2xl text-[11px] text-slate-400 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Permisos nativos Android activos: <code className="text-slate-300">SCHEDULE_EXACT_ALARM</code> y <code className="text-slate-300">POST_NOTIFICATIONS</code></span>
      </div>
    </div>
  );
};
