import { useStore } from "./store/useStore";
import { SelectorView } from "./views/SelectorView";
import { BriefingView } from "./views/BriefingView";
import { ChatView } from "./views/ChatView";
import { FeedbackView } from "./views/FeedbackView";

import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const view = useStore((s) => s.view);
  const { login } = useAuth();

  return (
    <>
      {/* USUARIO NO AUTENTICADO: Pantalla de bienvenida centrada */}
      <UnauthenticatedTemplate>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-950 to-blue-800">
          <div className="bg-white p-10 rounded-sm shadow-2xl text-center max-w-sm w-full">
            <h1 className="text-3xl font-extrabold mb-2 text-slate-900">RolePlay Stemdo</h1>
            <p className="text-slate-500 mb-8">Simulador de comunicación con IA</p>

            <button
              onClick={login}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-sm transition-all transform active:scale-95 shadow-lg"
            >
              Iniciar sesión con Microsoft
            </button>
          </div>
        </div>
      </UnauthenticatedTemplate>

      {/* USUARIO AUTENTICADO */}
      <AuthenticatedTemplate>
        {(() => {
          switch (view) {
            case "selector": return <SelectorView />;
            case "briefing": return <BriefingView />;
            case "chat": return <ChatView />;
            case "feedback": return <FeedbackView />;
            default: return <SelectorView />;
          }
        })()}
      </AuthenticatedTemplate>
    </>
  );
}