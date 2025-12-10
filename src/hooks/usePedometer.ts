import { useEffect, useRef } from 'react';
import { PedometerService } from '../services/pedometerService';
import { useStore } from '../state/store';

export const usePedometer = () => {
  const setCurrentSteps = useStore((state) => state.setCurrentSteps);
  const setPedometerAvailable = useStore((state) => state.setPedometerAvailable);
  const isLoading = useStore((state) => state.isLoading);
  const isStepTrackingPaused = useStore((state) => state.isStepTrackingPaused);
  
  const initRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;

    // Prevent multiple initializations
    if (initRef.current) {
      return;
    }

    const initPedometer = async () => {
      if (!mountedRef.current || initRef.current) {
        return;
      }

      try {
        initRef.current = true;
        console.log('🚀 usePedometer: Initializing pedometer service...');

        // Small delay to let app settle
        await new Promise(resolve => setTimeout(resolve, 200));

        if (!mountedRef.current) {
          return;
        }

        // Initialize pedometer service
        // Add safety check in case module didn't load
        if (!PedometerService) {
          console.error('❌ PedometerService is undefined - module may not have loaded');
          console.error('   Attempting to reload module...');
          try {
            const pedometerModule = require('../services/pedometerService');
            PedometerService = pedometerModule.PedometerService || pedometerModule.default;
          } catch (reloadError) {
            console.error('❌ Failed to reload PedometerService:', reloadError);
            setPedometerAvailable(false);
            return;
          }
        }

        if (typeof PedometerService.initPedometer !== 'function') {
          console.error('❌ PedometerService.initPedometer is not a function');
          setPedometerAvailable(false);
          return;
        }

        const success = await PedometerService.initPedometer((steps, isAvailable) => {
          if (!mountedRef.current) {
            return;
          }

          // Check if tracking is paused
          if (useStore.getState().isStepTrackingPaused) {
            return;
          }

          // Update store with new steps
          if (isAvailable) {
            // Get current stored steps to preserve them
            const currentStoredSteps = useStore.getState().currentSteps;
            
            // Only update if pedometer reading is higher than stored steps
            // This prevents overwriting stored steps with 0 or lower values on app reload
            // The pedometer might return 0 initially before it gets a reading
            if (steps > currentStoredSteps) {
              setCurrentSteps(steps);
              console.log('📈 Pedometer update - steps:', steps, '(was:', currentStoredSteps, ')');
            } else if (steps === currentStoredSteps) {
              // Steps are the same - this is fine, just confirm they're in sync
              // Don't log to avoid spam
            } else {
              // Pedometer reading is lower - this shouldn't happen, but preserve stored value
              console.log('⚠️ Pedometer reading lower than stored - preserving stored value');
              console.log('   Pedometer:', steps, 'Stored:', currentStoredSteps);
            }
          } else {
            setPedometerAvailable(false);
          }
        });

        if (mountedRef.current) {
          setPedometerAvailable(success);
          
          if (success && PedometerService.isRunningInExpoGo()) {
            console.warn('⚠️ Running in Expo Go - step tracking may be unreliable');
            console.warn('💡 Build a development build for proper step tracking');
          }
        }
      } catch (error) {
        console.error('❌ Error in usePedometer:', error);
        if (mountedRef.current) {
          setPedometerAvailable(false);
        }
      }
    };

    // Start initialization
    if (!isLoading) {
      setTimeout(initPedometer, 100);
    } else {
      const checkLoading = setInterval(() => {
        const stillLoading = useStore.getState().isLoading;
        if (!stillLoading) {
          clearInterval(checkLoading);
          setTimeout(initPedometer, 100);
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkLoading);
        if (!initRef.current) {
          initPedometer();
        }
      }, 5000);
      
      return () => clearInterval(checkLoading);
    }

    return () => {
      mountedRef.current = false;
      if (PedometerService && typeof PedometerService.stopPedometer === 'function') {
        PedometerService.stopPedometer();
      }
      initRef.current = false;
    };
  }, [isLoading, isStepTrackingPaused, setCurrentSteps, setPedometerAvailable]);
};
