import { useState, useEffect } from 'react';
import { useTasks } from './hooks/useTasks';
import { usePomodoro } from './hooks/usePomodoro';
import { useCalendar } from './hooks/useCalendar';
import DayNav from './components/DayNav';
import Timeline from './components/Timeline';
import Pomodoro from './components/Pomodoro';
import TaskForm from './components/TaskForm';
import StatsBar from './components/StatsBar';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function App() {
  const [date, setDate] = useState(todayStr());
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const { tasks, loading, refresh, createTask, updateTask, deleteTask } = useTasks(date);
  const pomodoro = usePomodoro();
  const calendar = useCalendar(date);

  // Check for ?gcal=connected after OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gcal') === 'connected') {
      window.history.replaceState({}, '', '/');
      calendar.refresh();
    }
  }, []);

  const requestNotifications = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleStartPomodoro = async (task) => {
    requestNotifications();
    await pomodoro.start(task);
    refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50" onClick={requestNotifications}>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Routina</h1>
            <div className="flex items-center gap-2">
              {calendar.connected ? (
                <button onClick={calendar.sync}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium cursor-pointer"
                        title="Synchroniser avec Google Calendar">
                  Sync
                </button>
              ) : (
                !calendar.loading && (
                  <button onClick={calendar.connect}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium cursor-pointer">
                    Google Cal
                  </button>
                )
              )}
            </div>
          </div>
          <DayNav date={date} onChange={setDate} />
        </div>
      </header>

      {pomodoro.activeTask && (
        <div className="max-w-lg mx-auto">
          <Pomodoro pomodoro={pomodoro} onRefresh={refresh} />
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-2">
        <StatsBar tasks={tasks} />
      </div>

      <main className="max-w-lg mx-auto px-4 pb-24">
        <Timeline
          tasks={tasks}
          loading={loading}
          calendarEvents={calendar.events}
          onStartPomodoro={handleStartPomodoro}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onEdit={(task) => { setEditingTask(task); setShowForm(true); }}
        />
      </main>

      <button
        onClick={() => { setEditingTask(null); setShowForm(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full
                   shadow-lg flex items-center justify-center text-2xl z-50
                   active:bg-blue-700 transition-colors cursor-pointer"
      >
        +
      </button>

      {showForm && (
        <TaskForm
          task={editingTask}
          date={date}
          onSave={async (data) => {
            if (editingTask) {
              await updateTask(editingTask.id, data);
            } else {
              await createTask(data);
            }
            setShowForm(false);
            setEditingTask(null);
          }}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
          onDelete={async (id) => {
            await deleteTask(id);
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
