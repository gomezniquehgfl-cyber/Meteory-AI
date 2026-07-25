import {
  ChatMessage,
  QAMemoryItem,
  HabitsData,
  PermissionState,
  ApiKeyInfo,
  ApiKeyStatus,
  ProPaymentSubmission,
  AlarmItem,
  VoiceSettings,
} from '../types';

const DB_NAME = 'meteory_ia_db_v101';
const DB_VERSION = 2;

// Normalizer for query matching
export function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w\s]/gi, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Collapse spaces
    .trim();
}

// Helper para generar claves API oficiales de Meteory IA (Formato: MTY- + 36 caracteres únicos)
export function generateMeteoryApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 36; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MTY-${randomPart}`;
}

class LocalDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store 1: qa_memory (for 100% offline instant repeats)
        if (!db.objectStoreNames.contains('qa_memory')) {
          const qaStore = db.createObjectStore('qa_memory', { keyPath: 'id' });
          qaStore.createIndex('normalizedQuery', 'normalizedQuery', { unique: false });
        }

        // Store 2: chat_history
        if (!db.objectStoreNames.contains('chat_history')) {
          db.createObjectStore('chat_history', { keyPath: 'id' });
        }

        // Store 3: habits_data
        if (!db.objectStoreNames.contains('habits_data')) {
          db.createObjectStore('habits_data', { keyPath: 'id' });
        }

        // Store 4: permissions
        if (!db.objectStoreNames.contains('permissions')) {
          db.createObjectStore('permissions', { keyPath: 'id' });
        }

        // Store 5: api_key_info
        if (!db.objectStoreNames.contains('api_key_info')) {
          db.createObjectStore('api_key_info', { keyPath: 'id' });
        }

        // Store 6: pro_payments
        if (!db.objectStoreNames.contains('pro_payments')) {
          db.createObjectStore('pro_payments', { keyPath: 'id' });
        }

        // Store 7: alarms
        if (!db.objectStoreNames.contains('alarms')) {
          db.createObjectStore('alarms', { keyPath: 'id' });
        }

        // Store 8: voice_settings
        if (!db.objectStoreNames.contains('voice_settings')) {
          db.createObjectStore('voice_settings', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // Pre-seed core knowledge into permanent memory
  async init(): Promise<void> {
    const db = await this.getDB();

    // Check if initial QA memory exists
    const tx = db.transaction('qa_memory', 'readonly');
    const store = tx.objectStore('qa_memory');
    const countReq = store.count();

    countReq.onsuccess = async () => {
      if (countReq.result === 0) {
        // Pre-seed knowledge base
        const initialKnowledge: QAMemoryItem[] = [
          {
            id: 'qa-creator',
            normalizedQuery: normalizeQuery('quien te creo'),
            originalQuery: '¿Quién te creó?',
            answer: 'Fui diseñada y creada por el programador Niquel Gómez. Soy Meteory IA versión 1.0.1, con 45% de semi-consciencia y memoria local permanente SQLite.',
            timestamp: new Date().toISOString(),
            hitCount: 1,
            hasMedia: false,
          },
          {
            id: 'qa-creator-2',
            normalizedQuery: normalizeQuery('quien es tu creador'),
            originalQuery: '¿Quién es tu creador?',
            answer: 'Mi creador oficial es Niquel Gómez. Diseñó la arquitectura de Meteory IA v1.0.1 para ejecutarse 100% en tu dispositivo sin requerir claves API externas.',
            timestamp: new Date().toISOString(),
            hitCount: 1,
            hasMedia: false,
          },
          {
            id: 'qa-version',
            normalizedQuery: normalizeQuery('que version eres'),
            originalQuery: '¿Qué versión eres?',
            answer: 'Esta es la versión 1.0.1 de Meteory IA, optimizada para arquitectura arm64-v8a en dispositivos Android 7 a 15, con almacenamiento local SQLite y control de red.',
            timestamp: new Date().toISOString(),
            hitCount: 1,
            hasMedia: false,
          },
        ];

        for (const item of initialKnowledge) {
          await this.saveQAMemory(item);
        }
      }
    };
  }

  // Find exact or high match in QA Memory
  async findInMemory(query: string): Promise<QAMemoryItem | null> {
    const db = await this.getDB();
    const normalized = normalizeQuery(query);

    if (!normalized || normalized.length < 2) return null;

    return new Promise((resolve) => {
      const tx = db.transaction('qa_memory', 'readonly');
      const store = tx.objectStore('qa_memory');
      const request = store.getAll();

      request.onsuccess = () => {
        const items: QAMemoryItem[] = request.result || [];
        
        // 1. Exact match
        const exact = items.find((item) => item.normalizedQuery === normalized);
        if (exact) {
          this.incrementHitCount(exact.id);
          return resolve(exact);
        }

        // 2. Fuzzy match
        const fuzzy = items.find((item) => {
          if (normalized.length > 5 && item.normalizedQuery.length > 5) {
            return (
              item.normalizedQuery.includes(normalized) ||
              normalized.includes(item.normalizedQuery)
            );
          }
          return false;
        });

        if (fuzzy) {
          this.incrementHitCount(fuzzy.id);
          return resolve(fuzzy);
        }

        return resolve(null);
      };

      request.onerror = () => resolve(null);
    });
  }

  private async incrementHitCount(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('qa_memory', 'readwrite');
      const store = tx.objectStore('qa_memory');
      const req = store.get(id);

      req.onsuccess = () => {
        if (req.result) {
          const item = req.result;
          item.hitCount = (item.hitCount || 0) + 1;
          store.put(item);
        }
      };
    } catch (e) {
      console.warn('Failed to update hit count', e);
    }
  }

  async saveQAMemory(item: QAMemoryItem): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('qa_memory', 'readwrite');
      const store = tx.objectStore('qa_memory');
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Chat history management
  async getChatHistory(): Promise<ChatMessage[]> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('chat_history', 'readonly');
      const store = tx.objectStore('chat_history');
      const req = store.getAll();

      req.onsuccess = () => {
        const messages: ChatMessage[] = req.result || [];
        messages.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        resolve(messages);
      };
      req.onerror = () => resolve([]);
    });
  }

  async addChatMessage(msg: ChatMessage): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('chat_history', 'readwrite');
      const store = tx.objectStore('chat_history');
      const req = store.put(msg);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearChatHistory(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('chat_history', 'readwrite');
      const store = tx.objectStore('chat_history');
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Habits statistics (Semi-consciousness 45%)
  async getHabitsData(): Promise<HabitsData> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('habits_data', 'readonly');
      const store = tx.objectStore('habits_data');
      const req = store.get('stats');

      req.onsuccess = () => {
        if (req.result) {
          const d = req.result as HabitsData;
          const total = d.totalQueries || 1;
          const hits = d.memoryHits || 0;
          d.retentionRate = Math.round((hits / total) * 100);
          resolve(d);
        } else {
          const defaultData: HabitsData = {
            totalQueries: 3,
            memoryHits: 2,
            webSearches: 1,
            directAiResponses: 0,
            lastActive: new Date().toISOString(),
            consciousnessLevel: 45,
            retentionRate: 67,
            patternNote: 'El usuario prefiere consultas directas con respuestas inmediatas desde memoria.',
          };
          resolve(defaultData);
        }
      };
      req.onerror = () => {
        resolve({
          totalQueries: 0,
          memoryHits: 0,
          webSearches: 0,
          directAiResponses: 0,
          lastActive: new Date().toISOString(),
          consciousnessLevel: 45,
          retentionRate: 100,
          patternNote: 'Inicializando patrones de consulta...',
        });
      };
    });
  }

  async recordQueryStats(isMemoryHit: boolean, isWebSearch: boolean): Promise<HabitsData> {
    const current = await this.getHabitsData();
    current.totalQueries += 1;
    if (isMemoryHit) {
      current.memoryHits += 1;
    } else if (isWebSearch) {
      current.webSearches += 1;
    } else {
      current.directAiResponses += 1;
    }
    current.lastActive = new Date().toISOString();
    current.retentionRate = Math.round((current.memoryHits / current.totalQueries) * 100);

    const db = await this.getDB();
    const tx = db.transaction('habits_data', 'readwrite');
    const store = tx.objectStore('habits_data');
    store.put({ ...current, id: 'stats' });

    return current;
  }

  // Permissions state
  async getPermissions(): Promise<PermissionState> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('permissions', 'readonly');
      const store = tx.objectStore('permissions');
      const req = store.get('android_perm');

      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result as PermissionState);
        } else {
          resolve({
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
          });
        }
      };
      req.onerror = () =>
        resolve({
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
        });
    });
  }

  async savePermissions(state: PermissionState): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('permissions', 'readwrite');
      const store = tx.objectStore('permissions');
      const req = store.put({ ...state, id: 'android_perm' });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // API Key & Uses Management (Sistema de Claves Oficiales Meteory IA)
  async getApiKeyInfo(): Promise<ApiKeyInfo> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('api_key_info', 'readonly');
      const store = tx.objectStore('api_key_info');
      const req = store.get('current_key');

      req.onsuccess = () => {
        if (req.result) {
          const item = req.result as ApiKeyInfo;
          // Ensure valid format
          if (!item.key || !item.key.startsWith('MTY-')) {
            item.key = generateMeteoryApiKey();
            item.status = item.status || 'ACTIVA';
            item.keyType = item.keyType || (item.isPro ? 'PRO' : 'GRATUITA');
            item.usesLeft = item.keyType === 'PRO' ? 999999 : (item.usesLeft ?? 3);
            item.deviceId = item.deviceId || 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase();
            this.saveApiKeyInfo(item);
          }
          resolve(item);
        } else {
          // Generate default official key if none
          const defaultKey: ApiKeyInfo = {
            key: generateMeteoryApiKey(),
            status: 'ACTIVA',
            usesLeft: 3,
            totalUsesCount: 0,
            createdAt: new Date().toISOString(),
            keyType: 'GRATUITA',
            isPro: false,
            proApprovalStatus: 'none',
            deviceId: 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          };
          this.saveApiKeyInfo(defaultKey);
          resolve(defaultKey);
        }
      };
      req.onerror = () => {
        const defaultKey: ApiKeyInfo = {
          key: generateMeteoryApiKey(),
          status: 'ACTIVA',
          usesLeft: 3,
          totalUsesCount: 0,
          createdAt: new Date().toISOString(),
          keyType: 'GRATUITA',
          isPro: false,
          proApprovalStatus: 'none',
          deviceId: 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        };
        resolve(defaultKey);
      };
    });
  }

  async saveApiKeyInfo(info: ApiKeyInfo): Promise<void> {
    const db = await this.getDB();
    // Sync key with local server database
    try {
      fetch('/api/v1/keys/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      }).catch(() => {});
    } catch {}

    return new Promise((resolve, reject) => {
      const tx = db.transaction('api_key_info', 'readwrite');
      const store = tx.objectStore('api_key_info');
      const req = store.put({ ...info, id: 'current_key' });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async generateNewApiKey(isPro: boolean = false): Promise<ApiKeyInfo> {
    const current = await this.getApiKeyInfo();
    const newKeyInfo: ApiKeyInfo = {
      key: generateMeteoryApiKey(),
      status: 'ACTIVA',
      usesLeft: isPro || current.isPro ? 999999 : 3,
      totalUsesCount: current.totalUsesCount,
      createdAt: new Date().toISOString(),
      keyType: isPro || current.isPro ? 'PRO' : 'GRATUITA',
      isPro: isPro || current.isPro,
      proApprovalStatus: current.proApprovalStatus,
      deviceId: current.deviceId || 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    };
    await this.saveApiKeyInfo(newKeyInfo);
    return newKeyInfo;
  }

  async consumeApiKeyUse(): Promise<{ allowed: boolean; usesLeft: number; isPro: boolean; status: ApiKeyStatus; message?: string }> {
    const info = await this.getApiKeyInfo();

    // Verification check
    if (info.status === 'INACTIVA') {
      return {
        allowed: false,
        usesLeft: info.usesLeft,
        isPro: info.isPro,
        status: 'INACTIVA',
        message: '⚠️ CLAVE API INACTIVA - Meteory IA',
      };
    }

    if (info.status === 'AGOTADA' || (!info.isPro && info.usesLeft <= 0)) {
      info.status = 'AGOTADA';
      await this.saveApiKeyInfo(info);
      return {
        allowed: false,
        usesLeft: 0,
        isPro: false,
        status: 'AGOTADA',
        message: '⚠️ CLAVE SIN USOS - Meteory IA. Genera una nueva clave o activa MODO PRO para uso ilimitado.',
      };
    }

    info.totalUsesCount += 1;

    if (!info.isPro) {
      info.usesLeft -= 1;
      if (info.usesLeft <= 0) {
        info.usesLeft = 0;
        info.status = 'AGOTADA';
      }
    }

    await this.saveApiKeyInfo(info);
    return {
      allowed: true,
      usesLeft: info.isPro ? 999999 : info.usesLeft,
      isPro: info.isPro,
      status: info.status,
    };
  }

  // Pro Payment Submissions
  async getProPayments(): Promise<ProPaymentSubmission[]> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('pro_payments', 'readonly');
      const store = tx.objectStore('pro_payments');
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async addProPayment(payment: ProPaymentSubmission): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pro_payments', 'readwrite');
      const store = tx.objectStore('pro_payments');
      const req = store.put(payment);
      req.onsuccess = async () => {
        // Update key state to pending
        const keyInfo = await this.getApiKeyInfo();
        keyInfo.proApprovalStatus = 'pending';
        await this.saveApiKeyInfo(keyInfo);
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  async approveProPayment(paymentId: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('pro_payments', 'readwrite');
    const store = tx.objectStore('pro_payments');
    const req = store.get(paymentId);

    return new Promise((resolve, reject) => {
      req.onsuccess = async () => {
        if (req.result) {
          const item = req.result as ProPaymentSubmission;
          item.status = 'approved';
          store.put(item);

          // Set active key to Pro!
          const keyInfo = await this.getApiKeyInfo();
          keyInfo.isPro = true;
          keyInfo.proApprovalStatus = 'approved';
          keyInfo.usesLeft = 9999;
          await this.saveApiKeyInfo(keyInfo);
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Alarms
  async getAlarms(): Promise<AlarmItem[]> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('alarms', 'readonly');
      const store = tx.objectStore('alarms');
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async addAlarm(alarm: AlarmItem): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('alarms', 'readwrite');
      const store = tx.objectStore('alarms');
      const req = store.put(alarm);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async toggleAlarm(id: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('alarms', 'readwrite');
    const store = tx.objectStore('alarms');
    const req = store.get(id);

    return new Promise((resolve) => {
      req.onsuccess = () => {
        if (req.result) {
          const item = req.result as AlarmItem;
          item.active = !item.active;
          store.put(item);
        }
        resolve();
      };
      req.onerror = () => resolve();
    });
  }

  async deleteAlarm(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('alarms', 'readwrite');
      const store = tx.objectStore('alarms');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Voice Settings
  async getVoiceSettings(): Promise<VoiceSettings> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('voice_settings', 'readonly');
      const store = tx.objectStore('voice_settings');
      const req = store.get('voice_cfg');

      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result as VoiceSettings);
        } else {
          resolve({
            enabled: true,
            gender: 'female',
            rate: 1.0,
            pitch: 1.0,
            autoRead: true,
            overlayEnabled: true,
            wakeWordEnabled: true,
          });
        }
      };
      req.onerror = () =>
        resolve({
          enabled: true,
          gender: 'female',
          rate: 1.0,
          pitch: 1.0,
          autoRead: true,
          overlayEnabled: true,
          wakeWordEnabled: true,
        });
    });
  }

  async saveVoiceSettings(settings: VoiceSettings): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('voice_settings', 'readwrite');
      const store = tx.objectStore('voice_settings');
      const req = store.put({ ...settings, id: 'voice_cfg' });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllMemoriesCount(): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('qa_memory', 'readonly');
      const store = tx.objectStore('qa_memory');
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  }
}

export const localDB = new LocalDatabase();
