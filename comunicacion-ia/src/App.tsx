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
import { HistoryView } from "./views/HistoryView";

// Stemdo brand assets
import logoColorSrc from "./components/assets/Stemdo_Principal_Color.png";
import logoWhiteSrc from "./components/assets/Stemdo_Logo_Full_White.png";

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
      if (inProgress !== "none") return;

      if (activeAccount) {
        const isStemdoEmail = activeAccount.username.toLowerCase().endsWith('@stemdo.io');

        if (!isStemdoEmail) {
          if (isMounted) {
            setError("Acceso restringido: Solo cuentas de @stemdo.io están permitidas.");
            setInitializing(false);
          }
          return;
        }

        try {
          // Siempre intentamos sincronizar el perfil para tener el rol actualizado
          try {
            await dbService.setAppContext(activeAccount.localAccountId);
          } catch (rlsError) {
            console.warn("RLS Context warning:", rlsError);
          }

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
    }

    initUser();
    return () => { isMounted = false; };
  }, [activeAccount, inProgress, setUserProfile]);

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
    instance.logoutRedirect({ postLogoutRedirectUri: "/" });
  };

  const isMsalBusy = inProgress !== "none";
  const isWaitingForProfile = activeAccount && !userProfile && !error;

  // ── LOADING SCREEN ──────────────────────────────────────────────────────────
  if (isMsalBusy || (initializing && isWaitingForProfile)) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-6"
        style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #1a1a3e 100%)" }}
      >

        <img src={logoWhiteSrc} alt="Stemdo" className="h-8 object-contain opacity-90"
          style={{ filter: "brightness(0) invert(1)" }} />

        <div className="flex items-center gap-3">
          <div
            className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#4040FF", borderTopColor: "transparent" }}
          />
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
            {isMsalBusy ? "Verificando identidad con Microsoft..." : "Sincronizando perfil..."}
          </p>
        </div>
      </div>
    );
  }

  // ── ERROR SCREEN ────────────────────────────────────────────────────────────
  if (error) {
    const isDomainError = error.includes("@stemdo.io");

    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen p-6"
        style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #1a1a3e 100%)" }}
      >

        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-10 text-center">
          <img src={logoColorSrc} alt="Stemdo" className="h-7 object-contain mx-auto mb-8" />
          <div className="text-4xl mb-4">{isDomainError ? "🚫" : "⚠️"}</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {isDomainError ? "Acceso denegado" : "Error de conexión"}
          </h2>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleLogout}
              className="w-full text-white font-bold py-3 rounded-xl transition hover:opacity-90"
              style={{ background: "#FF2D78" }}
            >
              Cerrar sesión e intentar con otra cuenta
            </button>
            {!isDomainError && (
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl hover:bg-slate-200 transition font-medium"
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── LOGIN SCREEN ────────────────────────────────────────────────────────────
  if (!activeAccount) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #1a1a3e 60%, #0D0D1F 100%)" }}
      >

        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(#4040FF 1px, transparent 1px), linear-gradient(90deg, #4040FF 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
          style={{ background: "#4040FF" }} />

        {/* Card */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-10 text-center">
          <img src={logoColorSrc} alt="Stemdo" className="h-8 object-contain mx-auto mb-8" />

          <div
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(64,64,255,0.08)", color: "#4040FF" }}
          >
            Simulador IA · RolePlay
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Bienvenido
          </h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Inicia sesión con tu cuenta de Microsoft para acceder a la plataforma de formación.
          </p>

          <button
            onClick={login}
            className="w-full text-white font-bold py-3.5 px-6 rounded-xl transition-all hover:opacity-90 hover:scale-[1.02] flex items-center justify-center gap-3 shadow-lg"
            style={{
              background: "#4040FF",
              boxShadow: "0 4px 24px rgba(64,64,255,0.4)",
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
              <path d="M10 0H0v10h10V0z" fill="#F25022"/>
              <path d="M21 0H11v10h10V0z" fill="#7FBA00"/>
              <path d="M10 11H0v10h10V11z" fill="#00A4EF"/>
              <path d="M21 11H11v10h10V11z" fill="#FFB900"/>
            </svg>
            Iniciar sesión con Microsoft
          </button>

          <p className="text-[11px] text-slate-400 mt-5">
            Solo disponible para cuentas @stemdo.io
          </p>
        </div>
      </div>
    );
  }

  if (!userProfile) return null;

  // ── MAIN APP ────────────────────────────────────────────────────────────────
  const roleBadge = {
    superadmin: { bg: "rgba(255,45,120,0.12)", color: "#FF2D78", label: "Superadmin" },
    admin:      { bg: "rgba(64,64,255,0.12)",  color: "#4040FF", label: "Admin" },
    user:       { bg: "rgba(0,210,200,0.12)",   color: "#00A89F", label: "Usuario" },
  }[userProfile.role] ?? { bg: "#f1f5f9", color: "#64748b", label: userProfile.role };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--stemdo-bg)" }}>

      {/* ── HEADER ── */}
      <header className="bg-white border-b sticky top-0 z-50" style={{ borderColor: "#E5E5F0" }}>

        <div className="px-6 py-3 flex justify-between items-center">
          {/* Logo + badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('selector')}
              className="flex items-center gap-3 group"
              style={{ background: "none", border: "none", padding: 0 }}
            >
              <img
                src={logoColorSrc}
                alt="Stemdo"
                className="h-6 object-contain transition-opacity group-hover:opacity-80"
              />
              <span
                className="hidden sm:block text-xs font-semibold pl-3 border-l"
                style={{ borderColor: "#E5E5F0", color: "#9090B0" }}
              >
                RolePlay IA
              </span>
            </button>

            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: roleBadge.bg, color: roleBadge.color }}
            >
              {roleBadge.label}
            </span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <NavBtn active={view === 'selector'} onClick={() => setView('selector')}>
              Escenarios
            </NavBtn>

            <NavBtn active={view === 'history'} onClick={() => setView('history')}>
              Mi Historial
            </NavBtn>

            {(userProfile.role === 'admin' || userProfile.role === 'superadmin') && (
              <>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <NavBtn active={view === 'admin-dashboard'} onClick={() => setView('admin-dashboard')}>
                  Crear escenarios
                </NavBtn>
                <NavBtn active={view === 'global-history'} onClick={() => setView('global-history')}>
                  Historial global
                </NavBtn>
              </>
            )}

            {userProfile.role === 'superadmin' && (
              <NavBtn active={view === 'superadmin-users'} onClick={() => setView('superadmin-users')}>
                Usuarios
              </NavBtn>
            )}

            {/* User menu */}
            <div className="relative flex items-center gap-2 border-l ml-2 pl-4" style={{ borderColor: "#E5E5F0" }}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 focus:outline-none group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-none group-hover:text-[#4040FF] transition-colors">
                    {userProfile.full_name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{userProfile.email}</p>
                </div>
                <div
                  className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm border-2 transition-all group-hover:border-[#4040FF]"
                  style={{ background: "rgba(64,64,255,0.1)", borderColor: "rgba(64,64,255,0.2)", color: "#4040FF" }}
                >
                  {userPhoto ? (
                    <img src={userPhoto} alt={userProfile.full_name} className="w-full h-full object-cover" />
                  ) : (
                    (userProfile.full_name || "U").charAt(0)
                  )}
                </div>
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-3 w-52 bg-white rounded-xl shadow-xl border py-2 z-50"
                    style={{ borderColor: "#E5E5F0" }}>
                    <div className="px-4 py-2 border-b mb-1" style={{ borderColor: "#F0F0F8" }}>
                      <p className="text-xs font-bold text-slate-800 truncate">{userProfile.full_name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{userProfile.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors hover:bg-red-50"
                      style={{ color: "#FF2D78" }}
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
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-auto bg-white">
        {(() => {
          switch (view) {
            case "selector":          return <SelectorView />;
            case "briefing":          return <BriefingView />;
            case "chat":              return <ChatView />;
            case "feedback":          return <FeedbackView />;
            case "custom-creator":    return <CustomScenarioView />;
            case "admin-dashboard":   return <AdminDashboardView />;
            case "global-history":    return <GlobalHistoryView />;
            case "superadmin-users":  return <SuperadminUsersView />;
            case "history":           return <HistoryView />;
            default:                  return <SelectorView />;
          }
        })()}
      </main>
    </div>
  );
}

// ── Small helper component ──────────────────────────────────────────────────
function NavBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
      style={{
        background: active ? "rgba(64,64,255,0.1)" : "transparent",
        color: active ? "#4040FF" : "#6B7280",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(64,64,255,0.06)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}