export default function StatsBar({ tasks }) {
  const done = tasks.filter((t) => t.status === 'terminee').length;
  const total = tasks.length;
  const pomodoros = tasks.reduce((sum, t) => sum + (t.pomodoros_done || 0), 0);

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-4 text-xs text-gray-500">
      <span>{done}/{total} taches</span>
      <span>{pomodoros} pomodoro{pomodoros !== 1 ? 's' : ''}</span>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full transition-all"
             style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
      </div>
    </div>
  );
}
