import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { TYPE_COLORS, WORK_ITEM_TYPES } from '../../lib/utils';

export default function BacklogPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [type, setType] = useState('STORY');
  const [title, setTitle] = useState('');
  const [filterType, setFilterType] = useState('');

  const { data: items } = useQuery({
    queryKey: ['work-items', projectId, filterType],
    queryFn: async () => {
      const params = filterType ? { type: filterType } : {};
      return (await api.get(`/projects/${projectId}/work-items`, { params })).data;
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: () => api.post(`/projects/${projectId}/work-items`, { type, title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-items', projectId] });
      setTitle('');
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Backlog</h1>
      <form className="card flex flex-wrap gap-2 p-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
        <select className="input max-w-[160px]" value={type} onChange={(e) => setType(e.target.value)}>
          {WORK_ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className="input flex-1" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <button type="submit" className="btn-primary">Adicionar</button>
      </form>
      <select className="input max-w-[200px]" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
        <option value="">Todos os tipos</option>
        {WORK_ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Key</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Título</th>
              <th className="p-3">Status</th>
              <th className="p-3">Assignee</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item: { id: string; key: string; type: string; title: string; status: string; assignee?: { name: string } }) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="p-3 font-mono text-xs">{item.key}</td>
                <td className="p-3"><span className={`badge ${TYPE_COLORS[item.type] ?? ''}`}>{item.type}</span></td>
                <td className="p-3">{item.title}</td>
                <td className="p-3">{item.status}</td>
                <td className="p-3">{item.assignee?.name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
