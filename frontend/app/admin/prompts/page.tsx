'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  GripVertical,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';

interface TaskPrompt {
  id: string;
  title: string;
  icon: string;
  prompt: string;
  category: string;
  order?: number;
}

interface Department {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  tasks: TaskPrompt[];
}

const EMOJI_OPTIONS = ['📊', '📧', '📱', '🎯', '✍️', '📬', '🔍', '📋', '📢', '🎤', '💰', '📑', '📈', '📝', '🔄', '🧾', '🏛️', '🔮', '👥', '✉️', '✅', '📖', '🎓', '🚪', '⚙️', '📅', '🏪', '⚠️', '🎧', '💬', '❓', '🙏', '📚', '📦', '🚚', '↩️', '🏭', '💡', '⭐', '🚀', '💼', '🎨', '🔧', '📌'];

export default function AdminPromptsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [editingTask, setEditingTask] = useState<TaskPrompt | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [newTask, setNewTask] = useState<Partial<TaskPrompt>>({ icon: '📋', title: '', prompt: '' });
  const [newDepartment, setNewDepartment] = useState<Partial<Department>>({ icon: '📁', name: '', description: '', color: 'from-gray-500 to-slate-500' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/prompts?tenant_id=${TENANT_ID}`);
      if (res.ok) {
        const data = await res.json();
        if (data.departments && data.departments.length > 0) {
          setDepartments(data.departments);
          setSelectedDepartment(data.departments[0].id);
        } else {
          // Load defaults if no custom departments
          const { DEPARTMENTS } = await import('@/lib/department-tasks');
          setDepartments(DEPARTMENTS);
          setSelectedDepartment(DEPARTMENTS[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load departments:', error);
      // Fall back to defaults
      const { DEPARTMENTS } = await import('@/lib/department-tasks');
      setDepartments(DEPARTMENTS);
      setSelectedDepartment(DEPARTMENTS[0].id);
    }
    setLoading(false);
  };

  const saveDepartments = async (updatedDepartments: Department[]) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: TENANT_ID,
          departments: updatedDepartments,
        }),
      });

      if (res.ok) {
        setDepartments(updatedDepartments);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save departments:', error);
    }
    setSaving(false);
  };

  const currentDepartment = departments.find(d => d.id === selectedDepartment);

  const handleAddTask = () => {
    if (!newTask.title || !newTask.prompt || !currentDepartment) return;

    const task: TaskPrompt = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      icon: newTask.icon || '📋',
      prompt: newTask.prompt,
      category: currentDepartment.id,
      order: currentDepartment.tasks.length,
    };

    const updatedDepartments = departments.map(d =>
      d.id === selectedDepartment
        ? { ...d, tasks: [...d.tasks, task] }
        : d
    );

    saveDepartments(updatedDepartments);
    setNewTask({ icon: '📋', title: '', prompt: '' });
    setIsAddingTask(false);
  };

  const handleUpdateTask = () => {
    if (!editingTask) return;

    const updatedDepartments = departments.map(d =>
      d.id === selectedDepartment
        ? { ...d, tasks: d.tasks.map(t => t.id === editingTask.id ? editingTask : t) }
        : d
    );

    saveDepartments(updatedDepartments);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedDepartments = departments.map(d =>
      d.id === selectedDepartment
        ? { ...d, tasks: d.tasks.filter(t => t.id !== taskId) }
        : d
    );

    saveDepartments(updatedDepartments);
  };

  const handleAddDepartment = () => {
    if (!newDepartment.name) return;

    const department: Department = {
      id: `dept-${Date.now()}`,
      name: newDepartment.name,
      icon: newDepartment.icon || '📁',
      color: newDepartment.color || 'from-gray-500 to-slate-500',
      description: newDepartment.description || '',
      tasks: [],
    };

    const updatedDepartments = [...departments, department];
    saveDepartments(updatedDepartments);
    setSelectedDepartment(department.id);
    setNewDepartment({ icon: '📁', name: '', description: '', color: 'from-gray-500 to-slate-500' });
    setIsAddingDepartment(false);
  };

  const handleDeleteDepartment = (deptId: string) => {
    if (departments.length <= 1) return;
    
    const updatedDepartments = departments.filter(d => d.id !== deptId);
    saveDepartments(updatedDepartments);
    setSelectedDepartment(updatedDepartments[0].id);
  };

  const duplicateTask = (task: TaskPrompt) => {
    const newTaskCopy: TaskPrompt = {
      ...task,
      id: `task-${Date.now()}`,
      title: `${task.title} (Copy)`,
    };

    const updatedDepartments = departments.map(d =>
      d.id === selectedDepartment
        ? { ...d, tasks: [...d.tasks, newTaskCopy] }
        : d
    );

    saveDepartments(updatedDepartments);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Prompt Management</h1>
            <p className="text-muted-foreground">Customize department tasks and prompts for your team</p>
          </div>
        </div>
        {saved && (
          <Badge className="bg-green-500">
            <Check className="h-3 w-3 mr-1" />
            Saved
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Departments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedDepartment === dept.id
                      ? 'bg-purple-100 dark:bg-purple-900'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedDepartment(dept.id)}
                >
                  <div className="flex items-center gap-2">
                    <span>{dept.icon}</span>
                    <span className="text-sm font-medium truncate">{dept.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {dept.tasks.length}
                  </Badge>
                </div>
              ))}

              <Dialog open={isAddingDepartment} onOpenChange={setIsAddingDepartment}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Department</DialogTitle>
                    <DialogDescription>Create a new category for organizing tasks</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                      <Select
                        value={newDepartment.icon}
                        onValueChange={(v) => setNewDepartment({ ...newDepartment, icon: v })}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EMOJI_OPTIONS.map((emoji) => (
                            <SelectItem key={emoji} value={emoji}>{emoji}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Department name"
                        value={newDepartment.name}
                        onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                    <Input
                      placeholder="Description (optional)"
                      value={newDepartment.description}
                      onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddingDepartment(false)}>Cancel</Button>
                    <Button onClick={handleAddDepartment}>Add Department</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-9">
          {currentDepartment && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{currentDepartment.icon}</span>
                    <div>
                      <CardTitle>{currentDepartment.name}</CardTitle>
                      <CardDescription>{currentDepartment.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add New Task</DialogTitle>
                          <DialogDescription>Create a new quick task prompt for {currentDepartment.name}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex gap-2">
                            <Select
                              value={newTask.icon}
                              onValueChange={(v) => setNewTask({ ...newTask, icon: v })}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {EMOJI_OPTIONS.map((emoji) => (
                                  <SelectItem key={emoji} value={emoji}>{emoji}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Task title (e.g., 'Draft cold outreach email')"
                              value={newTask.title}
                              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Prompt Template</label>
                            <Textarea
                              placeholder="Write the prompt that Eve will receive. Use [brackets] for user-fillable fields.&#10;&#10;Example: Write a professional cold outreach email for [describe your product/service] targeting [describe ideal customer]."
                              value={newTask.prompt}
                              onChange={(e) => setNewTask({ ...newTask, prompt: e.target.value })}
                              rows={6}
                            />
                            <p className="text-xs text-muted-foreground">
                              Tip: Use [brackets] to indicate fields the user should customize
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsAddingTask(false)}>Cancel</Button>
                          <Button onClick={handleAddTask}>Add Task</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {currentDepartment.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {currentDepartment.tasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <span className="text-lg">{task.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{task.prompt}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateTask(task)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingTask(task)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Task</DialogTitle>
                              </DialogHeader>
                              {editingTask && (
                                <div className="space-y-4 py-4">
                                  <div className="flex gap-2">
                                    <Select
                                      value={editingTask.icon}
                                      onValueChange={(v) => setEditingTask({ ...editingTask, icon: v })}
                                    >
                                      <SelectTrigger className="w-20">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {EMOJI_OPTIONS.map((emoji) => (
                                          <SelectItem key={emoji} value={emoji}>{emoji}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      value={editingTask.title}
                                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                      className="flex-1"
                                    />
                                  </div>
                                  <Textarea
                                    value={editingTask.prompt}
                                    onChange={(e) => setEditingTask({ ...editingTask, prompt: e.target.value })}
                                    rows={6}
                                  />
                                </div>
                              )}
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
                                <Button onClick={handleUpdateTask}>Save Changes</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No tasks in this department yet</p>
                    <Button onClick={() => setIsAddingTask(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
