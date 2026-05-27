// src/components/landing/HowItWorks.tsx

const pasos = [
  {
    n: "01",
    t: "Elige un escenario",
    d: "Filtra según tu nivel y la habilidad que quieres practicar y selecciona una situación.",
    accent: "#4040FF",
  },
  {
    n: "02",
    t: "Conversa con la IA",
    d: "La IA hace su papel de forma realista. Responde como lo harías en la situación real.",
    accent: "#00D2C8",
  },
  {
    n: "03",
    t: "Recibe tu feedback",
    d: "Obtén una evaluación detallada por objetivos, con sugerencias concretas para mejorar.",
    accent: "#FF2D78",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-white border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4"
            style={{ background: "rgba(64,64,255,0.08)", color: "#4040FF" }}
          >
            Cómo funciona
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Tres pasos para mejorar
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pasos.map((p) => (
            <div
              key={p.n}
              className="group relative p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ borderColor: "#E5E5F0", background: "#FAFAFF" }}
            >
              {/* Accent top bar */}
              <div
                className="absolute top-0 left-6 right-6 h-0.5 rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: p.accent }}
              />

              {/* Number */}
              <div
                className="text-5xl font-black mb-4 leading-none"
                style={{ color: p.accent, opacity: 0.15 }}
              >
                {p.n}
              </div>

              {/* Icon-like circle */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 font-bold text-white text-sm"
                style={{ background: p.accent }}
              >
                {p.n.replace("0", "")}
              </div>

              <h3 className="font-bold text-slate-900 mb-2 text-lg">{p.t}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}