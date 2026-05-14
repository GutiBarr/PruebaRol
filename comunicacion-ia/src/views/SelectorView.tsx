//Cambio
import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { LandingHero } from "../components/landing/LandingHero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { ScenarioCard } from "../components/landing/ScenarioCard";
import { dbService } from "../services/dbService";
import type { Scenario } from "../types/database";

export function SelectorView() {
  const selectScenario = useStore((s) => s.selectScenario);
  const setView = useStore((s) => s.setView);
  const userProfile = useStore((s) => s.userProfile);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

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
    return isAdmin || s.is_active === true;
  });

  const handleUpdateScenario = (updatedScenario: Scenario) => {
    setScenarios(prev => prev.map(s => s.id === updatedScenario.id ? updatedScenario : s));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <LandingHero />
      <HowItWorks />

      <section id="escenarios" className="py-20 bg-gradient-to-b from-slate-50 to-blue-50/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-2">
                Catálogo
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">
                Escenarios disponibles
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              <button
              onClick={() => setView("my-history")}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition"
              >
              📋 Ver mi historial
              </button>
              <div className="text-sm text-slate-500">
                {loading ? "Cargando..." : `${visibleScenarios.length} disponibles`}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr max-w-fit mx-auto justify-items-center">
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

      <footer className="border-t border-slate-200 bg-blue-950 text-blue-100">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm">
          RolePlay Stemdo · Entrena tus habilidades de comunicación con IA
        </div>
      </footer>
    </div>
  );
}
