import TaskCard from './TaskCard';

export default function Timeline({ tasks, loading, onStartPomodoro, onUpdateTask, onDeleteTask, onEdit }) {
  if (loading) {
    return <div className="text-center py-8 text-gray-400">Chargement...</div>;
  }

  const scheduled = tasks.filter((t) => t.start_time);
  const unscheduled = tasks.filter((t) => !t.start_time);

  return (
    <div className="space-y-2">
      {scheduled.length > 0 && (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          {scheduled.map((task) => (
            <div key={task.id} className="relative pl-10 py-1">
              <div className="absolute left-2.5 w-3 h-3 rounded-full bg-gray-300 border-2 border-white top-4" />
              <span className="text-xs text-gray-400 font-mono">{task.start_time}</span>
              <TaskCard task={task} onStart={onStartPomodoro} onUpdate={onUpdateTask}
                        onDelete={onDeleteTask} onEdit={onEdit} />
            </div>
          ))}
        </div>
      )}

      {unscheduled.length > 0 && (
        <div>
          {scheduled.length > 0 && (
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

      {tasks.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Aucune tache pour ce jour</p>
          <p className="text-sm mt-1">Appuie sur + pour en ajouter</p>
        </div>
      )}
    </div>
  );
}
