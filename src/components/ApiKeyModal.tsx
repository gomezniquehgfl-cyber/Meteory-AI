import React, { useState } from 'react';
import { Key, Sparkles, AlertTriangle, RefreshCw, X, Code, Play, Copy, Check, Cpu } from 'lucide-react';
import { ApiKeyInfo } from '../types';
import { localDB, generateMeteoryApiKey } from '../lib/db';

interface Props {
  apiKeyInfo: ApiKeyInfo;
  onUpdateApiKey: (info: ApiKeyInfo) => void;
  onClose: () => void;
  onOpenProModal: () => void;
}

export const ApiKeyModal: React.FC<Props> = ({
  apiKeyInfo,
  onUpdateApiKey,
  onClose,
  onOpenProModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [keyRevealed, setKeyRevealed] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'sdk' | 'tester'>('info');
  const [codeLang, setCodeLang] = useState<'sdk' | 'python' | 'curl' | 'js'>('sdk');

  // Interactive tester states
  const [customKeyInput, setCustomKeyInput] = useState(apiKeyInfo.key);
  const [testPrompt, setTestPrompt] = useState('¿Qué es la energía y cómo funciona?');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const handleGenerateNewKey = async () => {
    setGenerating(true);
    const newInfo = await localDB.generateNewApiKey(apiKeyInfo.isPro);
    onUpdateApiKey(newInfo);
    setCustomKeyInput(newInfo.key);
    setKeyRevealed(true);
    setTimeout(() => setGenerating(false), 300);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentKey = apiKeyInfo.key || generateMeteoryApiKey();

  const runApiKeyTest = async () => {
    if (!testPrompt.trim()) return;
    setTesting(true);
    setTestResponse(null);

    const keyToUse = customKeyInput.trim() || currentKey;

    try {
      const res = await fetch('/api/v1/execute-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': keyToUse,
        },
        body: JSON.stringify({
          clave_api: keyToUse,
          prompt: testPrompt,
        }),
      });

      const data = await res.json();
      setTestResponse(data);
    } catch (err: any) {
      setTestResponse({
        status: 'error',
        code: 'NETWORK_ERROR',
        message: '⚠️ CLAVE INVÁLIDA O ERROR DE CONEXIÓN - Meteory IA',
        details: err?.message || 'Error de comunicación con el servidor.',
      });
    } finally {
      setTesting(false);
    }
  };

  const getCodeSnippet = () => {
    const activeKey = currentKey;
    const origin = window.location.origin;

    if (codeLang === 'sdk') {
      return `# =======================================================
# EJEMPLO USO OFICIAL SDK METEORY IA (Igual que Gemini)
# Creador: Niquel Gómez
# =======================================================
from meteory_sdk import MeteoryIA

clave = "${activeKey}"
ia = MeteoryIA(clave_api=clave, host="${origin}")

# Realizar consulta al motor de Meteory IA
respuesta = ia.preguntar("${testPrompt}")
print("🤖 Respuesta Meteory IA:", respuesta)`;
    }

    if (codeLang === 'curl') {
      return `curl -X POST "${origin}/api/v1/execute-api-key" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${activeKey}" \\
  -d '{
    "clave_api": "${activeKey}",
    "prompt": "${testPrompt}"
  }'`;
    }

    if (codeLang === 'python') {
      return `import requests

# Clave API Oficial de Meteory IA (Formato MTY-...)
api_key = "${activeKey}"
url = "${origin}/api/v1/execute-api-key"

payload = {
    "clave_api": api_key,
    "prompt": "${testPrompt}"
}

response = requests.post(url, json=payload)
data = response.json()

if response.status_code == 200 and data.get("status") == "success":
    print("✅ Respuesta Meteory IA:", data["answer"])
else:
    print("❌ Error:", data.get("message"))`;
    }

    return `// Node.js / JavaScript Fetch
const apiKey = "${activeKey}";
const res = await fetch("${origin}/api/v1/execute-api-key", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "x-api-key": apiKey
  },
  body: JSON.stringify({
    clave_api: apiKey,
    prompt: "${testPrompt}"
  })
});

const data = await res.json();
if (res.ok) {
  console.log("✅ Respuesta Meteory IA:", data.answer);
} else {
  console.error("❌ Error de Clave API:", data.message);
}`;
  };

  const downloadPythonSDKModule = () => {
    const origin = window.location.origin;
    const sdkCode = `# =======================================================
# MODULE OFICIAL: meteory_sdk.py
# Creador: Niquel Gómez
# Librería de cliente propia para Meteory IA v1.0.1
# =======================================================

import urllib.request
import json
import sys

class MeteoryIA:
    """
    Cliente Oficial de Meteory IA v1.0.1
    Permite interactuar con la IA creada por Niquel Gómez mediante Clave API (MTY-...)
    """
    def __init__(self, clave_api: str, host: str = "${origin}"):
        if not clave_api or not clave_api.startswith("MTY-"):
            raise ValueError("⚠️ La clave API debe comenzar con el prefijo MTY- (Ej: MTY-1A2B3C...)")
        self.clave_api = clave_api
        self.endpoint = f"{host.rstrip('/')}/api/v1/execute-api-key"

    def preguntar(self, prompt: str) -> str:
        payload = json.dumps({
            "clave_api": self.clave_api,
            "prompt": prompt
        }).encode('utf-8')

        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.clave_api,
            "User-Agent": "MeteoryIA-SDK-Python/1.0"
        }

        try:
            req = urllib.request.Request(self.endpoint, data=payload, headers=headers)
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode('utf-8'))
                if data.get("status") == "success":
                    return data.get("answer", "")
                else:
                    raise Exception(data.get("message", "Error desconocido en Meteory IA"))
        except urllib.error.HTTPError as e:
            try:
                err_data = json.loads(e.read().decode('utf-8'))
                msg = err_data.get("message") or err_data.get("details") or str(e)
            except Exception:
                msg = str(e)
            raise RuntimeError(f"{msg}")
        except Exception as e:
            raise RuntimeError(f"Error al conectar con Meteory IA: {str(e)}")

# Ejemplo de ejecución directa
if __name__ == "__main__":
    print("🤖 METEORY IA SDK v1.0.1 (Creado por Niquel Gómez)")
    clave_demo = "${currentKey}"
    ia = MeteoryIA(clave_api=clave_demo)
    
    pregunta = sys.argv[1] if len(sys.argv) > 1 else "¿Qué es la energía?"
    print(f"💬 Preguntando: {pregunta}")
    try:
        respuesta = ia.preguntar(pregunta)
        print("\\n💡 Respuesta de Meteory IA:\\n" + respuesta)
    except Exception as err:
        print(f"\\n❌ Error: {err}")
`;

    const blob = new Blob([sdkCode], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meteory_sdk.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#050814] border-2 border-[#0066ff]/60 rounded-3xl max-w-xl w-full p-6 shadow-[0_0_50px_rgba(0,102,255,0.3)] text-slate-100 relative my-6 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-[#0066ff]/30 pb-4">
          <div className="p-3 bg-[#0066ff]/20 border border-[#0066ff] rounded-2xl text-[#0066ff] shadow-[0_0_15px_rgba(0,102,255,0.4)]">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🗝️ Claves API Oficiales de Meteory IA
            </h2>
            <p className="text-xs text-slate-400">
              Formato estándar <code className="text-[#0066ff] font-bold">MTY-...</code> para ejecución universal en cualquier programa
            </p>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'info'
                ? 'bg-[#0066ff] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]'
                : 'bg-[#080d20] text-slate-400 hover:text-white border border-slate-800/80'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> Mi Clave API
          </button>
          <button
            onClick={() => setActiveTab('sdk')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'sdk'
                ? 'bg-[#0066ff] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]'
                : 'bg-[#080d20] text-slate-400 hover:text-white border border-slate-800/80'
            }`}
          >
            <Code className="w-3.5 h-3.5" /> SDK & Código
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'tester'
                ? 'bg-[#0066ff] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]'
                : 'bg-[#080d20] text-slate-400 hover:text-white border border-slate-800/80'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Probador Live
          </button>
        </div>

        {/* TAB 1: KEY GENERATOR & STATUS */}
        {activeTab === 'info' && (
          <div className="space-y-5">
            {/* Account Status Box */}
            <div className="p-4 rounded-2xl bg-[#091026] border border-[#0066ff]/30 space-y-3.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Estado de Clave:</span>
                {apiKeyInfo.isPro ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> ACTIVA (MODO PRO - Ilimitado)
                  </span>
                ) : apiKeyInfo.status === 'ACTIVA' && apiKeyInfo.usesLeft > 0 ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1">
                    🟢 ACTIVA ({apiKeyInfo.usesLeft} / 3 usos restantes)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/50 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> 🔴 AGOTADA (0/3 usos)
                  </span>
                )}
              </div>

              {/* Key Display Area */}
              <div className="p-3.5 bg-black/80 border border-slate-800 rounded-2xl font-mono text-xs text-[#0066ff] flex items-center justify-between gap-2">
                <div className="truncate font-bold text-sm tracking-wider">
                  {keyRevealed ? currentKey : 'MTY-••••••••••••••••••••••••••••••••'}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setKeyRevealed(!keyRevealed)}
                    className="text-[11px] text-[#0066ff] hover:underline px-2.5 py-1 bg-[#0066ff]/10 rounded-lg font-bold"
                  >
                    {keyRevealed ? 'Ocultar' : 'Mostrar'}
                  </button>

                  <button
                    onClick={() => copyToClipboard(currentKey)}
                    className="text-xs text-slate-200 hover:text-white px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition flex items-center gap-1 font-sans font-semibold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Key Info Details */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                <div>
                  <span className="text-slate-500">Tipo:</span>{' '}
                  <span className="text-slate-200 font-bold">{apiKeyInfo.isPro ? 'PRO (Ilimitada)' : 'GRATUITA (3 Usos)'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Formato:</span> <span className="text-slate-200">Oficial MTY- (36 chars)</span>
                </div>
              </div>

              {!apiKeyInfo.isPro && apiKeyInfo.usesLeft === 0 && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">⚠️ Clave API Agotada</p>
                    <p className="text-[11px] text-rose-300/80 mt-0.5">
                      Has consumido tus 3 consultas gratuitas. Presiona "Generar Nueva Clave API" para obtener otra clave o activa el **MODO PRO (3 USD)** para ejecuciones ilimitadas.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-3 bg-[#0066ff]/10 border border-[#0066ff]/30 rounded-xl text-xs text-cyan-200 space-y-1">
                <p className="font-bold flex items-center gap-1 text-[#0066ff]">
                  <Cpu className="w-3.5 h-3.5" /> Motor Propio: Meteory IA v1.0.1 (Niquel Gómez)
                </p>
                <p className="text-[11px] text-slate-300">
                  Desarrollado 100% de forma nativa. Al enviar tu clave <code className="text-white font-bold">MTY-...</code> desde cualquier script externo, el servidor valida la clave y responde con la inteligencia propia de Meteory IA.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleGenerateNewKey}
                disabled={generating}
                className="w-full py-3.5 px-4 bg-[#091026] hover:bg-[#0d1738] border border-[#0066ff]/60 hover:border-[#0066ff] text-[#0066ff] font-bold rounded-2xl text-sm transition shadow-[0_0_20px_rgba(0,102,255,0.2)] flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                <span>⚡ Generar Nueva Clave API (MTY-...)</span>
              </button>

              {!apiKeyInfo.isPro && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenProModal();
                  }}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#0066ff] to-cyan-500 hover:brightness-110 text-white font-bold rounded-2xl text-sm transition shadow-[0_0_20px_rgba(0,102,255,0.4)] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>🛒 Activar MODO PRO (3 USD) - Consultas Ilimitadas</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CODE PROGRAM INTEGRATION */}
        {activeTab === 'sdk' && (
          <div className="space-y-4 animate-in fade-in">
            <p className="text-xs text-slate-300">
              Integra tu clave oficial <code className="text-[#0066ff] font-bold">MTY-...</code> en tu código exactamente igual que con Gemini o ChatGPT:
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setCodeLang('sdk')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  codeLang === 'sdk'
                    ? 'bg-[#0066ff] text-white'
                    : 'bg-[#080d20] border border-slate-800 text-slate-400'
                }`}
              >
                Python SDK (Igual que Gemini)
              </button>
              <button
                onClick={() => setCodeLang('python')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  codeLang === 'python'
                    ? 'bg-[#0066ff] text-white'
                    : 'bg-[#080d20] border border-slate-800 text-slate-400'
                }`}
              >
                Python (requests)
              </button>
              <button
                onClick={() => setCodeLang('curl')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  codeLang === 'curl'
                    ? 'bg-[#0066ff] text-white'
                    : 'bg-[#080d20] border border-slate-800 text-slate-400'
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setCodeLang('js')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  codeLang === 'js'
                    ? 'bg-[#0066ff] text-white'
                    : 'bg-[#080d20] border border-slate-800 text-slate-400'
                }`}
              >
                Node.js
              </button>
            </div>

            <div className="p-3.5 bg-black border border-slate-800 rounded-2xl relative font-mono text-xs text-cyan-300 space-y-2">
              <button
                onClick={() => copyToClipboard(getCodeSnippet())}
                className="absolute top-3 right-3 text-xs text-slate-400 hover:text-white p-1.5 bg-slate-800 rounded-lg flex items-center gap-1 font-sans"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
              <pre className="overflow-x-auto whitespace-pre-wrap p-1 pt-3">
                {getCodeSnippet()}
              </pre>
            </div>

            <button
              onClick={downloadPythonSDKModule}
              className="w-full py-3 px-4 bg-[#091026] hover:bg-[#0d1738] border border-[#0066ff]/60 text-[#0066ff] font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2"
            >
              <Code className="w-4 h-4" />
              <span>📥 Descargar Módulo Python `meteory_sdk.py` (.py)</span>
            </button>
          </div>
        )}

        {/* TAB 3: LIVE API KEY TESTER */}
        {activeTab === 'tester' && (
          <div className="space-y-4 animate-in fade-in">
            <p className="text-xs text-slate-300">
              Prueba en tiempo real la validación universal de la Clave API en el servidor local:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Clave API a probar (MTY-...):</label>
                <input
                  type="text"
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  placeholder="MTY-1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R"
                  className="w-full p-3 bg-[#030612] border border-slate-700 focus:border-[#0066ff] rounded-xl text-xs font-mono text-cyan-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Pregunta / Comando de Prueba:</label>
                <input
                  type="text"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  className="w-full p-3 bg-[#030612] border border-slate-700 focus:border-[#0066ff] rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={runApiKeyTest}
              disabled={testing || !testPrompt.trim() || !customKeyInput.trim()}
              className="w-full py-3.5 bg-[#0066ff] hover:bg-[#0052cc] text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{testing ? 'Validando Clave en Meteory IA...' : '▶️ Ejecutar Validación en Servidor'}</span>
            </button>

            {testResponse && (
              <div className={`p-4 border rounded-2xl font-mono text-xs space-y-2 overflow-x-auto ${
                testResponse.status === 'success'
                  ? 'bg-black/90 border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              }`}>
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                  <span className="font-bold">
                    {testResponse.status === 'success' ? '✅ RESPUESTA EXITOSA DE METEORY IA' : '❌ ERROR DE VALIDACIÓN EN CLAVE API'}
                  </span>
                  <span className="text-[10px] text-slate-400">Status Code: {testResponse.status === 'success' ? '200 OK' : 'Error'}</span>
                </div>

                {testResponse.status === 'success' ? (
                  <div className="space-y-2 text-slate-200 font-sans">
                    <p className="font-bold text-emerald-400">💡 Respuesta:</p>
                    <p className="text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">{testResponse.answer}</p>
                    <div className="text-[11px] text-slate-400 font-mono pt-1">
                      Usos Restantes: <span className="text-white font-bold">{testResponse.usesRemaining}</span> | Estado: <span className="text-emerald-400 font-bold">{testResponse.keyStatus}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-rose-300">
                    <p className="font-bold text-rose-400 text-sm">{testResponse.message || '⚠️ CLAVE INVÁLIDA O SIN USOS - Meteory IA'}</p>
                    <p className="text-xs text-rose-200/90">{testResponse.details}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
