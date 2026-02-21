import { useState, useRef } from 'react';
import TaskCard from './TaskCard';
import CalendarEvent from './CalendarEvent';

export default function Timeline({ tasks, loading, calendarEvents = [], onStartPomodoro, onUpdateTask, onDeleteTask, onEdit, onReorder }) {
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const touchStartY = useRef(null);
  const touchTaskId = useRef(null);

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Chargement...</div>;
  }

  const scheduled = tasks.filter((t) => t.start_time);
  const unscheduled = tasks.filter((t) => !t.start_time);

  const timelineItems = [
    ...scheduled.map((t) => ({ type: 'task', time: t.start_time, data: t })),
    ...calendarEvents
      .filter((e) => !e.allDay)
      .map((e) => ({
        type: 'event',
        time: e.start?.includes('T')
          ? new Date(e.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : '00:00',
        data: e,
      })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const allDayEvents = calendarEvents.filter((e) => e.allDay);

  // Drag handlers for unscheduled tasks reorder
  const handleDragStart = (taskId) => setDragId(taskId);
  const handleDragOver = (e, taskId) => { e.preventDefault(); setDragOverId(taskId); };
  const handleDrop = (targetId) => {
    if (dragId && dragId !== targetId && onReorder) {
      const ids = tasks.map((t) => t.id);
      const fromIdx = ids.indexOf(dragId);
      const toIdx = ids.indexOf(targetId);
      if (fromIdx !== -1 && toIdx !== -1) {
        ids.splice(fromIdx, 1);
        ids.splice(toIdx, 0, dragId);
        onReorder(ids);
      }
    }
    setDragId(null);
    setDragOverId(null);
  };
  const handleDragEnd = () => { setDragId(null); setDragOverId(null); };

  return (
    <div className="space-y-2">
      {allDayEvents.length > 0 && (
        <div className="space-y-1 mb-3">
          {allDayEvents.map((event) => (
            <CalendarEvent key={event.id} event={event} />
          ))}
        </div>
      )}

      {timelineItems.length > 0 && (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          {timelineItems.map((item) => (
            <div key={`${item.type}-${item.data.id}`} className="relative pl-10 py-1">
              <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white top-4 ${
                item.type === 'event' ? 'bg-gray-400' : 'bg-gray-300'
              }`} />
              <span className="text-xs text-gray-400 font-mono">{item.time}</span>
              {item.type === 'task' ? (
                <TaskCard task={item.data} onStart={onStartPomodoro} onUpdate={onUpdateTask}
                          onDelete={onDeleteTask} onEdit={onEdit} />
              ) : (
                <CalendarEvent event={item.data} />
              )}
            </div>
          ))}
        </div>
      )}

      {unscheduled.length > 0 && (
        <div>
          {(timelineItems.length > 0 || allDayEvents.length > 0) && (
            <h3 className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-2">Sans horaire</h3>
          )}
          {unscheduled.map((task) => (
            <div key={task.id} className={`py-1 transition-opacity ${dragOverId === task.id ? 'opacity-50' : ''}`}
                 draggable
                 onDragStart={() => handleDragStart(task.id)}
                 onDragOver={(e) => handleDragOver(e, task.id)}
                 onDrop={() => handleDrop(task.id)}
                 onDragEnd={handleDragEnd}>
              <TaskCard task={task} onStart={onStartPomodoro} onUpdate={onUpdateTask}
                        onDelete={onDeleteTask} onEdit={onEdit} />
            </div>
          ))}
        </div>
      )}

      {tasks.length === 0 && calendarEvents.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Aucune tache pour ce jour</p>
          <p className="text-sm mt-1">Appuie sur + pour en ajouter</p>
        </div>
      )}
    </div>
  );
}
