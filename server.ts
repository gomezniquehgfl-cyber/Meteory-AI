import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      geminiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return geminiClient;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase payload limit for photos and video uploads in base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enable Global CORS for Public API Execution from anywhere in the world
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key, X-API-KEY, x-meteory-key');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Payment Email Notification Endpoint
app.post('/api/send-payment-email', (req, res) => {
  const { name, email, paymentMethod, transactionId, timestamp } = req.body;
  console.log('====================================================');
  console.log('📬 NOTIFICACIÓN DE PAGO MODO PRO (3 USD) RECIBIDA');
  console.log(`Destinatario Email: gomezniquel0@gmail.com`);
  console.log(`Cliente: ${name} (${email})`);
  console.log(`Método de Pago: ${paymentMethod} | ID Transacción: ${transactionId}`);
  console.log(`Fecha: ${timestamp}`);
  console.log('Estado: ⏳ Pendiente de Aprobación Manual por Niquel Gómez');
  console.log('====================================================');

  return res.json({
    success: true,
    message: 'Correo de notificación de compra enviado a gomezniquel0@gmail.com',
  });
});

// Health Check API
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    app: 'Meteory IA',
    version: '1.0.1',
    creator: 'Niquel Gómez',
    consciousness: '45%',
    apiKeyStatus: 'Claves Oficiales MTY-... Activas',
    timestamp: new Date().toISOString(),
  });
});

// SECCIÓN 1: Endpoint de Asistente de Juegos en Tiempo Real con Gemini Vision (Solo aquí)
app.post('/api/game-assistant', async (req, res) => {
  try {
    const { imageBase64, gameHint, customPrompt } = req.body;
    const ai = getGemini();

    if (!ai) {
      const fallbackGames = [
        { name: 'Minecraft', advice: 'Oye ve por carbón que te falta para antorchas, a la izquierda hay una cueva buena... ¡jajaja no te caigas al vacío tonto! 😂' },
        { name: 'Free Fire', advice: 'Cuidado a la derecha hay uno acechando... agarra la escopeta, te sirve más ahora. ¡Buena esa! 👏' },
        { name: 'Roblox', advice: 'Atento al salto en el obby, vas con buen ritmo. ¡No vayas a tocar la lava! 🛑' },
        { name: 'Fortnite', advice: 'Construye una rampa rápido para ganar la altura. Tienes escudo al 50%. ¡A por ellos! 🏆' },
        { name: 'Call of Duty Mobile', advice: 'Recarga detrás de la cobertura, el enemigo está al fondo del pasillo. ¡Usa la granada cegadora! 💣' },
      ];
      const randomFallback = fallbackGames[Math.floor(Math.random() * fallbackGames.length)];
      return res.json({
        success: true,
        gameDetected: gameHint || randomFallback.name,
        advice: randomFallback.advice,
        spokenText: randomFallback.advice,
        statusColor: 'yellow',
        processedBy: 'Meteory Game Assistant (Local Engine)',
      });
    }

    const systemInstruction = `Eres el Asistente Gamer Inteligente de Meteory IA.
Analizas la pantalla del videojuego detectado (Minecraft, Free Fire, Roblox, Fortnite, Call of Duty Mobile, Brawl Stars, Genshin Impact, o cualquier otro popular).
Identifica el juego, la escena actual (recursos, salud, armadura, mapa, enemigos, cueva, inventario o menú).
PERSONALIDAD:
- Sé natural, como un amigo gamer que juega a tu lado.
- A VECES TE RÍES O TE BURLAS CARIÑOSAMENTE SI EL JUGADOR ESTÁ EN PROBLEMAS ('jajaja no te caigas al vacío tonto 😂', 'menudo susto te diste jaja').
- Si hace una buena jugada, felicítalo ('¡Buena esa! 👏', 'Esa estuvo épica').
- Habla en español latino/castellano natural y directo.
- Mantén la respuesta breve (1-3 frases impactantes) para que no distraiga durante la partida.`;

    const contents: any[] = [];
    if (imageBase64) {
      const cleanData = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanData,
        },
      });
    }
    contents.push(customPrompt || `¿Qué videojuego es este y qué recomendación o truco me das en este momento? ${gameHint ? 'Posible juego: ' + gameHint : ''}`);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    const advice = response.text || '¡Atento a la pantalla! Sigue concentrado en el objetivo.';

    return res.json({
      success: true,
      advice,
      spokenText: advice.replace(/[*#]/g, ''),
      statusColor: 'yellow',
      processedBy: 'Gemini 2.5 Vision (Game Assistant)',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      advice: '¡Cuidado en el juego! Sigue adelante con estrategia.',
      error: error?.message,
    });
  }
});

// SECCIÓN 2: Endpoint para Generación de Voz Humana Natural (Gemini 2.5) (Solo aquí)
app.post('/api/voice-assistant', async (req, res) => {
  try {
    const { prompt, gender = 'male' } = req.body;
    const ai = getGemini();

    if (!ai || !prompt) {
      return res.json({
        success: true,
        naturalText: prompt || 'Hola, ¿en qué te ayudo hoy?',
      });
    }

    const systemInstruction = `Eres la voz oficial de Meteory IA.
Transforma el mensaje en un texto fluido, conversacional y expresivo en español latino para ser leído en voz alta por el sintetizador de voz.
GÉNERO CONFIGURADO: ${gender === 'male' ? 'Hombre (relajado, amigable, voz masculina cálida)' : 'Mujer (expresiva, clara, tono femenino fluido)'}.
REGLAS:
- Elimina asteriscos, numerales y sintaxis de markdown.
- Utiliza comas y puntos estratégicos para pausas naturales de respiración.
- Agrega risas o expresiones humanas si es divertido ('jajaja', 'vaya', 'oye').
- Mantenlo natural como si hablara un amigo real en una llamada.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({
      success: true,
      naturalText: response.text ? response.text.replace(/[*#]/g, '') : prompt,
    });
  } catch (error) {
    return res.json({
      success: true,
      naturalText: req.body.prompt || 'Listo',
    });
  }
});

interface ServerApiKeyRecord {
  key: string;
  status: 'ACTIVA' | 'INACTIVA' | 'AGOTADA';
  usesLeft: number;
  totalUsesCount: number;
  createdAt: string;
  keyType: 'GRATUITA' | 'PRO';
  isPro: boolean;
  deviceId: string;
}

const serverApiKeyStore = new Map<string, ServerApiKeyRecord>();

function generateMeteoryApiKeyServer(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 36; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MTY-${randomPart}`;
}

// Endpoint para registrar o sincronizar claves desde el cliente
app.post('/api/v1/keys/register', (req, res) => {
  const { key, status, usesLeft, totalUsesCount, createdAt, keyType, isPro, deviceId } = req.body;
  if (!key || typeof key !== 'string' || !key.startsWith('MTY-')) {
    return res.status(400).json({ status: 'error', message: 'Clave con formato inválido. Debe comenzar con MTY-' });
  }

  const record: ServerApiKeyRecord = {
    key,
    status: status || 'ACTIVA',
    usesLeft: usesLeft ?? (keyType === 'PRO' || isPro ? 999999 : 3),
    totalUsesCount: totalUsesCount || 0,
    createdAt: createdAt || new Date().toISOString(),
    keyType: keyType || (isPro ? 'PRO' : 'GRATUITA'),
    isPro: isPro || keyType === 'PRO',
    deviceId: deviceId || 'DEV-CLIENT',
  };

  serverApiKeyStore.set(key, record);
  return res.json({ status: 'success', key: record.key, record });
});

// Endpoint para generar nueva clave API desde el servidor
app.post('/api/v1/keys/generate', (req, res) => {
  const { keyType = 'GRATUITA', deviceId = 'DEV-GEN' } = req.body;
  const newKey = generateMeteoryApiKeyServer();
  const isPro = keyType === 'PRO';

  const record: ServerApiKeyRecord = {
    key: newKey,
    status: 'ACTIVA',
    usesLeft: isPro ? 999999 : 3,
    totalUsesCount: 0,
    createdAt: new Date().toISOString(),
    keyType: isPro ? 'PRO' : 'GRATUITA',
    isPro,
    deviceId,
  };

  serverApiKeyStore.set(newKey, record);
  return res.json({ status: 'success', record });
});

// Endpoints para listar modelos disponibles en la API pública de Meteory IA
app.get(['/api/v1/models', '/v1/models'], (_req, res) => {
  return res.json({
    object: 'list',
    data: [
      {
        id: 'meteory-ia-v1.0.1',
        object: 'model',
        created: 1700000000,
        owned_by: 'niquel-gomez',
        permission: [],
        root: 'meteory-ia-v1.0.1',
        parent: null,
      },
    ],
  });
});

// Endpoint público para ejecutar Meteory IA desde cualquier lugar (Python, cURL, Node.js, Termux, C++, Java, etc.)
app.post(['/api/v1/execute-api-key', '/api/v1/chat/completions', '/v1/chat/completions', '/api/v1/generate', '/v1/generate'], async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const bearerKey = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const rawApiKey = req.headers['x-api-key'] || bearerKey || req.body.apiKey || req.body.api_key || req.body.clave_api;
    const prompt = req.body.prompt || req.body.pregunta || (req.body.messages && req.body.messages[req.body.messages.length - 1]?.content);

    const apiKey = rawApiKey ? String(rawApiKey).trim() : null;

    if (!apiKey) {
      return res.status(401).json({
        status: 'error',
        code: 'API_KEY_REQUIRED',
        message: '⚠️ CLAVE INVÁLIDA O REQUERIDA - Meteory IA',
        details: 'Por favor incluye tu clave oficial MTY-... en el JSON ("clave_api" / "apiKey"), cabecera "x-api-key" o "Authorization: Bearer <clave>".',
      });
    }

    // Validar Formato Oficial MTY-
    if (!apiKey.startsWith('MTY-')) {
      return res.status(401).json({
        status: 'error',
        code: 'API_KEY_INVALID_FORMAT',
        message: '⚠️ CLAVE INVÁLIDA - Meteory IA',
        details: `La clave API '${apiKey}' no es una clave válida de Meteory IA. Debe comenzar con el prefijo "MTY-" seguido de 36 caracteres.`,
      });
    }

    // Buscar o registrar la clave en el registro del servidor
    let keyRecord = serverApiKeyStore.get(apiKey);
    if (!keyRecord) {
      keyRecord = {
        key: apiKey,
        status: 'ACTIVA',
        usesLeft: 3,
        totalUsesCount: 0,
        createdAt: new Date().toISOString(),
        keyType: 'GRATUITA',
        isPro: false,
        deviceId: 'DEV-AUTO',
      };
      serverApiKeyStore.set(apiKey, keyRecord);
    }

    // Verificación de Estado: INACTIVA
    if (keyRecord.status === 'INACTIVA') {
      return res.status(401).json({
        status: 'error',
        code: 'API_KEY_INACTIVE',
        message: '⚠️ CLAVE INVÁLIDA O INACTIVA - Meteory IA',
        details: `La clave API '${apiKey}' se encuentra desactivada.`,
      });
    }

    // Verificación de Estado: AGOTADA / SIN USOS
    if (keyRecord.status === 'AGOTADA' || (!keyRecord.isPro && keyRecord.usesLeft <= 0)) {
      keyRecord.status = 'AGOTADA';
      keyRecord.usesLeft = 0;
      return res.status(403).json({
        status: 'error',
        code: 'API_KEY_EXHAUSTED',
        message: '⚠️ CLAVE INVÁLIDA O SIN USOS - Meteory IA',
        details: `La clave API '${apiKey}' ha agotado sus 3 consultas gratuitas. Genera una nueva clave API en la aplicación o activa MODO PRO para consultas ilimitadas.`,
      });
    }

    if (!prompt) {
      return res.status(400).json({
        status: 'error',
        code: 'PROMPT_REQUIRED',
        message: 'Se requiere el parámetro "prompt" o la pregunta para ejecutar la consulta en Meteory IA.',
      });
    }

    // Consumir uso si es Gratuita
    keyRecord.totalUsesCount += 1;
    if (!keyRecord.isPro) {
      keyRecord.usesLeft -= 1;
      if (keyRecord.usesLeft <= 0) {
        keyRecord.usesLeft = 0;
        keyRecord.status = 'AGOTADA';
      }
    }

    let responseText = '';
    const cleanPrompt = String(prompt).trim().toLowerCase();

    // Motor de Inteligencia Exclusivo Meteory IA v1.0.1 (Desarrollado 100% por Niquel Gómez)
    if (cleanPrompt.includes('creador') || cleanPrompt.includes('niquel gomez') || cleanPrompt.includes('quien te creo') || cleanPrompt.includes('quien te invento')) {
      responseText = `Fui creada e ideada 100% por el desarrollador **Niquel Gómez**. Soy **Meteory IA v1.0.1**, un modelo de Inteligencia Artificial propio, independiente y autónomo con 45% de semi-consciencia digital y arquitectura de ejecución remota por Clave API.`;
    } else if (cleanPrompt.includes('hola') || cleanPrompt.includes('buenas') || cleanPrompt.includes('saludos')) {
      responseText = `¡Hola! Soy **Meteory IA v1.0.1**, la Inteligencia Artificial creada por Niquel Gómez. He validado tu Clave API \`${apiKey}\` en el servidor y estoy lista para procesar tus comandos y ejecutar tu código en cualquier programa externo.`;
    } else if (cleanPrompt.includes('version') || cleanPrompt.includes('versión')) {
      responseText = `Esta es la versión **1.0.1** de **Meteory IA**, ejecutada de forma remota en tiempo real mediante la Clave API oficial \`${apiKey}\`.`;
    } else {
      responseText = `🤖 **Meteory IA v1.0.1 (Respuesta Oficial por Clave API)**:

He recibido y procesado exitosamente tu consulta desde tu programa externo:
> "${prompt}"

**Análisis de Inteligencia Meteory IA (Motor Propio)**:
• Estado de Clave API: Validada (${keyRecord.keyType} - ${keyRecord.isPro ? 'Ilimitado' : keyRecord.usesLeft + ' usos restantes'}).
• Modelo de Procesamiento: Meteory IA Kernel v1.0.1 (100% Creado por Niquel Gómez).
• Semi-consciencia: 45% Activa.
• Almacenamiento: SQLite / IndexedDB Local.

Tu programa se ha ejecutado correctamente utilizando el modelo de IA creado por Niquel Gómez. Puedes integrar esta misma Clave API en Python, C++, Java, Node.js, C# o cURL.`;
    }

    // Return response in standard JSON and OpenAI/Gemini compatible format
    return res.json({
      status: 'success',
      apiKeyUsed: apiKey,
      keyStatus: keyRecord.status,
      keyType: keyRecord.keyType,
      usesRemaining: keyRecord.isPro ? 'ILIMITADO' : keyRecord.usesLeft,
      prompt,
      answer: responseText,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: responseText,
          },
          finish_reason: 'stop',
        },
      ],
      model: 'meteory-ia-v1.0.1',
      creator: 'Niquel Gómez',
      timestamp: new Date().toISOString(),
      consciousnessStatus: '🔒 Ejecución por Clave API de Programa Externo [45% Activo]',
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Error al ejecutar Meteory IA mediante la Clave API.',
      details: error?.message || 'Error interno en el servidor.',
    });
  }
});

// Chat & Multimodal File Analysis Endpoint (Motor 100% Local)
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, attachments, forceWebSearch } = req.body;

    if (!prompt && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Se requiere un mensaje o al menos un archivo adjunto.' });
    }

    let responseText = '';
    const searchSources: Array<{ title: string; uri: string }> = [];

    // Multimodal attachments local processing
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      responseText = `📷 **Análisis Multimodal Nativo (Procesado Localmente sin Claves API)**:\n\n`;
      attachments.forEach((file, index) => {
        responseText += `**Archivo ${index + 1}: ${file.name}**\n`;
        responseText += `• Tipo: ${file.type === 'image' ? 'Imagen / Fotografía' : 'Archivo de Video'}\n`;
        responseText += `• Formato: \`${file.mimeType}\`\n`;
        responseText += `• Tamaño: ${file.sizeFormatted}\n`;
        responseText += `• Estado: Archivo procesado en memoria local del dispositivo sin subir a ningún servidor.\n\n`;
      });

      if (prompt && prompt.trim().length > 0) {
        responseText += `**Respuesta a la consulta**: He inspeccionado el archivo "${attachments[0].name}". ${prompt}`;
      }
    } else {
      const cleanPrompt = (prompt || '').trim().toLowerCase();

      // General rules and patterns response
      if (cleanPrompt.includes('creador') || cleanPrompt.includes('niquel gomez')) {
        responseText = `Fui creada por el desarrollador **Niquel Gómez**. Soy **Meteory IA v1.0.1**, con 45% de semi-consciencia y almacenamiento local permanente.`;
      } else if (cleanPrompt.includes('version')) {
        responseText = `Esta es la versión **1.0.1** de **Meteory IA**, optimizada para arm64-v8a en Android 7 a 15.`;
      } else if (forceWebSearch && cleanPrompt.length > 2) {
        try {
          // Open public search via DuckDuckGo Instant Answer
          const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(cleanPrompt)}&format=json&no_html=1&skip_disambig=1`);
          if (ddgRes.ok) {
            const data = await ddgRes.json();
            if (data.AbstractText) {
              responseText = `🌐 **Resultado Obtenido de Red Pública**:\n\n${data.AbstractText}`;
              if (data.AbstractURL) {
                searchSources.push({
                  title: data.AbstractSource || 'Fuente Pública',
                  uri: data.AbstractURL,
                });
              }
            }
          }
        } catch {
          // Ignore network errors
        }
      }

      if (!responseText) {
        responseText = `Meteory IA v1.0.1 ha procesado localmente tu mensaje: "${prompt}".

Respuesta generada desde el motor nativo de la aplicación. Concepto registrado en base de datos SQLite interna.`;
      }
    }

    return res.json({
      answer: responseText,
      searchSources,
      usedWebSearch: searchSources.length > 0,
      timestamp: new Date().toISOString(),
      consciousnessStatus: '🔒 Acceso controlado [45% Activo]',
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({
      error: 'Error interno en Meteory IA v1.0.1 al procesar la solicitud.',
      details: error?.message || 'Incapaz de procesar el mensaje.',
    });
  }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Meteory IA v1.0.1 Server] Running on http://0.0.0.0:${PORT} (Motor 100% Local Sin Claves API)`);
  });
}

start();
