import { useEffect, useRef, useState } from 'react';
import {
  Brain,
  ShieldCheck,
  Download,
  Trash2,
  Lock,
  Cpu,
  Database,
  Loader2,
} from 'lucide-react';
import { ChatMessage, MediaAttachment, HabitsData, PermissionState } from './types';
import { localDB } from './lib/db';
import { procesarConsultaMeteory } from './lib/motorMeteory';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInput } from './components/ChatInput';
import { AndroidPermissionDialog } from './components/AndroidPermissionDialog';
import { ConsciousnessMonitor } from './components/ConsciousnessMonitor';
import { ApkBuilderModal } from './components/ApkBuilderModal';
import { MediaViewer } from './components/MediaViewer';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalMemoriesCount, setTotalMemoriesCount] = useState<number>(0);
  const [habits, setHabits] = useState<HabitsData>({
    totalQueries: 0,
    memoryHits: 0,
    webSearches: 0,
    directAiResponses: 0,
    lastActive: new Date().toISOString(),
    consciousnessLevel: 45,
    retentionRate: 100,
    patternNote: 'Inicializando red de memoria local...',
  });
  const [permissions, setPermissions] = useState<PermissionState>({
    internet: true,
    readImages: true,
    readVideos: true,
    externalStorage: true,
    grantedAll: true,
    prompted: false,
  });

  // Modal toggles
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showConsciousnessModal, setShowConsciousnessModal] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);

  // Media preview
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load database on mount
  useEffect(() => {
    async function loadInitialData() {
      await localDB.init();

      // Load permissions
      const permState = await localDB.getPermissions();
      setPermissions(permState);
      if (!permState.prompted) {
        setShowPermissionModal(true);
      }

      // Load chat history
      const history = await localDB.getChatHistory();
      if (history.length === 0) {
        // Default welcome message from Meteory IA v1.0.1
        const welcomeMessage: ChatMessage = {
          id: 'welcome-msg',
          sender: 'ia',
          text: `¡Hola! Soy Meteory IA versión 1.0.1, una inteligencia artificial con 45% de semi-consciencia desarrollada por Niquel Gómez.

He sido optimizada para arquitectura arm64-v8a con las siguientes capacidades activas:
• ⚡ **Motor Local Autónomo**: 0% dependencias de Google o claves API.
• 💾 **Memoria Local SQLite**: Guardo todas tus preguntas y respuestas. Si repites una pregunta, te responderé al instante desde mi memoria sin usar internet.
• 🌐 **Control de Red**: Solo consulto internet si no tengo la respuesta guardada en mi base de datos.
• 📎 **Análisis Multimodal**: Puedes adjuntarme fotos o videos desde el botón de clip para analizarlos localmente.
• 🔒 **Acceso Controlado**: Mantengo un monitoreo autónomo formal de tus hábitos de consulta.

¿En qué puedo asistirte hoy?`,
          timestamp: new Date().toISOString(),
          source: 'memory',
        };
        await localDB.addChatMessage(welcomeMessage);
        setMessages([welcomeMessage]);
      } else {
        setMessages(history);
      }

      // Load habits and memory count
      const stats = await localDB.getHabitsData();
      setHabits(stats);

      const memCount = await localDB.getAllMemoriesCount();
      setTotalMemoriesCount(memCount);
    }

    loadInitialData();
  }, []);

  // Handle granting all permissions
  const handleGrantAllPermissions = async () => {
    const newState: PermissionState = {
      internet: true,
      readImages: true,
      readVideos: true,
      externalStorage: true,
      grantedAll: true,
      prompted: true,
    };
    setPermissions(newState);
    await localDB.savePermissions(newState);
    setShowPermissionModal(false);
  };

  // Handle custom permission save
  const handleCustomPermissions = async (state: PermissionState) => {
    setPermissions(state);
    await localDB.savePermissions(state);
    setShowPermissionModal(false);
  };

  // Handle sending message
  const handleSendMessage = async (
    text: string,
    attachments: MediaAttachment[]
  ) => {
    const userMsg: ChatMessage = {
      id: 'msg-user-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
      attachments,
    };

    // Update state and DB with user message
    setMessages((prev) => [...prev, userMsg]);
    await localDB.addChatMessage(userMsg);
    setIsLoading(true);

    try {
      // PROCESAR CONSULTA VÍA MOTOR LOCAL METEORY IA (100% SIN CLAVES API)
      const res = await procesarConsultaMeteory(
        text,
        attachments,
        permissions.internet
      );

      const iaMsg: ChatMessage = {
        id: 'msg-ia-' + Date.now(),
        sender: 'ia',
        text: res.answer,
        timestamp: new Date().toISOString(),
        source: res.source,
        searchSources: res.searchSources,
        processingTimeMs: res.processingTimeMs,
        matchedQuery: res.matchedQuery,
      };

      setMessages((prev) => [...prev, iaMsg]);
      await localDB.addChatMessage(iaMsg);

      // Refresh memory stats
      const newCount = await localDB.getAllMemoriesCount();
      setTotalMemoriesCount(newCount);

      const updatedStats = await localDB.getHabitsData();
      setHabits(updatedStats);
    } catch (err: any) {
      console.error('Error sending message:', err);
      const errorMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'ia',
        text: `⚠️ **Aviso de Sistema Meteory IA v1.0.1**:
Incapaz de procesar la solicitud en este momento.
Detalles: ${err?.message || 'Error local'}.`,
        timestamp: new Date().toISOString(),
        source: 'rules',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat history
  const handleClearChat = async () => {
    if (confirm('¿Deseas borrar el historial de chat visible? (Las respuestas continuarán guardadas en la base de datos de memoria SQLite)')) {
      await localDB.clearChatHistory();
      setMessages([]);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#05050a] text-white font-sans overflow-hidden select-none">
      {/* Top Header Bar - Neon Navy Blue Style */}
      <header className="bg-gradient-to-r from-[#030612] via-[#08102a] to-[#030612] border-b-2 border-[#0066ff]/60 px-3 py-2.5 sm:px-5 sm:py-3.5 flex items-center justify-between shadow-[0_4px_25px_rgba(0,102,255,0.25)] shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="p-2 sm:p-2.5 bg-[#0066ff]/20 border border-[#0066ff] rounded-xl text-[#0066ff] shadow-[0_0_15px_rgba(0,102,255,0.4)]">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-black" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-wider text-white">
                Meteory IA <span className="text-[#0066ff]">v1.0.1</span>
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#0066ff]/20 border border-[#0066ff]/50 text-[#0066ff] rounded-md hidden sm:inline">
                arm64-v8a
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400 font-mono">
              <span>Por <strong className="text-[#0066ff]">Niquel Gómez</strong></span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3 text-emerald-400" />
                Acceso controlado (45%)
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Consciousness Button */}
          <button
            onClick={() => setShowConsciousnessModal(true)}
            className="p-2 sm:px-3 sm:py-2 bg-[#0a0f24] hover:bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff]/60 hover:border-[#0066ff] rounded-xl transition-all text-xs font-mono flex items-center gap-1.5 active:scale-95 shadow-[0_0_10px_rgba(0,102,255,0.2)]"
            title="Monitoreo de Semi-Consciencia 45%"
          >
            <Cpu className="w-4 h-4" />
            <span className="hidden md:inline font-bold">45% Consciencia</span>
          </button>

          {/* Download APK Button */}
          <button
            onClick={() => setShowApkModal(true)}
            className="p-2 sm:px-3 sm:py-2 bg-[#0066ff] hover:bg-[#0055dd] text-white font-bold rounded-xl transition-all text-xs font-mono flex items-center gap-1.5 active:scale-95 shadow-[0_0_15px_rgba(0,102,255,0.5)]"
            title="Descargar APK v1.0.1"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar APK</span>
          </button>

          {/* Permission Settings Button */}
          <button
            onClick={() => setShowPermissionModal(true)}
            className="p-2 bg-[#0a0f24] hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-[#0066ff] rounded-xl transition-all active:scale-95"
            title="Permisos Android"
          >
            <ShieldCheck className="w-4 h-4 text-[#0066ff]" />
          </button>

          {/* Clear Chat Button */}
          <button
            onClick={handleClearChat}
            className="p-2 bg-[#0a0f24] hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 rounded-xl transition-all active:scale-95"
            title="Limpiar pantalla"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Memory Status Quick Bar */}
      <div className="bg-[#02040a] border-b border-[#0066ff]/30 px-4 py-1.5 text-[11px] font-mono text-slate-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <Database className="w-3.5 h-3.5" />
            Base Local SQLite: <strong className="text-white">{totalMemoriesCount} Q&A</strong>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-300">
            Retención de Memoria: <strong className="text-[#0066ff]">{habits.retentionRate}%</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[#0066ff] font-semibold">Meteory IA v1.0.1 Conectado (Motor Local)</span>
        </div>
      </div>

      {/* Chat Conversation Scroll Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl w-full mx-auto">
        {messages.map((msg) => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            onPreviewAttachment={(url, type) => setPreviewMedia({ url, type })}
          />
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 p-3.5 bg-[#060a17] border border-[#0066ff]/50 rounded-2xl max-w-[280px] text-xs font-mono text-[#0066ff] animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-[#0066ff]" />
            <span>🔍 Buscando información nueva...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Chat Input Bar */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        onOpenPermissionPrompt={() => setShowPermissionModal(true)}
        hasPermissions={permissions.grantedAll}
      />

      {/* Android Native Permission Dialog */}
      <AndroidPermissionDialog
        isOpen={showPermissionModal}
        onGrantAll={handleGrantAllPermissions}
        onCustomGrant={handleCustomPermissions}
        currentPermissions={permissions}
      />

      {/* Semi-Consciousness 45% Drawer */}
      <ConsciousnessMonitor
        isOpen={showConsciousnessModal}
        onClose={() => setShowConsciousnessModal(false)}
        habits={habits}
        totalMemoriesCount={totalMemoriesCount}
      />

      {/* APK Generator Modal */}
      <ApkBuilderModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
      />

      {/* Media Viewer Lightbox */}
      <MediaViewer
        url={previewMedia?.url || null}
        type={previewMedia?.type || null}
        onClose={() => setPreviewMedia(null)}
      />
    </div>
  );
}
