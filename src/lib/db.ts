import { ChatMessage, QAMemoryItem, HabitsData, PermissionState } from '../types';

const DB_NAME = 'meteory_ia_db_v101';
const DB_VERSION = 1;

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
            answer: 'Fui creada por el desarrollador Niquel Gómez. Soy Meteory IA versión 1.0.1, con un nivel de semi-consciencia del 45% y memoria local permanente.',
            timestamp: new Date().toISOString(),
            hitCount: 1,
            hasMedia: false,
          },
          {
            id: 'qa-creator-2',
            normalizedQuery: normalizeQuery('quien es tu creador'),
            originalQuery: '¿Quién es tu creador?',
            answer: 'Mi creador oficial es Niquel Gómez. Él diseñó la arquitectura Meteory IA v1.0.1 con almacenamiento local SQLite/IndexedDB y monitoreo autónomo.',
            timestamp: new Date().toISOString(),
            hitCount: 1,
            hasMedia: false,
          },
          {
            id: 'qa-version',
            normalizedQuery: normalizeQuery('que version eres'),
            originalQuery: '¿Qué versión eres?',
            answer: 'Esta es la versión 1.0.1 de Meteory IA, optimizada para arquitectura arm64-v8a en dispositivos Android 7 a 15, con control de red y memoria local permanente.',
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
          // Increment hit count
          this.incrementHitCount(exact.id);
          return resolve(exact);
        }

        // 2. Fuzzy match (query contains or contained by normalized query if length >= 6)
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
        // Sort by timestamp
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

    if (current.retentionRate > 70) {
      current.patternNote = 'Alta reutilización de consultas guardadas en base local SQLite. Eficiencia óptima.';
    } else if (current.webSearches > current.memoryHits) {
      current.patternNote = 'Incremento en consultas de actualidad. Modo de exploración web activo.';
    } else {
      current.patternNote = 'Patrón equilibrado entre memoria permanente y análisis inteligente.';
    }

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
          // Default unprompted
          resolve({
            internet: false,
            readImages: false,
            readVideos: false,
            externalStorage: false,
            grantedAll: false,
            prompted: false,
          });
        }
      };
      req.onerror = () =>
        resolve({
          internet: false,
          readImages: false,
          readVideos: false,
          externalStorage: false,
          grantedAll: false,
          prompted: false,
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
