import { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { useStore } from '../store/useStore';
import type { Profile, UserRole } from '../types/database';

export function SuperadminUsersView() {
  const { userProfile } = useStore();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      if (!userProfile) return;
      try {
        try { await dbService.setAppContext(userProfile.azure_oid); } catch (e) { console.warn(e); }
        const data = await dbService.getAllProfiles();
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

  if (loading) return <div className="p-8 text-center">Cargando usuarios...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Gestión de Usuarios</h1>
      
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
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {user.full_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 
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
                    className="text-sm border rounded p-1"
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
      </div>
    </div>
  );
}
