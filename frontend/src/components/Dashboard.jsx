import { useState, useEffect } from 'react';
import { api } from '../api';
import { CATEGORIES } from '../categories';

const CATEGORY_COLORS = {
  dev: '#3B82F6',
  sante: '#10B981',
  menage: '#F59E0B',
  admin: '#8B5CF6',
  loisir: '#EC4899',
  tech: '#06B6D4',
  famille: '#F97316',
  autre: '#6B7280',
};

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function DonutChart({ categories }) {
  const total = categories.reduce((s, c) => s + c.total, 0);
  if (total === 0) return null;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = categories.map((c) => {
    const pct = c.total / total;
    const dash = pct * circumference;
    const seg = { ...c, dash, offset, color: CATEGORY_COLORS[c.category] || CATEGORY_COLORS.autre };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-4">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {segments.map((s, i) => (
          <circle key={i} cx="50" cy="50" r={radius} fill="none"
                  stroke={s.color} strokeWidth="16"
                  strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                  strokeDashoffset={-s.offset}
                  transform="rotate(-90 50 50)" />
        ))}
      </svg>
      <div className="flex flex-col gap-1 text-xs">
        {segments.map((s) => (
          <div key={s.category} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.color }} />
            <span className="text-gray-700">{CATEGORIES[s.category]?.label || s.category}</span>
            <span className="text-gray-400">{Math.round((s.total / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStatsDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxTotal = data ? Math.max(...data.daily.map((d) => d.total), 1) : 1;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="w-full max-w-lg mx-auto bg-white rounded-t-2xl p-4 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Statistiques</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none cursor-pointer">&times;</button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 text-sm py-8">Chargement...</p>
        ) : !data ? (
          <p className="text-center text-gray-400 text-sm py-8">Erreur de chargement</p>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pb-4">

            {/* Streak */}
            <div className="text-center py-3 bg-orange-50 rounded-xl">
              <div className="text-3xl font-bold text-orange-600">
                {data.streak > 0 ? `🔥 ${data.streak}` : '—'}
              </div>
              <div className="text-sm text-orange-500 mt-1">
                {data.streak > 0
                  ? `jour${data.streak > 1 ? 's' : ''} consecutif${data.streak > 1 ? 's' : ''}`
                  : 'Pas encore de streak'}
              </div>
            </div>

            {/* 7-day bars */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">7 derniers jours</h3>
              <div className="flex items-end justify-between gap-1.5 h-28">
                {data.daily.map((d) => {
                  const pct = d.total > 0 ? (d.done / d.total) * 100 : 0;
                  const dayIdx = new Date(d.date + 'T12:00:00').getDay();
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-500">{d.done}/{d.total}</span>
                      <div className="w-full bg-gray-100 rounded-t relative flex-1 flex items-end">
                        <div className="w-full rounded-t transition-all"
                             style={{
                               height: `${d.total > 0 ? Math.max((d.total / maxTotal) * 100, 10) : 5}%`,
                               background: `linear-gradient(to top, #22c55e ${pct}%, #e5e7eb ${pct}%)`,
                             }} />
                      </div>
                      <span className="text-[10px] text-gray-400">{DAY_LABELS[dayIdx]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Categories donut */}
            {data.categories.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Repartition par categorie</h3>
                <DonutChart categories={data.categories} />
              </div>
            )}

            {/* Pomodoros */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Pomodoros</h3>
              <div className="flex gap-4">
                <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{data.pomodoros.week}</div>
                  <div className="text-xs text-red-400">cette semaine</div>
                </div>
                <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{data.pomodoros.month}</div>
                  <div className="text-xs text-red-400">ce mois</div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
