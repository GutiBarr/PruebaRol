import { useStore } from "../store/useStore";
import { scenarios } from "../data/scenarios";
import { LandingNav } from "../components/landing/LandingNav";
import { LandingHero } from "../components/landing/LandingHero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { ScenarioCard } from "../components/landing/ScenarioCard";

export function SelectorView() {
  const selectScenario = useStore((s) => s.selectScenario);

  return (
    <div className="min-h-screen bg-slate-50">
      <LandingNav />
      <LandingHero totalScenarios={scenarios.length} />
      <HowItWorks />

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
              <ScenarioCard
                key={s.id}
                scenario={s}
                index={i}
                onSelect={selectScenario}
              />
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