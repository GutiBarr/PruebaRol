import { useStore } from "./store/useStore";
import { SelectorView } from "./views/SelectorView";
import { BriefingView } from "./views/BriefingView";
import { ChatView } from "./views/ChatView";
import { FeedbackView } from "./views/FeedbackView";

import { AuthenticatedTemplate, UnauthenticatedTemplate} from "@azure/msal-react";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const view = useStore((s) => s.view);
  const { login, activeAccount } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900"> {/* Contenedor base para toda la app */}
      
      {/* USUARIO NO AUTENTICADO: Pantalla de bienvenida centrada */}
      <UnauthenticatedTemplate>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-500 to-purple-600">
          <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-sm w-full">
            <h1 className="text-3xl font-extrabold mb-2 text-gray-800">RolePlay Stemdo</h1>
            <p className="text-gray-500 mb-8">Simulador de comunicación con IA</p>
            
            <button 
              onClick={login} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform active:scale-95 shadow-lg"
            >
              Iniciar sesión con Microsoft
            </button>
          </div>
        </div>
      </UnauthenticatedTemplate>

      {/* USUARIO AUTENTICADO */}
      <AuthenticatedTemplate>
        {/* Contenedor de las Vistas: Aquí es donde se cargan tus pantallas */}
        <main className="h-[calc(100vh-57px)] overflow-auto">
          {(() => {
            switch (view) {
              case "selector": return <SelectorView />;
              case "briefing": return <BriefingView />;
              case "chat": return <ChatView />;
              case "feedback": return <FeedbackView />;
              default: return <SelectorView />;
            }
          })()}
        </main>
      </AuthenticatedTemplate>
    </div>
  );
}