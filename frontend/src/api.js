const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  getTasks: (date) => request(`/tasks?date=${date}`),
  createTask: (task) => request('/tasks', { method: 'POST', body: task }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: data }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  reorderTasks: (date, order) => request('/tasks/reorder', { method: 'PUT', body: { date, order } }),

  startPomodoro: (taskId) => request(`/pomodoro/start/${taskId}`, { method: 'POST' }),
  completePomodoro: (sessionId) => request(`/pomodoro/complete/${sessionId}`, { method: 'POST' }),
  skipTask: (taskId) => request(`/pomodoro/skip/${taskId}`, { method: 'POST' }),

  getStats: (period = 'week') => request(`/stats?period=${period}`),

  // Google Calendar
  calendarStatus: () => request('/calendar/status'),
  calendarAuthUrl: () => request('/calendar/auth'),
  calendarEvents: (date) => request(`/calendar/events?date=${date}`),
  calendarSync: (date) => request('/calendar/sync', { method: 'POST', body: { date } }),

  // Comments
  getComments: (date) => request(`/comments?date=${date}`),
  postComment: (data) => request('/comments', { method: 'POST', body: data }),
  commentsUnread: (date) => request(`/comments/unread?date=${date}`),
};
