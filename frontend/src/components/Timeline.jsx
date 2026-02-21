import TaskCard from './TaskCard';
import CalendarEvent from './CalendarEvent';

export default function Timeline({ tasks, loading, calendarEvents = [], onStartPomodoro, onUpdateTask, onDeleteTask, onEdit }) {
  if (loading) {
    return <div className="text-center py-8 text-gray-400">Chargement...</div>;
  }

  const scheduled = tasks.filter((t) => t.start_time);
  const unscheduled = tasks.filter((t) => !t.start_time);

  // Merge scheduled tasks and calendar events, sorted by time
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

  return (
    <div className="space-y-2">
      {/* All-day Google Calendar events */}
      {allDayEvents.length > 0 && (
        <div className="space-y-1 mb-3">
          {allDayEvents.map((event) => (
            <CalendarEvent key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Timeline with merged tasks + events */}
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

      {/* Unscheduled tasks */}
      {unscheduled.length > 0 && (
        <div>
          {(timelineItems.length > 0 || allDayEvents.length > 0) && (
            <h3 className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-2">Sans horaire</h3>
          )}
          {unscheduled.map((task) => (
            <div key={task.id} className="py-1">
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
