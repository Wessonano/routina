export default function DayNav({ date, onChange }) {
  const shift = (days) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    onChange(d.toISOString().split('T')[0]);
  };

  const isToday = date === new Date().toISOString().split('T')[0];

  const formatted = new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="flex items-center justify-between mt-1">
      <button onClick={() => shift(-1)} className="p-2 text-gray-500 text-lg">&#8592;</button>
      <div className="text-center">
        <span className="text-sm font-medium text-gray-700 capitalize">{formatted}</span>
        {!isToday && (
          <button onClick={() => onChange(new Date().toISOString().split('T')[0])}
                  className="ml-2 text-xs text-blue-600 underline">
            aujourd&apos;hui
          </button>
        )}
      </div>
      <button onClick={() => shift(1)} className="p-2 text-gray-500 text-lg">&#8594;</button>
    </div>
  );
}
