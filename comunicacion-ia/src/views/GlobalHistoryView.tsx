import { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { useStore } from '../store/useStore';

export function GlobalHistoryView() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useStore();

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


  if (loading) return <div className="p-8 text-center">Cargando historial...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Historial Global de Sesiones</h1>
      
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Escenario</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Puntuación</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mensajes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(session.started_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {session.profiles?.full_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {session.scenarios?.titulo || <span className="italic text-gray-400">Escenario Oculto</span>}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    session.puntuacion >= 7 ? 'bg-emerald-100 text-emerald-700' : 
                    session.puntuacion >= 5 ? 'bg-amber-100 text-amber-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    {session.puntuacion || 'N/A'}/10
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {session.session_messages?.length || 0} mensajes
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sessions.length === 0 && (
          <div className="p-10 text-center text-gray-400">
            No hay sesiones registradas todavía.
          </div>
        )}
      </div>
    </div>
  );
}
