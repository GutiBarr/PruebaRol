import { useState } from "react";
import { useStore } from "../store/useStore";
import { useMsal } from "@azure/msal-react";

export function CustomScenarioView() {
  const { accounts } = useMsal();
  const setCustomScenario = useStore((state) => state.setCustomScenario);
  const setView = useStore((state) => state.setView);
  const userName = accounts[0]?.name?.split(" ")[0]|| "Usuario";
  
  const [formData, setFormData] = useState({
    rolIA: "",
    systemPrompt: "",
    objetivosRaw: "" 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.rolIA.trim() || !formData.systemPrompt.trim() || !formData.objetivosRaw.trim()) {
      alert("Por favor, rellena todos los campos.");
      return;
    }

    const objetivosProcesados = formData.objetivosRaw
      .split(/[\n,]+/)
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
      contexto: `Entrenamiento: ${formData.rolIA}.`,
      objetivos: objetivosProcesados,
      frasenicial: `Hola ${userName}, le estaba esperando. ¿Qué es lo que tienes que decirme sobre lo nuestro?`,
      systemPrompt: `Actúa como ${formData.rolIA}. Instrucciones: ${formData.systemPrompt}. Objetivos: ${formData.objetivosRaw}.`
    };

    setCustomScenario(newScenario);
  };

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-slate-50/50">
      <div className="max-w-xl w-full bg-white shadow-lg rounded-xl border border-slate-100 overflow-hidden">
        <div className="bg-blue-800 p-4 text-white text-center">
          <h2 className="text-xl font-bold">Configura tu entrenamiento</h2>
          <p className="text-blue-100 text-xs opacity-90">Define el rol de la IA y tus metas</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* CAMPO 1 */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              1. ¿Quién debe ser la IA? *
            </label>
            <input 
              required
              placeholder="Ej: Un reclutador, un cliente enfadado..."
              className="w-full border border-slate-200 p-2.5 rounded-lg focus:border-blue-500 outline-none text-sm transition-all"
              value={formData.rolIA}
              onChange={e => setFormData({...formData, rolIA: e.target.value})}
            />
          </div>

          {/* CAMPO 2 */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              2. Instrucciones de comportamiento *
            </label>
            <textarea 
              required
              placeholder="¿Cómo debe actuar?"
              className="w-full border border-slate-200 p-2.5 h-20 rounded-lg focus:border-blue-500 outline-none resize-none text-sm transition-all"
              value={formData.systemPrompt}
              onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
            />
          </div>

          {/* CAMPO 3 */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              3. ¿Qué objetivos tienes? *
            </label>
            <textarea 
              required
              placeholder="Ej: Practicar asertividad, mejorar mi explicación..."
              className="w-full border border-slate-200 p-2.5 h-20 rounded-lg focus:border-blue-500 outline-none resize-none text-sm transition-all"
              value={formData.objetivosRaw}
              onChange={e => setFormData({...formData, objetivosRaw: e.target.value})}
            />
          </div>

          {/* BOTONES */}
          <div className="flex flex-col gap-2 pt-2">
            <button 
              type="submit" 
              className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 rounded-lg shadow transition-all active:scale-95 text-sm"
            >
              Crear y Empezar
            </button>
            <button 
              type="button" 
              onClick={() => setView("selector")} 
              className="text-slate-400 font-semibold hover:text-slate-600 py-1 text-xs text-center"
            >
              Cancelar y volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}