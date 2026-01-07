'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  MessageSquare, 
  Briefcase, 
  Zap,
  Check,
  ArrowRight,
  ArrowLeft,
  Plug,
  Target,
  Brain
} from 'lucide-react';

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

type EngagementLevel = 1 | 2 | 3;

const STEPS = [
  { id: 'welcome', title: 'Welcome to Eve' },
  { id: 'engagement', title: 'How should Eve help you?' },
  { id: 'departments', title: 'What do you work on?' },
  { id: 'connect', title: 'Connect your tools' },
  { id: 'ready', title: "You're all set!" },
];

const DEPARTMENTS = [
  { id: 'sales-marketing', name: 'Sales & Marketing', icon: '📊' },
  { id: 'finance-accounting', name: 'Finance & Accounting', icon: '💰' },
  { id: 'human-resources', name: 'Human Resources', icon: '👥' },
  { id: 'operations', name: 'Operations', icon: '⚙️' },
  { id: 'customer-experience', name: 'Customer Experience', icon: '🎧' },
  { id: 'fulfillment', name: 'Fulfillment & Logistics', icon: '📦' },
];

export function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [engagementLevel, setEngagementLevel] = useState<EngagementLevel>(2);
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const toggleDepartment = (deptId: string) => {
    const newSelected = new Set(selectedDepartments);
    if (newSelected.has(deptId)) {
      newSelected.delete(deptId);
    } else {
      newSelected.add(deptId);
    }
    setSelectedDepartments(newSelected);
  };

  const handleNext = async () => {
    if (currentStep === STEPS.length - 1) {
      // Save preferences and complete
      setSaving(true);
      try {
        // Save engagement level
        await fetch('/api/settings/engagement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: TENANT_ID,
            tenant_id: TENANT_ID,
            engagement_level: engagementLevel,
          }),
        });

        // Save onboarding complete flag
        localStorage.setItem('eve-onboarding-complete', 'true');
        localStorage.setItem('eve-selected-departments', JSON.stringify(Array.from(selectedDepartments)));
        
        onComplete();
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
      setSaving(false);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Meet Eve, Your AI Assistant</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Eve learns how your business works and helps you get things done faster. 
              The more you use her, the smarter she gets.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="p-4 rounded-lg bg-muted/50">
                <Brain className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Remembers Everything</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <Target className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Tracks Your Goals</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm font-medium">One-Click Tasks</p>
              </div>
            </div>
          </div>
        );

      case 'engagement':
        return (
          <div className="py-4">
            <h2 className="text-xl font-bold mb-2 text-center">How should Eve interact with you?</h2>
            <p className="text-muted-foreground text-center mb-6">You can change this anytime in Settings</p>
            
            <div className="space-y-3">
              {[
                { level: 1 as EngagementLevel, name: 'Sounding Board', icon: MessageSquare, desc: 'Eve responds only when you ask. Minimal interruptions.', color: 'blue' },
                { level: 2 as EngagementLevel, name: 'Co-Worker', icon: Briefcase, desc: 'Eve actively helps with tasks and offers suggestions.', color: 'purple' },
                { level: 3 as EngagementLevel, name: 'Personal Assistant', icon: Sparkles, desc: 'Eve anticipates your needs and proactively offers help.', color: 'pink' },
              ].map((option) => {
                const Icon = option.icon;
                const isSelected = engagementLevel === option.level;
                return (
                  <div
                    key={option.level}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setEngagementLevel(option.level)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-500' : 'bg-gray-100'}`}>
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{option.name}</h3>
                          {isSelected && <Check className="h-4 w-4 text-purple-500" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{option.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'departments':
        return (
          <div className="py-4">
            <h2 className="text-xl font-bold mb-2 text-center">What areas do you work in?</h2>
            <p className="text-muted-foreground text-center mb-6">Select all that apply. This helps Eve show relevant tasks.</p>
            
            <div className="grid grid-cols-2 gap-3">
              {DEPARTMENTS.map((dept) => {
                const isSelected = selectedDepartments.has(dept.id);
                return (
                  <div
                    key={dept.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleDepartment(dept.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{dept.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{dept.name}</h3>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-purple-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {selectedDepartments.size === 0 && (
              <p className="text-sm text-amber-600 text-center mt-4">
                Select at least one department to continue
              </p>
            )}
          </div>
        );

      case 'connect':
        return (
          <div className="py-4 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plug className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Connect Your Tools (Optional)</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Eve works best when connected to your business tools. You can do this now or later.
            </p>
            
            <div className="grid grid-cols-4 gap-3 mb-6">
              {['🔵 Google', '💬 Slack', '🟠 HubSpot', '💚 QuickBooks'].map((tool) => (
                <div key={tool} className="p-3 rounded-lg border text-center">
                  <span className="text-sm">{tool}</span>
                </div>
              ))}
            </div>
            
            <Button variant="outline" asChild>
              <a href="/dashboard/integrations" target="_blank">
                Connect Tools Now
              </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              You can always connect tools later from the dashboard
            </p>
          </div>
        );

      case 'ready':
        return (
          <div className="py-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">You're All Set!</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Eve is ready to help. Start by clicking any task on the dashboard, or just chat with Eve directly.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
              <h3 className="font-medium mb-2">Quick tips:</h3>
              <ul className="text-sm text-muted-foreground text-left space-y-2">
                <li>• Click department cards to see quick tasks</li>
                <li>• Tell Eve about your goals and she'll track them</li>
                <li>• The more you use Eve, the smarter she gets</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </DialogTitle>
            <div className="flex gap-1">
              {STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    idx <= currentStep ? 'bg-purple-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <Progress value={progress} className="h-1" />
        </DialogHeader>

        {renderStep()}

        <DialogFooter className="flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={
              (STEPS[currentStep].id === 'departments' && selectedDepartments.size === 0) ||
              saving
            }
          >
            {currentStep === STEPS.length - 1 ? (
              saving ? 'Saving...' : 'Get Started'
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
