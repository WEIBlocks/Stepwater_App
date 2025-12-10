import { useEffect } from 'react';
import { useStore } from '../state/store';

export const useHydration = () => {
  const loadTodayData = useStore((state) => state.loadTodayData);
  const addWater = useStore((state) => state.addWater);
  const deleteWaterLog = useStore((state) => state.deleteWaterLog);

  useEffect(() => {
    // Load today's data on mount
    loadTodayData();

    // Check for midnight reset
    const checkMidnightReset = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      
      const timeout = setTimeout(() => {
        loadTodayData();
        // Set up next day check
        const interval = setInterval(() => {
          loadTodayData();
        }, 24 * 60 * 60 * 1000); // Every 24 hours

        return () => clearInterval(interval);
      }, msUntilMidnight);

      return () => clearTimeout(timeout);
    };

    const cleanup = checkMidnightReset();
    
    return () => {
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - Zustand actions are stable

  return {
    addWater,
    deleteWaterLog,
  };
};

