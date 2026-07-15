import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TYPE_COLORS } from '../../lib/utils';
import type { WorkItemCard } from './BoardColumn';

export default function SortableCard({ item }: { item: WorkItemCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="card mb-2 cursor-grab p-3 active:cursor-grabbing">
      <div className="mb-1 flex items-center gap-2">
        <span className="font-mono text-xs text-slate-500">{item.key}</span>
        <span className={`badge ${TYPE_COLORS[item.type] ?? ''}`}>{item.type}</span>
      </div>
      <p className="text-sm font-medium">{item.title}</p>
      {item.assignee && <p className="mt-1 text-xs text-slate-500">{item.assignee.name}</p>}
    </div>
  );
}
