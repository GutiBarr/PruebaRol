import { useStore } from "../store/useStore";
import { scenarios } from "../data/scenarios";
import { LandingNav } from "../components/landing/LandingNav";
import { LandingHero } from "../components/landing/LandingHero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { ScenarioCard } from "../components/landing/ScenarioCard";

export function SelectorView() {
  const selectScenario = useStore((s) => s.selectScenario);
  const setView = useStore((s) => s.setView);

  return (
    <div className="min-h-screen bg-slate-50">
      <LandingNav />
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
            <div className="text-sm text-slate-500">
              {scenarios.length + 1} disponibles
            </div>
          </div>

          {/* GRID DE 4 COLUMNAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 items-stretch">
            {scenarios.map((s, i) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                index={i}
                onSelect={selectScenario}
              />
            ))}

            {/* BOTÓN "CREAR PROPIO ESCENARIO" CENTRADO Y EN LÍNEA */}
            <button 
              onClick={() => setView("custom-creator")}
              className="group relative flex flex-col bg-white rounded-sm border-2 border-dashed border-slate-200 hover:border-blue-800 hover:bg-blue-50/30 transition-all duration-300 overflow-hidden active:scale-[0.98] min-h-[380px]"
            >
              {/* Barra superior animada */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-800 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

              {/* Contenedor de contenido centrado */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                
                {/* Icono circular centrado */}
                <div className="w-14 h-14 mb-5 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-800 group-hover:text-white transition-all duration-300 shadow-sm">
                  <span className="text-3xl font-light">+</span>
                </div>

                <h3 className="font-semibold text-lg text-slate-900 mb-2 group-hover:text-blue-900 transition-colors">
                  Crear propio escenario
                </h3>
                
                <p className="text-slate-500 text-xs leading-relaxed max-w-[180px]">
                  Configura a medida el papel que debe jugar la IA en la práctica
                </p>

                {/* Pie de tarjeta centrado para simetría con los roles */}
                <div className="mt-auto pt-6 border-t border-slate-100 w-full flex flex-col items-center">
                  <div className="text-slate-400 uppercase tracking-wider text-[9px] font-bold">
                    Entrenamiento Libre
                  </div>
                  <div className="font-bold text-blue-800 mt-1 text-[11px] tracking-tight">
                    CONFIGURACIÓN MANUAL
                  </div>
                </div>
              </div>
            </button>
          </div>
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