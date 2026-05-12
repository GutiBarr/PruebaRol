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
  const { inProgress, accounts, instance } = useMsal();

  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initUser() {
      // 1. Esperar a que MSAL termine de procesar el estado inicial
      if (inProgress !== "none") return;

      if (activeAccount) {
        // 🛡️ VALIDACIÓN DE DOMINIO: Solo permitir @stemdo.io
        const isStemdoEmail = activeAccount.username.toLowerCase().endsWith('@stemdo.io');

        if (!isStemdoEmail) {
          if (isMounted) {
            setError("Acceso restringido: Solo cuentas de @stemdo.io están permitidas.");
            setInitializing(false);
          }
          return;
        }

        if (!userProfile) {
          try {
            // Intentar establecer contexto de seguridad
            try {
              await dbService.setAppContext(activeAccount.localAccountId);
            } catch (rlsError) {
              console.warn("RLS Context warning:", rlsError);
            }

            console.log("Cargando perfil para:", activeAccount.username);
            const profile = await dbService.upsertProfile(
              activeAccount.localAccountId,
              activeAccount.username,
              activeAccount.name || "Usuario",
              ""
            );

            if (isMounted) {
              setUserProfile(profile);
              setError(null);
            }
          } catch (err: any) {
            console.error("Error crítico de inicialización:", err);
            if (isMounted) {
              setError(err.message || "Error al conectar con la base de datos.");
            }
          } finally {
            if (isMounted) setInitializing(false);
          }
        } else {
          if (isMounted) setInitializing(false);
        }
      } else {
        // No hay cuenta activa y MSAL terminó de buscar
        if (isMounted) setInitializing(false);
      }
    }

    initUser();
    return () => { isMounted = false; };
  }, [activeAccount, inProgress, setUserProfile, userProfile]);

  // Carga de foto de Microsoft Graph
  useEffect(() => {
    const fetchPhoto = async () => {
      if (accounts.length > 0 && activeAccount?.username.toLowerCase().endsWith('@stemdo.io')) {
        try {
          const response = await instance.acquireTokenSilent({
            scopes: ["User.Read"],
            account: accounts[0],
          });

          const photoResponse = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
            headers: { Authorization: `Bearer ${response.accessToken}` },
          });

          if (photoResponse.ok) {
            const blob = await photoResponse.blob();
            setUserPhoto(URL.createObjectURL(blob));
          }
        } catch (error) {
          console.error("Error cargando foto:", error);
        }
      }
    };
    if (activeAccount) fetchPhoto();
  }, [accounts, instance, activeAccount]);

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: "/",
    });
  };

  // --- ESTADOS DE CARGA (Evitan el parpadeo) ---
  const isMsalBusy = inProgress !== "none";
  const isWaitingForProfile = activeAccount && !userProfile && !error;

  if (isMsalBusy || (initializing && isWaitingForProfile)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-500 animate-pulse font-medium text-center px-4">
          {isMsalBusy ? "Verificando identidad con Microsoft..." : "Sincronizando perfil..."}
        </p>
      </div>
    );
  }

  // --- PANTALLA DE ERROR (Incluye bloqueo de dominio) ---
  if (error) {
    const isDomainError = error.includes("@stemdo.io");

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
          <div className="text-4xl mb-4">{isDomainError ? "🚫" : "⚠️"}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isDomainError ? "Acceso denegado" : "Error de conexión"}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition"
            >
              Cerrar sesión e intentar con otra cuenta
            </button>
            {!isDomainError && (
              <button onClick={() => window.location.reload()} className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition">
                Reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA DE LOGIN (Si no hay cuenta activa) ---
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

  // Fallback por si acaso falla el perfil sin lanzar error
  if (!userProfile) return null;

  // --- APLICACIÓN PRINCIPAL ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setView('selector')}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:bg-indigo-700 transition-colors">
              R
            </div>
            <h1 className="font-bold text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">
              RolePlay Stemdo
            </h1>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${userProfile.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
              userProfile.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                'bg-indigo-100 text-indigo-700'
            }`}>
            {userProfile.role}
          </span>
        </div>

        <nav className="flex items-center gap-6">
          <button
            onClick={() => setView('selector')}
            className={`text-sm font-medium transition-colors ${view === 'selector' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Escenarios
          </button>

          {(userProfile.role === 'admin' || userProfile.role === 'superadmin') && (
            <>
              <button
                onClick={() => setView('admin-dashboard')}
                className={`text-sm font-medium transition-colors ${view === 'admin-dashboard' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Crear escenarios
              </button>
              <button
                onClick={() => setView('global-history')}
                className={`text-sm font-medium transition-colors ${view === 'global-history' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Historial Global
              </button>
            </>
          )}

          {userProfile.role === 'superadmin' && (
            <button
              onClick={() => setView('superadmin-users')}
              className={`text-sm font-medium transition-colors ${view === 'superadmin-users' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Usuarios
            </button>
          )}

          <div className="relative flex items-center gap-3 border-l pl-6 ml-2">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 focus:outline-none group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-gray-800 leading-none group-hover:text-indigo-600 transition-colors">{userProfile.full_name}</p>
                <p className="text-[10px] text-gray-500 mt-1">{userProfile.email}</p>
              </div>
              <div className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden bg-indigo-50 flex items-center justify-center group-hover:border-indigo-300 transition-all">
                {userPhoto ? (
                  <img src={userPhoto} alt={userProfile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-indigo-600 font-bold text-sm">{(userProfile.full_name || "U").charAt(0)}</span>
                )}
              </div>
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in duration-150">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
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