import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Shield, 
  Building2, 
  Mail,
  Loader2,
  Check,
  X,
  Edit2,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/src/lib/auth";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "Employee",
    department: "None"
  });
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    role: "",
    department: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const { token, user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        const addedUser = await res.json();
        setUsers(prev => [...prev, addedUser]);
        setIsAddUserOpen(false);
        setNewUser({ fullName: "", email: "", password: "", role: "Employee", department: "None" });
      }
    } catch (error) {
      console.error("Failed to add user:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(editFormData),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        setIsEditUserOpen(false);
        setEditingUser(null);
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Optimistic update
      setUsers(prev => prev.filter(u => u.id !== userId));

      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        // Revert if failed
        fetchUsers();
        console.error("Failed to delete user");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      fetchUsers();
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      department: user.department
    });
    setIsEditUserOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-muted-foreground font-medium">Manage team members, roles, and department access.</p>
        </div>
        
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger render={
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px] rounded-[2rem] bg-card border-border p-0 overflow-hidden shadow-2xl">
            <div className="bg-primary/5 p-8 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-foreground">Add Team Member</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">Invite a new member to your organization.</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleAddUser} className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <Input 
                    id="fullName" 
                    placeholder="John Doe" 
                    value={newUser.fullName}
                    onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                    required
                    className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@company.com" 
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                    required
                    className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Initial Password</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                    required
                    className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Role</Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={v => setNewUser({...newUser, role: v})}
                  >
                    <SelectTrigger className="rounded-xl border-border bg-muted/30 h-12">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-xl">
                      <SelectItem value="Admin">Administrator</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Department</Label>
                  <Select 
                    value={newUser.department} 
                    onValueChange={v => setNewUser({...newUser, department: v})}
                  >
                    <SelectTrigger className="rounded-xl border-border bg-muted/30 h-12">
                      <SelectValue placeholder="Select dept" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-xl">
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="IT">Information Tech</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create User Account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
        <CardHeader className="border-b border-border bg-muted/30 p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              className="pl-10 h-10 rounded-xl border-border bg-background"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground">No users found</h3>
              <p className="text-muted-foreground">Add your first team member to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Joined</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {u.full_name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">{u.full_name}</span>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`rounded-lg font-bold text-[10px] uppercase px-2 py-0.5 ${
                          u.role === "Admin" ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                          u.role === "Manager" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                          "bg-slate-500/10 text-slate-500 border-slate-500/20"
                        }`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="w-4 h-4 text-muted-foreground/60" />
                          {u.department}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:text-foreground">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border rounded-xl shadow-xl">
                            <DropdownMenuItem 
                              onClick={() => openEditDialog(u)}
                              className="flex items-center gap-2 cursor-pointer focus:bg-muted"
                            >
                              <Edit2 className="w-4 h-4 text-blue-500" />
                              <span>Edit User</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={u.id === currentUser?.id}
                              className="flex items-center gap-2 cursor-pointer focus:bg-red-500/10 text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete User</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] bg-card border-border p-0 overflow-hidden shadow-2xl">
          <div className="bg-primary/5 p-8 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Edit2 className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground">Edit User</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Update team member details.</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleEditUser} className="p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="editFullName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input 
                  id="editFullName" 
                  placeholder="John Doe" 
                  value={editFormData.fullName}
                  onChange={e => setEditFormData({...editFormData, fullName: e.target.value})}
                  required
                  className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input 
                  id="editEmail" 
                  type="email" 
                  placeholder="john@company.com" 
                  value={editFormData.email}
                  onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                  required
                  className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Role</Label>
                <Select 
                  value={editFormData.role} 
                  onValueChange={v => setEditFormData({...editFormData, role: v})}
                >
                  <SelectTrigger className="rounded-xl border-border bg-muted/30 h-12">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border rounded-xl">
                    <SelectItem value="Admin">Administrator</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Department</Label>
                <Select 
                  value={editFormData.department} 
                  onValueChange={v => setEditFormData({...editFormData, department: v})}
                >
                  <SelectTrigger className="rounded-xl border-border bg-muted/30 h-12">
                    <SelectValue placeholder="Select dept" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border rounded-xl">
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="HR">Human Resources</SelectItem>
                    <SelectItem value="IT">Information Tech</SelectItem>
                    <SelectItem value="None">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update User Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
