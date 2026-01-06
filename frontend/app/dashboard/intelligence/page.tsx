'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Lightbulb,
  Network,
  CheckCircle,
  Clock,
  Trash2,
  Plus,
  Settings,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ArrowRight
} from 'lucide-react';

interface Memory {
  id: string;
  content: string;
  memory_type: string;
  importance: number;
  created_at: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: string;
  priority: string;
  subtasks: { id: string; description: string; status: string }[];
}

export default function IntelligenceDashboard() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [engagementLevel, setEngagementLevel] = useState({ level: 2, name: 'Co-Worker' });
  const [newGoal, setNewGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch engagement level
      const engRes = await fetch(`/api/settings/engagement?user_id=${TENANT_ID}`);
      if (engRes.ok) {
        const engData = await engRes.json();
        const names: Record<number, string> = { 1: 'Sounding Board', 2: 'Co-Worker', 3: 'Personal Assistant' };
        setEngagementLevel({ level: engData.engagement_level || 2, name: names[engData.engagement_level] || 'Co-Worker' });
      }

      // Fetch memories
      const memRes = await fetch(`/api/memories?user_id=${TENANT_ID}`);
      if (memRes.ok) {
        const memData = await memRes.json();
        setMemories(memData.memories || []);
      }

      // Fetch goals
      const goalRes = await fetch(`/api/goals?tenant_id=${TENANT_ID}&user_id=${TENANT_ID}`);
      if (goalRes.ok) {
        const goalData = await goalRes.json();
        setGoals(goalData.goals || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const deleteMemory = async (memoryId: string) => {
    try {
      await fetch(`/api/memories/${memoryId}`, { method: 'DELETE' });
      setMemories(memories.filter(m => m.id !== memoryId));
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  const createGoal = async () => {
    if (!newGoal.trim()) return;
    
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGoal,
          user_id: TENANT_ID,
          tenant_id: TENANT_ID,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setGoals([...goals, data.goal]);
        setNewGoal('');
      }
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const getMemoryTypeColor = (type: string) => {
    switch (type) {
      case 'preference': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'fact': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'context': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your AI Assistant</h1>
          <p className="text-muted-foreground mt-1">
            See what Eve knows and how she's helping you
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/dashboard/settings">
              <Settings className="h-4 w-4 mr-2" />
              Change How Eve Works
            </a>
          </Button>
          <Button asChild>
            <a href="/dashboard">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat with Eve
            </a>
          </Button>
        </div>
      </div>

      {/* Current Mode Banner */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Eve is currently your</p>
              <h2 className="text-2xl font-bold">{engagementLevel.name}</h2>
              <p className="text-white/80 text-sm mt-1">
                {engagementLevel.level === 1 && "I'll respond when you ask and stay out of your way."}
                {engagementLevel.level === 2 && "I'll actively help with tasks and offer suggestions."}
                {engagementLevel.level === 3 && "I'll anticipate your needs and proactively assist."}
              </p>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <a href="/dashboard/settings">
                Change <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="memory" className="flex items-center gap-2">
            <Brain className="h-4 w-4" /> What Eve Knows
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" /> Your Goals
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:border-purple-500 transition-colors" onClick={() => setActiveTab('memory')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  Things Eve Remembers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{memories.length}</div>
                <p className="text-sm text-muted-foreground">facts, preferences & context</p>
                <Button variant="link" className="p-0 h-auto mt-2">View all →</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-orange-500 transition-colors" onClick={() => setActiveTab('goals')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  Active Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{goals.filter(g => g.status === 'active').length}</div>
                <p className="text-sm text-muted-foreground">goals being tracked</p>
                <Button variant="link" className="p-0 h-auto mt-2">Manage goals →</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Quick Tip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {engagementLevel.level === 1 && "Try asking Eve a question to get started!"}
                  {engagementLevel.level === 2 && "Tell Eve about a task you need help with."}
                  {engagementLevel.level === 3 && "Eve will notice when you need help and offer assistance."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>How to Get the Most from Eve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                  <Brain className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Share information about yourself</h4>
                  <p className="text-sm text-muted-foreground">Tell Eve your preferences, work style, and important facts. She'll remember and use them to help you better.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                  <Target className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium">Tell Eve about your goals</h4>
                  <p className="text-sm text-muted-foreground">Say "I want to..." or "Help me..." and Eve will track your goal and break it into steps.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Give feedback</h4>
                  <p className="text-sm text-muted-foreground">Let Eve know when responses are helpful or not. She learns from your feedback.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                What Eve Remembers About You
              </CardTitle>
              <CardDescription>
                Eve learns these facts from your conversations. You can delete anything you don't want her to remember.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memories.length > 0 ? (
                <div className="space-y-2">
                  {memories.map((memory) => (
                    <div key={memory.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group">
                      <div className="flex items-center gap-3">
                        <Badge className={getMemoryTypeColor(memory.memory_type)}>
                          {memory.memory_type}
                        </Badge>
                        <span className="text-sm">{memory.content}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteMemory(memory.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium">No memories yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start chatting with Eve and she'll remember important things about you.
                  </p>
                  <Button className="mt-4" asChild>
                    <a href="/dashboard">Start a conversation</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                Your Goals
              </CardTitle>
              <CardDescription>
                Tell Eve about your goals and she'll help you achieve them step by step.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Goal Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="What do you want to achieve? (e.g., 'Learn Spanish' or 'Launch my website')"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createGoal()}
                />
                <Button onClick={createGoal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </div>

              {/* Goals List */}
              {goals.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {goals.map((goal) => (
                    <div key={goal.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{goal.title}</h4>
                        <Badge variant="outline">{goal.progress}%</Badge>
                      </div>
                      <Progress value={goal.progress} className="mb-3" />
                      {goal.subtasks && goal.subtasks.length > 0 && (
                        <div className="space-y-1">
                          {goal.subtasks.map((subtask, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              {subtask.status === 'completed' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className={subtask.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                                {subtask.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium">No goals yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add a goal above or tell Eve "I want to..." in chat.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
