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
  grantedAll: boolean;
  prompted: boolean;
}
