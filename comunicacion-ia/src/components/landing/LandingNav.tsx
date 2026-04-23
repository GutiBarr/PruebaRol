import {useMsal } from "@azure/msal-react";
export function LandingNav() {
  const { accounts } = useMsal();
  const userName = accounts[0]?.name || "Usuario";
  return (
    <nav className="bg-blue-50/60 backdrop-blur-md border-b border-blue-100 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-900 to-blue-700 rounded-sm flex items-center justify-center text-white font-bold text-sm">
            R
          </div>
          <span className="font-semibold text-slate-900">RolePlay Stemdo</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-600">
          <span className="hidden md:block">Plataforma de entrenamiento</span>
          <span className="inline-flex items-center gap-1.5 bg-white text-blue-800 border border-blue-200 px-2.5 py-1 rounded-sm text-xs font-medium uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            Activo
          </span>
          <div className="border-l border-blue-200 pl-3 hidden sm:block">
              <span className="font-bold text-blue-900 leading-none">{userName}</span>
            </div>
        </div>
      </div>
    </nav>
  );
}