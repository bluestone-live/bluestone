import { useEffect } from 'react';

export const useEffectAsync = (initializeCallback: () => Promise<any>) => {
  useEffect(() => {
    initializeCallback();
  });
};
