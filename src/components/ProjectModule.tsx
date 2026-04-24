import React, { useState, useEffect } from "react";
import { 
  Layout, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Calendar,
  Users,
  Loader2,
  Kanban,
  ListTodo,
  TrendingUp,
  Edit2,
  Trash2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/src/lib/auth";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_to?: string;
  assigned_to_name?: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

export default function ProjectModule() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "active"
  });
  const [newTask, setNewTask] = useState({
    projectId: "",
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Task; direction: "asc" | "desc" } | null>({ key: "due_date", direction: "asc" });
  const { token } = useAuth();

  useEffect(() => {
    fetchProjectsAndTasks();
  }, []);

  const fetchProjectsAndTasks = async () => {
    try {
      const [projectsRes, tasksRes, usersRes] = await Promise.all([
        fetch("/api/projects", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/projects/tasks", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (projectsRes.ok && tasksRes.ok && usersRes.ok) {
        const [projectsData, tasksData, usersData] = await Promise.all([
          projectsRes.json(),
          tasksRes.json(),
          usersRes.json()
        ]);
        setProjects(projectsData);
        setTasks(tasksData);
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Failed to fetch projects and tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      const res = await fetch(`/api/projects/tasks/${taskId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ...task, status: newStatus }),
      });
      if (!res.ok) {
        fetchProjectsAndTasks();
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
      fetchProjectsAndTasks();
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        const addedProject = await res.json();
        setProjects(prev => [...prev, addedProject]);
        setIsNewProjectOpen(false);
        setNewProject({
          name: "",
          description: "",
          status: "active"
        });
      }
    } catch (error) {
      console.error("Failed to add project:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(selectedProject),
      });
      if (res.ok) {
        const updatedProject = await res.json();
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        setIsEditProjectOpen(false);
        setSelectedProject(null);
      }
    } catch (error) {
      console.error("Failed to update project:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      // Optimistic update
      setProjects(prev => prev.filter(p => p.id !== projectId));

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        // Revert if failed
        fetchProjectsAndTasks();
        console.error("Failed to delete project");
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      fetchProjectsAndTasks();
    }
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setIsEditProjectOpen(true);
  };

  const openEditTaskDialog = (task: Task) => {
    setSelectedTask(task);
    setIsEditTaskOpen(true);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects/tasks", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        const addedTask = await res.json();
        setTasks(prev => [addedTask, ...prev]);
        setIsNewTaskOpen(false);
        setNewTask({
          projectId: "",
          title: "",
          description: "",
          status: "todo",
          priority: "medium",
          dueDate: new Date().toISOString().split('T')[0],
          assignedTo: ""
        });
      }
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/tasks/${selectedTask.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(selectedTask),
      });
      if (res.ok) {
        const updatedTask = await res.json();
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        setIsEditTaskOpen(false);
        setSelectedTask(null);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      const res = await fetch(`/api/projects/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        fetchProjectsAndTasks();
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      fetchProjectsAndTasks();
    }
  };

  const handleSort = (key: keyof Task) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    // Define headers we want to export (excluding potential internal IDs or sensitive fields if needed)
    // For now, let's just take all keys from the first object
    const headers = Object.keys(data[0]);
    
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] ?? '';
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const priorityOrder: Record<string, number> = { "critical": 4, "high": 3, "medium": 2, "low": 1 };
  const statusOrder: Record<string, number> = { "todo": 1, "in-progress": 2, "done": 3 };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aVal: any = a[key];
    let bVal: any = b[key];

    if (key === "priority") {
      aVal = priorityOrder[aVal] || 0;
      bVal = priorityOrder[bVal] || 0;
    } else if (key === "status") {
      aVal = statusOrder[aVal] || 0;
      bVal = statusOrder[bVal] || 0;
    } else if (key === "due_date") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    } else if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const priorityColors: Record<string, string> = {
    low: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    high: "bg-amber-600/10 text-amber-600 border-amber-600/20",
    critical: "bg-red-600/10 text-red-600 border-red-600/20 shadow-[0_0_8px_rgba(220,38,38,0.1)]",
  };

  const priorityAccents: Record<string, string> = {
    low: "bg-slate-300",
    medium: "bg-blue-500",
    high: "bg-amber-500",
    critical: "bg-red-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Project Management</h1>
          <p className="text-muted-foreground font-medium">Plan, track, and collaborate on your team's work.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant={viewMode === "kanban" ? "default" : "outline"} 
            onClick={() => setViewMode(viewMode === "kanban" ? "list" : "kanban")}
            className={`rounded-xl border-border font-bold ${viewMode === "kanban" ? "bg-primary text-primary-foreground" : "bg-card"}`}
          >
            {viewMode === "kanban" ? <ListTodo className="w-4 h-4 mr-2" /> : <Kanban className="w-4 h-4 mr-2" />}
            {viewMode === "kanban" ? "List View" : "Kanban Board"}
          </Button>
          
          <Button 
            variant="outline"
            className="rounded-xl border-border font-bold bg-card"
            onClick={() => {
              if (activeTab === "projects") {
                downloadCSV(projects, "eazbook_projects");
              } else {
                downloadCSV(tasks, "eazbook_tasks");
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          
          <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
            <DialogTrigger render={
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 font-bold">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            } />
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] bg-card border-border p-0 overflow-hidden shadow-2xl">
              <div className="bg-primary/5 p-8 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <Layout className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-foreground">Create New Project</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">Initialize a new workspace for your team.</p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleAddProject} className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Project Name</Label>
                  <div className="relative">
                    <Layout className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input 
                      id="name" 
                      placeholder="ERP Phase 3" 
                      value={newProject.name}
                      onChange={e => setNewProject({...newProject, name: e.target.value})}
                      required
                      className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe the project goals and scope..." 
                    value={newProject.description}
                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                    required
                    className="rounded-xl min-h-[120px] border-border bg-muted/30 focus:bg-background p-4 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Initial Status</Label>
                  <Select 
                    value={newProject.status} 
                    onValueChange={v => setNewProject({...newProject, status: v})}
                  >
                    <SelectTrigger className="rounded-xl border-border bg-muted/30 h-12">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-xl">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Launch Project"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] bg-card border-border p-0 overflow-hidden shadow-2xl">
              <div className="bg-primary/5 p-8 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <Layout className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-foreground">Edit Project</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">Update project scope and status.</p>
                  </div>
                </div>
              </div>
              {selectedProject && (
                <form onSubmit={handleEditProject} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Project Name</Label>
                    <div className="relative">
                      <Layout className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input 
                        id="edit-name" 
                        value={selectedProject.name ?? ""}
                        onChange={e => setSelectedProject({...selectedProject, name: e.target.value})}
                        required
                        className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Description</Label>
                    <Textarea 
                      id="edit-description" 
                      value={selectedProject.description ?? ""}
                      onChange={e => setSelectedProject({...selectedProject, description: e.target.value})}
                      required
                      className="rounded-xl min-h-[120px] border-border bg-muted/30 focus:bg-background p-4 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</Label>
                    <Select 
                      value={selectedProject.status ?? "active"} 
                      onValueChange={v => setSelectedProject({...selectedProject, status: v})}
                    >
                      <SelectTrigger className="rounded-xl border-border bg-muted/30 h-12">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-xl">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 font-bold">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] bg-card border-border p-0 overflow-hidden shadow-2xl">
              <div className="bg-primary/5 p-8 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <ListTodo className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-foreground">Create New Task</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">Add a new actionable item to your project.</p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleAddTask} className="p-8 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Project</Label>
                  <Select 
                    value={newTask.projectId} 
                    onValueChange={v => setNewTask({...newTask, projectId: v})}
                    required
                  >
                    <SelectTrigger className="rounded-xl border-border bg-muted/30 h-10">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-xl">
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Title</Label>
                  <Input 
                    id="task-title" 
                    placeholder="Task title" 
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                    required
                    className="rounded-xl border-border bg-muted/30 focus:bg-background h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Description</Label>
                  <Textarea 
                    id="task-desc" 
                    placeholder="Task details" 
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                    className="rounded-xl border-border bg-muted/30 focus:bg-background min-h-[80px]"
                  />
                </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Priority</Label>
                      <Select 
                        value={newTask.priority} 
                        onValueChange={v => setNewTask({...newTask, priority: v})}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-muted/30 h-10">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border rounded-xl">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-due" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Due Date</Label>
                      <Input 
                        id="task-due" 
                        type="date"
                        value={newTask.dueDate}
                        onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                        required
                        className="rounded-xl border-border bg-muted/30 focus:bg-background h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Assign To</Label>
                      <Select 
                        value={newTask.assignedTo} 
                        onValueChange={v => setNewTask({...newTask, assignedTo: v})}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-muted/30 h-10">
                          <SelectValue placeholder="Assignee" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border rounded-xl">
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                <DialogFooter className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 font-bold shadow-lg shadow-primary/20"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Task"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] bg-card border-border p-0 overflow-hidden shadow-2xl">
              <div className="bg-primary/5 p-8 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <Edit2 className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-foreground">Edit Task</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">Update project task details.</p>
                  </div>
                </div>
              </div>
              {selectedTask && (
                <form onSubmit={handleEditTask} className="p-8 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-task-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Title</Label>
                    <Input 
                      id="edit-task-title" 
                      value={selectedTask.title}
                      onChange={e => setSelectedTask({...selectedTask, title: e.target.value})}
                      required
                      className="rounded-xl border-border bg-muted/30 focus:bg-background h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-task-desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Description</Label>
                    <Textarea 
                      id="edit-task-desc" 
                      value={selectedTask.description}
                      onChange={e => setSelectedTask({...selectedTask, description: e.target.value})}
                      className="rounded-xl border-border bg-muted/30 focus:bg-background min-h-[80px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Priority</Label>
                      <Select 
                        value={selectedTask.priority} 
                        onValueChange={v => setSelectedTask({...selectedTask, priority: v})}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-muted/30 h-10">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border rounded-xl">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-task-due" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Due Date</Label>
                      <Input 
                        id="edit-task-due" 
                        type="date"
                        value={selectedTask.due_date ? new Date(selectedTask.due_date).toISOString().split('T')[0] : ""}
                        onChange={e => setSelectedTask({...selectedTask, due_date: e.target.value})}
                        required
                        className="rounded-xl border-border bg-muted/30 focus:bg-background h-10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</Label>
                      <Select 
                        value={selectedTask.status} 
                        onValueChange={v => setSelectedTask({...selectedTask, status: v})}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-muted/30 h-10">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border rounded-xl">
                          <SelectItem value="todo">Todo</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Assign To</Label>
                      <Select 
                        value={selectedTask.assigned_to || "unassigned"} 
                        onValueChange={v => setSelectedTask({...selectedTask, assigned_to: v === "unassigned" ? "" : v})}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-muted/30 h-10">
                          <SelectValue placeholder="Assignee" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border rounded-xl">
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 font-bold shadow-lg shadow-primary/20"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border shadow-sm rounded-2xl bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Active Projects</span>
              <Layout className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{projects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">4 completed this month</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm rounded-2xl bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Pending Tasks</span>
              <ListTodo className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{tasks.filter(t => t.status !== 'done').length}</div>
            <p className="text-xs text-muted-foreground mt-1">12 overdue tasks requiring attention</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm rounded-2xl bg-slate-900 dark:bg-slate-800 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">Team Velocity</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-slate-400 mt-1">+5% from last sprint</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl mb-6">
          <TabsTrigger value="projects" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Projects
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center bg-card border border-border rounded-2xl">
              <Layout className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">No projects found</h3>
              <p className="text-muted-foreground mb-6">Create your first project to start tracking work.</p>
              <Button onClick={() => setIsNewProjectOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">Create Project</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="border-border shadow-sm rounded-2xl hover:shadow-md transition-all bg-card">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="rounded-lg bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase text-[10px] font-bold">
                        {project.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:text-foreground h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border rounded-xl shadow-xl">
                          <DropdownMenuItem 
                            onClick={() => openEditDialog(project)}
                            className="flex items-center gap-2 cursor-pointer focus:bg-muted"
                          >
                            <Edit2 className="w-4 h-4 text-blue-500" />
                            <span>Edit Project</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProject(project.id)}
                            className="flex items-center gap-2 cursor-pointer focus:bg-red-500/10 text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Project</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2 text-muted-foreground">{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                            U{i}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        8/12 Tasks
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          {viewMode === "kanban" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[500px]">
              {["todo", "in-progress", "done"].map(col => (
                <div key={col} className="bg-muted/30 rounded-2xl p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        col === 'todo' ? 'bg-slate-400' : col === 'in-progress' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`} />
                      {col.replace('-', ' ')}
                    </h3>
                    <Badge variant="outline" className="rounded-lg bg-background border-border text-[10px]">
                      {tasks.filter(t => t.status === col).length}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                    {sortedTasks.filter(t => t.status === col).map(task => (
                      <Card 
                        key={task.id} 
                        className="border-border shadow-sm rounded-xl bg-card hover:shadow-md transition-all overflow-hidden cursor-pointer active:scale-[0.98]"
                        onClick={() => openEditTaskDialog(task)}
                      >
                        <div className={`h-1 w-full ${priorityAccents[task.priority]}`} />
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className={`text-[10px] font-bold uppercase ${priorityColors[task.priority]}`}>
                              {task.priority}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md">
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border">
                                <DropdownMenuItem onClick={() => openEditTaskDialog(task)}>
                                  <Edit2 className="w-3 h-3 mr-2 text-blue-500" />
                                  Edit Task
                                </DropdownMenuItem>
                                {["todo", "in-progress", "done"].filter(c => c !== col).map(c => (
                                  <DropdownMenuItem key={c} onClick={() => handleUpdateTaskStatus(task.id, c)}>
                                    Move to {c.replace('-', ' ')}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <h4 className="font-bold text-sm text-foreground leading-tight">{task.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground font-medium">{task.assigned_to_name && task.assigned_to_name.split(' ')[0]}</span>
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary border border-primary/20">
                                {task.assigned_to_name ? task.assigned_to_name.charAt(0) : "?"}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {tasks.filter(t => t.status === col).length === 0 && (
                      <div className="p-8 text-center border-2 border-dashed border-border rounded-xl">
                        <p className="text-xs text-muted-foreground">No tasks</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
              <CardHeader className="border-b border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search tasks, priorities, projects..." 
                      className="pl-10 h-10 rounded-xl border-border bg-background"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th 
                          className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSort("title")}
                        >
                          <div className="flex items-center gap-2">
                            Task
                            {sortConfig?.key === "title" ? (
                              sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                          </div>
                        </th>
                        <th 
                          className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSort("status")}
                        >
                          <div className="flex items-center gap-2">
                            Status
                            {sortConfig?.key === "status" ? (
                              sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                          </div>
                        </th>
                        <th 
                          className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSort("priority")}
                        >
                          <div className="flex items-center gap-2">
                            Priority
                            {sortConfig?.key === "priority" ? (
                              sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                          </div>
                        </th>
                        <th 
                          className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSort("due_date")}
                        >
                          <div className="flex items-center gap-2">
                            Due Date
                            {sortConfig?.key === "due_date" ? (
                              sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                          </div>
                        </th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Assignee</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sortedTasks.map((task) => (
                        <tr 
                          key={task.id} 
                          className="hover:bg-muted/30 transition-colors cursor-pointer active:bg-muted/50"
                          onClick={() => openEditTaskDialog(task)}
                        >
                          <td className="p-4 text-sm font-bold text-foreground">{task.title}</td>
                          <td className="p-4">
                            <Badge variant="outline" className={`rounded-lg ${
                              task.status === 'done' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                              task.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                              'bg-slate-500/10 text-slate-500 border-slate-500/20'
                            }`}>
                              {task.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={`text-[10px] font-bold uppercase ${priorityColors[task.priority]}`}>
                              {task.priority}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{new Date(task.due_date).toLocaleDateString()}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                {task.assigned_to_name ? task.assigned_to_name.charAt(0) : "?"}
                              </div>
                              <span className="text-xs text-muted-foreground">{task.assigned_to_name || "Unassigned"}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border rounded-xl shadow-xl">
                                <DropdownMenuItem onClick={() => openEditTaskDialog(task)} className="flex items-center gap-2 cursor-pointer">
                                  <Edit2 className="w-4 h-4 text-blue-500" />
                                  <span>Edit Task</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteTask(task.id)} className="flex items-center gap-2 cursor-pointer text-red-500">
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete Task</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
