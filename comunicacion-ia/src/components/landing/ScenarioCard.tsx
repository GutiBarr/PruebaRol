import { useState } from "react";
import { useStore } from "../../store/useStore";
import { dbService } from "../../services/dbService";
import type { Scenario } from "../../types/database";

interface Props {
  scenario: Scenario;
  index: number;
  onSelect: (scenario: Scenario) => void;
  onRefresh?: () => void;
  onUpdate?: (scenario: Scenario) => void;
}

export function ScenarioCard({ scenario, index, onSelect, onRefresh, onUpdate }: Props) {
  const { userProfile } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superadmin';

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userProfile) return;
    if (!confirm(`¿Estás seguro de que quieres eliminar el escenario "${scenario.titulo}"?`)) return;

    setIsDeleting(true);
    try {
      await dbService.deleteScenario(scenario.id, userProfile.azure_oid);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar el escenario");
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const handleToggleVisibility = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userProfile) return;
    
    const newActiveState = !scenario.is_active;
    
    // 1. Optimistic Update: Actualizamos la UI inmediatamente para que sea instantáneo
    if (onUpdate) {
      onUpdate({ ...scenario, is_active: newActiveState });
    }
    setShowMenu(false);
    
    // 2. Ejecutar la actualización de base de datos en segundo plano
    try {
      await dbService.updateScenarioStatus(scenario.id, newActiveState, userProfile.azure_oid);
      if (!onUpdate && onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      // Si falla después de todos los reintentos, revertimos el cambio optimista
      if (onUpdate) {
        onUpdate({ ...scenario, is_active: !newActiveState });
      }
      alert("Error de conexión con la base de datos al cambiar la visibilidad.");
    }
  };

  return (
    <div className="relative group h-full">
      <button
        onClick={() => onSelect(scenario)}
        style={{ animationDelay: `${index * 0.1}s` }}
        disabled={isDeleting || isUpdating}
        className={`card-enter text-left bg-white rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border overflow-hidden relative active:scale-[0.98] w-full h-full flex flex-col ${isDeleting || isUpdating ? 'opacity-50 grayscale' : ''} ${!scenario.is_active ? 'border-dashed border-amber-300' : 'border-slate-200 hover:border-[#4040FF]/30'}`}
      >
        <div className={`absolute top-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} style={{ background: !scenario.is_active ? 'linear-gradient(90deg,#F59E0B,#FCD34D)' : 'linear-gradient(90deg,#4040FF,#00D2C8)' }}></div>

        <div className="p-6 flex flex-col flex-1 w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              {scenario.nivel && (
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {scenario.nivel}
                </span>
              )}
              {scenario.competencia && (
                <span className="bg-violet-50 text-violet-700 border border-violet-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider max-w-[120px] truncate" title={scenario.competencia}>
                  {scenario.competencia}
                </span>
              )}
            </div>
            
            <div>
              {!scenario.is_active && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                  Oculto
                </span>
              )}
            </div>
          </div>

          <h3 className="font-semibold text-xl text-slate-900 mb-2 transition-colors" style={{ color: undefined }} onMouseEnter={(e) => (e.currentTarget.style.color = '#4040FF')} onMouseLeave={(e) => (e.currentTarget.style.color = '')}>
            {scenario.titulo}
          </h3>
          <p className="text-slate-600 text-sm mb-5 leading-relaxed flex-1 line-clamp-4">
            {scenario.descripcion}
          </p>



          <div className="flex items-center gap-4 text-xs pt-4 border-t border-slate-100">
            <div>
              <div className="text-slate-400 uppercase tracking-wider text-[10px]">
                Tu rol
              </div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {scenario.rol_usuario}
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div>
              <div className="text-slate-400 uppercase tracking-wider text-[10px]">
                Rol de la IA
              </div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {scenario.rol_ia}
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Menú de opciones para Admin */}
      {isAdmin && (
        <div 
          className="absolute top-2 right-2 p-2 z-20 flex flex-col items-end"
          onMouseLeave={() => setShowMenu(false)}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {showMenu && (
            <div className="mt-1 w-44 bg-white border rounded-lg shadow-xl py-1 z-30 overflow-hidden">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  useStore.getState().setEditingScenario(scenario);
                  useStore.getState().setView('admin-dashboard');
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 font-semibold border-b border-slate-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar Escenario
              </button>
              <button 
                onClick={handleToggleVisibility}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium border-b border-slate-50"
              >
                {scenario.is_active ? 'Ocultar Escenario' : 'Mostrar Escenario'}
              </button>
              <button 
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-semibold"
              >
                Eliminar Escenario
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
