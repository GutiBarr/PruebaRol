import { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { useStore } from '../store/useStore';

export function AdminDashboardView() {
  const { setView, userProfile, editingScenario, setEditingScenario } = useStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    rol_usuario: '',
    rol_ia: '',
    contexto: '',
    frase_inicial: '',
    system_prompt: ''
  });
  const [improvisarFrase, setImprovisarFrase] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [objectives, setObjectives] = useState([{ descripcion: '' }]);

  useEffect(() => {
    if (editingScenario) {
      setFormData({
        titulo: editingScenario.titulo,
        rol_usuario: editingScenario.rol_usuario,
        rol_ia: editingScenario.rol_ia,
        contexto: editingScenario.contexto,
        frase_inicial: editingScenario.frase_inicial || '',
        system_prompt: editingScenario.system_prompt
      });
      setImprovisarFrase(!editingScenario.frase_inicial);
      setObjectives(editingScenario.objetivos && editingScenario.objetivos.length > 0 
        ? editingScenario.objetivos.map((o: any) => ({ descripcion: o.descripcion }))
        : [{ descripcion: '' }]
      );
    }
  }, [editingScenario]);

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

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToEdit = () => {
    setShowPreview(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePublish = async () => {
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

      if (editingScenario) {
        await dbService.updateScenario(
          editingScenario.id,
          {
            ...formData,
            frase_inicial: improvisarFrase ? '' : formData.frase_inicial,
            slug: scenarioSlug,
            descripcion: formData.contexto
          },
          processedObjectives,
          userProfile.azure_oid
        );
        alert('¡Escenario actualizado con éxito!');
      } else {
        await dbService.createScenario(
          {
            ...formData,
            frase_inicial: improvisarFrase ? '' : formData.frase_inicial,
            slug: scenarioSlug,
            descripcion: formData.contexto
          },
          processedObjectives,
          userProfile.azure_oid
        );
        alert('¡Escenario creado con éxito!');
      }
      
      setEditingScenario(null);
      setView('selector');
    } catch (error: any) {
      console.error("Error al guardar escenario:", error);
      alert(`Error: ${error.message || 'No se pudo guardar el escenario'}.`);
    } finally {
      setLoading(false);
    }
  };

  if (showPreview) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-slate-50 min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Vista Previa del Escenario</h1>
          <div className="flex items-center gap-4">
            <button onClick={handleBackToEdit} disabled={loading} className="text-slate-500 hover:text-slate-800 text-sm font-medium px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
              Volver a editar
            </button>
            <button onClick={handlePublish} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md transition-all">
              {loading ? 'Publicando...' : 'Publicar Escenario'}
            </button>
          </div>
        </div>

        <div className="space-y-8 pb-12">
          {/* Tarjeta de Catálogo */}
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="bg-slate-200 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> 
              Así se verá en el catálogo
            </h2>
            <div className="max-w-sm bg-white rounded-2xl border shadow-sm p-6 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{formData.titulo}</h3>
              <p className="text-slate-600 text-sm mb-6 line-clamp-3 leading-relaxed">{formData.contexto}</p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <span className="text-sm text-slate-500 font-medium">Módulo Nuevo</span>
                <span className="text-indigo-600 font-semibold text-sm group-hover:text-indigo-700">Entrar</span>
              </div>
            </div>
          </div>

          {/* Pantalla de Briefing */}
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="bg-slate-200 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> 
              Así se verá el Briefing (antes de empezar)
            </h2>
            <div className="bg-white p-8 rounded-2xl border shadow-sm">
              <div className="mb-6">
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Briefing</div>
                <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">{formData.titulo}</h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tu Rol</div>
                    <div className="text-slate-800 font-medium leading-snug">{formData.rol_usuario}</div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 text-violet-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Rol de la IA</div>
                    <div className="text-slate-800 font-medium leading-snug">{formData.rol_ia}</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-4">
                <h2 className="font-semibold mb-3 text-slate-900">Contexto</h2>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">{formData.contexto}</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h2 className="font-semibold mb-4 text-slate-900">Objetivos de la sesión</h2>
                <ul className="space-y-3">
                  {objectives.filter(o => o.descripcion.trim()).map((o, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-slate-700 leading-relaxed">{o.descripcion}</span>
                    </li>
                  ))}
                  {objectives.filter(o => o.descripcion.trim()).length === 0 && (
                    <li className="text-slate-500 italic text-sm">No se han añadido objetivos.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {editingScenario ? 'Editar Escenario' : 'Configurar Escenario'}
        </h1>
        <button onClick={() => { setEditingScenario(null); setView('selector'); }} className="text-slate-500 hover:text-slate-800 text-sm font-medium">
          Volver al catálogo
        </button>
      </div>

      <form onSubmit={handlePreview} className="space-y-8">
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

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">Inicio de la Conversación</label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="radio" 
                  name="inicio_ia" 
                  checked={!improvisarFrase} 
                  onChange={() => setImprovisarFrase(false)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">Escribir la frase inicial manualmente</span>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="radio" 
                  name="inicio_ia" 
                  checked={improvisarFrase} 
                  onChange={() => setImprovisarFrase(true)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex flex-col">
                  <span className="text-slate-700 font-medium">Dejar que la IA improvise</span>
                  <span className="text-slate-500 text-xs">La IA generará su primer mensaje automáticamente basándose en el contexto y system prompt.</span>
                </div>
              </label>
            </div>

            {!improvisarFrase && (
              <div className="pt-2">
                <input
                  required
                  placeholder="Ej: Hola, me habéis dicho que el proyecto se retrasa otra vez..."
                  className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.frase_inicial}
                  onChange={e => setFormData({ ...formData, frase_inicial: e.target.value })}
                />
              </div>
            )}
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98]"
          >
            Siguiente: Previsualizar {editingScenario ? 'Cambios' : 'Escenario'}
          </button>
        </div>
      </form>
    </div>
  );
}
