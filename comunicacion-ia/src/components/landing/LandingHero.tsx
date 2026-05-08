export function LandingHero() {
  return (
    <section className="bg-gradient-to-b from-blue-950 to-blue-900 text-white border-b border-blue-950">
      <div className="max-w-5xl mx-auto px-6 py-24 md:py-32">
        <div className="max-w-3xl">
          <div className="hero-item hero-delay-1 inline-flex items-center gap-2 border border-blue-400/30 bg-blue-500/10 text-blue-200 px-3 py-1 rounded-sm text-xs font-medium uppercase tracking-widest mb-8">
            Formación profesional continua
          </div>

          <h1 className="hero-item hero-delay-2 text-4xl md:text-5xl font-semibold mb-6 tracking-tight leading-tight">
            Práctica de habilidades de comunicación asistida por{" "}
            <span className="text-blue-300">inteligencia artificial</span>
          </h1>

          <p className="hero-item hero-delay-3 text-lg text-blue-100/80 mb-10 leading-relaxed max-w-2xl">
            Entrena situaciones profesionales reales en un entorno controlado.
            Cada sesión incluye un briefing, objetivos medibles y una evaluación
            detallada del desempeño.
          </p>

          <a
            href="#escenarios"
            className="hero-item hero-delay-4 inline-flex items-center gap-2 bg-white text-blue-950 px-6 py-3 rounded-sm font-semibold hover:bg-blue-50 transition"
          >
            Acceder al catálogo
          </a>
        </div>
      </div>
    </section>
  );
}