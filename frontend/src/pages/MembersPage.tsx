import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { JOB_ROLES } from '../lib/utils';

export default function MembersPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: '', name: '', jobRole: 'DEV', password: '' });

  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: async () => (await api.get('/companies/me')).data,
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get('/companies/me/members')).data,
  });

  const add = useMutation({
    mutationFn: () => api.post('/companies/me/members', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['company'] });
      setForm({ email: '', name: '', jobRole: 'DEV', password: '' });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/companies/me/members/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['company'] });
    },
  });

  const sub = company?.subscription;
  const pct = sub ? Math.round((sub.seatsUsed / sub.seatLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Membros</h1>
      <div className="card p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span>Seats usados</span>
          <span>{sub?.seatsUsed ?? 0} / {sub?.seatLimit ?? 0}</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <form className="card grid gap-2 p-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
        <input className="input" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <select className="input" value={form.jobRole} onChange={(e) => setForm({ ...form, jobRole: e.target.value })}>
          {JOB_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <input className="input" type="password" placeholder="Senha (novo usuário)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit" className="btn-primary md:col-span-2" disabled={sub && sub.seatsUsed >= sub.seatLimit}>
          Adicionar membro
        </button>
      </form>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3">Função</th>
              <th className="p-3">Permissão</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {members?.map((m: { id: string; systemRole: string; jobRole: string; user: { name: string; email: string } }) => (
              <tr key={m.id} className="border-t">
                <td className="p-3">{m.user.name}</td>
                <td className="p-3">{m.user.email}</td>
                <td className="p-3"><span className="badge bg-blue-100 text-blue-800">{m.jobRole}</span></td>
                <td className="p-3">{m.systemRole}</td>
                <td className="p-3">
                  {m.systemRole !== 'ADMIN' && (
                    <button type="button" className="text-xs text-red-600" onClick={() => remove.mutate(m.id)}>Remover</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
