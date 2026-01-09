'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export function useOnboarding() {
  const { user, isLoaded } = useUser();
  const [isComplete, setIsComplete] = useState(true); // Default to true to prevent flash
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      const clerkComplete = user?.publicMetadata?.onboardingComplete === true;
      const localComplete = localStorage.getItem('eve-onboarding-complete') === 'true';
      setIsComplete(clerkComplete || localComplete);
      setIsLoading(false);
    }
  }, [isLoaded, user]);

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
