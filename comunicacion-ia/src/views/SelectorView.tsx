// src/views/SelectorView.tsx
import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { LandingHero } from "../components/landing/LandingHero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { ScenarioCard } from "../components/landing/ScenarioCard";
import { dbService } from "../services/dbService";
import type { Scenario } from "../types/database";
import logoWhite from "../components/assets/Stemdo_Logo_Full_White.png";
import { CustomSelect } from "../components/ui/CustomSelect";

export function SelectorView() {
  const selectScenario = useStore((s) => s.selectScenario);
  const userProfile = useStore((s) => s.userProfile);
  const setView = useStore((s) => s.setView);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNivel, setFilterNivel] = useState("");
  const [filterCompetencia, setFilterCompetencia] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadScenarios = async () => {
    try {
      if (scenarios.length === 0) setLoading(true);
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
  }, []);

  const visibleScenarios = scenarios.filter(s => {
    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superadmin';
    const isActiveOrAdmin = isAdmin || s.is_active === true;

    if (!isActiveOrAdmin) return false;
    if (filterNivel && s.nivel !== filterNivel) return false;
    if (filterCompetencia && s.competencia !== filterCompetencia) return false;

    return true;
  });

  const handleUpdateScenario = (updatedScenario: Scenario) => {
    setScenarios(prev => prev.map(s => s.id === updatedScenario.id ? updatedScenario : s));
  };

  const ITEMS_PER_PAGE = 4;

  const maxIndex = Math.max(
    0,
    visibleScenarios.length - ITEMS_PER_PAGE
  );

  const handleNext = () => {
    setCurrentIndex((prev) =>
      Math.min(prev + ITEMS_PER_PAGE, maxIndex)
    );
  };

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      Math.max(prev - ITEMS_PER_PAGE, 0)
    );
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--stemdo-bg)" }}>
      <LandingHero />
      <HowItWorks />

      {/* ── Escenarios ── */}
      <section id="escenarios" className="py-20" style={{ background: "var(--stemdo-bg)" }}>
        <div className="max-w-[90%] md:max-w-[1400px] mx-auto px-7.5">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div
                className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3"
                style={{ background: "rgba(64,64,255,0.08)", color: "#4040FF" }}
              >
                Catálogo
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                ¿Qué quieres practicar hoy?
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium" style={{ color: "#9090B0" }}>
                {loading ? "Cargando..." : `${visibleScenarios.length} disponibles`}
              </span>

              {/* Botón Mi historial */}
              <button
                onClick={() => setView('history')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #4040FF, #00D2C8)",
                  color: "#fff",
                  boxShadow: "0 2px 12px rgba(64,64,255,0.25)",
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mi historial
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mb-8 relative z-[60]">
            <div className="w-[200px] relative z-20">
              <CustomSelect
                value={filterNivel}
                onChange={(val: string) => setFilterNivel(val)}
                placeholder="Todos los niveles"
                options={[
                  { value: "", label: "Todos los niveles" },
                  { value: "Trainee", label: "Trainee" },
                  { value: "Graduate", label: "Graduate" },
                  { value: "Specialist", label: "Specialist" },
                  { value: "AllStar", label: "AllStar" },
                ]}
              />
            </div>

            <div className="w-[240px] relative z-10">
              <CustomSelect
                value={filterCompetencia}
                onChange={(val: string) => setFilterCompetencia(val)}
                placeholder="Todas las competencias"
                options={[
                  { value: "", label: "Todas las competencias" },
                  { value: "Problem Solving", label: "Problem Solving" },
                  { value: "Learning Curve", label: "Learning Curve" },
                  { value: "Collaboration", label: "Collaboration" },
                  { value: "Fellowship", label: "Fellowship" },
                  { value: "Leadership", label: "Leadership" },
                  { value: "People-hands (Empathy)", label: "People-hands (Empathy)" },
                  { value: "Communication", label: "Communication" },
                  { value: "Commitment", label: "Commitment" },
                  { value: "Extra-mile", label: "Extra-mile" },
                  { value: "Ownership", label: "Ownership" },
                ]}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div
                className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "#4040FF", borderTopColor: "transparent" }}
              />
            </div>
          ) : visibleScenarios.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-10 text-center text-amber-800 my-8 shadow-sm">
              <svg className="w-16 h-16 mx-auto mb-4 text-amber-400 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-xl font-bold mb-2">No hay escenarios disponibles</h3>
              <p className="text-sm text-amber-700 mb-6">
                No se han encontrado escenarios que coincidan con los filtros seleccionados de nivel y competencia.
              </p>
              <button
                onClick={() => { setFilterNivel(""); setFilterCompetencia(""); }}
                className="px-5 py-2.5 bg-white rounded-xl border border-amber-200 text-amber-700 font-bold hover:bg-amber-100 transition-colors shadow-sm active:scale-95"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="relative w-full px-16">

              {/* Flecha izquierda */}
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white text-[#4040FF] border border-slate-100 flex items-center justify-center transition-all duration-200 shadow-[0_4px_12px_rgba(64,64,255,0.15)] hover:bg-[#0D0D0D] hover:text-white hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, #4040FF, #00D2C8)",
                  color: "#fff",
                  boxShadow: "0 4px 12px rgba(64,64,255,0.25)",
                }}
                aria-label="←"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Flecha derecha */}
              <button
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-[#0D0D0D] hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, #4040FF, #00D2C8)",
                  color: "#fff",
                  boxShadow: "0 4px 12px rgba(64,64,255,0.25)",
                }}
                aria-label="→"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Contenedor */}
              <div className="overflow-hidden w-full">
                <div
                  className="flex gap-6 transition-transform duration-500"
                  style={{
                    transform: `translateX(-${currentIndex * 306}px)`,
                  }}
                >
                  {visibleScenarios.map((s, i) => (
                    <div
                      key={s.id}
                      className="min-w-[280px] max-w-[280px] h-[400px] flex-shrink-0"
                    >
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
              </div>
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
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
              © {new Date().getFullYear()} Stemdo™
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}