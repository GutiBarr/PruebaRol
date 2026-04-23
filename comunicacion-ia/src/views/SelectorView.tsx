import { useStore } from "../store/useStore";
import { scenarios } from "../data/scenarios";

export function SelectorView() {
  const selectScenario = useStore((s) => s.selectScenario);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <span className="font-semibold text-slate-900">RolePlay Stemdo</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <span className="hidden md:block">Plataforma de entrenamiento</span>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Activo
            </span>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-slate-50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm text-slate-700 px-3 py-1.5 rounded-full text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
              Impulsado por IA generativa
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-[1.05]">
              Entrena conversaciones <br />
              <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                que marcan la diferencia
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              Practica situaciones reales de trabajo con una IA que se adapta a ti.
              Recibe feedback inmediato sobre tus puntos fuertes y áreas a mejorar.
            </p>
            <a
              href="#escenarios"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition shadow-lg shadow-slate-900/10"
            >
              Empezar a practicar
              <span>↓</span>
            </a>
          </div>

          <div className="mt-20 grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-slate-900">{scenarios.length}</div>
              <div className="text-xs md:text-sm text-slate-500 mt-1">Escenarios listos</div>
            </div>
            <div className="text-center border-x border-slate-200">
              <div className="text-3xl md:text-4xl font-bold text-slate-900">∞</div>
              <div className="text-xs md:text-sm text-slate-500 mt-1">Práctica ilimitada</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-slate-900">100%</div>
              <div className="text-xs md:text-sm text-slate-500 mt-1">Feedback personalizado</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              Cómo funciona
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Tres pasos para mejorar
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: 1, t: "Elige un escenario", d: "Selecciona la situación que quieres practicar: cliente difícil, entrevista, negociación…" },
              { n: 2, t: "Conversa con la IA", d: "La IA hace su papel de forma realista. Responde como lo harías en la situación real." },
              { n: 3, t: "Recibe tu feedback", d: "Obtén una evaluación detallada por objetivos, con sugerencias concretas para mejorar." },
            ].map((p) => (
              <div key={p.n} className="relative">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-lg mb-4">
                  {p.n}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 text-lg">{p.t}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="escenarios" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
                Catálogo
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Escenarios disponibles
              </h2>
            </div>
            <div className="text-sm text-slate-500">
              {scenarios.length} disponibles
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {scenarios.map((s, i) => (
              <button
                key={s.id}
                onClick={() => selectScenario(s)}
                className="group text-left bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-indigo-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-slate-400">
                      #{String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                      →
                    </span>
                  </div>

                  <h3 className="font-bold text-xl text-slate-900 mb-2">
                    {s.titulo}
                  </h3>
                  <p className="text-slate-600 text-sm mb-5 leading-relaxed">
                    {s.descripcion}
                  </p>

                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-5">
                    <div className="text-xs text-slate-400 mb-1">La IA te dirá:</div>
                    <p className="text-sm text-slate-700 italic line-clamp-2">
                      "{s.frasenicial}"
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs pt-4 border-t border-slate-100">
                    <div>
                      <div className="text-slate-400">Tu rol</div>
                      <div className="font-semibold text-slate-700 mt-0.5">{s.rolUsuario}</div>
                    </div>
                    <div className="w-px h-8 bg-slate-200"></div>
                    <div>
                      <div className="text-slate-400">Rol de la IA</div>
                      <div className="font-semibold text-slate-700 mt-0.5">{s.rolIA}</div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-slate-500">
          RolePlay AI · Entrena tus habilidades de comunicación con IA
        </div>
      </footer>
    </div>
  );
}