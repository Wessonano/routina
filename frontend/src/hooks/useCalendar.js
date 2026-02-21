import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export function useCalendar(date) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check connection status on mount
  useEffect(() => {
    api.calendarStatus()
      .then((data) => setConnected(data.connected))
      .catch(() => setConnected(false))
      .finally(() => setLoading(false));
  }, []);

  // Fetch external events when date changes and connected
  const fetchEvents = useCallback(async () => {
    if (!connected) { setEvents([]); return; }
    try {
      const data = await api.calendarEvents(date);
      setEvents(data);
    } catch {
      setEvents([]);
    }
  }, [date, connected]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const connect = async () => {
    const { url } = await api.calendarAuthUrl();
    window.location.href = url;
  };

  const sync = async () => {
    await api.calendarSync(date);
    await fetchEvents();
  };

  return { events, connected, loading, connect, sync, refresh: fetchEvents };
}
