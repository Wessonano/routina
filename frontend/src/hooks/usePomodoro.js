import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../api';

export function usePomodoro() {
  const [activeTask, setActiveTask] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef(null);
  const isBreakRef = useRef(false);
  const sessionIdRef = useRef(null);

  useEffect(() => { isBreakRef.current = isBreak; }, [isBreak]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  const handleTimerEnd = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(isBreakRef.current ? 'Pause terminee !' : 'Pomodoro termine !', {
        body: isBreakRef.current ? 'Pret pour le prochain pomodoro ?' : 'Bien joue !',
      });
    }
    setIsRunning(false);
    if (!isBreakRef.current && sessionIdRef.current) {
      api.completePomodoro(sessionIdRef.current).catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [isRunning, handleTimerEnd]);

  const start = async (task) => {
    const res = await api.startPomodoro(task.id);
    setActiveTask(res.task);
    setSessionId(res.session.id);
    const secs = res.work_min * 60;
    setTotalSeconds(secs);
    setTimeLeft(secs);
    setIsBreak(false);
    setIsRunning(true);
  };

  const startBreak = (minutes = 5) => {
    const secs = minutes * 60;
    setIsBreak(true);
    setTotalSeconds(secs);
    setTimeLeft(secs);
    setIsRunning(true);
  };

  const complete = async () => {
    if (sessionId) await api.completePomodoro(sessionId);
    if (activeTask) await api.updateTask(activeTask.id, { status: 'terminee' });
    reset();
  };

  const skip = async () => {
    if (activeTask) await api.skipTask(activeTask.id);
    reset();
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setActiveTask(null);
    setSessionId(null);
    setTimeLeft(0);
    setTotalSeconds(0);
    setIsRunning(false);
    setIsBreak(false);
  };

  const togglePause = () => setIsRunning((prev) => !prev);
  const addTime = (minutes = 5) => {
    setTimeLeft((prev) => prev + minutes * 60);
    setTotalSeconds((prev) => prev + minutes * 60);
  };

  return {
    activeTask, timeLeft, totalSeconds, isRunning, isBreak,
    start, startBreak, complete, skip, togglePause, addTime, reset,
  };
}
