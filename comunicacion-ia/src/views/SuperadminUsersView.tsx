import { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { useStore } from '../store/useStore';
import type { Profile, UserRole } from '../types/database';

export function SuperadminUsersView() {
  const { userProfile } = useStore();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    async function loadUsers() {
      if (!userProfile) return;
      try {
        const data = await dbService.getAllProfiles(userProfile.azure_oid);
        setUsers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [userProfile]);


  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      if (!userProfile) return;
      await dbService.changeUserRole(userId, newRole, userProfile.azure_oid);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error(error);
      alert('Error al cambiar el rol');
    }
  };

  const normalizeText = (text: string | null | undefined) => 
    text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

  const filteredUsers = users.filter(user => {
    const query = normalizeText(searchQuery);
    const matchesQuery = normalizeText(user.full_name).includes(query) || 
                         normalizeText(user.email).includes(query);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  if (loading) return <div className="p-8 text-center bg-white min-h-screen text-slate-500">Cargando usuarios...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-slate-900">Gestión de Usuarios</h1>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input 
          type="search" 
          autoComplete="off"
          placeholder="Buscar por nombre o email..." 
          className="flex-1 max-w-md border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm bg-white cursor-pointer"
        >
          <option value="all">Todos los roles</option>
          <option value="user">Solo Usuarios</option>
          <option value="admin">Solo Administradores</option>
          <option value="superadmin">Solo Superadmins</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rol Actual</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {user.full_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    className="text-sm border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="p-10 text-center text-slate-500">
            No se encontraron usuarios que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </div>
  );
}
