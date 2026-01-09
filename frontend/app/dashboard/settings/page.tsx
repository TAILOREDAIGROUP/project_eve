'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Briefcase, 
  Sparkles,
  Check,
  Info
} from 'lucide-react';

type EngagementLevel = 1 | 2 | 3;

interface EngagementOption {
  level: EngagementLevel;
  name: string;
  icon: typeof MessageSquare;
  description: string;
  behaviors: string[];
  bestFor: string;
}

const ENGAGEMENT_OPTIONS: EngagementOption[] = [
  {
    level: 1,
    name: 'Sounding Board',
    icon: MessageSquare,
    description: 'Eve listens and responds only when you ask. Minimal interruptions.',
    behaviors: [
      'Responds only to direct questions',
      'Occasional check-ins (every 10+ messages)',
      'Never suggests tasks unprompted',
      'Keeps responses brief and focused',
    ],
    bestFor: 'Users who want control and minimal AI involvement',
  },
  {
    level: 2,
    name: 'Co-Worker',
    icon: Briefcase,
    description: 'Eve actively helps with tasks and offers suggestions when relevant.',
    behaviors: [
      'Offers to handle routine tasks',
      'Asks clarifying questions before starting work',
      'Reports back when tasks are complete',
      'Suggests improvements when appropriate',
    ],
    bestFor: 'Users who want a collaborative partner',
  },
  {
    level: 3,
    name: 'Personal Assistant',
    icon: Sparkles,
    description: 'Eve anticipates your needs and proactively offers help.',
    behaviors: [
      'Notices when you seem stuck or confused',
      'Proactively offers to help or take over tasks',
      'Anticipates what you might need next',
      'Can demonstrate how to do things step-by-step',
    ],
    bestFor: 'Users who want maximum AI assistance',
  },
];

export default function SettingsPage() {
  const { userId } = useAuth();
  const [currentLevel, setCurrentLevel] = useState<EngagementLevel>(2);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchCurrentLevel();
    }
  }, [userId]);

  const fetchCurrentLevel = async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/settings/engagement');
      if (res.ok) {
        const data = await res.json();
        setCurrentLevel(data.engagement_level || 2);
      }
    } catch (error) {
      console.error('Failed to fetch engagement level:', error);
    }
  };

  const updateLevel = async (level: EngagementLevel) => {
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    
    try {
      const res = await fetch('/api/settings/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagement_level: level,
        }),
      });

      if (res.ok) {
        setCurrentLevel(level);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to update engagement level:', error);
    }
    
    setSaving(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize how Eve works with you
        </p>
      </div>

      {/* Engagement Level Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            How should Eve interact with you?
          </CardTitle>
          <CardDescription>
            Choose how proactive you want Eve to be. You can change this anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ENGAGEMENT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = currentLevel === option.level;
            
            return (
              <div
                key={option.level}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' 
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
                onClick={() => updateLevel(option.level)}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <Check className="h-5 w-5 text-purple-500" />
                  </div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-500' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <Icon className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{option.name}</h3>
                      <Badge variant="outline" className="text-xs">Level {option.level}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">{option.description}</p>
                    
                    <div className="mt-3 space-y-1">
                      {option.behaviors.map((behavior, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                          {behavior}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="text-blue-600 dark:text-blue-400">{option.bestFor}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {saved && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <Check className="h-5 w-5" />
              <span>Settings saved! Eve will now behave as your {ENGAGEMENT_OPTIONS.find(o => o.level === currentLevel)?.name}.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Memory Management */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Management</CardTitle>
          <CardDescription>
            View and manage what Eve remembers about you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href="/dashboard/intelligence?tab=memory">
              Manage Memories →
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
