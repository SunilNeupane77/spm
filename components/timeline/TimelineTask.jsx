'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { Clock, GripVertical } from 'lucide-react';

export default function TimelineTask({ task }) {
  // Set up sortable item
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `task::${task._id}`,
  });
  
  // Apply styles for dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };
  
  // Generate color based on task type and priority
  const getBadgeColor = (type) => {
    switch(type) {
      case 'assignment':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'exam':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'project':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  // Generate color based on priority
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing border-l-4",
        task.course?.color ? `border-l-[${task.course.color}]` : "border-l-blue-500"
      )}
      onClick={(e) => {
        // Only navigate if not dragging
        if (!isDragging) {
          e.stopPropagation();
          window.location.href = `/tasks/${task._id}`;
        }
      }}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate" title={task.title}>
                {task.title}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {task.course && (
                <Badge variant="outline" className="text-xs">
                  {task.course.code || 'No Course'}
                </Badge>
              )}
              <Badge variant="outline" className={getBadgeColor(task.type)}>
                {task.type}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
            </div>
            
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(task.dueDate), 'h:mm a')}
            </div>
          </div>
          
          <div 
            {...attributes} 
            {...listeners} 
            className="touch-none flex items-center self-stretch p-1"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        {task.progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-primary h-1.5 rounded-full" 
              style={{ width: `${task.progress}%` }}
            ></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
