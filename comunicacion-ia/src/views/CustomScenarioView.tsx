import { useState } from "react";
import { useStore } from "../store/useStore";
import { useMsal } from "@azure/msal-react";

function IconUser() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconFlag() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

export function CustomScenarioView() {
  const { accounts } = useMsal();
  const setCustomScenario = useStore((state) => state.setCustomScenario);
  const setView = useStore((state) => state.setView);
  const userName = accounts[0]?.name?.split(" ")[0] || "Usuario";

  const [formData, setFormData] = useState({
    rol_ia: "",
    system_prompt: "",
    objetivosRaw: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.rol_ia.trim() || !formData.system_prompt.trim() || !formData.objetivosRaw.trim()) {
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
      titulo: formData.rol_ia,
      slug: "custom-" + Date.now(),
      descripcion: "Escenario personalizado",
      rol_usuario: "Usuario",
      rol_ia: formData.rol_ia,
      contexto: `Entrenamiento: ${formData.rol_ia}.`,
      objetivos: objetivosProcesados,
      frase_inicial: `Hola ${userName}, le estaba esperando. ¿Qué es lo que tienes que decirme sobre lo nuestro?`,
      system_prompt: `Actúa como ${formData.rol_ia}. Instrucciones: ${formData.system_prompt}. Objetivos: ${formData.objetivosRaw}.`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setCustomScenario(newScenario as any);
  };

  const steps: { number: number; label: string; hint: string; icon: React.ReactNode; field: keyof typeof formData; multiline: boolean }[] = [
    {
      number: 1,
      label: "¿Quién debe ser la IA?",
      hint: "Ej: Un reclutador, un cliente enfadado, tu jefe...",
      icon: <IconUser />,
      field: "rol_ia",
      multiline: false,
    },
    {
      number: 2,
      label: "Instrucciones de comportamiento",
      hint: "¿Cómo debe actuar? Sé todo lo detallado que quieras.",
      icon: <IconDocument />,
      field: "system_prompt",
      multiline: true,
    },
    {
      number: 3,
      label: "¿Qué objetivos tienes?",
      hint: "Ej: Practicar asertividad, mejorar mi explicación...",
      icon: <IconFlag />,
      field: "objetivosRaw",
      multiline: true,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
      <div className="max-w-xl w-full">
        {/* Header card */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-6 text-white mb-4 shadow-lg shadow-indigo-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">Crea tu propio escenario</h2>
              <p className="text-blue-200 text-xs">Define el rol, las instrucciones y tus metas</p>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
                  {step.number}
                </div>
                <div className="flex-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    <span className="text-indigo-500">{step.icon}</span>
                    {step.label}
                  </label>
                  {step.multiline ? (
                    <textarea
                      required
                      placeholder={step.hint}
                      className="w-full border border-slate-200 bg-slate-50 p-3 h-24 rounded-xl focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none resize-none text-sm transition-all"
                      value={formData[step.field]}
                      onChange={e => setFormData({ ...formData, [step.field]: e.target.value })}
                    />
                  ) : (
                    <input
                      required
                      placeholder={step.hint}
                      className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                      value={formData[step.field]}
                      onChange={e => setFormData({ ...formData, [step.field]: e.target.value })}
                    />
                  )}
                </div>
              </div>
            ))}

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Crear y Empezar
              </button>
              <button
                type="button"
                onClick={() => setView("selector")}
                className="text-slate-400 hover:text-slate-600 py-1.5 text-xs font-medium text-center transition-colors"
              >
                Cancelar y volver al catálogo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
