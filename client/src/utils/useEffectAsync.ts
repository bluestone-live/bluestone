import { useEffect } from 'react';

/**
 * Only called after component mounted
 * @param initializeCallback callback
 */
export const useComponentMounted = (initializeCallback: () => Promise<any>) =>
  useEffect(() => {
    initializeCallback();
  }, []);

/**
 * Called when deps changed
 * @param callback callback
 * @param deps dependencies
 */
export const useDepsUpdated = (callback: () => Promise<any>, deps: any[]) =>
  useEffect(() => {
    callback();
  }, deps);
