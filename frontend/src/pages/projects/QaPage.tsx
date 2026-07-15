import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function QaPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [planName, setPlanName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [caseForm, setCaseForm] = useState({ storyId: '', title: '', steps: '', expectedResult: '' });

  const { data: plans } = useQuery({
    queryKey: ['test-plans', projectId],
    queryFn: async () => (await api.get(`/projects/${projectId}/test-plans`)).data,
    enabled: !!projectId,
  });

  const { data: stories } = useQuery({
    queryKey: ['stories', projectId],
    queryFn: async () => (await api.get(`/projects/${projectId}/work-items`, { params: { type: 'STORY' } })).data,
    enabled: !!projectId,
  });

  const { data: cases } = useQuery({
    queryKey: ['test-cases', selectedPlan],
    queryFn: async () => (await api.get(`/test-plans/${selectedPlan}/cases`)).data,
    enabled: !!selectedPlan,
  });

  const { data: traceability } = useQuery({
    queryKey: ['traceability', projectId],
    queryFn: async () => (await api.get(`/projects/${projectId}/traceability`)).data,
    enabled: !!projectId,
  });

  const { data: coverage } = useQuery({
    queryKey: ['coverage', projectId],
    queryFn: async () => (await api.get(`/projects/${projectId}/qa/coverage`)).data,
    enabled: !!projectId,
  });

  const createPlan = useMutation({
    mutationFn: () => api.post(`/projects/${projectId}/test-plans`, { name: planName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['test-plans', projectId] });
      setPlanName('');
    },
  });

  const createCase = useMutation({
    mutationFn: () => api.post(`/test-plans/${selectedPlan}/cases`, caseForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['test-cases', selectedPlan] });
      setCaseForm({ storyId: '', title: '', steps: '', expectedResult: '' });
    },
  });

  const execute = useMutation({
    mutationFn: (id: string) => api.post(`/test-cases/${id}/executions`, { status: 'PASS' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['test-cases', selectedPlan] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">QA</h1>
      {coverage && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-4">Cobertura Stories: <strong>{coverage.storyCoverage}%</strong></div>
          <div className="card p-4">Cobertura Execução: <strong>{coverage.executionCoverage}%</strong></div>
        </div>
      )}
      <form className="card flex gap-2 p-4" onSubmit={(e) => { e.preventDefault(); createPlan.mutate(); }}>
        <input className="input flex-1" placeholder="Nome do plano de teste" value={planName} onChange={(e) => setPlanName(e.target.value)} />
        <button type="submit" className="btn-primary">Criar Plano</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {plans?.map((p: { id: string; name: string; _count: { testCases: number } }) => (
          <button key={p.id} type="button" className={`btn-secondary ${selectedPlan === p.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelectedPlan(p.id)}>
            {p.name} ({p._count.testCases})
          </button>
        ))}
      </div>
      {selectedPlan && (
        <form className="card grid gap-2 p-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); createCase.mutate(); }}>
          <select className="input" value={caseForm.storyId} onChange={(e) => setCaseForm({ ...caseForm, storyId: e.target.value })} required>
            <option value="">Story...</option>
            {stories?.map((s: { id: string; key: string; title: string }) => (
              <option key={s.id} value={s.id}>{s.key} — {s.title}</option>
            ))}
          </select>
          <input className="input" placeholder="Título do caso" value={caseForm.title} onChange={(e) => setCaseForm({ ...caseForm, title: e.target.value })} required />
          <input className="input" placeholder="Steps" value={caseForm.steps} onChange={(e) => setCaseForm({ ...caseForm, steps: e.target.value })} />
          <input className="input" placeholder="Resultado esperado" value={caseForm.expectedResult} onChange={(e) => setCaseForm({ ...caseForm, expectedResult: e.target.value })} />
          <button type="submit" className="btn-primary md:col-span-2">Adicionar Caso</button>
        </form>
      )}
      {cases && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr><th className="p-3 text-left">Caso</th><th className="p-3 text-left">Story</th><th className="p-3">Ações</th></tr></thead>
            <tbody>
              {cases.map((c: { id: string; title: string; story: { key: string } }) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3">{c.title}</td>
                  <td className="p-3">{c.story.key}</td>
                  <td className="p-3"><button type="button" className="btn-secondary text-xs" onClick={() => execute.mutate(c.id)}>Executar PASS</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {traceability && (
        <div className="card p-4">
          <h2 className="mb-3 font-semibold">Matriz de Rastreabilidade</h2>
          <ul className="space-y-2 text-sm">
            {traceability.map((row: { story: { key: string; title: string }; testCases: { title: string; lastExecution?: { status: string } }[]; coverage: boolean }) => (
              <li key={row.story.key} className="rounded border border-slate-200 p-2">
                <strong>{row.story.key}</strong> — {row.story.title}
                <ul className="ml-4 mt-1 text-slate-600">
                  {row.testCases.map((tc, i) => (
                    <li key={i}>• {tc.title} {tc.lastExecution ? `(${tc.lastExecution.status})` : '(not run)'}</li>
                  ))}
                  {!row.coverage && <li className="text-orange-600">Sem casos de teste</li>}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
