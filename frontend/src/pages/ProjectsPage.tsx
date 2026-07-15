import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [key, setKey] = useState('');
  const [name, setName] = useState('');

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data,
  });

  const create = useMutation({
    mutationFn: () => api.post('/projects', { key, name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setKey('');
      setName('');
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Projetos</h1>
      <form
        className="card flex flex-wrap gap-3 p-4"
        onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
      >
        <input className="input max-w-[120px]" placeholder="KEY" value={key} onChange={(e) => setKey(e.target.value.toUpperCase())} required />
        <input className="input max-w-xs flex-1" placeholder="Nome do projeto" value={name} onChange={(e) => setName(e.target.value)} required />
        <button type="submit" className="btn-primary">Criar</button>
      </form>
      <div className="grid gap-3 md:grid-cols-2">
        {projects?.map((p: { id: string; key: string; name: string; description?: string }) => (
          <div key={p.id} className="card p-4">
            <h3 className="font-semibold">[{p.key}] {p.name}</h3>
            <p className="mb-3 text-sm text-slate-500">{p.description}</p>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link to={`/projects/${p.id}/backlog`} className="text-blue-600">Backlog</Link>
              <Link to={`/projects/${p.id}/board`} className="text-blue-600">Board</Link>
              <Link to={`/projects/${p.id}/sprints`} className="text-blue-600">Sprints</Link>
              <Link to={`/projects/${p.id}/qa`} className="text-blue-600">QA</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
