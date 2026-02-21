function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DayNav({ date, onChange }) {
  const shift = (days) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + days);
    onChange(formatDate(d));
  };

  const today = formatDate(new Date());
  const isToday = date === today;

  const formatted = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="flex items-center justify-between mt-1">
      <button onClick={() => shift(-1)} className="p-3 text-gray-500 text-lg cursor-pointer">&#8592;</button>
      <div className="text-center">
        <span className="text-sm font-medium text-gray-700 capitalize">{formatted}</span>
        {!isToday && (
          <button onClick={() => onChange(today)}
                  className="ml-2 text-xs text-blue-600 underline cursor-pointer">
            aujourd&apos;hui
          </button>
        )}
      </div>
      <button onClick={() => shift(1)} className="p-3 text-gray-500 text-lg cursor-pointer">&#8594;</button>
    </div>
  );
}
