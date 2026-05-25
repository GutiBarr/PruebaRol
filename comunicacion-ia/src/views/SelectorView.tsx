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
  const selectScenario = useStore((s) => s.selectScenario);
  const userProfile = useStore((s) => s.userProfile);
  const setView = useStore((s) => s.setView);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNivel, setFilterNivel] = useState("");
  const [filterCompetencia, setFilterCompetencia] = useState("");

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
          <div className="flex flex-wrap gap-4 mb-8">
            <select
              className="border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-[#4040FF] outline-none text-sm bg-white font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300"
              value={filterNivel}
              onChange={e => setFilterNivel(e.target.value)}
            >
              <option value="">Todos los niveles</option>
              <option value="Trainee">Trainee</option>
              <option value="Graduate">Graduate</option>
              <option value="Specialist">Specialist</option>
              <option value="AllStar">AllStar</option>
            </select>

            <select
              className="border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-[#4040FF] outline-none text-sm bg-white font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300"
              value={filterCompetencia}
              onChange={e => setFilterCompetencia(e.target.value)}
            >
              <option value="">Todas las competencias</option>
              <option value="Problem Solving">Problem Solving</option>
              <option value="Learning Curve">Learning Curve</option>
              <option value="Collaboration">Collaboration</option>
              <option value="Fellowship">Fellowship</option>
              <option value="Leadership">Leadership</option>
              <option value="People-hands (Empathy)">People-hands (Empathy)</option>
              <option value="Communication">Communication</option>
              <option value="Commitment">Commitment</option>
              <option value="Extra-mile">Extra-mile</option>
              <option value="Ownership">Ownership</option>
            </select>
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
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
              © {new Date().getFullYear()} Stemdo™
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}