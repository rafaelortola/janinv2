import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function SprintsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null);

  const { data: sprints } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => (await api.get(`/projects/${projectId}/sprints`)).data,
    enabled: !!projectId,
  });

  const { data: metrics } = useQuery({
    queryKey: ['sprint-metrics', selectedSprint],
    queryFn: async () => (await api.get(`/sprints/${selectedSprint}/metrics`)).data,
    enabled: !!selectedSprint,
  });

  const create = useMutation({
    mutationFn: () => api.post(`/projects/${projectId}/sprints`, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', projectId] });
      setName('');
    },
  });

  const activate = useMutation({
    mutationFn: (id: string) => api.patch(`/sprints/${id}/activate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', projectId] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sprints</h1>
      <form className="card flex gap-2 p-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
        <input className="input flex-1" placeholder="Nome do sprint" value={name} onChange={(e) => setName(e.target.value)} required />
        <button type="submit" className="btn-primary">Criar Sprint</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 font-semibold">Lista</h2>
          <ul className="space-y-2">
            {sprints?.map((s: { id: string; name: string; status: string; _count: { workItems: number } }) => (
              <li key={s.id} className="flex items-center justify-between rounded border border-slate-200 p-2">
                <button type="button" className="text-left" onClick={() => setSelectedSprint(s.id)}>
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 text-xs text-slate-500">{s.status} · {s._count.workItems} items</span>
                </button>
                {s.status === 'PLANNED' && (
                  <button type="button" className="btn-secondary text-xs" onClick={() => activate.mutate(s.id)}>Ativar</button>
                )}
              </li>
            ))}
          </ul>
        </div>
        {metrics && (
          <div className="card space-y-3 p-4">
            <h2 className="font-semibold">Métricas — {metrics.sprint.name}</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Total points: <strong>{metrics.totalPoints}</strong></div>
              <div>Done: <strong>{metrics.donePoints}</strong></div>
              <div>Remaining: <strong>{metrics.remainingPoints}</strong></div>
              <div>Velocity: <strong>{metrics.velocity}</strong></div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Burndown</h3>
              <div className="max-h-40 overflow-auto text-xs">
                {metrics.burndown?.map((d: { date: string; ideal: number; remaining: number }) => (
                  <div key={d.date} className="flex justify-between border-b border-slate-100 py-1">
                    <span>{d.date}</span>
                    <span>ideal {d.ideal} · rem {d.remaining}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
