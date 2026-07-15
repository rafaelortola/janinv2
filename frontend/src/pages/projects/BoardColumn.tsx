import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableCard from './SortableCard';

interface ColumnProps {
  col: { id: string; name: string; status: string; workItems: WorkItemCard[] };
  items: WorkItemCard[];
}

interface WorkItemCard {
  id: string;
  key: string;
  type: string;
  title: string;
  status: string;
  assignee?: { name: string };
}

function BoardColumn({ col, items }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[280px] flex-shrink-0 rounded-lg p-3 ${isOver ? 'bg-blue-50' : 'bg-slate-100'}`}
    >
      <h3 className="mb-3 font-semibold">{col.name} ({items.length})</h3>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableCard key={item.id} item={item} />
        ))}
      </SortableContext>
    </div>
  );
}

export default BoardColumn;
export type { WorkItemCard };
