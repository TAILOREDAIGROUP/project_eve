'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { WelcomeEmptyState } from '@/components/welcome-empty-state';
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
  ArrowRight,
  Sparkles,
  History,
  BarChart3,
  BookOpen,
  Send,
  Users,
  Calendar,
  RefreshCw,
  XCircle,
  Download,
  FileText
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

interface TaskExecution {
  id: string;
  task_title: string;
  department_id: string;
  feedback: 'positive' | 'negative' | null;
  created_at: string;
}

interface BusinessPattern {
  id: string;
  pattern_type: string;
  pattern_key: string;
  pattern_value: string;
  confidence: number;
  source: string;
  usage_count: number;
}

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
}

interface LearningStats {
  totalExecutions: number;
  positiveRate: number;
  topTasks: { title: string; count: number }[];
  topDepartments: { name: string; count: number }[];
  patternsLearned: number;
  glossaryTerms: number;
}

interface ActionLog {
  id: string;
  action_type: string;
  provider_id: string;
  task_id: string;
  status: 'pending' | 'confirmed' | 'executed' | 'failed' | 'cancelled';
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  error_message: string | null;
  created_at: string;
  executed_at: string | null;
}

export default function IntelligenceDashboard() {
  const { userId } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [engagementLevel, setEngagementLevel] = useState({ level: 2, name: 'Co-Worker' });
  const [newGoal, setNewGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Learning states
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [patterns, setPatterns] = useState<BusinessPattern[]>([]);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<TaskExecution[]>([]);
  const [newTerm, setNewTerm] = useState({ term: '', definition: '', category: 'general' });
  const [showAddTerm, setShowAddTerm] = useState(false);

  // Activity states
  const [actions, setActions] = useState<ActionLog[]>([]);
  const [actionFilter, setActionFilter] = useState<'all' | 'executed' | 'failed' | 'pending'>('all');

  useEffect(() => {
    if (userId) {
      fetchAllData();
    }
  }, [userId]);

  const fetchAllData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Fetch engagement level
      const engRes = await fetch('/api/settings/engagement');
      if (engRes.ok) {
        const engData = await engRes.json();
        const names: Record<number, string> = { 1: 'Sounding Board', 2: 'Co-Worker', 3: 'Personal Assistant' };
        setEngagementLevel({ level: engData.engagement_level || 2, name: names[engData.engagement_level] || 'Co-Worker' });
      }

      // Fetch memories
      const memRes = await fetch('/api/memories');
      if (memRes.ok) {
        const memData = await memRes.json();
        setMemories(memData.memories || []);
      }

      // Fetch goals
      const goalRes = await fetch('/api/goals');
      if (goalRes.ok) {
        const goalData = await goalRes.json();
        setGoals(goalData.goals || []);
      }

      // Fetch Learning data
      const [statsRes, patternsRes, glossaryRes, executionsRes] = await Promise.all([
        fetch('/api/learning/stats'),
        fetch('/api/learning/patterns'),
        fetch('/api/learning/glossary'),
        fetch('/api/learning/executions?limit=10'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (patternsRes.ok) {
        const data = await patternsRes.json();
        setPatterns(data.patterns || []);
      }
      if (glossaryRes.ok) {
        const data = await glossaryRes.json();
        setGlossary(data.terms || []);
      }
      if (executionsRes.ok) {
        const data = await executionsRes.json();
        setRecentExecutions(data.executions || []);
      }

      // Fetch Action data
      const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
      const actionRes = await fetch(`/api/actions?tenant_id=${TENANT_ID}`);
      if (actionRes.ok) {
        const data = await actionRes.json();
        setActions(data.actions || []);
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
    if (!newGoal.trim() || !userId) return;
    
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGoal,
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

  const addGlossaryTerm = async () => {
    if (!newTerm.term || !newTerm.definition || !userId) return;
    try {
      const res = await fetch('/api/learning/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTerm),
      });
      if (res.ok) {
        const data = await res.json();
        setGlossary([...glossary, data.term]);
        setNewTerm({ term: '', definition: '', category: 'general' });
        setShowAddTerm(false);
      }
    } catch (error) {
      console.error('Failed to add term:', error);
    }
  };

  const deleteGlossaryTerm = async (termId: string) => {
    try {
      await fetch(`/api/learning/glossary/${termId}`, { method: 'DELETE' });
      setGlossary(glossary.filter(t => t.id !== termId));
    } catch (error) {
      console.error('Failed to delete term:', error);
    }
  };

  const getPatternTypeColor = (type: string) => {
    switch (type) {
      case 'preference': return 'bg-blue-100 text-blue-800';
      case 'terminology': return 'bg-green-100 text-green-800';
      case 'workflow': return 'bg-purple-100 text-purple-800';
      case 'style': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'confirmed': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_email': return <Send className="h-4 w-4" />;
      case 'create_deal': return <Users className="h-4 w-4" />;
      case 'create_ticket': return <FileText className="h-4 w-4" />;
      case 'create_task': return <Calendar className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getProviderBadge = (provider: string) => {
    const icons: Record<string, string> = {
      google: '🔵',
      slack: '💬',
      hubspot: '🟠',
      quickbooks: '💚',
      zendesk: '🎫',
    };
    return (
      <Badge variant="outline" className="flex gap-1 items-center font-normal">
        <span>{icons[provider] || '📦'}</span>
        {provider}
      </Badge>
    );
  };

  const getMemoryTypeColor = (type: string) => {
    switch (type) {
      case 'preference': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'fact': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'context': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const filteredActions = actions.filter(a => {
    if (actionFilter === 'all') return true;
    return a.status === actionFilter;
  });

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="memory" className="flex items-center gap-2">
            <Brain className="h-4 w-4" /> What Eve Knows
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" /> Your Goals
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Learning & Patterns
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <History className="h-4 w-4" /> Activity Log
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

        {/* Learning Tab */}
        <TabsContent value="learning" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalExecutions || 0}</p>
                    <p className="text-sm text-muted-foreground">Tasks Executed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <ThumbsUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.positiveRate || 0}%</p>
                    <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.patternsLearned || 0}</p>
                    <p className="text-sm text-muted-foreground">Patterns Learned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <BookOpen className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.glossaryTerms || 0}</p>
                    <p className="text-sm text-muted-foreground">Business Terms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="patterns" className="space-y-4">
            <TabsList>
              <TabsTrigger value="patterns">Learned Patterns</TabsTrigger>
              <TabsTrigger value="glossary">Business Glossary</TabsTrigger>
            </TabsList>
            <TabsContent value="patterns">
              <Card>
                <CardHeader>
                  <CardTitle>What Eve Has Learned</CardTitle>
                </CardHeader>
                <CardContent>
                  {patterns.length > 0 ? (
                    <div className="space-y-3">
                      {patterns.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Badge className={getPatternTypeColor(p.pattern_type)}>{p.pattern_type}</Badge>
                            <div>
                              <p className="font-medium">{p.pattern_key}</p>
                              <p className="text-sm text-muted-foreground">{p.pattern_value}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{p.confidence}% confident</p>
                            <p className="text-xs text-muted-foreground">Used {p.usage_count} times</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <WelcomeEmptyState
                      title="Eve is still learning"
                      description="Use more tasks to help Eve understand your business preferences."
                      icon={<Sparkles className="h-8 w-8 text-white" />}
                      tips={["The more you use Eve, the better she learns", "Give feedback on tasks"]}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="glossary">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Business Glossary</CardTitle>
                  <Button size="sm" onClick={() => setShowAddTerm(!showAddTerm)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Term
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showAddTerm && (
                    <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                      <Input 
                        placeholder="Term" 
                        value={newTerm.term} 
                        onChange={e => setNewTerm({...newTerm, term: e.target.value})} 
                      />
                      <Input 
                        placeholder="Definition" 
                        value={newTerm.definition} 
                        onChange={e => setNewTerm({...newTerm, definition: e.target.value})} 
                      />
                      <div className="flex gap-2">
                        <Button onClick={addGlossaryTerm}>Save</Button>
                        <Button variant="outline" onClick={() => setShowAddTerm(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                  {glossary.length > 0 ? (
                    <div className="space-y-2">
                      {glossary.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border group">
                          <div>
                            <p className="font-medium">{t.term}</p>
                            <p className="text-sm text-muted-foreground">{t.definition}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-red-500 opacity-0 group-hover:opacity-100" onClick={() => deleteGlossaryTerm(t.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <WelcomeEmptyState
                      title="No terms yet"
                      description="Teach Eve your company's terminology."
                      icon={<BookOpen className="h-8 w-8 text-white" />}
                      tips={["Add product names", "Add acronyms"]}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Action History</CardTitle>
                <CardDescription>Audit trail of Eve's actions across your tools.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchAllData}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Tabs value={actionFilter} onValueChange={(v: any) => setActionFilter(v)}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="executed">Executed</TabsTrigger>
                    <TabsTrigger value="failed">Failed</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {filteredActions.length > 0 ? (
                <div className="space-y-4">
                  {filteredActions.map((action) => (
                    <div key={action.id} className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div className="flex gap-4">
                        <div className={`p-2 rounded-full ${
                          action.status === 'executed' ? 'bg-green-100 text-green-600' :
                          action.status === 'failed' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {getActionIcon(action.action_type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold capitalize">{action.action_type.replace('_', ' ')}</span>
                            {getStatusIcon(action.status)}
                            <span className="text-xs text-muted-foreground">{new Date(action.created_at).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {getProviderBadge(action.provider_id)}
                            <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {JSON.stringify(action.input_data).substring(0, 100)}...
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={action.status === 'executed' ? 'default' : 'secondary'} className="capitalize">{action.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <WelcomeEmptyState
                  title="No actions found"
                  description="Actions you approve will appear here."
                  icon={<History className="h-8 w-8 text-white" />}
                />
              )}
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">Total Success</p>
                <p className="text-2xl font-bold text-green-600">{actions.filter(a => a.status === 'executed').length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">Total Failed</p>
                <p className="text-2xl font-bold text-red-600">{actions.filter(a => a.status === 'failed').length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {actions.length > 0 ? Math.round((actions.filter(a => a.status === 'executed').length / actions.length) * 100) : 0}%
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
