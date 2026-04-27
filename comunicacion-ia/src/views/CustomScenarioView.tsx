import { useState } from "react";
import { useStore } from "../store/useStore";

export function CustomScenarioView() {
  const setCustomScenario = useStore((state) => state.setCustomScenario);
  const setView = useStore((state) => state.setView);
  
  const [formData, setFormData] = useState({
    titulo: "Escenario Personalizado",
    rolIA: "",
    systemPrompt: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación manual: comprobamos que no estén vacíos o solo con espacios
    if (!formData.rolIA.trim() || !formData.systemPrompt.trim()) {
      alert("Por favor, rellena todos los campos antes de continuar.");
      return;
    }

    const newScenario = {
      id: "custom-" + Date.now(),
      titulo: formData.rolIA, // Usamos el rol como título para que se vea mejor
      descripcion: "Escenario creado por el usuario",
      rolUsuario: "Usuario",
      rolIA: formData.rolIA,
      contexto: `Has definido este escenario personalizado donde interactúas con: ${formData.rolIA}. \n\nInstrucciones: ${formData.systemPrompt}`,
      objetivos: [], 
      frasenicial: "Hola, estoy listo para empezar según el rol que me has asignado. ¿De qué te gustaría hablar?",
      systemPrompt: `Actúa como ${formData.rolIA}. Instrucciones específicas: ${formData.systemPrompt}. Mantén el rol de forma estricta y responde de forma natural.`
    };

    setCustomScenario(newScenario);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white shadow-xl rounded-xl border border-slate-100 overflow-hidden">
        <div className="bg-blue-800 p-6 text-white">
          <h2 className="text-2xl font-bold text-center">Configura tu entrenamiento</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              ¿Quién debe ser la IA? *
            </label>
            <input 
              required
              placeholder="Ej: Reclutador técnico, Cliente exigente..."
              className="w-full border-2 border-slate-100 p-3 rounded-lg focus:border-blue-500 outline-none transition-colors"
              value={formData.rolIA}
              onChange={e => setFormData({...formData, rolIA: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Instrucciones de comportamiento *
            </label>
            <textarea 
              required
              placeholder="Explica cómo debe actuar, qué tono usar y qué temas tratar..."
              className="w-full border-2 border-slate-100 p-3 h-40 rounded-lg focus:border-blue-500 outline-none transition-colors resize-none"
              value={formData.systemPrompt}
              onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
            />
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button 
              type="submit" 
              className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-4 rounded-lg shadow-lg transform transition-transform active:scale-95"
            >
              Empezar Entrenamiento
            </button>
            <button 
              type="button" 
              onClick={() => setView("selector")} 
              className="text-slate-400 font-semibold hover:text-slate-600 transition-colors py-2"
            >
              Cancelar y volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}