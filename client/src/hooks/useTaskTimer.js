import { useState, useEffect, useRef } from 'react';
import { progressService } from '../services/progressService';

/**
 * Counts the time spent in a lab and pulses it to the server.
 *
 * `running` stops both the tick and the sync — once a lab is completed there is
 * nothing left to time, and a timer that keeps climbing on a finished lab both
 * looks broken and keeps inflating the recorded duration.
 */
export const useTaskTimer = (taskId, initialTimeSpent = 0, running = true) => {
  const [seconds, setSeconds] = useState(initialTimeSpent);
  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;

  useEffect(() => {
    setSeconds(initialTimeSpent);
  }, [initialTimeSpent]);

  useEffect(() => {
    if (!taskId || !running) return;

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
  }, [taskId, running]);

  const formatTime = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    seconds,
    formatTime: formatTime(),
    running,
  };
};
