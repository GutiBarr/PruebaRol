import { useState } from "react";
import { useStore } from "../store/useStore";

export function CustomScenarioView() {
  const setCustomScenario = useStore((state) => state.setCustomScenario);
  const setView = useStore((state) => state.setView);
  
  const [formData, setFormData] = useState({
    rolIA: "",
    systemPrompt: "",
    objetivosRaw: "" // Campo para el texto de los objetivos
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación: ahora los tres campos son importantes
    if (!formData.rolIA.trim() || !formData.systemPrompt.trim() || !formData.objetivosRaw.trim()) {
      alert("Por favor, rellena todos los campos, incluyendo tus objetivos.");
      return;
    }

    // Convertimos el texto de objetivos (separados por comas o saltos de línea) en el formato que espera el Store
    const objetivosProcesados = formData.objetivosRaw
      .split(/[\n,]+/) // Separa por coma o por nueva línea
      .map(obj => obj.trim())
      .filter(obj => obj.length > 0)
      .map((obj, index) => ({
        id: `obj-${index}`,
        descripcion: obj
      }));

    const newScenario = {
      id: "custom-" + Date.now(),
      titulo: formData.rolIA,
      descripcion: "Escenario personalizado",
      rolUsuario: "Usuario",
      rolIA: formData.rolIA,
      contexto: `Has definido un entrenamiento personalizado con: ${formData.rolIA}. \n\nInstrucciones de la IA: ${formData.systemPrompt} \n\nObjetivos de la sesión: ${formData.objetivosRaw}`,
      objetivos: objetivosProcesados, // <--- Aquí pasamos los objetivos procesados
      frasenicial: "Hola, estoy listo para el entrenamiento. ¿Cómo quieres empezar?",
      systemPrompt: `Actúa como ${formData.rolIA}. 
      Instrucciones de comportamiento: ${formData.systemPrompt}. 
      Los objetivos del usuario para esta sesión son: ${formData.objetivosRaw}. 
      Ayúdale a trabajar en ellos durante la conversación.`
    };

    setCustomScenario(newScenario);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50/50">
      <div className="max-w-2xl w-full bg-white shadow-xl rounded-xl border border-slate-100 overflow-hidden">
        <div className="bg-blue-800 p-6 text-white text-center">
          <h2 className="text-2xl font-bold">Configura tu entrenamiento</h2>
          <p className="text-blue-100 text-sm mt-1">Define el rol de la IA y tus metas</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-5">
          {/* CAMPO 1: ROL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              1. ¿Quién debe ser la IA? *
            </label>
            <input 
              required
              placeholder="Ej: Un reclutador de Microsoft, un cliente enfadado..."
              className="w-full border-2 border-slate-100 p-3 rounded-lg focus:border-blue-500 outline-none transition-all"
              value={formData.rolIA}
              onChange={e => setFormData({...formData, rolIA: e.target.value})}
            />
          </div>

          {/* CAMPO 2: INSTRUCCIONES */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              2. Instrucciones de comportamiento *
            </label>
            <textarea 
              required
              placeholder="¿Cómo debe actuar? (Ej: Sé muy exigente con los detalles técnicos y habla de forma cortante)"
              className="w-full border-2 border-slate-100 p-3 h-32 rounded-lg focus:border-blue-500 outline-none transition-all resize-none"
              value={formData.systemPrompt}
              onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
            />
          </div>

          {/* CAMPO 3: OBJETIVOS (NUEVO) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              3. ¿Qué objetivos tienes en esta sesión? *
            </label>
            <textarea 
              required
              placeholder="Ej: Practicar mi asertividad, mejorar mi explicación de presupuestos, no ponerme nervioso..."
              className="w-full border-2 border-slate-100 p-3 h-28 rounded-lg focus:border-blue-500 outline-none transition-all resize-none"
              value={formData.objetivosRaw}
              onChange={e => setFormData({...formData, objetivosRaw: e.target.value})}
            />
            <p className="text-[10px] text-slate-400 mt-1 italic">Separa los objetivos por comas o líneas.</p>
          </div>

          {/* BOTONES */}
          <div className="flex flex-col gap-3 pt-2">
            <button 
              type="submit" 
              className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-4 rounded-lg shadow-lg transform transition-all active:scale-95"
            >
              Crear y Empezar
            </button>
            <button 
              type="button" 
              onClick={() => setView("selector")} 
              className="text-slate-400 font-semibold hover:text-slate-600 transition-colors py-2 text-sm"
            >
              Cancelar y volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}