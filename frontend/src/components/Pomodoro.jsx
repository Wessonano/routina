export default function Pomodoro({ pomodoro, onRefresh }) {
  const { activeTask, timeLeft, totalSeconds, isRunning, isBreak,
          togglePause, complete, skip, addTime, startBreak } = pomodoro;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  return (
    <div className={`mx-4 mt-3 rounded-2xl p-6 shadow-lg ${isBreak ? 'bg-green-50' : 'bg-blue-50'}`}>
      <div className="text-center mb-4">
        <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">
          {isBreak ? 'Pause' : 'Pomodoro'}
        </span>
        <h2 className="text-lg font-bold text-gray-900 mt-1">{activeTask?.title}</h2>
      </div>

      <div className="text-center">
        <span className="text-6xl font-mono font-bold text-gray-900 tracking-tight"
              style={{ fontVariantNumeric: 'tabular-nums' }}>
          {display}
        </span>
      </div>

      <div className="w-full h-1.5 bg-gray-200 rounded-full mt-4 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${isBreak ? 'bg-green-500' : 'bg-blue-500'}`}
             style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
        <button onClick={togglePause}
                className="px-4 py-2 rounded-full bg-white shadow text-sm font-medium text-gray-700">
          {isRunning ? 'Pause' : 'Reprendre'}
        </button>
        <button onClick={() => addTime(5)}
                className="px-4 py-2 rounded-full bg-white shadow text-sm font-medium text-gray-700">
          +5 min
        </button>
        <button onClick={async () => { await complete(); onRefresh(); }}
                className="px-4 py-2 rounded-full bg-green-600 text-white text-sm font-medium shadow">
          Terminer
        </button>
        <button onClick={async () => { await skip(); onRefresh(); }}
                className="px-4 py-2 rounded-full bg-red-100 text-red-700 text-sm font-medium">
          Skip
        </button>
      </div>

      {!isRunning && timeLeft === 0 && !isBreak && (
        <div className="text-center mt-3">
          <button onClick={() => startBreak(5)}
                  className="text-sm text-blue-600 underline">
            Pause 5 min
          </button>
        </div>
      )}
    </div>
  );
}
