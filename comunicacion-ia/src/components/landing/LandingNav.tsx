import { useMsal } from "@azure/msal-react";
import { useEffect, useState, useRef } from "react";

export function LandingNav() {
  const { accounts, instance } = useMsal();
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); // Para detectar clics fuera
  
  const userName = accounts[0]?.name || "Usuario";

  // Efecto para cerrar el menú si haces clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchPhoto = async () => {
      if (accounts.length > 0) {
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
    fetchPhoto();
  }, [accounts, instance]);

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: "/",
    });
  };

  return (
    <nav className="bg-blue-50/60 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-900 to-blue-700 rounded-sm flex items-center justify-center text-white font-bold text-sm">
            R
          </div>
          <span className="font-semibold text-slate-900">RolePlay Stemdo</span>
        </div>

        {/* Info y Perfil */}
        <div className="flex items-center gap-6">
          <span className="hidden md:inline-flex items-center gap-1.5 bg-white text-blue-800 border border-blue-200 px-2.5 py-1 rounded-sm text-xs font-medium uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
            Activo
          </span>

          {/* Menú de Usuario */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 focus:outline-none group"
            >
              <div className="hidden sm:flex flex-col items-end">
                <span className="font-bold text-blue-900 text-xs leading-none group-hover:text-blue-700">{userName}</span>
                <span className="text-[10px] text-slate-400">Mi cuenta ▼</span>
              </div>
              
              <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-blue-100 flex items-center justify-center group-hover:border-blue-200 transition-all">
                {userPhoto ? (
                  <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-blue-700 font-bold text-sm">{userName.charAt(0)}</span>
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in duration-150">
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Sesión iniciada</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">{accounts[0]?.username}</p>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}