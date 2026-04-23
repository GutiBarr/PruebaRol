const pasos = [
  {
    n: 1,
    t: "Elige un escenario",
    d: "Selecciona la situación que quieres practicar: cliente difícil, entrevista, negociación…",
  },
  {
    n: 2,
    t: "Conversa con la IA",
    d: "La IA hace su papel de forma realista. Responde como lo harías en la situación real.",
  },
  {
    n: 3,
    t: "Recibe tu feedback",
    d: "Obtén una evaluación detallada por objetivos, con sugerencias concretas para mejorar.",
  },
];

export function HowItWorks() {
  return (
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
          {pasos.map((p) => (
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
  );
}