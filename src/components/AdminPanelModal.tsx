import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, CheckCircle2, X, RefreshCw, Mail } from 'lucide-react';
import { ApiKeyInfo, ProPaymentSubmission } from '../types';
import { localDB } from '../lib/db';

interface Props {
  apiKeyInfo: ApiKeyInfo;
  onUpdateApiKey: (info: ApiKeyInfo) => void;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<Props> = ({
  apiKeyInfo,
  onUpdateApiKey,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorPin, setErrorPin] = useState(false);
  const [payments, setPayments] = useState<ProPaymentSubmission[]>([]);

  useEffect(() => {
    if (isUnlocked) {
      loadPayments();
    }
  }, [isUnlocked]);

  const loadPayments = async () => {
    const list = await localDB.getProPayments();
    setPayments(list);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsUnlocked(true);
      setErrorPin(false);
    } else {
      setErrorPin(true);
    }
  };

  const handleApprove = async (id: string) => {
    await localDB.approveProPayment(id);
    await loadPayments();

    const updatedKey = await localDB.getApiKeyInfo();
    onUpdateApiKey(updatedKey);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#050814] border-2 border-[#0066ff] rounded-3xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(0,102,255,0.3)] text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="space-y-4 text-center">
            <div className="p-3 bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff] rounded-2xl w-fit mx-auto mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Panel Administrador Creador</h2>
            <p className="text-xs text-slate-400">
              Aprobación manual de pagos para **Niquel Gómez** (gomezniquel0@gmail.com)
            </p>

            <div className="space-y-2 max-w-xs mx-auto">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Ingresa PIN (1234)"
                className="w-full text-center tracking-widest text-lg p-3 bg-[#030612] border border-slate-700 focus:border-[#0066ff] rounded-xl text-white focus:outline-none"
              />
              {errorPin && (
                <p className="text-xs text-rose-400 font-medium">PIN Incorrecto (Prueba: 1234)</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0066ff] hover:bg-[#0052cc] font-bold rounded-xl text-xs text-white transition shadow-lg"
            >
              🔓 Desbloquear Panel Administrador
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Panel de Aprobación de Pagos
                </h2>
                <p className="text-xs text-slate-400">Control Creador (gomezniquel0@gmail.com)</p>
              </div>
              <button
                onClick={loadPayments}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#091026] rounded-xl text-xs space-y-1">
              <p className="text-slate-300">
                Estado Actual de la App:
              </p>
              <p className="font-mono text-[#0066ff]">
                • Modo PRO: {apiKeyInfo.isPro ? '🟢 ACTIVADO' : '🔴 NO ACTIVADO'}
              </p>
              <p className="font-mono text-slate-400">
                • Usos Restantes: {apiKeyInfo.isPro ? 'Ilimitados' : apiKeyInfo.usesLeft}
              </p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {payments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 italic">
                  No hay solicitudes de pago registradas.
                </p>
              ) : (
                payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-[#030612] border border-slate-800 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex justify-between font-mono">
                      <span className="font-bold text-white">{p.name}</span>
                      <span className="text-slate-400">{p.paymentMethod}</span>
                    </div>
                    <p className="text-slate-400">{p.email}</p>
                    <p className="font-mono text-[#0066ff]">TRX: {p.transactionId}</p>

                    {p.status === 'approved' || apiKeyInfo.isPro ? (
                      <div className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aprobado y Pro Activado
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApprove(p.id)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-lg text-xs transition shadow-md"
                      >
                        ✅ Aprobar Modo PRO para este Usuario
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
