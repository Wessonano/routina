export default function CalendarEvent({ event }) {
  const startTime = event.start?.includes('T')
    ? new Date(event.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;
  const endTime = event.end?.includes('T')
    ? new Date(event.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="bg-gray-100 rounded-lg border-l-4 border-l-gray-400 p-3 opacity-70">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
          Google Cal
        </span>
        <span className="font-medium text-sm text-gray-600">{event.title}</span>
      </div>
      <div className="text-xs text-gray-400 mt-1">
        {event.allDay ? 'Toute la journee' : `${startTime}${endTime ? ` - ${endTime}` : ''}`}
        {event.calendar && ` · ${event.calendar}`}
      </div>
    </div>
  );
}
