import { useStore } from "./store/useStore";
import { SelectorView } from "./views/SelectorView";
import { BriefingView } from "./views/BriefingView";
import { ChatView } from "./views/ChatView";
import { FeedbackView } from "./views/FeedbackView";
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { useAuth } from "./hooks/useAuth";
import { CustomScenarioView } from "./views/CustomScenarioView";
import { useState, useEffect } from 'react';
import { supabase } from "./services/supabase";

export default function App() {
  const view = useStore((s) => s.view);
  const { login } = useAuth();
  const [todos, setTodos] = useState<any[]>([]); // Estado para los datos de Supabase

  // Lógica de la imagen image_100ac0.png integrada aquí
  useEffect(() => {
    async function getTodos() {
      const { data } = await supabase.from('todos').select('*');
      if (data) {
        setTodos(data);
      }
    }
    getTodos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      
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

      <AuthenticatedTemplate>
        <main className="h-[calc(100vh-57px)] overflow-auto">
          {/* Opcional: Mostrar los todos en algún lado para probar */}
          <div className="hidden">Datos cargados: {todos.length}</div>
          
          {(() => {
            switch (view) {
              case "selector": return <SelectorView />;
              case "briefing": return <BriefingView />;
              case "chat": return <ChatView />;
              case "feedback": return <FeedbackView />;
              case "custom-creator": return <CustomScenarioView />;
              default: return <SelectorView />;
            }
          })()}
        </main>
      </AuthenticatedTemplate>
    </div>
  );
}