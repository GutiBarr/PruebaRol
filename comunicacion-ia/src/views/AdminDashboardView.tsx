import { useState } from 'react';
import { dbService } from '../services/dbService';
import { useStore } from '../store/useStore';

export function AdminDashboardView() {
  const { setView, userProfile } = useStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    rol_usuario: '',
    rol_ia: '',
    contexto: '',
    frase_inicial: '',
    system_prompt: ''
  });

  const [objectives, setObjectives] = useState([{ descripcion: '' }]);

  const handleAddObjective = () => {
    setObjectives([...objectives, { descripcion: '' }]);
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index].descripcion = value;
    setObjectives(newObjectives);
  };

  const handleRemoveObjective = (index: number) => {
    const newObjectives = [...objectives];
    newObjectives.splice(index, 1);
    setObjectives(newObjectives);
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setLoading(true);

    try {
      const scenarioSlug = generateSlug(formData.titulo);

      const processedObjectives = objectives
        .filter(obj => obj.descripcion.trim() !== '')
        .map((obj, i) => ({
          slug: `obj-${i + 1}`,
          descripcion: obj.descripcion
        }));

      await dbService.createScenario(
        {
          ...formData,
          slug: scenarioSlug,
          descripcion: formData.contexto // Usamos el contexto también como descripción
        },
        processedObjectives,
        userProfile.azure_oid
      );

      alert('¡Escenario creado con éxito!');
      setView('selector');
    } catch (error: any) {
      console.error("Error al crear escenario:", error);
      alert(`Error: ${error.message || 'No se pudo crear el escenario'}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Configurar Escenario</h1>
        <button onClick={() => setView('selector')} className="text-slate-500 hover:text-slate-800 text-sm font-medium">
          Volver al catálogo
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
          <h2 className="text-lg font-semibold border-b pb-4 text-slate-800">Información General</h2>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Título del Escenario</label>
            <input
              required
              type="text"
              placeholder="Ej: Gestión de expectativas con cliente"
              className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.titulo}
              onChange={e => setFormData({ ...formData, titulo: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Contexto y Detalles del Escenario</label>
            <textarea
              required
              placeholder="Explica la situación, los antecedentes y el problema a resolver. Este texto se verá en el catálogo y antes de empezar."
              className="w-full border border-slate-200 rounded-xl p-3 h-40 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              value={formData.contexto}
              onChange={e => setFormData({ ...formData, contexto: e.target.value })}
            />
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
          <h2 className="text-lg font-semibold border-b pb-4 text-slate-800">Roles de la Simulación</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Rol del Usuario (Tú)</label>
              <input
                required
                placeholder="Ej: Account Manager"
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.rol_usuario}
                onChange={e => setFormData({ ...formData, rol_usuario: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Rol de la IA</label>
              <input
                required
                placeholder="Ej: Cliente insatisfecho"
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.rol_ia}
                onChange={e => setFormData({ ...formData, rol_ia: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
          <h2 className="text-lg font-semibold border-b pb-4 text-slate-800">Inteligencia Artificial</h2>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Frase Inicial de la IA</label>
            <input
              required
              placeholder="Ej: Hola, me habéis dicho que el proyecto se retrasa otra vez..."
              className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.frase_inicial}
              onChange={e => setFormData({ ...formData, frase_inicial: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">System Prompt (Instrucciones ocultas para la IA)</label>
            <textarea
              required
              placeholder="Indica a la IA cómo debe comportarse: su personalidad, qué información tiene, qué no debe decir..."
              className="w-full border border-slate-200 rounded-xl p-3 h-40 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.system_prompt}
              onChange={e => setFormData({ ...formData, system_prompt: e.target.value })}
            />
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-semibold text-slate-800">Objetivos de la Sesión</h2>
            <button
              type="button"
              onClick={handleAddObjective}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-bold"
            >
              + Añadir Objetivo
            </button>
          </div>

          <div className="space-y-4">
            {objectives.map((obj, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="bg-slate-100 text-slate-500 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold mt-1">
                  {i + 1}
                </span>
                <input
                  required
                  placeholder="Ej: Conseguir que el cliente acepte el nuevo calendario"
                  className="flex-1 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={obj.descripcion}
                  onChange={e => handleObjectiveChange(i, e.target.value)}
                />
                {objectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(i)}
                    className="text-red-500 hover:text-red-700 p-2 mt-1 transition-colors bg-red-50 rounded-lg"
                    title="Eliminar objetivo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Creando escenario...' : 'Guardar y Publicar Escenario'}
          </button>
        </div>
      </form>
    </div>
  );
}
