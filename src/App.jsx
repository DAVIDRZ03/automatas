import React, { useState, useEffect } from "react";
import { Play, RotateCcw, CheckCircle2, XCircle, Zap } from "lucide-react";
import { regexToPostfix, postfixToNFA, nfaToDfa, evaluateDFA } from "./automataEngine";
import AutomataGraph from "./AutomataGraph";

export default function App() {
  const [regex, setRegex] = useState("(a|b)*abb");
  const [cadena, setCadena] = useState("aabb");
  const [data, setData] = useState(null);
  const [activeStep, setActiveStep] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const [currentAutomata, setCurrentAutomata] = useState(0);

  const handleGenerate = () => {
    if (!regex) return;
    try {
      const postfix = regexToPostfix(regex);
      const { nfa, totalStates } = postfixToNFA(postfix);
      const alphabet = Array.from(new Set(regex.replace(/[()|*+?ε]/g, ""))).filter(Boolean);
      const dfa = nfaToDfa(nfa, alphabet);
      const evalRes = evaluateDFA(dfa, cadena);

      setData({ postfix, nfa, totalStates, dfa, alphabet, evalRes });
      setActiveStep(null);
      setCurrentAutomata(0); // Reinicia siempre al primer autómata (AFN)
    } catch (e) {
      alert("Error procesando la expresión regular.");
    }
  };

  useEffect(() => {
    handleGenerate();
  }, []);

  const handleSimulate = () => {
    if (!data?.evalRes) return;
    // Si están viendo el AFN, cambiamos automáticamente al AFD para simular el recorrido
    if (currentAutomata !== 1) setCurrentAutomata(1);

    setIsSimulating(true);
    let step = 0;
    const path = data.evalRes.path;

    const timer = setInterval(() => {
      if (step < path.length) {
        setActiveStep(path[step].state);
        step++;
      } else {
        clearInterval(timer);
        setIsSimulating(false);
      }
    }, 600);
  };

  const loadExample = (r, c) => {
    setRegex(r);
    setCadena(c);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 font-sans">
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400"></div>

      
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
               
              Generador de Autómatas </h1>
          </div>
          <div className="flex gap-2">
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
              AFN Thompson
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
              AFD Subconjuntos
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* 1. Panel de Entradas */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-semibold tracking-wide text-slate-400 uppercase mb-4">
            1. Parámetros de Entrada
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Expresión Regular</label>
              <input
                type="text"
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 font-mono text-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Ej: (a|b)*abb"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Cadena a Validar</label>
              <input
                type="text"
                value={cadena}
                onChange={(e) => setCadena(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 font-mono text-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Ej: aabb"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-4">
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 text-sm cursor-pointer"
              >
                <Zap className="w-4 h-4" /> Generar
              </button>
              <button
                disabled={isSimulating}
                onClick={handleSimulate}
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 text-sm cursor-pointer"
              >
                <Play className="w-4 h-4" /> Simular Recorrido
              </button>
              <button
                onClick={() => { setRegex(""); setCadena(""); setData(null); }}
                className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2 text-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Limpiar
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Pruebas:</span>
              {[
                { r: "(a|b)*abb", c: "abb" },
                { r: "a*b", c: "aaab" },
                { r: "(ab|c)+", c: "abc" }
              ].map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => loadExample(ex.r, ex.c)}
                  className="text-xs bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 transition-all font-mono cursor-pointer"
                >
                  {ex.r}
                </button>
              ))}
            </div>
          </div>

          {data?.evalRes && (
            <div
              className={`mt-4 p-4 rounded-xl border flex items-center gap-3 transition-all ${
                data.evalRes.accepted
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-950/40 border-rose-500/30 text-rose-300"
              }`}
            >
              {data.evalRes.accepted ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              )}
              <div className="text-sm font-medium">
                {data.evalRes.accepted
                  ? `Cadena "${cadena}" ACEPTADA por el autómata.`
                  : `Cadena "${cadena}" RECHAZADA por el autómata.`}
              </div>
            </div>
          )}
        </section>

        {/* 2. Visualización Paso a Paso con Botones de Avanzar/Retroceder */}
        {data && (
          <section className="space-y-4">
            {/* Controles de Navegación */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <button
                disabled={currentAutomata === 0}
                onClick={() => setCurrentAutomata((prev) => Math.max(0, prev - 1))}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-all flex items-center gap-2 text-sm cursor-pointer disabled:cursor-not-allowed"
              >
                ◀ Retroceder
              </button>

              <div className="text-center">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block">
                  Paso {currentAutomata + 1} de 2
                </span>
                <span className="text-base font-bold text-white">
                  {currentAutomata === 0 ? "AFN - Construcción de Thompson" : "AFD - Método de Subconjuntos"}
                </span>
              </div>

              <button
                disabled={currentAutomata === 1}
                onClick={() => setCurrentAutomata((prev) => Math.min(1, prev + 1))}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm cursor-pointer disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
              >
                Avanzar ▶
              </button>
            </div>

            {/* Vista 1: AFN Thompson */}
            {currentAutomata === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">AFN - Thompson</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Postfijo: <code className="text-cyan-400">{data.postfix}</code></p>
                  </div>
                  <span className="text-xs font-mono bg-blue-950 text-blue-400 px-2.5 py-1 rounded border border-blue-800/50">
                    {data.totalStates} Estados
                  </span>
                </div>

                <AutomataGraph
                  states={Array.from(
                    new Set(data.nfa.transitions.flatMap((t) => [`q${t.from}`, `q${t.to}`]))
                  ).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))}
                  transitions={data.nfa.transitions.map((t) => ({
                    from: `q${t.from}`,
                    to: `q${t.to}`,
                    symbol: t.symbol,
                  }))}
                  startState={`q${data.nfa.start}`}
                  acceptStates={[`q${data.nfa.accept}`]}
                  activeState={null}
                />

                <div className="overflow-x-auto max-h-64 border border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 uppercase sticky top-0 z-10">
                      <tr>
                        <th className="p-3">Origen</th>
                        <th className="p-3">Símbolo</th>
                        <th className="p-3">Destino</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {data.nfa.transitions.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-mono text-slate-300">q{t.from}</td>
                          <td className="p-3 font-mono font-bold text-cyan-400">{t.symbol}</td>
                          <td className="p-3 font-mono text-slate-300">q{t.to}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Vista 2: AFD Subconjuntos */}
            {currentAutomata === 1 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">AFD - Subconjuntos</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Estados de aceptación: <span className="text-emerald-400 font-mono">&#123;{data.dfa.acceptStates.join(", ")}&#125;</span>
                    </p>
                  </div>
                  <span className="text-xs font-mono bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded border border-emerald-800/50">
                    {data.dfa.states.length} Estados
                  </span>
                </div>

                <AutomataGraph
                  states={data.dfa.states.map((s) => s.name)}
                  transitions={data.dfa.transitions}
                  startState={data.dfa.start}
                  acceptStates={data.dfa.acceptStates}
                  activeState={activeStep}
                />

                <div className="overflow-x-auto max-h-64 border border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 uppercase sticky top-0 z-10">
                      <tr>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Subconjunto AFN</th>
                        {data.alphabet.map((sym) => (
                          <th key={sym} className="p-3 text-center text-cyan-400">{sym}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {data.dfa.states.map((s) => (
                        <tr key={s.name} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-mono text-emerald-400 font-bold">{s.name}</td>
                          <td className="p-3 font-mono text-slate-400">
                            &#123;{Array.from(s.set).sort((a, b) => a - b).map((x) => `q${x}`).join(", ")}&#125;
                          </td>
                          {data.alphabet.map((sym) => {
                            const trans = data.dfa.transitions.find((t) => t.from === s.name && t.symbol === sym);
                            return (
                              <td key={sym} className="p-3 text-center font-mono text-slate-300 font-medium">
                                {trans ? trans.to : "—"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}