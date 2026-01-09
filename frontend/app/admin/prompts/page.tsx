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
  Check,
  Layout,
  Settings,
  Eye,
  MoreVertical,
  Search,
  TrendingUp,
  Mail,
  MessageSquare,
  Target,
  Type,
  Mails,
  FileText,
  Megaphone,
  Presentation,
  BarChart3,
  Calculator,
  FileSpreadsheet,
  GitCompare,
  Receipt,
  Landmark,
  LineChart,
  Users,
  CheckSquare,
  BarChart,
  Book,
  GraduationCap,
  LogOut,
  Calendar,
  RefreshCw,
  ShoppingBag,
  List,
  AlertTriangle,
  Headphones,
  MessageCircle,
  HelpCircle,
  BarChart2,
  BookOpen,
  Package,
  Truck,
  RotateCcw,
  Factory,
  DollarSign,
  FileSearch,
  Lightbulb,
  Sparkles
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

const EMOJI_OPTIONS = ['📊', '📧', '🎯', '✍️', '📬', '🔍', '📋', '📢', '💰', '📑', '📈', '📝', '🔄', '🧾', '🏛️', '🔮', '👥', '✉️', '✅', '📖', '🎓', '🚪', '⚙️', '📅', '🏪', '⚠️', '🎧', '💬', '❓', '🙏', '📚', '📦', '🚚', '🏭', '💡', '⭐', '🚀', '💼', '🎨', '🔧', '📌'];

const ICON_MAP: Record<string, any> = {
  'trending-up': TrendingUp,
  'mail': Mail,
  'message-square': MessageSquare,
  'target': Target,
  'type': Type,
  'mails': Mails,
  'search': Search,
  'file-text': FileText,
  'megaphone': Megaphone,
  'presentation': Presentation,
  'bar-chart-3': BarChart3,
  'calculator': Calculator,
  'file-spreadsheet': FileSpreadsheet,
  'layout': Layout,
  'git-compare': GitCompare,
  'receipt': Receipt,
  'landmark': Landmark,
  'line-chart': LineChart,
  'users': Users,
  'check-square': CheckSquare,
  'bar-chart': BarChart,
  'book': Book,
  'graduation-cap': GraduationCap,
  'log-out': LogOut,
  'settings': Settings,
  'calendar': Calendar,
  'refresh-cw': RefreshCw,
  'shopping-bag': ShoppingBag,
  'list': List,
  'alert-triangle': AlertTriangle,
  'headphones': Headphones,
  'message-circle': MessageCircle,
  'help-circle': HelpCircle,
  'bar-chart-2': BarChart2,
  'book-open': BookOpen,
  'package': Package,
  'truck': Truck,
  'rotate-ccw': RotateCcw,
  'factory': Factory,
  'dollar-sign': DollarSign,
  'file-search': FileSearch,
  'lightbulb': Lightbulb,
  'sparkles': Sparkles
};

function DynamicIcon({ icon, className = "h-4 w-4" }: { icon: string, className?: string }) {
  const IconComponent = ICON_MAP[icon];
  if (IconComponent) {
    return <IconComponent className={className} strokeWidth={1.5} />;
  }
  return <span className={className.includes('text-lg') || className.includes('text-xl') ? '' : 'text-sm'}>{icon}</span>;
}

export default function AdminPromptsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [editingTask, setEditingTask] = useState<TaskPrompt | null>(null);
  const [previewTask, setPreviewTask] = useState<TaskPrompt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
    <div className="min-h-screen bg-slate-50/50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-500">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg">
                <Layout className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Prompt Management</h1>
                <p className="text-xs text-slate-500">System configuration and team workflows</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <Badge className="bg-emerald-500 text-white">
                <Check className="h-3 w-3 mr-1" />
                Changes Saved
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={loadDepartments}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-3 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Departments</h3>
              <div className="space-y-1">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDepartment(dept.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      selectedDepartment === dept.id
                        ? 'bg-white shadow-sm border border-slate-200 text-slate-900'
                        : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <DynamicIcon icon={dept.icon} className="h-4 w-4" />
                      <span className="text-sm font-medium">{dept.name}</span>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-normal">
                      {dept.tasks.length}
                    </Badge>
                  </button>
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-slate-500 hover:text-slate-900 mt-4"
                onClick={() => setIsAddingDepartment(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9 space-y-6">
            {currentDepartment && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                      <DynamicIcon icon={currentDepartment.icon} className="h-8 w-8 text-slate-900" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{currentDepartment.name}</h2>
                      <p className="text-slate-500">{currentDepartment.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Search tasks..." 
                        className="pl-9 w-64 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => setIsAddingTask(true)} className="bg-slate-900 hover:bg-slate-800 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {currentDepartment.tasks
                    .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((task) => (
                    <Card key={task.id} className="border-slate-200 hover:border-slate-300 transition-all group overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex items-center p-4 gap-4">
                          <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
                            <DynamicIcon icon={task.icon} className="h-5 w-5 text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900">{task.title}</h4>
                            <p className="text-sm text-slate-500 truncate">{task.prompt}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setPreviewTask(task)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setEditingTask(task);
                              }}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => duplicateTask(task)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {currentDepartment.tasks.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="h-8 w-8 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900">No tasks yet</h3>
                      <p className="text-slate-500 mt-1 mb-6">Start by adding a task prompt for this department.</p>
                      <Button onClick={() => setIsAddingTask(true)}>
                        Create First Task
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTask} onOpenChange={() => setPreviewTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <DynamicIcon icon={previewTask?.icon || ''} className="h-5 w-5" />
              {previewTask?.title}
            </DialogTitle>
            <DialogDescription>Prompt preview for end users</DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-slate-900 rounded-xl mt-4">
            <p className="text-slate-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">
              {previewTask?.prompt}
            </p>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setPreviewTask(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>Create a new task prompt for {currentDepartment?.name}</DialogDescription>
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
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="flex-1"
              />
            </div>
            <Textarea
              placeholder="Prompt Template..."
              value={newTask.prompt}
              onChange={(e) => setNewTask({ ...newTask, prompt: e.target.value })}
              rows={8}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddingTask(false)}>Cancel</Button>
            <Button onClick={handleAddTask}>Create Task</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
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
                rows={8}
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
            <Button onClick={handleUpdateTask}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Department Dialog */}
      <Dialog open={isAddingDepartment} onOpenChange={setIsAddingDepartment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
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
                placeholder="Name"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                className="flex-1"
              />
            </div>
            <Input
              placeholder="Description"
              value={newDepartment.description}
              onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddingDepartment(false)}>Cancel</Button>
            <Button onClick={handleAddDepartment}>Add</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
