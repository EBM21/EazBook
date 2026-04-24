import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Building2, 
  DollarSign,
  TrendingUp,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  Check
} from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: string;
  value: number;
  assigned_to_name?: string;
  created_at: string;
}

export default function CRMModule() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    company: "",
    status: "new",
    value: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/crm/leads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...newLead,
          value: parseFloat(newLead.value) || 0
        }),
      });
      if (res.ok) {
        const addedLead = await res.json();
        setLeads(prev => [addedLead, ...prev]);
        setIsAddLeadOpen(false);
        setNewLead({ name: "", email: "", company: "", status: "new", value: "" });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to add lead:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/crm/leads/${selectedLead.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: selectedLead.name,
          email: selectedLead.email,
          company: selectedLead.company,
          status: selectedLead.status,
          value: parseFloat(selectedLead.value.toString()) || 0
        }),
      });
      if (res.ok) {
        const updatedLead = await res.json();
        setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
        setIsEditLeadOpen(false);
        setSelectedLead(null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to update lead:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      // Optimistic update
      setLeads(prev => prev.filter(l => l.id !== leadId));
      
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        // Revert if failed
        fetchLeads();
        console.error("Failed to delete lead");
      }
    } catch (error) {
      console.error("Failed to delete lead:", error);
      fetchLeads();
    }
  };

  const openEditDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditLeadOpen(true);
  };

  const toggleLeadSelection = (id: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map(l => l.id));
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedLeadIds.length === 0) return;
    setBulkSubmitting(true);
    try {
      const res = await fetch("/api/crm/leads/bulk-status", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ids: selectedLeadIds, status }),
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => 
          selectedLeadIds.includes(l.id) ? { ...l, status } : l
        ));
        setSelectedLeadIds([]);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Bulk status update failed:", error);
    } finally {
      setBulkSubmitting(false);
    }
  };

  const statusColors: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    contacted: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    qualified: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    lost: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">CRM Pipeline</h1>
          <p className="text-muted-foreground font-medium">Manage your leads and sales opportunities with real-time data.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <BulkImportButton 
            endpoint="/api/crm/leads/bulk"
            onSuccess={fetchLeads}
            mapping={{
              "Name": "name",
              "Email": "email",
              "Company": "company",
              "Status": "status",
              "Value": "value"
            }}
          />
          {success && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-emerald-500 font-bold text-sm bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Lead added!
            </motion.div>
          )}
          
            <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
              <DialogTrigger render={
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lead
                </Button>
              } />
              <DialogContent className="sm:max-w-[500px] rounded-[2rem] bg-card border-border p-0 overflow-hidden shadow-2xl">
                <div className="bg-primary/5 p-8 border-b border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-bold text-foreground">Add New Lead</DialogTitle>
                      <p className="text-sm text-muted-foreground mt-1">Capture new business opportunities in your pipeline.</p>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleAddLead} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Lead Name</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input 
                          id="name" 
                          placeholder="Jane Smith" 
                          value={newLead.name}
                          onChange={e => setNewLead({...newLead, name: e.target.value})}
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
                          placeholder="jane@example.com" 
                          value={newLead.email}
                          onChange={e => setNewLead({...newLead, email: e.target.value})}
                          required
                          className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input 
                        id="company" 
                        placeholder="Acme Corp" 
                        value={newLead.company}
                        onChange={e => setNewLead({...newLead, company: e.target.value})}
                        className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</Label>
                      <Select 
                        value={newLead.status} 
                        onValueChange={v => setNewLead({...newLead, status: v})}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-muted/30 h-12">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border rounded-xl">
                          <SelectItem value="new">New Lead</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="value" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Est. Value ($)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input 
                          id="value" 
                          type="number" 
                          placeholder="5000" 
                          value={newLead.value}
                          onChange={e => setNewLead({...newLead, value: e.target.value})}
                          className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Lead Opportunity"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

          <Dialog open={isEditLeadOpen} onOpenChange={setIsEditLeadOpen}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Edit Lead</DialogTitle>
              </DialogHeader>
              {selectedLead && (
                <form onSubmit={handleEditLead} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Lead Name</Label>
                    <Input 
                      id="edit-name" 
                      value={selectedLead.name ?? ""}
                      onChange={e => setSelectedLead({...selectedLead, name: e.target.value})}
                      required
                      className="rounded-xl border-border bg-muted/50 focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email Address</Label>
                    <Input 
                      id="edit-email" 
                      type="email" 
                      value={selectedLead.email ?? ""}
                      onChange={e => setSelectedLead({...selectedLead, email: e.target.value})}
                      required
                      className="rounded-xl border-border bg-muted/50 focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-company">Company</Label>
                    <Input 
                      id="edit-company" 
                      value={selectedLead.company ?? ""}
                      onChange={e => setSelectedLead({...selectedLead, company: e.target.value})}
                      className="rounded-xl border-border bg-muted/50 focus:bg-background"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select 
                        value={selectedLead.status ?? "new"} 
                        onValueChange={v => setSelectedLead({...selectedLead, status: v})}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-muted/50">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-value">Estimated Value ($)</Label>
                      <Input 
                        id="edit-value" 
                        type="number" 
                        value={selectedLead.value ?? 0}
                        onChange={e => setSelectedLead({...selectedLead, value: parseFloat(e.target.value) || 0})}
                        className="rounded-xl border-border bg-muted/50 focus:bg-background"
                      />
                    </div>
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

      {/* CRM Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border shadow-sm rounded-2xl bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Pipeline Value</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              ${leads.reduce((acc, lead) => acc + Number(lead.value), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Based on {leads.length} active leads</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm rounded-2xl bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-80">AI Conversion Prediction</span>
              <Sparkles className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-2xl font-bold">74% Average</div>
            <p className="text-xs opacity-70 mt-1">+12% from last week's model</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm rounded-2xl bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">New Leads Today</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {leads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Real-time tracking enabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
        <CardHeader className="border-b border-border bg-muted/30 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search leads, companies..." 
                className="pl-10 h-10 rounded-xl border-border bg-background"
              />
            </div>

            {selectedLeadIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20"
              >
                <span className="text-sm font-bold text-primary">{selectedLeadIds.length} selected</span>
                <div className="h-4 w-[1px] bg-primary/20 mx-1" />
                <Select onValueChange={handleBulkStatusUpdate}>
                  <SelectTrigger className="h-8 w-[140px] rounded-lg bg-background border-border text-xs">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border rounded-xl">
                    <SelectItem value="new">New Lead</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                {bulkSubmitting && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                  onClick={() => setSelectedLeadIds([])}
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground">No leads found</h3>
              <p className="text-muted-foreground mb-6">Start by adding your first lead to the pipeline.</p>
              <Button onClick={() => setIsAddLeadOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">Add Lead</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="p-4 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-border bg-background cursor-pointer"
                        checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Lead Name</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Company</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Value</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned To</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leads.map((lead) => (
                    <tr key={lead.id} className={`hover:bg-muted/30 transition-colors ${selectedLeadIds.includes(lead.id) ? 'bg-primary/5' : ''}`}>
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-border bg-background cursor-pointer"
                          checked={selectedLeadIds.includes(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {lead.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">{lead.name}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {lead.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="w-4 h-4 text-muted-foreground/60" />
                          {lead.company}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[lead.status]}`}>
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                          <DollarSign className="w-3 h-3 text-muted-foreground/60" />
                          {Number(lead.value).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-medium text-muted-foreground">
                          {lead.assigned_to_name || "Unassigned"}
                        </span>
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
                              onClick={() => openEditDialog(lead)}
                              className="flex items-center gap-2 cursor-pointer focus:bg-muted"
                            >
                              <Edit2 className="w-4 h-4 text-blue-500" />
                              <span>Edit Lead</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteLead(lead.id)}
                              className="flex items-center gap-2 cursor-pointer focus:bg-red-500/10 text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete Lead</span>
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
