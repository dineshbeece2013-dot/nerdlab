import { useState, useEffect, useRef } from 'react';
import { progressService } from '../services/progressService';

export const useTaskTimer = (taskId, initialTimeSpent = 0) => {
  const [seconds, setSeconds] = useState(initialTimeSpent);
  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;

  useEffect(() => {
    setSeconds(initialTimeSpent);
  }, [initialTimeSpent]);

  useEffect(() => {
    if (!taskId) return;

    // Timer tick every second
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // Periodic backend sync pulse every 30 seconds
    const syncInterval = setInterval(() => {
      progressService.updateTimeSpent(taskId, 30).catch((err) => {
        console.error('Failed to sync lab duration pulse:', err.message);
      });
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, [taskId]);

  const formatTime = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    seconds,
    formatTime: formatTime(),
  };
};
