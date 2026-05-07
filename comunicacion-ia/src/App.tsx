import { useStore } from "./store/useStore";
import { SelectorView } from "./views/SelectorView";
import { BriefingView } from "./views/BriefingView";
import { ChatView } from "./views/ChatView";
import { FeedbackView } from "./views/FeedbackView";
import { useMsal } from "@azure/msal-react";
import { useAuth } from "./hooks/useAuth";
import { CustomScenarioView } from "./views/CustomScenarioView";
import { useEffect, useState } from 'react';
import { dbService } from "./services/dbService";
import { AdminDashboardView } from "./views/AdminDashboardView";
import { GlobalHistoryView } from "./views/GlobalHistoryView";
import { SuperadminUsersView } from "./views/SuperadminUsersView";

export default function App() {
  const { view, userProfile, setUserProfile, setView } = useStore();
  const { login, activeAccount } = useAuth();
  const { inProgress, accounts } = useMsal();
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initUser() {
      if (activeAccount) {
        try {
          setError(null);
          // Intentar establecer el contexto, pero no bloquear si falla (dar aviso)
          try {
            await dbService.setAppContext(activeAccount.localAccountId);
          } catch (rlsError) {
            console.warn("No se pudo establecer el contexto RLS. ¿Has creado la función set_config en Supabase?", rlsError);
          }

          console.log("Intentando cargar perfil para:", activeAccount.username);
          const profile = await dbService.upsertProfile(
            activeAccount.localAccountId,
            activeAccount.username,
            activeAccount.name || "Usuario",
            "" 
          );
          
          setUserProfile(profile);
        } catch (err: any) {
          console.error("Error crítico de inicialización:", err);
          setError(`Error al conectar con la base de datos: ${err.message || "Desconocido"}. Revisa si has ejecutado el script SQL completo.`);
        } finally {
          setInitializing(false);
        }
      } else if (inProgress === "none") {
        setInitializing(false);
      }
    }
    initUser();
  }, [activeAccount, inProgress, setUserProfile]);


  const isMsalBusy = inProgress !== "none";
  const hasAccountsButNotReady = accounts.length > 0 && !userProfile && initializing;

  if (isMsalBusy || hasAccountsButNotReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-500 animate-pulse font-medium text-center px-4">
          {isMsalBusy ? "Verificando identidad con Microsoft..." : "Sincronizando perfil..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error de conexión</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!activeAccount) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-sm w-full">
          <h1 className="text-3xl font-extrabold mb-2 text-gray-800">RolePlay Stemdo</h1>
          <p className="text-gray-500 mb-8">Simulador de comunicación con IA</p>
          <button onClick={login} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg">
            Iniciar sesión con Microsoft
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">No se pudo cargar el perfil del usuario.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-xl text-indigo-600 cursor-pointer" onClick={() => setView('selector')}>
            RolePlay Stemdo
          </h1>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
            userProfile.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 
            userProfile.role === 'admin' ? 'bg-blue-100 text-blue-700' : 
            'bg-indigo-100 text-indigo-700'
          }`}>
            {userProfile.role}
          </span>
        </div>
        
        <nav className="flex items-center gap-6">
          <button onClick={() => setView('selector')} className={`text-sm font-medium transition-colors ${view === 'selector' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>
            Escenarios
          </button>
          
          {(userProfile.role === 'admin' || userProfile.role === 'superadmin') && (
            <>
              <button onClick={() => setView('admin-dashboard')} className={`text-sm font-medium transition-colors ${view === 'admin-dashboard' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>
                Admin
              </button>
              <button onClick={() => setView('global-history')} className={`text-sm font-medium transition-colors ${view === 'global-history' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>
                Historial Global
              </button>
            </>
          )}

          {userProfile.role === 'superadmin' && (
            <button onClick={() => setView('superadmin-users')} className={`text-sm font-medium transition-colors ${view === 'superadmin-users' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>
              Usuarios
            </button>
          )}

          <div className="flex items-center gap-3 border-l pl-6 ml-2">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-800 leading-none">{userProfile.full_name}</p>
              <p className="text-[10px] text-gray-500 mt-1">{userProfile.email}</p>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 overflow-auto">
        {(() => {
          switch (view) {
            case "selector": return <SelectorView />;
            case "briefing": return <BriefingView />;
            case "chat": return <ChatView />;
            case "feedback": return <FeedbackView />;
            case "custom-creator": return <CustomScenarioView />;
            case "admin-dashboard": return <AdminDashboardView />;
            case "global-history": return <GlobalHistoryView />;
            case "superadmin-users": return <SuperadminUsersView />;
            default: return <SelectorView />;
          }
        })()}
      </main>
    </div>
  );
}