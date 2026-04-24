import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Briefcase, 
  Calendar,
  Building2,
  DollarSign,
  Loader2,
  UserCheck,
  UserMinus,
  Edit2,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/src/lib/auth";
import BulkImportButton from "@/src/components/BulkImportButton";

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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  job_title: string;
  department_id: string;
  department_name?: string;
  hire_date: string;
  salary: number;
  status: string;
  created_at: string;
}

export default function HRModule() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    fullName: "",
    email: "",
    jobTitle: "",
    departmentId: "Engineering",
    salary: "",
    hireDate: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/hr/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/employees", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...newEmployee,
          salary: parseFloat(newEmployee.salary) || 0
        }),
      });
      if (res.ok) {
        const addedEmployee = await res.json();
        setEmployees(prev => [...prev, addedEmployee]);
        setIsAddEmployeeOpen(false);
        setNewEmployee({
          fullName: "",
          email: "",
          jobTitle: "",
          departmentId: "Engineering",
          salary: "",
          hireDate: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error("Failed to add employee:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/hr/employees/${selectedEmployee.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          fullName: selectedEmployee.full_name,
          email: selectedEmployee.email,
          jobTitle: selectedEmployee.job_title,
          departmentId: selectedEmployee.department_name || selectedEmployee.department_id,
          salary: parseFloat(selectedEmployee.salary.toString()) || 0,
          status: selectedEmployee.status
        }),
      });
      if (res.ok) {
        const updatedEmployee = await res.json();
        setEmployees(prev => prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
        setIsEditEmployeeOpen(false);
        setSelectedEmployee(null);
      }
    } catch (error) {
      console.error("Failed to update employee:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      // Optimistic update
      setEmployees(prev => prev.filter(e => e.id !== employeeId));

      const res = await fetch(`/api/hr/employees/${employeeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        // Revert if failed
        fetchEmployees();
        console.error("Failed to delete employee");
      }
    } catch (error) {
      console.error("Failed to delete employee:", error);
      fetchEmployees();
    }
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditEmployeeOpen(true);
  };

  const activeEmployees = employees.filter(e => e.status === "active");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Human Resources</h1>
          <p className="text-muted-foreground font-medium">Manage your team, departments, and payroll in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <BulkImportButton 
            endpoint="/api/hr/employees/bulk"
            onSuccess={fetchEmployees}
            mapping={{
              "Full Name": "fullName",
              "Email": "email",
              "Job Title": "jobTitle",
              "Department": "department",
              "Salary": "salary",
              "Hire Date": "hireDate"
            }}
          />
          <Button variant="outline" className="rounded-xl border-border bg-card font-bold">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          
          <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
            <DialogTrigger render={
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 font-bold">
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px] rounded-3xl bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-foreground">Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEmployee} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    placeholder="John Doe" 
                    value={newEmployee.fullName}
                    onChange={e => setNewEmployee({...newEmployee, fullName: e.target.value})}
                    required
                    className="rounded-xl border-border bg-muted/50 focus:bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@company.com" 
                    value={newEmployee.email}
                    onChange={e => setNewEmployee({...newEmployee, email: e.target.value})}
                    required
                    className="rounded-xl border-border bg-muted/50 focus:bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input 
                    id="jobTitle" 
                    placeholder="Software Engineer" 
                    value={newEmployee.jobTitle}
                    onChange={e => setNewEmployee({...newEmployee, jobTitle: e.target.value})}
                    required
                    className="rounded-xl border-border bg-muted/50 focus:bg-background"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select 
                      value={newEmployee.departmentId} 
                      onValueChange={v => setNewEmployee({...newEmployee, departmentId: v})}
                    >
                      <SelectTrigger className="rounded-xl border-border bg-muted/50">
                        <SelectValue placeholder="Select dept" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="IT">IT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">Annual Salary ($)</Label>
                    <Input 
                      id="salary" 
                      type="number" 
                      placeholder="85000" 
                      value={newEmployee.salary}
                      onChange={e => setNewEmployee({...newEmployee, salary: e.target.value})}
                      required
                      className="rounded-xl border-border bg-muted/50 focus:bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Hire Date</Label>
                  <Input 
                    id="hireDate" 
                    type="date" 
                    value={newEmployee.hireDate}
                    onChange={e => setNewEmployee({...newEmployee, hireDate: e.target.value})}
                    required
                    className="rounded-xl border-border bg-muted/50 focus:bg-background"
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hire Employee"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-foreground">Edit Employee</DialogTitle>
              </DialogHeader>
              {selectedEmployee && (
                <form onSubmit={handleEditEmployee} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-fullName">Full Name</Label>
                    <Input 
                      id="edit-fullName" 
                      value={selectedEmployee.full_name ?? ""}
                      onChange={e => setSelectedEmployee({...selectedEmployee, full_name: e.target.value})}
                      required
                      className="rounded-xl border-border bg-muted/50 focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email Address</Label>
                    <Input 
                      id="edit-email" 
                      type="email" 
                      value={selectedEmployee.email ?? ""}
                      onChange={e => setSelectedEmployee({...selectedEmployee, email: e.target.value})}
                      required
                      className="rounded-xl border-border bg-muted/50 focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-jobTitle">Job Title</Label>
                    <Input 
                      id="edit-jobTitle" 
                      value={selectedEmployee.job_title ?? ""}
                      onChange={e => setSelectedEmployee({...selectedEmployee, job_title: e.target.value})}
                      required
                      className="rounded-xl border-border bg-muted/50 focus:bg-background"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select 
                        value={selectedEmployee.department_name || "Engineering"} 
                        onValueChange={v => setSelectedEmployee({...selectedEmployee, department_name: v})}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-muted/50">
                          <SelectValue placeholder="Select dept" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="Engineering">Engineering</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="HR">HR</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-salary">Annual Salary ($)</Label>
                      <Input 
                        id="edit-salary" 
                        type="number" 
                        value={selectedEmployee.salary ?? 0}
                        onChange={e => setSelectedEmployee({...selectedEmployee, salary: parseFloat(e.target.value) || 0})}
                        required
                        className="rounded-xl border-border bg-muted/50 focus:bg-background"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={selectedEmployee.status} 
                      onValueChange={v => setSelectedEmployee({...selectedEmployee, status: v})}
                    >
                      <SelectTrigger className="rounded-xl border-border bg-muted/50">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* HR Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border shadow-sm rounded-2xl bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Headcount</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{employees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{activeEmployees.length} active employees</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm rounded-2xl bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Monthly Payroll</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              ${(employees.reduce((acc, e) => acc + Number(e.salary || 0), 0) / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Based on current salaries</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm rounded-2xl bg-slate-900 dark:bg-slate-800 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">Retention Rate</span>
              <UserCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-slate-400 mt-1">+2.1% from last year</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Directory */}
      <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
        <CardHeader className="border-b border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search employees, job titles..." 
                className="pl-10 h-10 rounded-xl border-border bg-background"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground">No employees found</h3>
              <p className="text-muted-foreground mb-6">Start by adding your first employee to the directory.</p>
              <Button onClick={() => setIsAddEmployeeOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">Add Employee</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Employee</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Job Title</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Hire Date</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border border-border">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.email}`} />
                            <AvatarFallback>{employee.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">{employee.full_name}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {employee.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                          <Briefcase className="w-4 h-4 text-muted-foreground/60" />
                          {employee.job_title}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="w-4 h-4 text-muted-foreground/60" />
                          {employee.department_name || "General"}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${
                          employee.status === "active" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}>
                          {employee.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 text-muted-foreground/60" />
                          {new Date(employee.hire_date).toLocaleDateString()}
                        </div>
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
                              onClick={() => openEditDialog(employee)}
                              className="flex items-center gap-2 cursor-pointer focus:bg-muted"
                            >
                              <Edit2 className="w-4 h-4 text-blue-500" />
                              <span>Edit Employee</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="flex items-center gap-2 cursor-pointer focus:bg-red-500/10 text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete Employee</span>
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
    </div>
  );
}
