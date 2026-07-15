import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function DashboardPage() {
  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: async () => (await api.get('/companies/me')).data,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data,
  });

  const sub = company?.subscription;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm text-slate-500">Plano</p>
          <p className="text-xl font-semibold">{sub?.plan?.name ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Seats</p>
          <p className="text-xl font-semibold">{sub?.seatsUsed ?? 0} / {sub?.seatLimit ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Projetos</p>
          <p className="text-xl font-semibold">{projects?.length ?? 0}</p>
        </div>
      </div>
      <div className="card p-4">
        <h2 className="mb-3 font-semibold">Projetos recentes</h2>
        <ul className="space-y-2">
          {projects?.map((p: { id: string; key: string; name: string }) => (
            <li key={p.id}>
              <Link to={`/projects/${p.id}/board`} className="text-blue-600 hover:underline">
                [{p.key}] {p.name}
              </Link>
            </li>
          )) ?? <li className="text-slate-500">Nenhum projeto ainda</li>}
        </ul>
      </div>
    </div>
  );
}
