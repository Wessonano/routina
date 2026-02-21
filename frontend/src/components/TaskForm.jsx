import { useState } from 'react';
import { CATEGORIES } from '../categories';

export default function TaskForm({ task, date, onSave, onClose, onDelete }) {
  const [title, setTitle] = useState(task?.title || '');
  const [category, setCategory] = useState(task?.category || 'autre');
  const [startTime, setStartTime] = useState(task?.start_time || '');
  const [duration, setDuration] = useState(task?.duration_min || 30);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      category,
      start_time: startTime || null,
      duration_min: parseInt(duration),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={onClose}>
      <form onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg mx-auto bg-white rounded-t-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">{task ? 'Modifier' : 'Nouvelle tache'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>

        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
               placeholder="Titre de la tache"
               className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               autoFocus />

        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button key={key} type="button" onClick={() => setCategory(key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                      ${category === key ? `${cat.bg} text-white border-transparent` : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Heure debut</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                   className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Duree (min)</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {[15, 25, 30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium active:bg-blue-700 transition-colors">
            {task ? 'Enregistrer' : 'Ajouter'}
          </button>
          {task && onDelete && (
            <button type="button" onClick={() => onDelete(task.id)}
                    className="px-4 py-3 bg-red-100 text-red-700 rounded-lg font-medium">
              Suppr.
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
