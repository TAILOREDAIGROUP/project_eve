'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding-wizard';

export default function OnboardingPage() {
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(true);

  const handleComplete = () => {
    setShowWizard(false);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <OnboardingWizard open={showWizard} onComplete={handleComplete} />
    </div>
  );
}
