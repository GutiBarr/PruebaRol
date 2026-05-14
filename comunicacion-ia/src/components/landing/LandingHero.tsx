// src/components/landing/LandingHero.tsx
import logoWhite from "../assets/Stemdo_Logo_Full_White.png";

export function LandingHero() {
  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #1a1a3e 50%, #0D0D1F 100%)" }}
    >


      {/* ── Subtle grid texture ── */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#4040FF 1px, transparent 1px), linear-gradient(90deg, #4040FF 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Glow blobs ── */}
      <div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "#4040FF" }}
      />
      <div
        className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10 blur-3xl"
        style={{ background: "#00D2C8" }}
      />

      <div className="relative max-w-6xl mx-auto px-6 py-28 md:py-36">
        {/* Logo */}
        <div className="hero-item hero-delay-1 mb-10">
          <img
            src={logoWhite}
            alt="Stemdo"
            className="h-9 md:h-11 object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </div>

        {/* Badge */}
        <div
          className="hero-item hero-delay-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-8 border"
          style={{
            background: "rgba(64,64,255,0.15)",
            borderColor: "rgba(64,64,255,0.4)",
            color: "#a0a0ff",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full stemdo-pulse"
            style={{ background: "#00D2C8" }}
          />
          Formación profesional continua
        </div>

        {/* Headline */}
        <h1 className="hero-item hero-delay-3 text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
          Practica. Aprende.{" "}
          <span className="stemdo-gradient-text">Mejora.</span>
        </h1>

        {/* Subline */}
        <p
          className="hero-item hero-delay-4 text-lg md:text-xl mb-10 leading-relaxed max-w-2xl"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          Entrena situaciones profesionales reales con inteligencia artificial.
          Cada sesión incluye un briefing, objetivos medibles y una evaluación
          detallada de tu desempeño.
        </p>

        {/* CTA */}
        <div className="hero-item hero-delay-5 flex flex-wrap gap-4 items-center">
          <a
            href="#escenarios"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{
              background: "#4040FF",
              color: "#fff",
              boxShadow: "0 4px 24px rgba(64,64,255,0.4)",
            }}
          >
            Ver escenarios
          </a>
        </div>
      </div>
    </section>
  );
}