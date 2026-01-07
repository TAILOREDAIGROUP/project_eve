'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WelcomeEmptyState } from '@/components/welcome-empty-state';
import {
  Brain,
  TrendingUp,
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  BarChart3,
  Clock,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

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

export default function LearningPage() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [patterns, setPatterns] = useState<BusinessPattern[]>([]);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<TaskExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTerm, setNewTerm] = useState({ term: '', definition: '', category: 'general' });
  const [showAddTerm, setShowAddTerm] = useState(false);

  const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, patternsRes, glossaryRes, executionsRes] = await Promise.all([
        fetch(`/api/learning/stats?tenant_id=${TENANT_ID}`),
        fetch(`/api/learning/patterns?tenant_id=${TENANT_ID}`),
        fetch(`/api/learning/glossary?tenant_id=${TENANT_ID}`),
        fetch(`/api/learning/executions?tenant_id=${TENANT_ID}&limit=10`),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
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
    } catch (error) {
      console.error('Failed to load learning data:', error);
      // Set demo data
      setStats({
        totalExecutions: 156,
        positiveRate: 87,
        topTasks: [
          { title: 'Draft cold outreach email', count: 34 },
          { title: 'Create weekly report', count: 28 },
          { title: 'Analyze sales pipeline', count: 22 },
        ],
        topDepartments: [
          { name: 'Sales & Marketing', count: 67 },
          { name: 'Operations', count: 45 },
          { name: 'Finance', count: 32 },
        ],
        patternsLearned: 23,
        glossaryTerms: 15,
      });
      setPatterns([
        { id: '1', pattern_type: 'preference', pattern_key: 'tone', pattern_value: 'Professional but friendly', confidence: 85, source: 'inferred', usage_count: 34 },
        { id: '2', pattern_type: 'terminology', pattern_key: 'product_name', pattern_value: 'Project Eve', confidence: 100, source: 'explicit', usage_count: 56 },
        { id: '3', pattern_type: 'workflow', pattern_key: 'email_signoff', pattern_value: 'Best regards', confidence: 78, source: 'inferred', usage_count: 28 },
      ]);
      setGlossary([
        { id: '1', term: 'TAG', definition: 'Tailored AI Group - the parent company', category: 'company' },
        { id: '2', term: 'Eve', definition: 'The AI assistant platform', category: 'product' },
      ]);
    }
    setLoading(false);
  };

  const addGlossaryTerm = async () => {
    if (!newTerm.term || !newTerm.definition) return;

    try {
      const res = await fetch('/api/learning/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: TENANT_ID,
          ...newTerm,
        }),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="h-8 w-8 text-purple-500" />
          How Eve Learns Your Business
        </h1>
        <p className="text-muted-foreground mt-1">
          Eve gets smarter the more you use it. Here's what she's learned about your business.
        </p>
      </div>

      {/* Stats Overview */}
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

      {/* Main Content */}
      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patterns">Learned Patterns</TabsTrigger>
          <TabsTrigger value="glossary">Business Glossary</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
        </TabsList>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>What Eve Has Learned</CardTitle>
              <CardDescription>
                These patterns help Eve understand your business better and provide more relevant responses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patterns.length > 0 ? (
                <div className="space-y-3">
                  {patterns.map((pattern) => (
                    <div key={pattern.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Badge className={getPatternTypeColor(pattern.pattern_type)}>
                          {pattern.pattern_type}
                        </Badge>
                        <div>
                          <p className="font-medium">{pattern.pattern_key}</p>
                          <p className="text-sm text-muted-foreground">{pattern.pattern_value}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{pattern.confidence}% confident</p>
                          <p className="text-xs text-muted-foreground">Used {pattern.usage_count} times</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {pattern.source}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <WelcomeEmptyState
                  title="Eve is still learning"
                  description="Use more tasks to help Eve understand your business preferences and patterns."
                  icon={<Sparkles className="h-8 w-8 text-white" />}
                  tips={[
                    "The more you use Eve, the better she learns",
                    "Give feedback on tasks to help Eve improve",
                    "Try different tasks to see what Eve can learn"
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Glossary Tab */}
        <TabsContent value="glossary" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Business Glossary</CardTitle>
                  <CardDescription>
                    Teach Eve your company's terminology, product names, and acronyms.
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddTerm(!showAddTerm)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Term
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddTerm && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                  <Input
                    placeholder="Term (e.g., 'SKU', 'MRR', 'Project Alpha')"
                    value={newTerm.term}
                    onChange={(e) => setNewTerm({ ...newTerm, term: e.target.value })}
                  />
                  <Input
                    placeholder="Definition"
                    value={newTerm.definition}
                    onChange={(e) => setNewTerm({ ...newTerm, definition: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button onClick={addGlossaryTerm}>Save Term</Button>
                    <Button variant="outline" onClick={() => setShowAddTerm(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {glossary.length > 0 ? (
                <div className="space-y-2">
                  {glossary.map((term) => (
                    <div key={term.id} className="flex items-center justify-between p-3 rounded-lg border group">
                      <div>
                        <p className="font-medium">{term.term}</p>
                        <p className="text-sm text-muted-foreground">{term.definition}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 text-red-500"
                        onClick={() => deleteGlossaryTerm(term.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <WelcomeEmptyState
                  title="No terms added yet"
                  description="Teach Eve your company's unique terminology, product names, and acronyms."
                  icon={<BookOpen className="h-8 w-8 text-white" />}
                  actionLabel="Add Your First Term"
                  onAction={() => setShowAddTerm(true)}
                  tips={[
                    "Add product names like 'Project Eve'",
                    "Add acronyms like 'SKU' or 'MRR'",
                    "Add company-specific terms"
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Most Used Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.topTasks && stats.topTasks.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topTasks.map((task, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{task.title}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={(task.count / stats.topTasks[0].count) * 100} className="w-20" />
                          <span className="text-sm text-muted-foreground w-8">{task.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No data yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Department Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.topDepartments && stats.topDepartments.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topDepartments.map((dept, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{dept.name}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={(dept.count / stats.topDepartments[0].count) * 100} className="w-20" />
                          <span className="text-sm text-muted-foreground w-8">{dept.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No data yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Learning Tip */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Sparkles className="h-8 w-8" />
            <div>
              <h3 className="font-semibold">The more you use Eve, the smarter she gets</h3>
              <p className="text-white/80 text-sm">
                Eve learns from every task you run, every correction you make, and every term you teach her.
                Over time, she'll understand your business better than any other tool.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
