// src/views/SelectorView.tsx
import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { LandingHero } from "../components/landing/LandingHero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { ScenarioCard } from "../components/landing/ScenarioCard";
import { dbService } from "../services/dbService";
import type { Scenario } from "../types/database";
import logoWhite from "../components/assets/Stemdo_Logo_Full_White.png";

export function SelectorView() {
  const { selectScenario, userProfile, view } = useStore();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superadmin';
      const data = await dbService.getScenarios(userProfile?.azure_oid, isAdmin);
      setScenarios(data);
    } catch (error) {
      console.error("Error al cargar escenarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, [view]);

  const visibleScenarios = scenarios.filter(s => {
    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superadmin';
    return isAdmin || s.is_active === true;
  });

  const handleUpdateScenario = (updatedScenario: Scenario) => {
    setScenarios(prev => prev.map(s => s.id === updatedScenario.id ? updatedScenario : s));
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--stemdo-bg)" }}>
      <LandingHero />
      <HowItWorks />

      {/* ── Escenarios ── */}
      <section id="escenarios" className="py-20" style={{ background: "var(--stemdo-bg)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div
                className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3"
                style={{ background: "rgba(64,64,255,0.08)", color: "#4040FF" }}
              >
                Catálogo
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Escenarios disponibles
              </h2>
            </div>
            <div className="text-sm font-medium" style={{ color: "#9090B0" }}>
              {loading ? "Cargando..." : `${visibleScenarios.length} disponibles`}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div
                className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "#4040FF", borderTopColor: "transparent" }}
              />
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6 mx-auto">
              {visibleScenarios.map((s, i) => (
                <div key={s.id} className="w-full sm:w-[280px] md:w-[290px] lg:w-[300px] h-full">
                  <ScenarioCard
                    scenario={s}
                    index={i}
                    onSelect={selectScenario}
                    onRefresh={loadScenarios}
                    onUpdate={handleUpdateScenario}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#0D0D0D" }}>

        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <img
              src={logoWhite}
              alt="Stemdo"
              className="h-6 object-contain opacity-80"
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
              RolePlay IA · Entrena tus habilidades de comunicación
            </p>
            <p className="text-xs" style={{ color: "rgba(255, 255, 255, 1)" }}>
              © {new Date().getFullYear()} Stemdo™
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
