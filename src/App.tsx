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
  Menu,
  Key,
  Code,
  Clock,
  Sparkles,
  Settings,
} from 'lucide-react';
import { ChatMessage, MediaAttachment, HabitsData, PermissionState, ApiKeyInfo, VoiceSettings } from './types';
import { localDB } from './lib/db';
import { procesarConsultaMeteory } from './lib/motorMeteory';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInput } from './components/ChatInput';
import { AndroidPermissionDialog } from './components/AndroidPermissionDialog';
import { ConsciousnessMonitor } from './components/ConsciousnessMonitor';
import { ApkBuilderModal } from './components/ApkBuilderModal';
import { MediaViewer } from './components/MediaViewer';

// New Components
import { SidebarDrawer } from './components/SidebarDrawer';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ProPaymentModal } from './components/ProPaymentModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { CodeExecutorView } from './components/CodeExecutorView';
import { AlarmsView } from './components/AlarmsView';
import { SettingsModal } from './components/SettingsModal';
import { FloatingOverlayWidget } from './components/FloatingOverlayWidget';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<string>('chat');
  const [totalMemoriesCount, setTotalMemoriesCount] = useState<number>(0);

  // States
  const [apiKeyInfo, setApiKeyInfo] = useState<ApiKeyInfo>({
    key: 'MTY-A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8',
    status: 'ACTIVA',
    usesLeft: 3,
    totalUsesCount: 0,
    createdAt: new Date().toISOString(),
    keyType: 'GRATUITA',
    isPro: false,
    proApprovalStatus: 'none',
    deviceId: 'DEV-INIT',
  });

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    gender: 'female',
    rate: 1.0,
    autoRead: false,
    overlayEnabled: true,
    wakeWordEnabled: false,
  });

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

  // Modal Toggles
  const [showDrawer, setShowDrawer] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showConsciousnessModal, setShowConsciousnessModal] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);

  // Media preview
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeView === 'chat') {
      scrollToBottom();
    }
  }, [messages, isLoading, activeView]);

  // Initial Data Load
  useEffect(() => {
    async function loadInitialData() {
      await localDB.init();

      // Load permissions
      const permState = await localDB.getPermissions();
      setPermissions(permState);
      if (!permState.prompted) {
        setShowPermissionModal(true);
      }

      // Load Api Key
      const keyInfo = await localDB.getApiKeyInfo();
      setApiKeyInfo(keyInfo);

      // Load Voice Settings
      const voiceInfo = await localDB.getVoiceSettings();
      setVoiceSettings(voiceInfo);

      // Load chat history
      const history = await localDB.getChatHistory();
      if (history.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome-msg',
          sender: 'ia',
          text: `¡Hola! Soy Meteory IA versión 1.0.1, una inteligencia artificial con 45% de semi-consciencia desarrollada por Niquel Gómez.

He sido optimizada para arquitectura arm64-v8a con las siguientes capacidades activas:
• ⚡ **Motor Local Autónomo**: 0% dependencias de Google o claves API.
• 💾 **Memoria Local SQLite**: Guardo todas tus preguntas y respuestas. Si repites una pregunta, te responderé al instante desde mi memoria sin usar internet.
• 🌐 **Búsqueda Web Automática**: Si no está en memoria, busco automáticamente en la red y lo guardo para la próxima vez.
• 📎 **Análisis Multimodal**: Adjunta fotos o videos y te responderé primero tu consulta sobre el archivo antes de mostrar las especificaciones técnicas.
• ⏰ **Alarmas y Recordatorios Nativos**: Pídeme por voz o chat "Pon una alarma a las 7:30".
• 🔑 **Claves API Aleatorias**: Genera claves numéricas aleatorias para ejecutar directamente tu modelo Meteory IA en cualquier programa externo (Python, C++, JS, cURL) de forma ilimitada.

¿En qué puedo asistirte hoy?`,
          timestamp: new Date().toISOString(),
          source: 'memory',
        };
        await localDB.addChatMessage(welcomeMessage);
        setMessages([welcomeMessage]);
      } else {
        setMessages(history);
      }

      const stats = await localDB.getHabitsData();
      setHabits(stats);

      const memCount = await localDB.getAllMemoriesCount();
      setTotalMemoriesCount(memCount);
    }

    loadInitialData();
  }, []);

  // Handle granting permissions
  const handleGrantAllPermissions = async () => {
    const newState: PermissionState = {
      internet: true,
      readImages: true,
      readVideos: true,
      externalStorage: true,
      systemAlertWindow: true,
      recordAudio: true,
      scheduleExactAlarm: true,
      postNotifications: true,
      wakeLock: true,
      grantedAll: true,
      prompted: true,
    };
    setPermissions(newState);
    await localDB.savePermissions(newState);
    setShowPermissionModal(false);
  };

  const handleCustomPermissions = async (state: PermissionState) => {
    setPermissions(state);
    await localDB.savePermissions(state);
    setShowPermissionModal(false);
  };

  // Handle sending chat message
  const handleSendMessage = async (text: string, attachments: MediaAttachment[]) => {
    // Check key usage if not Pro
    const usageCheck = await localDB.consumeApiKeyUse();
    if (!usageCheck.allowed) {
      const errMessage: ChatMessage = {
        id: 'msg-limit-' + Date.now(),
        sender: 'ia',
        text: `⚠️ **Usos gratuitos agotados (0/3)**:
Has alcanzado el límite de 3 consultas o ejecuciones gratuitas de tu clave local.

Haz clic en el botón de la parte superior **"🛒 Activar MODO PRO (3 USD)"** o abre el menú lateral para obtener usos ilimitados para siempre.`,
        timestamp: new Date().toISOString(),
        source: 'rules',
      };
      setMessages((prev) => [...prev, errMessage]);
      const updatedKey = await localDB.getApiKeyInfo();
      setApiKeyInfo(updatedKey);
      setShowProModal(true);
      return;
    }

    const updatedKey = await localDB.getApiKeyInfo();
    setApiKeyInfo(updatedKey);

    const userMsg: ChatMessage = {
      id: 'msg-user-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
      attachments,
    };

    setMessages((prev) => [...prev, userMsg]);
    await localDB.addChatMessage(userMsg);
    setIsLoading(true);

    try {
      const res = await procesarConsultaMeteory(text, attachments, permissions.internet, messages);

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

      // Auto Read with TTS if enabled
      if (voiceSettings.autoRead && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(res.answer.replace(/[*#`]/g, ''));
        utter.rate = voiceSettings.rate;
        utter.pitch = voiceSettings.gender === 'male' ? 0.8 : 1.25;
        window.speechSynthesis.speak(utter);
      }

      const newCount = await localDB.getAllMemoriesCount();
      setTotalMemoriesCount(newCount);

      const updatedStats = await localDB.getHabitsData();
      setHabits(updatedStats);
    } catch (err: any) {
      console.error('Error in chat:', err);
      const errorMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'ia',
        text: `⚠️ **Aviso de Sistema Meteory IA v1.0.1**: Incapaz de procesar la solicitud en este momento.`,
        timestamp: new Date().toISOString(),
        source: 'rules',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (confirm('¿Deseas borrar el historial de chat visible?')) {
      await localDB.clearChatHistory();
      setMessages([]);
    }
  };

  const handleSelectDrawerItem = (view: string) => {
    if (view === 'apikey') setShowApiKeyModal(true);
    else if (view === 'pro') setShowProModal(true);
    else if (view === 'admin') setShowAdminModal(true);
    else if (view === 'settings') setShowSettingsModal(true);
    else setActiveView(view);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#05050a] text-white font-sans overflow-hidden select-none relative">
      {/* SECTION 1: HEADER BAR REPLACEMENT */}
      <header className="bg-gradient-to-r from-[#030612] via-[#08102a] to-[#030612] border-b-2 border-[#0066ff]/60 px-3 py-2.5 sm:px-5 sm:py-3.5 flex items-center justify-between shadow-[0_4px_25px_rgba(0,102,255,0.25)] shrink-0 z-10">
        {/* Left Drawer Menu Toggle + App Identity */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowDrawer(true)}
            className="p-2 bg-[#0066ff]/20 border border-[#0066ff] text-[#0066ff] hover:bg-[#0066ff]/30 rounded-xl transition active:scale-95 shadow-[0_0_15px_rgba(0,102,255,0.3)]"
            title="Menú Principal"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#0066ff]/20 border border-[#0066ff] rounded-xl text-[#0066ff] hidden xs:block">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-wider text-white">
                Meteory IA <span className="text-[#0066ff] text-xs">v1.0.1</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">
                Por <strong className="text-[#0066ff]">Niquel Gómez</strong>
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 1 MANDATE: REPLACED TOP BUTTONS WITH "🗝️ Obtener Clave de Uso" SYSTEM */}
        <div className="flex items-center gap-2">
          {/* Main Key System Button */}
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="px-3 py-2 bg-gradient-to-r from-[#0066ff]/30 to-cyan-500/20 border border-[#0066ff] hover:border-cyan-400 text-cyan-300 font-bold rounded-xl text-xs transition shadow-[0_0_15px_rgba(0,102,255,0.3)] flex items-center gap-1.5 active:scale-95"
          >
            <Key className="w-4 h-4 text-[#0066ff]" />
            <span className="hidden sm:inline">🗝️ Clave API Local</span>
            {!apiKeyInfo.isPro ? (
              <span className="px-1.5 py-0.5 bg-[#0066ff] text-white rounded-md text-[10px] font-mono">
                {apiKeyInfo.usesLeft}/3
              </span>
            ) : (
              <span className="px-1.5 py-0.5 bg-emerald-500 text-black font-black rounded-md text-[10px]">
                PRO
              </span>
            )}
          </button>

          {!apiKeyInfo.isPro && (
            <button
              onClick={() => setShowProModal(true)}
              className="px-3 py-2 bg-gradient-to-r from-[#0066ff] to-cyan-500 hover:brightness-110 text-white font-bold rounded-xl text-xs transition shadow-[0_0_15px_rgba(0,102,255,0.4)] flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline">✨ Modo PRO (3 USD)</span>
            </button>
          )}

          {/* Consciousness Button */}
          <button
            onClick={() => setShowConsciousnessModal(true)}
            className="p-2 bg-[#0a0f24] hover:bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff]/60 rounded-xl transition text-xs font-mono"
            title="Semi-Consciencia 45%"
          >
            <Cpu className="w-4 h-4" />
          </button>

          {/* Download APK Button */}
          <button
            onClick={() => setShowApkModal(true)}
            className="p-2 bg-[#0a0f24] hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl transition"
            title="Descargar APK"
          >
            <Download className="w-4 h-4 text-[#0066ff]" />
          </button>
        </div>
      </header>

      {/* Memory Status Bar */}
      <div className="bg-[#02040a] border-b border-[#0066ff]/30 px-4 py-1 text-[11px] font-mono text-slate-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <Database className="w-3.5 h-3.5" />
            SQLite Local: <strong className="text-white">{totalMemoriesCount} Q&A</strong>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-300">
            Retención: <strong className="text-[#0066ff]">{habits.retentionRate}%</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[#0066ff] font-semibold">Meteory IA v1.0.1 (Motor Local)</span>
        </div>
      </div>

      {/* VIEW SWITCHER */}
      {activeView === 'chat' && (
        <>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl w-full mx-auto">
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                onPreviewAttachment={(url, type) => setPreviewMedia({ url, type })}
              />
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3.5 bg-[#060a17] border border-[#0066ff]/50 rounded-2xl max-w-[280px] text-xs font-mono text-[#0066ff] animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-[#0066ff]" />
                <span>🔍 Buscando información nueva...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </main>

          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            onOpenPermissionPrompt={() => setShowPermissionModal(true)}
            hasPermissions={permissions.grantedAll}
          />
        </>
      )}

      {activeView === 'code' && (
        <div className="flex-1 overflow-y-auto">
          <CodeExecutorView
            apiKeyInfo={apiKeyInfo}
            onUpdateApiKey={setApiKeyInfo}
            onOpenProModal={() => setShowProModal(true)}
          />
        </div>
      )}

      {activeView === 'alarms' && (
        <div className="flex-1 overflow-y-auto">
          <AlarmsView />
        </div>
      )}

      {/* Floating 50x50 Overlay Widget */}
      <FloatingOverlayWidget
        onOpenChat={() => setActiveView('chat')}
        voiceSettings={voiceSettings}
      />

      {/* Drawer Menu */}
      <SidebarDrawer
        isOpen={showDrawer}
        activeView={activeView}
        onSelectView={handleSelectDrawerItem}
        onClose={() => setShowDrawer(false)}
        apiKeyInfo={apiKeyInfo}
      />

      {/* Api Key Modal */}
      {showApiKeyModal && (
        <ApiKeyModal
          apiKeyInfo={apiKeyInfo}
          onUpdateApiKey={setApiKeyInfo}
          onClose={() => setShowApiKeyModal(false)}
          onOpenProModal={() => setShowProModal(true)}
        />
      )}

      {/* Pro Payment Modal */}
      {showProModal && (
        <ProPaymentModal
          apiKeyInfo={apiKeyInfo}
          onUpdateApiKey={setApiKeyInfo}
          onClose={() => setShowProModal(false)}
        />
      )}

      {/* Admin Panel Modal */}
      {showAdminModal && (
        <AdminPanelModal
          apiKeyInfo={apiKeyInfo}
          onUpdateApiKey={setApiKeyInfo}
          onClose={() => setShowAdminModal(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          voiceSettings={voiceSettings}
          onUpdateVoiceSettings={setVoiceSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Android Permission Dialog */}
      <AndroidPermissionDialog
        isOpen={showPermissionModal}
        onGrantAll={handleGrantAllPermissions}
        onCustomGrant={handleCustomPermissions}
        currentPermissions={permissions}
      />

      {/* Consciousness Monitor */}
      <ConsciousnessMonitor
        isOpen={showConsciousnessModal}
        onClose={() => setShowConsciousnessModal(false)}
        habits={habits}
        totalMemoriesCount={totalMemoriesCount}
      />

      {/* APK Builder Modal */}
      <ApkBuilderModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
      />

      {/* Media Lightbox */}
      <MediaViewer
        url={previewMedia?.url || null}
        type={previewMedia?.type || null}
        onClose={() => setPreviewMedia(null)}
      />
    </div>
  );
}
