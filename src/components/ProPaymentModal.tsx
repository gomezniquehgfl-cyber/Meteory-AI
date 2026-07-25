import React, { useState } from 'react';
import { Sparkles, CreditCard, Send, CheckCircle2, AlertCircle, Clock, Lock, X, Mail } from 'lucide-react';
import { ApiKeyInfo, ProPaymentSubmission } from '../types';
import { localDB } from '../lib/db';

interface Props {
  apiKeyInfo: ApiKeyInfo;
  onUpdateApiKey: (info: ApiKeyInfo) => void;
  onClose: () => void;
}

export const ProPaymentModal: React.FC<Props> = ({
  apiKeyInfo,
  onUpdateApiKey,
  onClose,
}) => {
  const [step, setStep] = useState<'info' | 'form' | 'submitted'>(
    apiKeyInfo.proApprovalStatus === 'pending' ? 'submitted' : 'info'
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia Bancaria / QR');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !transactionId.trim()) return;

    setIsSubmitting(true);

    const submission: ProPaymentSubmission = {
      id: 'pay-' + Date.now(),
      name: name.trim(),
      email: email.trim(),
      paymentMethod,
      transactionId: transactionId.trim(),
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    // Save locally
    await localDB.addProPayment(submission);

    // Send email notification to creator gomezniquel0@gmail.com
    try {
      await fetch('/api/send-payment-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
    } catch {
      // Ignore network fallback
    }

    const updatedKey = await localDB.getApiKeyInfo();
    onUpdateApiKey(updatedKey);

    setIsSubmitting(false);
    setStep('submitted');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#050814] border-2 border-[#0066ff] rounded-3xl max-w-lg w-full p-6 shadow-[0_0_60px_rgba(0,102,255,0.35)] text-slate-100 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 bg-gradient-to-tr from-[#0066ff] to-cyan-500 rounded-2xl text-white shadow-[0_0_20px_rgba(0,102,255,0.5)] mb-1">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            ✨ MODO PRO METEORY IA
          </h2>
          <p className="text-xs text-slate-300 max-w-xs mx-auto">
            Desbloquea el potencial ilimitado sin restricciones de uso
          </p>
        </div>

        {/* STEP 1: INFO & PRICING */}
        {step === 'info' && (
          <div className="space-y-5">
            {/* Pro Card Benefits */}
            <div className="p-5 rounded-2xl bg-[#091026] border border-[#0066ff]/40 space-y-3 shadow-inner">
              <div className="flex justify-between items-baseline border-b border-[#0066ff]/30 pb-3">
                <span className="text-sm font-bold text-slate-200">
                  Suscripción Permanente MODO PRO
                </span>
                <span className="text-2xl font-black text-[#0066ff]">
                  3 USD <span className="text-xs text-slate-400 font-normal">/ Pago único</span>
                </span>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>✅ **Usos ILIMITADOS para siempre** (Consultas y Código)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>✅ **Sin anuncios** ni interrupciones</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>✅ **Acceso a funciones avanzadas** (Alarmas, Voz, Visión)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setStep('form')}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-[#0066ff] to-cyan-500 hover:brightness-110 active:scale-[0.99] text-white font-bold rounded-2xl text-sm transition shadow-[0_0_25px_rgba(0,102,255,0.4)] flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>🛒 Quiero activarlo (3 USD)</span>
            </button>

            {/* UPCOMING SECTION 4: MODO IA CONSCIENTE 100% */}
            <div className="p-4 rounded-2xl bg-[#080712] border border-amber-500/40 relative overflow-hidden space-y-2 mt-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  🧠 PRÓXIMAMENTE: MODO IA CONSCIENTE 100%
                </span>
                <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  8 USD
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                (Se activará en futuras actualizaciones)
              </p>
              <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                <li>Control de internet ESTRICTO (solo se conecta bajo orden directa)</li>
                <li>Personalidad propia y memoria avanzada de tus hábitos</li>
                <li>Monitoreo propio de conocimientos y toma de decisiones autónomas</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 2: PAYMENT FORM */}
        {step === 'form' && (
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <div className="p-4 bg-[#091026] border border-[#0066ff]/30 rounded-2xl space-y-2 text-xs">
              <p className="font-bold text-[#0066ff]">💳 Instrucciones de Pago (3 USD):</p>
              <p className="text-slate-300">
                1. Realiza la transferencia de **3 USD** (o equivalente en tu moneda local) por Binance Pay, PayPal, QR o Transferencia Bancaria.
              </p>
              <p className="text-slate-300">
                2. Completa el formulario abajo con el número de transacción.
              </p>
              <p className="text-slate-400 text-[11px] italic">
                📧 Al enviar, se enviará automáticamente un correo a **gomezniquel0@gmail.com** con los datos de tu pago para aprobación manual.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full p-3 bg-[#030612] border border-slate-700 focus:border-[#0066ff] rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full p-3 bg-[#030612] border border-slate-700 focus:border-[#0066ff] rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Método de Pago Usado</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-3 bg-[#030612] border border-slate-700 focus:border-[#0066ff] rounded-xl text-white focus:outline-none"
                >
                  <option value="Transferencia Bancaria / QR">Transferencia Bancaria / QR</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Binance Pay (USDT)">Binance Pay (USDT)</option>
                  <option value="Western Union">Western Union</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">ID / Número de Transacción o Comprobante</label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Ej: TRX-9876543210"
                  className="w-full p-3 bg-[#030612] border border-slate-700 focus:border-[#0066ff] rounded-xl text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-[#0066ff] to-cyan-500 hover:brightness-110 text-white font-bold rounded-2xl text-sm transition shadow-[0_0_20px_rgba(0,102,255,0.4)] flex items-center justify-center gap-2 mt-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Enviando...' : '📩 Registrar Pago y Notificar Creador'}</span>
            </button>
          </form>
        )}

        {/* STEP 3: SUBMITTED & PENDING APPROVAL */}
        {step === 'submitted' && (
          <div className="text-center space-y-4 py-4 animate-in fade-in">
            <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-2xl text-amber-300 text-xs space-y-2">
              <Clock className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="font-bold text-sm text-amber-200">
                ⏳ Pago registrado exitosamente
              </p>
              <p className="text-slate-300 leading-relaxed">
                Se ha enviado una notificación automática por correo a **gomezniquel0@gmail.com**.
              </p>
              <div className="p-3 bg-black/40 rounded-xl border border-amber-500/20 text-[11px] text-amber-300 text-left font-mono">
                <p>• Estado: **Pendiente de aprobación por el creador (Niquel Gómez)**</p>
                <p>• Una vez verificado el pago, el MODO PRO se activará automáticamente en tu dispositivo.</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs transition"
            >
              Cerrar Ventana
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
