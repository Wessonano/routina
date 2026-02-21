import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export function useTasks(date) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTasks(date);
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { refresh(); }, [refresh]);

  const createTask = async (task) => {
    const created = await api.createTask({ ...task, date });
    setTasks((prev) => [...prev, created]);
    return created;
  };

  const updateTask = async (id, data) => {
    const updated = await api.updateTask(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const deleteTask = async (id) => {
    await api.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return { tasks, loading, refresh, createTask, updateTask, deleteTask };
}
