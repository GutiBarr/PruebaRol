import { useEffect, useState, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { useStore } from '../store/useStore';

export function GlobalHistoryView() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const { userProfile, setView } = useStore();

  useEffect(() => {
    async function loadSessions() {
      if (!userProfile) return;
      try {
        const data = await dbService.getAllSessions(userProfile.azure_oid);
        setSessions(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, [userProfile]);

  const groupedSessions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    sessions.forEach(session => {
      const userName = session.profiles?.full_name || 'Usuario Desconocido';
      if (!groups[userName]) groups[userName] = [];
      groups[userName].push(session);
    });
    return groups;
  }, [sessions]);

  const normalizeText = (text: string | null | undefined) => 
    text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

  const filteredUsers = useMemo(() => {
    const query = normalizeText(searchQuery);
    return Object.keys(groupedSessions)
      .filter(userName => normalizeText(userName).includes(query))
      .sort((a, b) => a.localeCompare(b));
  }, [groupedSessions, searchQuery]);

  const toggleUser = (userName: string) => {
    const next = new Set(expandedUsers);
    if (next.has(userName)) next.delete(userName);
    else next.add(userName);
    setExpandedUsers(next);
  };

  if (loading) return <div className="p-8 text-center">Cargando historial...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Historial Global de Sesiones</h1>
        <button onClick={() => setView('selector')} className="text-slate-500 hover:text-slate-800 text-sm font-medium">
          Volver al catálogo
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre de usuario..."
          className="w-full max-w-md border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredUsers.map(userName => {
          const userSessions = groupedSessions[userName];
          const isExpanded = expandedUsers.has(userName);
          const avgScore = Math.round(userSessions.reduce((acc, s) => acc + (s.puntuacion || 0), 0) / userSessions.length * 10) / 10;

          return (
            <div key={userName} className="bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-200">
              <button
                onClick={() => toggleUser(userName)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  {userSessions[0]?.profiles?.avatar_url ? (
                    <img
                      src={userSessions[0].profiles.avatar_url}
                      alt={userName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100"
                    />
                  ) : (
                    <div className="bg-indigo-100 text-indigo-700 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{userName}</h3>
                    <p className="text-sm text-slate-500">{userSessions.length} simulaciones realizadas</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Nota Media</div>
                    <div className="font-bold text-xl text-indigo-600">{avgScore}<span className="text-sm font-normal text-slate-400">/10</span></div>
                  </div>
                  <div className={`text-slate-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t bg-slate-50/50">
                  <div className="overflow-x-auto overflow-y-auto max-h-[350px]">
                    <table className="w-full text-left relative">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Fecha</th>
                          <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Escenario</th>
                          <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Puntuación</th>
                          <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Mensajes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {userSessions.map((session) => (
                          <tr key={session.id} className="hover:bg-white transition-colors">
                            <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                              {new Date(session.started_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-800">
                              {session.scenarios?.titulo || <span className="italic text-slate-400">Escenario Oculto</span>}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${session.puntuacion >= 7 ? 'bg-emerald-100 text-emerald-700' :
                                  session.puntuacion >= 5 ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                {session.puntuacion || 'N/A'}/10
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {session.session_messages?.length || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredUsers.length === 0 && !loading && (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No se encontraron usuarios</h3>
            <p className="text-slate-500">Prueba a buscar con otro nombre.</p>
          </div>
        )}
      </div>
    </div>
  );
}
