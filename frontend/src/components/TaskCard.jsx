import CategoryBadge from './CategoryBadge';

const STATUS_STYLES = {
  a_faire: 'border-l-gray-300',
  en_cours: 'border-l-blue-500 bg-blue-50/50',
  terminee: 'border-l-green-500 bg-green-50/50',
  skippee: 'border-l-red-400 bg-red-50/50',
};

export default function TaskCard({ task, onStart, onUpdate, onDelete, onEdit }) {
  const isDone = task.status === 'terminee' || task.status === 'skippee';

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 p-3 ${STATUS_STYLES[task.status] || ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(task)}>
          <div className="flex items-center gap-2">
            <CategoryBadge category={task.category} />
            <span className={`font-medium text-sm truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {task.title}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {task.duration_min} min
            {task.pomodoros_done > 0 && ` · ${task.pomodoros_done} pom.`}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2 shrink-0">
          {task.status === 'a_faire' && (
            <button onClick={() => onStart(task)}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
              Start
            </button>
          )}
          {task.status === 'en_cours' && (
            <>
              <button onClick={() => onUpdate(task.id, { status: 'terminee' })}
                      className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-medium">
                Done
              </button>
              <button onClick={() => onStart(task)}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                Pom
              </button>
            </>
          )}
          {isDone && (
            <button onClick={() => onUpdate(task.id, { status: 'a_faire' })}
                    className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
              Refaire
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
