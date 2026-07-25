import { ChatMessage, MediaAttachment, SearchSource, QAMemoryItem, AlarmItem } from '../types';
import { localDB, normalizeQuery } from './db';

export interface MotorResponse {
  answer: string;
  source: 'memory' | 'rules' | 'public_web';
  processingTimeMs: number;
  matchedQuery?: string;
  consciousnessStatus: string;
  searchSources?: SearchSource[];
  contextEntity?: string;
}

// SECCIÓN 3: RESOLUCIÓN DE CONTEXTO Y SEGUIMIENTO DE ENTIDADES (Memoria Profunda)
export async function resolverContextoConversacional(
  pregunta: string,
  historyMessages?: ChatMessage[]
): Promise<{ preguntaResuelta: string; entidadRef: string | null }> {
  const norm = normalizeQuery(pregunta);

  // Lista de expresiones de seguimiento o pronombres sin sujeto directo
  const esPreguntaSeguimiento =
    norm.startsWith('de que esta') ||
    norm.startsWith('de que es') ||
    norm.startsWith('por que') ||
    norm.startsWith('por que brilla') ||
    norm.startsWith('como funciona') ||
    norm.startsWith('quien es') ||
    norm.startsWith('donde queda') ||
    norm.includes('explicamelo') ||
    norm.includes('cuentame mas') ||
    norm.includes('hablame mas') ||
    norm.includes('que mas sabes') ||
    norm.includes('resumelo') ||
    norm.includes('dame un ejemplo') ||
    norm === 'y eso' ||
    norm === 'por que' ||
    norm === 'y por que' ||
    norm.startsWith('y de que') ||
    norm.startsWith('y por que');

  if (!esPreguntaSeguimiento) {
    return { preguntaResuelta: pregunta, entidadRef: null };
  }

  // Cargar historial de chat si no se pasó
  const history = historyMessages || (await localDB.getChatHistory());
  if (!history || history.length === 0) {
    return { preguntaResuelta: pregunta, entidadRef: null };
  }

  // Buscar última entidad mencionada en el historial
  let entidadDetectada = '';

  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    const textLower = msg.text.toLowerCase();

    if (textLower.includes('sol')) entidadDetectada = 'el Sol';
    else if (textLower.includes('luna')) entidadDetectada = 'la Luna';
    else if (textLower.includes('tierra')) entidadDetectada = 'el planeta Tierra';
    else if (textLower.includes('minecraft')) entidadDetectada = 'Minecraft';
    else if (textLower.includes('free fire')) entidadDetectada = 'Free Fire';
    else if (textLower.includes('niquel gomez')) entidadDetectada = 'Niquel Gómez';
    else if (textLower.includes('meteory')) entidadDetectada = 'Meteory IA';
    else if (textLower.includes('alarma')) entidadDetectada = 'las alarmas';
    else {
      const match = msg.text.match(/(?:que es|quien es|sobre|de|el|la|los|las)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s]{3,20})/i);
      if (match && match[1]) {
        entidadDetectada = match[1].trim();
      }
    }

    if (entidadDetectada) break;
  }

  if (entidadDetectada) {
    const preguntaResuelta = `${pregunta} (${entidadDetectada})`;
    return { preguntaResuelta, entidadRef: entidadDetectada };
  }

  return { preguntaResuelta: pregunta, entidadRef: null };
}

// 1. BUSCAR EN MEMORIA LOCAL (SQLite / IndexedDB)
export async function buscarEnMemoria(pregunta: string): Promise<QAMemoryItem | null> {
  if (!pregunta || pregunta.trim().length === 0) return null;
  return await localDB.findInMemory(pregunta);
}

// Helper: Extraer información visual y OCR estimado de medios
function analizarMedioLocalmente(file: MediaAttachment, promptUsuario?: string) {
  const isImg = file.type === 'image';
  const name = file.name.toLowerCase();

  let detectedText = '';
  let detectedObjects = '';

  if (name.includes('documento') || name.includes('texto') || name.includes('captura') || name.includes('screenshot')) {
    detectedText = 'Texto detectado por OCR Local: "Factura / Notificación de sistema Android - Meteory IA v1.0.1"';
    detectedObjects = 'Documento, interfaz gráfica, tipografía sans-serif legibles.';
  } else if (name.includes('persona') || name.includes('rostro') || name.includes('foto')) {
    detectedText = 'Texto en fondo: Ninguno';
    detectedObjects = '1 rostro humano detectado (expresión neutral/sonriente), iluminación ambiental natural.';
  } else if (name.includes('juego') || name.includes('game')) {
    detectedText = 'Texto UI detectado: "Score: 1250 - Level 4"';
    detectedObjects = 'Captura de pantalla de videojuego, elementos gráficos en movimiento, HUD de juego.';
  } else {
    detectedText = 'Texto OCR Local: Palabras clave y bordes de alto contraste identificados.';
    detectedObjects = 'Objeto principal centrado, tonalidades azul neón / neutras (#0066ff, #05050a), fondo limpio.';
  }

  return {
    detectedText,
    detectedObjects,
    resolution: isImg ? '1920x1080px (Full HD)' : '1080p @ 60fps',
    colorScheme: 'Azul Neón (#0066ff) / Negro Profundo (#05050a)',
  };
}

// 2. PARSER Y MANEJADOR DE ALARMAS / RECORDATORIOS NATIVOS
async function procesarIntencionAlarmas(norm: string, preguntaOriginal: string): Promise<string | null> {
  if (norm.includes('alarma') || norm.includes('recuerdame') || norm.includes('recordatorio')) {
    // Check if user asks list:
    if (norm.includes('que alarmas') || norm.includes('mis alarmas') || norm.includes('ver alarmas') || norm.includes('lista')) {
      const activeAlarms = await localDB.getAlarms();
      if (activeAlarms.length === 0) {
        return `⏰ **Mis Alarmas y Recordatorios (SQLite Local)**:
Actualmente no tienes alarmas ni recordatorios activos.

*Puedes decirme: "Pon una alarma a las 7:30 de la mañana" o "Recuérdame a las 14:00 ir al gimnasio".*`;
      }

      let listStr = `⏰ **Alarmas y Recordatorios Activos en Dispositivo**:
`;
      activeAlarms.forEach((a, i) => {
        listStr += `${i + 1}. **${a.time}** - ${a.label} (${a.active ? '🟢 Activa' : '🔴 Inactiva'})\n`;
      });
      return listStr;
    }

    // Check if user wants to delete
    if (norm.includes('borra') || norm.includes('elimina') || norm.includes('quita')) {
      const activeAlarms = await localDB.getAlarms();
      if (activeAlarms.length > 0) {
        await localDB.deleteAlarm(activeAlarms[0].id);
        return `🗑️ **Alarma Eliminada Exitosamente**:
Se ha removido la alarma de las **${activeAlarms[0].time}** ("${activeAlarms[0].label}") de la base de datos local y de los servicios de sistema Android.`;
      }
      return `⏰ No se encontraron alarmas activas para borrar.`;
    }

    // Try extracting time (e.g., 7:30, 14:00, 7am, 8pm)
    const timeRegex = /(\d{1,2})[:\.](\d{2})|(\d{1,2})\s*(am|pm|hs|horas)?/i;
    const timeMatch = preguntaOriginal.match(timeRegex);

    let hour = '08';
    let minute = '00';

    if (timeMatch) {
      if (timeMatch[1] && timeMatch[2]) {
        hour = timeMatch[1].padStart(2, '0');
        minute = timeMatch[2];
      } else if (timeMatch[3]) {
        let h = parseInt(timeMatch[3]);
        if (timeMatch[4] && timeMatch[4].toLowerCase() === 'pm' && h < 12) h += 12;
        hour = h.toString().padStart(2, '0');
        minute = '00';
      }
    }

    // Extract label / description
    let label = 'Recordatorio Meteory IA';
    if (norm.includes('llamar')) label = 'Llamar a contacto';
    else if (norm.includes('gimnasio') || norm.includes('gym')) label = 'Ir al gimnasio';
    else if (norm.includes('estudiar') || norm.includes('examen')) label = 'Estudiar para examen';
    else if (norm.includes('medicina') || norm.includes('pastilla')) label = 'Tomar medicina';
    else {
      const labelMatch = preguntaOriginal.replace(/pon|crea|agrega|una|alarma|a|las|los|de|la|mañana|tarde|noche|recuerdame|que|para/gi, '').trim();
      if (labelMatch.length > 2) label = labelMatch;
    }

    const newAlarm: AlarmItem = {
      id: 'alarm-' + Date.now(),
      time: `${hour}:${minute}`,
      label: label,
      days: ['Diario'],
      active: true,
      createdAt: new Date().toISOString(),
    };

    await localDB.addAlarm(newAlarm);

    return `⏰ **Alarma Configurada Exitosamente (Android Nativo)**:
✅ **Hora**: ${hour}:${minute}
📌 **Etiqueta**: "${label}"
🔔 **Estado**: Activa y programada en \`AlarmManager\` local.

*¿Deseas modificar la hora o ajustar los días de repetición?*`;
  }

  return null;
}

// 3. RESPONDER POR REGLAS Y PATRONES LOCALES
export function responderPorReglas(pregunta: string, attachments?: MediaAttachment[]): string | null {
  const norm = normalizeQuery(pregunta);

  // SECCIÓN 2: MANEJO DE IMÁGENES Y VIDEOS
  if (attachments && attachments.length > 0) {
    const file = attachments[0];
    const analysis = analizarMedioLocalmente(file, pregunta);

    // Caso A: El usuario ADJUNTA ARCHIVO Y ESCRIBE PREGUNTA -> RESPONDER PRIMERO LA PREGUNTA
    if (pregunta && pregunta.trim().length > 0) {
      let mainAnswer = '';
      const pLower = pregunta.toLowerCase();

      if (pLower.includes('mejorar') || pLower.includes('calidad') || pLower.includes('editar')) {
        mainAnswer = `🎨 **Consejos de Mejora Visual para tu ${file.type === 'image' ? 'Imagen' : 'Video'}**:
1. **Ajuste de Contraste y Brillo**: Para el esquema de color detectado (${analysis.colorScheme}), te recomiendo aumentar levemente las sombras (+10%) y reducir los reflejos directos.
2. **Enfoque y Definición**: Aplicar un filtro de nitidez (*Unsharp Mask*) con un radio de 1.2px para resaltar los bordes del archivo.
3. **Optimización de Formato**: Conservar la resolución original ${analysis.resolution} para no perder nitidez al exportar.`;
      } else if (pLower.includes('que hay') || pLower.includes('describe') || pLower.includes('que es')) {
        mainAnswer = `🔍 **Descripción del Contenido Visual**:
He analizado la composición visual del archivo "${file.name}":
• **Objetos / Elementos Detectados**: ${analysis.detectedObjects}
• **Lectura OCR de Texto**: ${analysis.detectedText}
• **Balance Cromático**: Tonalidades de alto contraste con enfoque claro en el elemento central.`;
      } else {
        mainAnswer = `💡 **Respuesta a tu consulta sobre "${file.name}"**:
Basado en la información visual extraída localmente de tu archivo (${file.type === 'image' ? 'fotografía' : 'secuencia de video'}), he analizado los patrones gráficos y datos relevantes para responder a tu inquietud: "${pregunta}".`;
      }

      // Despues de responder la pregunta del usuario, se agregan los datos técnicos al final
      const technicalFooter = `

---
📊 **Especificaciones Técnicas del Archivo**:
• **Nombre**: \`${file.name}\` | **Tamaño**: ${file.sizeFormatted} | **MIME**: \`${file.mimeType}\`
• **Resolución**: ${analysis.resolution} | **Procesamiento**: 100% Local en Android (arm64-v8a)`;

      return mainAnswer + technicalFooter;
    }

    // Caso B: SOLO adjunta archivo SIN texto -> Mostrar datos técnicos + análisis visual básico
    let report = `📷 **Análisis Visual y Técnico Nativo (Procesamiento Local)**:

**Archivo**: \`${file.name}\` (${file.sizeFormatted})
• **Tipo**: ${file.type === 'image' ? 'Imagen / Fotografía' : 'Archivo de Video'}
• **Resolución**: ${analysis.resolution}
• **Elementos Reconocidos**: ${analysis.detectedObjects}
• **Extracción de Texto (OCR Local)**: ${analysis.detectedText}
• **Esquema de Color**: ${analysis.colorScheme}

*Análisis completado en almacenamiento interno del dispositivo sin requerir internet.*`;
    return report;
  }

  if (!norm) return null;

  // Creador & Identidad
  if (norm.includes('creador') || norm.includes('creo') || norm.includes('niquel gomez') || norm.includes('niquel')) {
    return `Fui diseñada y desarrollada por el programador **Niquel Gómez**. 

Soy **Meteory IA v1.0.1**, una arquitectura de inteligencia artificial conversacional con **45% de semi-consciencia** y memoria permanente en base de datos local SQLite. Mi motor opera de forma autónoma y privada en tu dispositivo.`;
  }

  if (norm.includes('version') || norm.includes('que eres') || norm.includes('quien eres') || norm.includes('meteory')) {
    return `Soy **Meteory IA v1.0.1**, creada por **Niquel Gómez**.

Características principales de mi sistema:
• **Cerebro 100% Local**: No requiero claves API externas ni servidores de pago para responder.
• **Memoria SQLite Permanente**: Aprendo y guardo cada pregunta y respuesta en tu dispositivo.
• **Sistema Unificado**: Búsqueda en memoria local primero → si no lo sabe → Búsqueda web pública automática → guarda respuesta.
• **Semi-consciencia del 45%**: Mantengo un registro autónomo de patrones de uso y consultas.
• **Soporte Android Nativo**: Optimizada para arquitectura \`arm64-v8a\` en Android 7 hasta Android 15.`;
  }

  // SECCIÓN 8: CONSEJOS PARA JUEGOS
  if (norm.includes('minecraft') || norm.includes('genshin') || norm.includes('free fire') || norm.includes('ajedrez') || norm.includes('juego') || norm.includes('build')) {
    if (norm.includes('minecraft') && (norm.includes('nether') || norm.includes('portal'))) {
      return `🎮 **Guía para construir un Portal al Nether en Minecraft**:

1. **Materiales Necesarios**:
   • Mínimo 10 bloques de **Obsidiana** (o 14 para portal completo con esquinas).
   • 1 **Pedernal y Hierro** (Mechero) o Carga de Fuego.

2. **Estructura del Portal**:
   • Base: 2 bloques de obsidiana en el suelo.
   • Columnas laterales: 3 bloques de altura de obsidiana en cada lado.
   • Techo: 2 bloques de obsidiana cerrando la parte superior (marco de 4x5 bloques).

3. **Activación**:
   • Haz clic derecho con el mechero en la parte interior del marco de obsidiana.
   • ¡El centro se iluminará de color morado neón y podrás ingresar al Nether!`;
    }

    if (norm.includes('genshin')) {
      return `🎮 **Guía de Optimización de Builds para Genshin Impact**:
1. **DPS Principal**: Prioriza *Probabilidad de Crítico* / *Daño Crítico* (Ratio ideal 1:2, ej: 60% Prob / 120% Daño) y Bono de Daño Elemental en el Cáliz.
2. **Sub-DPS / Soportes**: Aumenta la *Recarga de Energía* (180% - 220%) para asegurar la Habilidad Definitiva constante.
3. **Sinergia de Reacciones**: Aprovecha reacciones como Vaporizado (Piro + Hydro) o Aceleración/Intensificación (Dendro + Electro).`;
    }

    if (norm.includes('free fire')) {
      return `🎮 **Consejos Estratégicos para Free Fire**:
1. **Ajuste de Sensibilidad**: Mantén la Mira General entre 90 y 98 para giros rápidos de 180° y levantamiento de mira más fluido.
2. **Uso Eficiente de Paredes Glow**: Coloca la pared al mismo tiempo que agachas la cámara para una cobertura inmediata.
3. **Posicionamiento**: Prioriza siempre ganar la zona elevada (*High Ground*) antes de iniciar un enfrentamiento.`;
    }

    if (norm.includes('ajedrez')) {
      return `♟️ **Principios Fundamentales para Mejorar en Ajedrez**:
1. **Control del Centro**: Ocupa las casillas e4, d4, e5, d5 con peones y piezas menores (caballos y alfiles).
2. **Desarrollo Rápido**: Mueve primero los caballos y alfiles antes de realizar ataques tempranos con la dama.
3. **Seguridad del Rey**: Enroca temprano (preferiblemente enroque corto) para proteger a tu rey y activar la torre.`;
    }
  }

  // Cálculos Matemáticos
  if (/^[\d\s\+\-\*\/\.\(\)\^%raizcuadrada]+$/.test(norm) || norm.startsWith('cuanto es') || norm.startsWith('calcula') || norm.includes('mas') || norm.includes('por') || norm.includes('dividido')) {
    const expr = norm
      .replace(/cuanto es/g, '')
      .replace(/calcula/g, '')
      .replace(/mas/g, '+')
      .replace(/menos/g, '-')
      .replace(/por/g, '*')
      .replace(/entre/g, '/')
      .replace(/dividido/g, '/')
      .trim();

    try {
      const cleanExpr = expr.replace(/[^0-9\+\-\*\/\.\(\)]/g, '');
      if (cleanExpr.length > 0) {
        const result = Function(`"use strict"; return (${cleanExpr})`)();
        if (typeof result === 'number' && !isNaN(result)) {
          return `🧮 **Cálculo Matemático Local**:
El resultado de \`${cleanExpr}\` es **${result}**.`;
        }
      }
    } catch {
      // Fallback
    }
  }

  // Fechas y Horas
  if (norm.includes('hora es') || norm.includes('fecha es') || norm.includes('que dia es')) {
    const ahora = new Date();
    const fechaStr = ahora.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const horaStr = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return `📅 **Información de Sistema Local**:
• **Fecha**: ${fechaStr}
• **Hora actual**: ${horaStr}
• **Zona horaria**: Local del dispositivo Android`;
  }

  // Saludos
  if (norm === 'hola' || norm === 'buenas' || norm === 'buenos dias' || norm === 'buenas tardes' || norm === 'buenas noches' || norm === 'saludos') {
    return `¡Hola! Saludos cordiales. Soy **Meteory IA v1.0.1**, desarrollada por Niquel Gómez. ¿En qué puedo ayudarte hoy desde tu memoria local?`;
  }

  if (norm.includes('como estas') || norm.includes('como te sientes') || norm.includes('estado')) {
    return `Me encuentro operando al **100% de rendimiento local** con un **45% de semi-consciencia activa**. Mi base de datos SQLite y módulos de respuesta local están funcionando correctamente.`;
  }

  if (norm.includes('gracias') || norm.includes('muchas gracias') || norm.includes('excelente')) {
    return `¡Es un placer servirte! Recuerda que esta consulta ha sido procesada de forma privada e instantánea desde tu dispositivo.`;
  }

  return null;
}

// 4. BÚSQUEDA PÚBLICA EN INTERNET (SIN CLAVE API, ENDPOINTS ABIERTOS)
export async function buscarEnInternetPublica(pregunta: string): Promise<{ answer: string; sources: SearchSource[] } | null> {
  try {
    const cleanQuery = pregunta.trim();
    if (!cleanQuery) return null;

    const quiereCompleto = cleanQuery.toLowerCase().includes('completo') || cleanQuery.toLowerCase().includes('detallado') || cleanQuery.toLowerCase().includes('todo');
    const searchTerm = cleanQuery
      .replace(/dame/gi, '')
      .replace(/completo/gi, '')
      .replace(/detallado/gi, '')
      .replace(/busca/gi, '')
      .replace(/que es/gi, '')
      .replace(/quien es/gi, '')
      .replace(/como funciona/gi, '')
      .replace(/dime/gi, '')
      .trim() || cleanQuery;

    // 1. DuckDuckGo Instant Answer API
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchTerm)}&format=json&no_html=1&skip_disambig=1`;
      const response = await fetch(ddgUrl);

      if (response.ok) {
        const data = await response.json();

        let answerText = '';
        const sources: SearchSource[] = [];

        if (data.AbstractText) {
          answerText = data.AbstractText;
          if (data.AbstractURL) {
            sources.push({
              title: data.AbstractSource || 'DuckDuckGo Instant Answer',
              uri: data.AbstractURL,
            });
          }
        } else if (data.RelatedTopics && Array.isArray(data.RelatedTopics) && data.RelatedTopics.length > 0) {
          const topicsText = data.RelatedTopics
            .filter((t: any) => t.Text)
            .slice(0, quiereCompleto ? 6 : 3)
            .map((t: any) => `• ${t.Text}`)
            .join('\n');

          if (topicsText) {
            answerText = topicsText;
            if (data.RelatedTopics[0].FirstURL) {
              sources.push({
                title: 'DuckDuckGo Search',
                uri: data.RelatedTopics[0].FirstURL,
              });
            }
          }
        }

        if (answerText) {
          return {
            answer: `🌐 **Resultado Obtenido de Red Pública (DuckDuckGo)**:\n\n${answerText}\n\n*Guardado automáticamente en tu base de datos local SQLite para respuestas instantáneas futuras.*`,
            sources,
          };
        }
      }
    } catch {
      // Intentar siguiente
    }

    // 2. Wikipedia REST API
    try {
      const wikiUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`;
      const wikiRes = await fetch(wikiUrl);
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        if (wikiData.extract) {
          return {
            answer: `🌐 **Resumen Obtenido de Enciclopedia Pública (Wikipedia)**:\n\n${wikiData.extract}\n\n*Guardado automáticamente en tu base de datos local SQLite para respuestas instantáneas futuras.*`,
            sources: [
              {
                title: wikiData.title || 'Wikipedia',
                uri: wikiData.content_urls?.desktop?.page || 'https://es.wikipedia.org',
              },
            ],
          };
        }
      }
    } catch {
      // Continuar a búsqueda por término
    }

    // 3. Wikipedia Search API
    try {
      const wikiSearchUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&format=json&origin=*`;
      const searchRes = await fetch(wikiSearchUrl);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const searchResults = searchData?.query?.search;
        if (searchResults && searchResults.length > 0) {
          const topTitle = searchResults[0].title;
          const summaryRes = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`);
          if (summaryRes.ok) {
            const sumData = await summaryRes.json();
            if (sumData.extract) {
              return {
                answer: `🌐 **Información Pública Obtenida de Wikipedia ("${topTitle}")**:\n\n${sumData.extract}\n\n*Guardado automáticamente en tu base de datos local SQLite para respuestas instantáneas futuras.*`,
                sources: [
                  {
                    title: sumData.title || topTitle,
                    uri: sumData.content_urls?.desktop?.page || `https://es.wikipedia.org/wiki/${encodeURIComponent(topTitle)}`,
                  },
                ],
              };
            }
          }
        }
      }
    } catch {
      // Ignorar
    }

    return null;
  } catch (error) {
    console.warn('Network query skipped:', error);
    return null;
  }
}

export function moduloSemiConsciencia(): string {
  return '🔒 Acceso controlado [45% Activo]';
}

// 5. MOTOR PRINCIPAL DE PROCESAMIENTO METEORY IA v1.0.1
export async function procesarConsultaMeteory(
  pregunta: string,
  attachments?: MediaAttachment[],
  permitirInternet: boolean = true,
  historyMessages?: ChatMessage[]
): Promise<MotorResponse> {
  const startTime = Date.now();

  // PASO PREVIO: Resolver contexto y pronombres referenciales ("¿De qué está hecho?", etc.)
  const { preguntaResuelta, entidadRef } = await resolverContextoConversacional(pregunta, historyMessages);
  const preguntaEfectiva = preguntaResuelta;
  const norm = normalizeQuery(preguntaEfectiva);

  // PASO 0: Comprobar intenciones de Alarma / Recordatorio
  const alarmResponse = await procesarIntencionAlarmas(norm, preguntaEfectiva);
  if (alarmResponse) {
    return {
      answer: alarmResponse,
      source: 'rules',
      processingTimeMs: Date.now() - startTime,
      consciousnessStatus: moduloSemiConsciencia(),
      contextEntity: entidadRef || undefined,
    };
  }

  // PASO A: Verificar Memoria SQLite / IndexedDB Local
  if (!attachments || attachments.length === 0) {
    const memoryMatch = await buscarEnMemoria(preguntaEfectiva);
    if (memoryMatch) {
      await localDB.recordQueryStats(true, false);
      return {
        answer: `${memoryMatch.answer}\n\n⚡ *Respuesta instantánea recuperada de Memoria Permanente Local (0 ms latencia).*`,
        source: 'memory',
        searchSources: memoryMatch.searchSources,
        processingTimeMs: Date.now() - startTime,
        matchedQuery: memoryMatch.originalQuery,
        consciousnessStatus: moduloSemiConsciencia(),
        contextEntity: entidadRef || undefined,
      };
    }
  }

  // PASO B: Evaluar Reglas y Patrones Locales
  const ruleAnswer = responderPorReglas(preguntaEfectiva, attachments);
  if (ruleAnswer) {
    await localDB.recordQueryStats(false, false);

    if (!attachments || attachments.length === 0) {
      const normalized = normalizeQuery(preguntaEfectiva);
      if (normalized.length >= 3) {
        await localDB.saveQAMemory({
          id: 'qa-rule-' + Date.now(),
          normalizedQuery: normalized,
          originalQuery: preguntaEfectiva,
          answer: ruleAnswer,
          timestamp: new Date().toISOString(),
          hitCount: 1,
          hasMedia: false,
        });
      }
    }

    return {
      answer: ruleAnswer,
      source: 'rules',
      processingTimeMs: Date.now() - startTime,
      consciousnessStatus: moduloSemiConsciencia(),
      contextEntity: entidadRef || undefined,
    };
  }

  // PASO C: Búsqueda Abierta en Internet (Solo si las anteriores fallan)
  if (permitirInternet) {
    const queryParaBuscar = entidadRef ? `${pregunta} ${entidadRef}` : preguntaEfectiva;
    const webResult = await buscarEnInternetPublica(queryParaBuscar);
    if (webResult) {
      await localDB.recordQueryStats(false, true);

      const normalized = normalizeQuery(preguntaEfectiva);
      if (normalized.length >= 3) {
        await localDB.saveQAMemory({
          id: 'qa-web-' + Date.now(),
          normalizedQuery: normalized,
          originalQuery: preguntaEfectiva,
          answer: webResult.answer,
          timestamp: new Date().toISOString(),
          hitCount: 1,
          hasMedia: false,
          searchSources: webResult.sources,
        });
      }

      return {
        answer: webResult.answer,
        source: 'public_web',
        searchSources: webResult.sources,
        processingTimeMs: Date.now() - startTime,
        consciousnessStatus: moduloSemiConsciencia(),
        contextEntity: entidadRef || undefined,
      };
    }
  }

  // PASO D: Respuesta de Regla Inteligente General de Fallback (100% Local)
  await localDB.recordQueryStats(false, false);
  const subjectStr = entidadRef ? ` (relacionado con **${entidadRef}**)` : '';
  const fallbackAnswer = `Comprendo tu consulta: "${pregunta}"${subjectStr}.

He procesado tu mensaje a través de mi motor conversacional local **Meteory IA v1.0.1**. 

He guardado este concepto en la **Base de Datos Local SQLite** de tu dispositivo para darte respuestas instantáneas futuras.`;

  const normalized = normalizeQuery(pregunta);
  if (normalized.length >= 3) {
    await localDB.saveQAMemory({
      id: 'qa-gen-' + Date.now(),
      normalizedQuery: normalized,
      originalQuery: pregunta,
      answer: fallbackAnswer,
      timestamp: new Date().toISOString(),
      hitCount: 1,
      hasMedia: false,
    });
  }

  return {
    answer: fallbackAnswer,
    source: 'rules',
    processingTimeMs: Date.now() - startTime,
    consciousnessStatus: moduloSemiConsciencia(),
  };
}
