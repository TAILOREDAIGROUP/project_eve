'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Play, ChevronRight } from 'lucide-react';
import { Department, TaskPrompt } from '@/lib/department-tasks';

interface DepartmentCardProps {
  department: Department;
  onRunTask: (prompt: string) => void;
}

export function DepartmentCard({ department, onRunTask }: DepartmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isExpanded) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{department.icon}</span>
              <div>
                <h3 className="font-semibold text-lg">{department.name}</h3>
                <p className="text-sm text-muted-foreground">{department.description}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {department.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group cursor-pointer"
                onClick={() => onRunTask(task.prompt)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{task.icon}</span>
                  <span className="text-sm font-medium">{task.title}</span>
                </div>
                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-4 w-4 mr-1" />
                  Run
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
      onClick={() => setIsExpanded(true)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${department.color} text-white text-xl`}>
              {department.icon}
            </div>
            <div>
              <h3 className="font-semibold">{department.name}</h3>
              <p className="text-xs text-muted-foreground">{department.tasks.length} quick tasks</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
