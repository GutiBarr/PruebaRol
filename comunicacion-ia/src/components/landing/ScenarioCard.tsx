import { useState } from "react";
import { useStore } from "../../store/useStore";
import { dbService } from "../../services/dbService";
import type { Scenario } from "../../types/database";

interface Props {
  scenario: Scenario;
  index: number;
  onSelect: (scenario: Scenario) => void;
  onRefresh?: () => void;
}

export function ScenarioCard({ scenario, index, onSelect, onRefresh }: Props) {
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
    
    setIsUpdating(true);
    try {
      await dbService.updateScenarioStatus(scenario.id, !scenario.is_active, userProfile.azure_oid);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar la visibilidad");
    } finally {
      setIsUpdating(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={() => onSelect(scenario)}
        style={{ animationDelay: `${index * 0.1}s` }}
        disabled={isDeleting || isUpdating}
        className={`card-enter text-left bg-white rounded-sm shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200 hover:border-blue-800 overflow-hidden relative active:scale-[0.98] w-full ${isDeleting || isUpdating ? 'opacity-50 grayscale' : ''} ${!scenario.is_active ? 'border-dashed' : ''}`}
      >
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${!scenario.is_active ? 'from-amber-400 to-amber-200' : 'from-blue-800 to-blue-500'} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 tracking-wider">
                #{String(index + 1).padStart(2, "0")}
              </span>
              {!scenario.is_active && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                  Oculto
                </span>
              )}
            </div>
            <span className="text-slate-300 group-hover:text-blue-800 group-hover:translate-x-1 transition-all">
              →
            </span>
          </div>

          <h3 className="font-semibold text-xl text-slate-900 mb-2 group-hover:text-blue-900 transition-colors">
            {scenario.titulo}
          </h3>
          <p className="text-slate-600 text-sm mb-5 leading-relaxed">
            {scenario.descripcion}
          </p>

          <div className="bg-blue-50/60 border border-blue-100 rounded-sm p-3 mb-5">
            <div className="text-xs text-blue-800 font-semibold uppercase tracking-wider mb-1">
              La IA te dirá
            </div>
            <p className="text-sm text-slate-700 italic line-clamp-2">
              "{scenario.frase_inicial}"
            </p>
          </div>

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
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="text-xl leading-none">⋮</span>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white border rounded-lg shadow-xl py-1 z-30">
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
