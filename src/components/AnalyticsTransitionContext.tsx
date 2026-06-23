'use client';

import React, { createContext, useContext, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface TransitionContextProps {
  isPending: boolean;
  updateFilter: (newRange: string, start?: string, end?: string) => void;
}

const AnalyticsTransitionContext = createContext<TransitionContextProps>({
  isPending: false,
  updateFilter: () => {},
});

export function AnalyticsTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilter = (newRange: string, start?: string, end?: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('range', newRange);
      
      if (newRange === 'CUSTOM') {
        if (start !== undefined) params.set('customStart', start);
        if (end !== undefined) params.set('customEnd', end);
      } else {
        params.delete('customStart');
        params.delete('customEnd');
      }

      router.replace(`/analytics?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <AnalyticsTransitionContext.Provider value={{ isPending, updateFilter }}>
      {children}
    </AnalyticsTransitionContext.Provider>
  );
}

export const useAnalyticsTransition = () => useContext(AnalyticsTransitionContext);

export function AnalyticsTransitionOverlay({ children }: { children: React.ReactNode }) {
  const { isPending } = useAnalyticsTransition();
  return (
    <div className={`transition-all duration-300 ${isPending ? 'opacity-40 pointer-events-none animate-pulse' : ''}`}>
      {children}
    </div>
  );
}
