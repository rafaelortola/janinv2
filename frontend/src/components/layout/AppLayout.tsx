import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';
import { LayoutDashboard, Users, FolderKanban, LogOut } from 'lucide-react';

export default function AppLayout() {
  const { user, company, systemRole, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white p-4">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-blue-600">Janin v2</h1>
          <p className="text-xs text-slate-500">{company?.name}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <NavLink to="/dashboard" className={linkClass}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to="/projects" className={linkClass}>
            <FolderKanban size={16} /> Projetos
          </NavLink>
          {systemRole === 'ADMIN' && (
            <NavLink to="/members" className={linkClass}>
              <Users size={16} /> Membros
            </NavLink>
          )}
        </nav>
        <div className="border-t border-slate-200 pt-4">
          <p className="mb-2 text-sm font-medium">{user?.name}</p>
          <button type="button" onClick={logout} className="btn-secondary w-full gap-2">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
