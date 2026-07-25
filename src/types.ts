export interface MediaAttachment {
  id: string;
  name: string;
  mimeType: string;
  type: 'image' | 'video';
  dataUrl: string; // Base64 data URL
  sizeFormatted: string;
}

export type MessageSource = 'memory' | 'rules' | 'public_web';

export interface SearchSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ia';
  text: string;
  timestamp: string;
  source?: MessageSource;
  searchSources?: SearchSource[];
  attachments?: MediaAttachment[];
  matchedQuery?: string;
  processingTimeMs?: number;
}

export interface QAMemoryItem {
  id: string;
  normalizedQuery: string;
  originalQuery: string;
  answer: string;
  timestamp: string;
  hitCount: number;
  hasMedia: boolean;
  searchSources?: SearchSource[];
}

export interface HabitsData {
  totalQueries: number;
  memoryHits: number;
  webSearches: number;
  directAiResponses: number;
  lastActive: string;
  consciousnessLevel: number; // 45%
  retentionRate: number; // calculated percentage
  patternNote: string;
}

export interface PermissionState {
  internet: boolean;
  readImages: boolean;
  readVideos: boolean;
  externalStorage: boolean;
  systemAlertWindow: boolean;
  recordAudio: boolean;
  scheduleExactAlarm: boolean;
  postNotifications: boolean;
  wakeLock: boolean;
  grantedAll: boolean;
  prompted: boolean;
}

export type ApiKeyStatus = 'ACTIVA' | 'INACTIVA' | 'AGOTADA';
export type ApiKeyType = 'GRATUITA' | 'PRO';

export interface ApiKeyInfo {
  key: string; // Formato oficial: MTY-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (36 caracteres)
  status: ApiKeyStatus;
  usesLeft: number; // 3 para GRATUITA, 999999 para PRO
  totalUsesCount: number;
  createdAt: string;
  keyType: ApiKeyType;
  isPro: boolean;
  proApprovalStatus: 'none' | 'pending' | 'approved';
  deviceId: string;
}

export interface ProPaymentSubmission {
  id: string;
  name: string;
  email: string;
  paymentMethod: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface AlarmItem {
  id: string;
  time: string; // HH:MM in 24h format
  label: string;
  days: string[]; // e.g. ['lun', 'mar', ...] or ['Diario']
  active: boolean;
  createdAt: string;
}

export interface CodeExecutionResult {
  id: string;
  code: string;
  language: 'javascript' | 'python' | 'html';
  output: string;
  error?: string;
  timestamp: string;
}

export interface VoiceSettings {
  enabled: boolean;
  gender: 'male' | 'female';
  rate: number;
  pitch: number;
  autoRead: boolean;
  overlayEnabled: boolean;
  wakeWordEnabled: boolean;
}
