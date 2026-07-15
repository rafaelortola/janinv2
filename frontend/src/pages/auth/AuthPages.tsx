import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@acme.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data);
      navigate('/dashboard');
    } catch {
      setError('Credenciais inválidas');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-6">
        <h1 className="text-2xl font-bold">Entrar</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Senha</label>
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        <button type="submit" className="btn-primary w-full">Entrar</button>
        <p className="text-center text-sm text-slate-500">
          Nova empresa? <Link to="/register" className="text-blue-600">Contratar plano</Link>
        </p>
      </form>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({
    companyName: '', name: '', email: '', password: '', planId: '',
  });
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => (await api.get('/plans')).data,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/register-company', form);
      setAuth(data);
      navigate('/dashboard');
    } catch {
      setError('Erro ao registrar. Verifique os dados.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form onSubmit={submit} className="card w-full max-w-lg space-y-4 p-6">
        <h1 className="text-2xl font-bold">Contratar plano</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="mb-1 block text-sm">Plano</label>
          <select className="input" value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} required>
            <option value="">Selecione...</option>
            {plans?.map((p: { id: string; name: string; seatLimit: number }) => (
              <option key={p.id} value={p.id}>{p.name} — {p.seatLimit} usuários</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm">Nome da empresa</label>
          <input className="input" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Seu nome</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Senha</label>
          <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <button type="submit" className="btn-primary w-full">Criar conta</button>
        <p className="text-center text-sm"><Link to="/login" className="text-blue-600">Já tenho conta</Link></p>
      </form>
    </div>
  );
}
