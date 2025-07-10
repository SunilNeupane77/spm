'use client';

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDays, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { useCallback, useState } from 'react';

import { cn } from '@/lib/utils';
import TimelineColumn from './TimelineColumn';

export default function TimelineView({ tasks, viewMode, startDate }) {
  const queryClient = useQueryClient();
  const [daysInView, setDaysInView] = useState(
    viewMode === 'week' ? 7 : 30
  );
  
  // Create array of dates for the view
  const dateRange = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, daysInView - 1)
  });
  
  // Group tasks by date
  const tasksByDate = dateRange.reduce((acc, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    acc[dateStr] = tasks.filter(task => {
      const taskDate = task.startDate ? new Date(task.startDate) : null;
      return taskDate && isSameDay(taskDate, date);
    });
    return acc;
  }, {});
  
  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Mutation for updating task date
  const updateTaskDate = useMutation({
    mutationFn: async ({ taskId, date }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate: date }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task date');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the tasks query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
    },
  });
  
  // Handle task dragging
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    // Extract task ID and target date from the droppable IDs
    const taskId = active.id.split('::')[1];
    const targetDate = over.id.split('::')[1];
    
    // Update the task date
    updateTaskDate.mutate({
      taskId,
      date: targetDate,
    });
  }, [updateTaskDate]);
  
  return (
    <div className="bg-card rounded-lg p-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-7 gap-2">
          {/* Date header row */}
          {dateRange.map(date => (
            <div 
              key={format(date, 'yyyy-MM-dd')} 
              className="text-center p-2 border-b"
            >
              <div className="font-semibold">{format(date, 'EEE')}</div>
              <div className={cn(
                "text-sm rounded-full w-8 h-8 flex items-center justify-center mx-auto",
                isSameDay(date, new Date()) ? "bg-primary text-primary-foreground" : ""
              )}>
                {format(date, 'd')}
              </div>
            </div>
          ))}
          
          {/* Task columns */}
          {dateRange.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayTasks = tasksByDate[dateStr] || [];
            
            return (
              <TimelineColumn 
                key={dateStr}
                date={date}
                dateStr={dateStr}
                tasks={dayTasks}
              />
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}
