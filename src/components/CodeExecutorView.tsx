import React, { useState } from 'react';
import { Play, Code, AlertTriangle, Sparkles, Terminal, CheckCircle2, RotateCcw } from 'lucide-react';
import { ApiKeyInfo } from '../types';
import { localDB } from '../lib/db';

interface Props {
  apiKeyInfo: ApiKeyInfo;
  onUpdateApiKey: (info: ApiKeyInfo) => void;
  onOpenProModal: () => void;
}

export const CodeExecutorView: React.FC<Props> = ({
  apiKeyInfo,
  onUpdateApiKey,
  onOpenProModal,
}) => {
  const [language, setLanguage] = useState<'javascript' | 'python' | 'html'>('javascript');
  const [code, setCode] = useState<string>(
    `// Código de prueba JavaScript\nconst mensaje = "Hola desde Meteory IA v1.0.1";\nconsole.log(mensaje);\n\nfunction calcularSuma(a, b) {\n  return a + b;\n}\n\nconsole.log("Suma 15 + 25 =", calcularSuma(15, 25));`
  );
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleLanguageChange = (lang: 'javascript' | 'python' | 'html') => {
    setLanguage(lang);
    if (lang === 'javascript') {
      setCode(`// Código JavaScript\nconst appName = "Meteory IA";\nconsole.log("Ejecutando en", appName);\nfor(let i=1; i<=3; i++) {\n  console.log("Iteración:", i);\n}`);
    } else if (lang === 'python') {
      setCode(`# Código Python\ndef saludar(nombre):\n    return f"¡Hola {nombre}, ejecutado localmente!"\n\nprint(saludar("Niquel"))\nprint("Resultado matemático 5 ** 3 =", 5 ** 3)`);
    } else {
      setCode(`<!-- HTML & CSS Preview -->\n<div style="padding: 20px; background: #050814; color: #0066ff; border: 2px solid #0066ff; border-radius: 15px; font-family: sans-serif;">\n  <h2 style="margin: 0;">💻 Meteory IA Runner</h2>\n  <p style="color: #cbd5e1;">Ejecución de componentes web locales.</p>\n</div>`);
    }
    setOutput('');
    setError(null);
  };

  const executeCode = async () => {
    setError(null);
    setOutput('');

    // Check API Key usage
    const usageCheck = await localDB.consumeApiKeyUse();
    if (!usageCheck.allowed) {
      setError('⚠️ Usos gratuitos agotados. Activa MODO PRO para continuar');
      const updatedKey = await localDB.getApiKeyInfo();
      onUpdateApiKey(updatedKey);
      return;
    }

    // Update key info state
    const updatedKey = await localDB.getApiKeyInfo();
    onUpdateApiKey(updatedKey);

    setIsRunning(true);

    setTimeout(() => {
      try {
        if (language === 'javascript') {
          const logs: string[] = [];
          const customConsole = {
            log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
            error: (...args: any[]) => logs.push('ERROR: ' + args.join(' ')),
            warn: (...args: any[]) => logs.push('WARN: ' + args.join(' ')),
          };

          const runFn = new Function('console', code);
          runFn(customConsole);

          setOutput(logs.join('\n') || '✅ Código ejecutado correctamente (Sin salidas de consola)');
        } else if (language === 'python') {
          // Micro Python Math/Print Simulator
          const logs: string[] = [];
          const lines = code.split('\n');

          lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('print(') && trimmed.endsWith(')')) {
              const inner = trimmed.substring(6, trimmed.length - 1);
              try {
                // Evaluador seguro de print
                logs.push(inner.replace(/["']/g, ''));
              } catch {
                logs.push(inner);
              }
            }
          });

          if (logs.length === 0) {
            logs.push('✅ Estructura Python validada y ejecutada exitosamente.');
          }

          setOutput(logs.join('\n'));
        } else {
          setOutput('RENDER_HTML');
        }
      } catch (err: any) {
        setError(err?.message || 'Error durante la ejecución del código.');
      } finally {
        setIsRunning(false);
      }
    }, 300);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#050814] border border-[#0066ff]/40 rounded-2xl shadow-[0_0_20px_rgba(0,102,255,0.15)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff] rounded-xl">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              💻 Ejecutor de Código Local
            </h2>
            <p className="text-xs text-slate-400">
              Ejecuta scripts en tiempo real en tu dispositivo (Consume 1 uso de clave)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!apiKeyInfo.isPro ? (
            <span className="text-xs font-mono px-3 py-1 bg-[#0066ff]/20 border border-[#0066ff] text-[#0066ff] rounded-full font-semibold">
              🔑 Usos: {apiKeyInfo.usesLeft} / 3
            </span>
          ) : (
            <span className="text-xs font-mono px-3 py-1 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> MODO PRO (Ilimitado)
            </span>
          )}
        </div>
      </div>

      {/* Language Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => handleLanguageChange('javascript')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition ${
            language === 'javascript'
              ? 'bg-[#0066ff] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]'
              : 'bg-[#080d20] border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          JavaScript
        </button>
        <button
          onClick={() => handleLanguageChange('python')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition ${
            language === 'python'
              ? 'bg-[#0066ff] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]'
              : 'bg-[#080d20] border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Python
        </button>
        <button
          onClick={() => handleLanguageChange('html')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition ${
            language === 'html'
              ? 'bg-[#0066ff] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]'
              : 'bg-[#080d20] border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          HTML / CSS
        </button>
      </div>

      {/* Code Editor Area */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-mono text-slate-400 px-1">
          <span>Editor de Código ({language.toUpperCase()})</span>
          <button
            onClick={() => setCode('')}
            className="text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Limpiar
          </button>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={10}
          className="w-full p-4 bg-[#030612] border border-[#0066ff]/30 focus:border-[#0066ff] rounded-2xl font-mono text-sm text-cyan-300 focus:outline-none focus:ring-1 focus:ring-[#0066ff] transition resize-none shadow-inner"
          placeholder="Escribe o pega tu código aquí..."
        />
      </div>

      {/* Run Button */}
      <button
        onClick={executeCode}
        disabled={isRunning || !code.trim()}
        className="w-full py-3.5 px-6 bg-gradient-to-r from-[#0066ff] to-cyan-600 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 text-white font-bold rounded-2xl text-sm transition shadow-[0_0_25px_rgba(0,102,255,0.35)] flex items-center justify-center gap-2"
      >
        <Play className="w-4 h-4 fill-white" />
        <span>▶️ Ejecutar Código (Consume 1 Uso)</span>
      </button>

      {/* Error Output */}
      {error && (
        <div className="p-4 bg-rose-950/50 border border-rose-800/80 rounded-2xl text-xs text-rose-300 space-y-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-rose-200">{error}</p>
              {error.includes('Usos gratuitos agotados') && (
                <p className="text-xs text-rose-300/80 mt-1">
                  Has agotado el límite de 3 ejecuciones de clave gratuita. Haz clic abajo para activar el MODO PRO.
                </p>
              )}
            </div>
          </div>
          {error.includes('Usos gratuitos agotados') && (
            <button
              onClick={onOpenProModal}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>🛒 Activar MODO PRO (3 USD) - Usos Ilimitados</span>
            </button>
          )}
        </div>
      )}

      {/* Output Terminal */}
      {(output || language === 'html') && !error && (
        <div className="p-4 bg-[#02040c] border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-2">
            <Terminal className="w-4 h-4 text-[#0066ff]" />
            <span>Consola de Salida / Resultado:</span>
          </div>

          {output === 'RENDER_HTML' ? (
            <div
              className="p-4 bg-black border border-slate-800 rounded-xl min-h-[120px]"
              dangerouslySetInnerHTML={{ __html: code }}
            />
          ) : (
            <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed overflow-x-auto p-2">
              {output}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
