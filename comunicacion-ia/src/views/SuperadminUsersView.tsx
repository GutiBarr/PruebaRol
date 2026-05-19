import { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { useStore } from '../store/useStore';
import type { Profile, UserRole } from '../types/database';

const ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  superadmin: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Superadmin' },
  admin:      { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Admin' },
  user:       { bg: 'bg-slate-100',  text: 'text-slate-600',  label: 'Usuario' },
};

function RoleIcon({ role }: { role: string }) {
  if (role === 'superadmin') {
    return (
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }
  if (role === 'admin') {
    return (
      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLES[role] ?? ROLE_STYLES.user;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${s.bg} ${s.text}`}>
      <RoleIcon role={role} />
      {s.label}
    </span>
  );
}

const avatarColors = [
  'from-indigo-400 to-violet-500',
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-pink-400 to-rose-500',
  'from-cyan-400 to-blue-500',
];

export function SuperadminUsersView() {
  const { userProfile, view, allUsers, setAllUsers } = useStore();
  const [loading, setLoading] = useState(allUsers.length === 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    async function loadUsers() {
      if (!userProfile) return;
      if (allUsers.length === 0) setLoading(true);
      try {
        const data = await dbService.getAllProfiles(userProfile.azure_oid);
        setAllUsers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [userProfile, view]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      if (!userProfile) return;
      await dbService.changeUserRole(userId, newRole, userProfile.azure_oid);
      setAllUsers(allUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error(error);
      alert('Error al cambiar el rol');
    }
  };

  const normalizeText = (text: string | null | undefined) =>
    text ? text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() : "";

  const filteredUsers = allUsers.filter(user => {
    const query = normalizeText(searchQuery);
    const matchesQuery = normalizeText(user.full_name).includes(query) ||
      normalizeText(user.email).includes(query);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  const countByRole = (role: string) => allUsers.filter(u => u.role === role).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-800 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest">Superadmin</p>
              <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { value: allUsers.length, label: 'Total' },
              { value: countByRole('user'), label: 'Usuarios' },
              { value: countByRole('admin'), label: 'Admins' },
              { value: countByRole('superadmin'), label: 'Superadmins' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3.5 text-center backdrop-blur-sm">
                <div className="text-xl font-bold">{value}</div>
                <div className="text-violet-300 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              autoComplete="off"
              placeholder="Buscar por nombre o email..."
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-400 outline-none transition-all bg-white shadow-sm text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500 focus:border-violet-400 outline-none transition-all bg-white shadow-sm text-sm cursor-pointer text-slate-700"
          >
            <option value="all">Todos los roles</option>
            <option value="user">Solo Usuarios</option>
            <option value="admin">Solo Administradores</option>
            <option value="superadmin">Solo Superadmins</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-600">
              {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Cambiar rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => {
                  const colorIdx = (user.full_name?.charCodeAt(0) ?? 0) % avatarColors.length;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`bg-gradient-to-br ${avatarColors[colorIdx]} w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0`}>
                            {(user.full_name ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-slate-800">{user.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{user.email}</td>
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-400 outline-none bg-white cursor-pointer transition-all hover:border-violet-300"
                        >
                          <option value="user">Usuario</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Superadmin</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="font-bold text-slate-700 mb-1">Sin resultados</p>
              <p className="text-slate-400 text-sm">No se encontraron usuarios que coincidan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
