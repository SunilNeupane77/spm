'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TimelineTask from './TimelineTask';

export default function TimelineColumn({ date, dateStr, tasks }) {
  // Set up droppable area for this date column
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable::${dateStr}`,
  });
  
  // Get task IDs for the SortableContext
  const taskIds = tasks.map(task => `task::${task._id}`);
  
  return (
    <div
      ref={setNodeRef}
      className={`h-full min-h-[200px] bg-background rounded-md border ${
        isOver ? 'border-primary border-dashed' : ''
      }`}
    >
      <SortableContext
        items={taskIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="p-2 space-y-2">
          {tasks.length === 0 && (
            <div className="text-center text-muted-foreground text-xs py-2">
              No tasks
            </div>
          )}
          
          {tasks.map((task) => (
            <TimelineTask key={task._id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
