'use client';

import { useState, useEffect } from 'react';

export function useOnboarding() {
  const [isComplete, setIsComplete] = useState(true); // Default to true to prevent flash
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const complete = localStorage.getItem('eve-onboarding-complete') === 'true';
    setIsComplete(complete);
    setIsLoading(false);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('eve-onboarding-complete', 'true');
    setIsComplete(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('eve-onboarding-complete');
    localStorage.removeItem('eve-selected-departments');
    setIsComplete(false);
  };

  return {
    isComplete,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
}
