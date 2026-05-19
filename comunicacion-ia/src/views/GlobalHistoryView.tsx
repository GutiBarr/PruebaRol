import { useEffect, useState, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { useStore } from '../store/useStore';

function ScoreBadge({ score }: { score: number }) {
  if (score >= 7) return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700">{score}/10</span>;
  if (score >= 5) return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700">{score}/10</span>;
  return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700">{score ?? 'N/A'}/10</span>;
}

export function GlobalHistoryView() {
  const { userProfile, setView, view, globalSessions, setGlobalSessions } = useStore();
  const [loading, setLoading] = useState(globalSessions.length === 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadSessions() {
      if (!userProfile) return;
      if (globalSessions.length === 0) setLoading(true);
      try {
        const data = await dbService.getAllSessions(userProfile.azure_oid);
        setGlobalSessions(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, [userProfile, view]);

  const groupedSessions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    globalSessions.forEach(session => {
      const userName = session.profiles?.full_name || 'Usuario Desconocido';
      if (!groups[userName]) groups[userName] = [];
      groups[userName].push(session);
    });
    return groups;
  }, [globalSessions]);

  const normalizeText = (text: string | null | undefined) =>
    text ? text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() : "";

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

  const totalSessions = globalSessions.length;
  const globalAvg = totalSessions
    ? Math.round((globalSessions.reduce((acc, s) => acc + (s.puntuacion || 0), 0) / totalSessions) * 10) / 10
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm">Cargando historial global...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Administración</p>
                <h1 className="text-2xl font-bold">Historial Global</h1>
              </div>
            </div>
            <button
              onClick={() => setView('selector')}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold">{Object.keys(groupedSessions).length}</div>
              <div className="text-slate-400 text-xs mt-0.5">Usuarios activos</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold">{totalSessions}</div>
              <div className="text-slate-400 text-xs mt-0.5">Sesiones totales</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-indigo-300">{globalAvg}<span className="text-sm font-normal text-slate-400">/10</span></div>
              <div className="text-slate-400 text-xs mt-0.5">Nota media global</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Search */}
        <div className="mb-6 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar usuario..."
            className="w-full max-w-md pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none transition-all bg-white shadow-sm text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* User list */}
        <div className="space-y-3">
          {filteredUsers.map(userName => {
            const userSessions = groupedSessions[userName];
            const isExpanded = expandedUsers.has(userName);
            const avgScore = Math.round(userSessions.reduce((acc, s) => acc + (s.puntuacion || 0), 0) / userSessions.length * 10) / 10;
            const avatarColors = [
              'from-indigo-400 to-violet-500',
              'from-blue-400 to-indigo-500',
              'from-emerald-400 to-teal-500',
              'from-amber-400 to-orange-500',
              'from-pink-400 to-rose-500',
            ];
            const colorIndex = userName.charCodeAt(0) % avatarColors.length;

            return (
              <div key={userName} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                <button
                  onClick={() => toggleUser(userName)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50/80 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    {userSessions[0]?.profiles?.avatar_url ? (
                      <img
                        src={userSessions[0].profiles.avatar_url}
                        alt={userName}
                        className="w-11 h-11 rounded-xl object-cover border-2 border-indigo-100"
                      />
                    ) : (
                      <div className={`bg-gradient-to-br ${avatarColors[colorIndex]} w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-sm`}>
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-800">{userName}</h3>
                      <p className="text-xs text-slate-400">{userSessions.length} simulaci{userSessions.length === 1 ? 'ón' : 'ones'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Media</div>
                      <div className={`font-bold text-lg ${avgScore >= 7 ? 'text-emerald-600' : avgScore >= 5 ? 'text-amber-500' : 'text-red-500'}`}>
                        {avgScore}<span className="text-xs font-normal text-slate-400">/10</span>
                      </div>
                    </div>
                    <div className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100">
                    <div className="overflow-x-auto overflow-y-auto max-h-[350px]">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10">
                          <tr>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Escenario</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Puntuación</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Mensajes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {userSessions.map((session) => (
                            <tr key={session.id} className="hover:bg-indigo-50/40 transition-colors">
                              <td className="px-6 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                                {new Date(session.started_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-6 py-3.5 text-sm font-medium text-slate-800">
                                {session.scenarios?.titulo || <span className="italic text-slate-400">Escenario oculto</span>}
                              </td>
                              <td className="px-6 py-3.5">
                                <ScoreBadge score={session.puntuacion} />
                              </td>
                              <td className="px-6 py-3.5 text-sm text-slate-500">
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
            );
          })}

          {filteredUsers.length === 0 && !loading && (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">Sin resultados</h3>
              <p className="text-slate-400 text-sm">No se encontraron usuarios que coincidan con tu búsqueda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
