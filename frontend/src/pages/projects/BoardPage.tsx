import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import api from '../../lib/api';
import BoardColumn, { type WorkItemCard } from './BoardColumn';
import SortableCard from './SortableCard';

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [activeItem, setActiveItem] = useState<WorkItemCard | null>(null);
  const [swimlane, setSwimlane] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: board } = useQuery({
    queryKey: ['board', projectId],
    queryFn: async () => (await api.get(`/projects/${projectId}/board`)).data,
    enabled: !!projectId,
  });

  const move = useMutation({
    mutationFn: ({ id, status, columnId }: { id: string; status: string; columnId: string }) =>
      api.patch(`/work-items/${id}/move`, { status, columnId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', projectId] }),
  });

  const onDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const itemId = String(active.id);
    const overId = String(over.id);
    const column = board?.columns?.find((c: { id: string }) => c.id === overId)
      ?? board?.columns?.find((c: { workItems: WorkItemCard[] }) => c.workItems.some((i) => i.id === overId));

    if (column) {
      move.mutate({ id: itemId, status: column.status, columnId: column.id });
    }
  };

  const filterItems = (items: WorkItemCard[]) => {
    if (!swimlane) return items;
    return items.filter((i) => i.assignee?.name === swimlane);
  };

  const assignees = [
    ...new Set(
      board?.columns?.flatMap((c: { workItems: WorkItemCard[] }) =>
        c.workItems.map((i) => i.assignee?.name).filter(Boolean),
      ) ?? [],
    ),
  ] as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kanban — {board?.project?.name}</h1>
        <select className="input max-w-[200px]" value={swimlane} onChange={(e) => setSwimlane(e.target.value)}>
          <option value="">Todas swimlanes</option>
          {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => {
          const item = board?.columns?.flatMap((c: { workItems: WorkItemCard[] }) => c.workItems)
            .find((i: WorkItemCard) => i.id === e.active.id);
          setActiveItem(item ?? null);
        }}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {board?.columns?.map((col: { id: string; name: string; status: string; workItems: WorkItemCard[] }) => (
            <BoardColumn key={col.id} col={col} items={filterItems(col.workItems)} />
          ))}
        </div>
        <DragOverlay>
          {activeItem ? <SortableCard item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
