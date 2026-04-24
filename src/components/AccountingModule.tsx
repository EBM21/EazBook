import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  CreditCard,
  Receipt,
  PieChart,
  Loader2,
  Users,
  Calendar,
  Edit2,
  Trash2,
  Building,
  Hash,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface Invoice {
  id: string;
  customer_name: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  balance: number;
  created_at: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  status: string;
}

interface Payment {
  id: string;
  invoice_id: string;
  customer_name: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string;
}

export default function AccountingModule() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    totalReceivables: 0,
    monthlyExpenses: 0,
    netProfit: 0
  });
  const [loading, setLoading] = useState(true);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isEditInvoiceOpen, setIsEditInvoiceOpen] = useState(false);
  const [isNewBankOpen, setIsNewBankOpen] = useState(false);
  const [isEditBankOpen, setIsEditBankOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [newInvoice, setNewInvoice] = useState({
    customerName: "",
    amount: "",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "draft"
  });
  const [newBank, setNewBank] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    balance: ""
  });
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "Office",
    date: new Date().toISOString().split('T')[0]
  });
  const [newPayment, setNewPayment] = useState({
    invoiceId: "",
    amount: "",
    paymentMethod: "Bank Transfer",
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchInvoices();
    fetchBanks();
    fetchStats();
    fetchExpenses();
    fetchPayments();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/accounting/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch accounting stats:", error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/accounting/invoices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch("/api/accounting/banks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBanks(data);
      }
    } catch (error) {
      console.error("Failed to fetch banks:", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/accounting/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/accounting/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounting/expenses", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...newExpense,
          amount: parseFloat(newExpense.amount) || 0
        }),
      });
      if (res.ok) {
        const addedExpense = await res.json();
        setExpenses(prev => [addedExpense, ...prev]);
        setIsNewExpenseOpen(false);
        setNewExpense({
          description: "",
          amount: "",
          category: "Office",
          date: new Date().toISOString().split('T')[0]
        });
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to add expense:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounting/payments", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...newPayment,
          amount: parseFloat(newPayment.amount) || 0
        }),
      });
      if (res.ok) {
        const addedPayment = await res.json();
        setPayments(prev => [addedPayment, ...prev]);
        setIsNewPaymentOpen(false);
        setNewPayment({
          invoiceId: "",
          amount: "",
          paymentMethod: "Bank Transfer",
          paymentDate: new Date().toISOString().split('T')[0],
          notes: ""
        });
        fetchInvoices();
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to record payment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Invoice - ${invoice.customer_name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 40px; }
            .invoice-title { font-size: 32px; font-weight: bold; color: #4f46e5; }
            .details { margin-bottom: 40px; display: grid; grid-template-cols: 1fr 1fr; gap: 40px; }
            .details div { margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { text-align: left; background: #f8fafc; padding: 12px; border-bottom: 1px solid #eee; }
            td { padding: 12px; border-bottom: 1px solid #eee; }
            .total-section { display: flex; justify-content: flex-end; }
            .total-box { width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .grand-total { font-size: 20px; font-weight: bold; border-top: 2px solid #eee; margin-top: 8px; padding-top: 8px; color: #4f46e5; }
            .footer { margin-top: 80px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="invoice-title">INVOICE</div>
              <div style="margin-top: 8px; color: #666">INV-${invoice.id.slice(0, 8).toUpperCase()}</div>
            </div>
            <div style="text-align: right">
              <div style="font-weight: bold; font-size: 18px">Your Company Name</div>
              <div style="color: #666">123 Business Avenue<br>Tech City, TC 54321<br>contact@yourcompany.com</div>
            </div>
          </div>
          <div class="details">
            <div>
              <div style="font-weight: bold; color: #666; text-transform: uppercase; font-size: 12px; margin-bottom: 8px">Bill To</div>
              <div style="font-size: 18px; font-weight: bold">${invoice.customer_name}</div>
              <div style="color: #666">Client Address Line 1<br>City, State, Zip</div>
            </div>
            <div style="text-align: right">
              <div style="margin-bottom: 12px">
                <span style="font-weight: bold; color: #666; text-transform: uppercase; font-size: 12px">Invoice Date:</span>
                <span style="margin-left: 8px">${new Date(invoice.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span style="font-weight: bold; color: #666; text-transform: uppercase; font-size: 12px">Due Date:</span>
                <span style="margin-left: 8px">${new Date(invoice.due_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style="font-weight: bold">Professional Services</div>
                  <div style="font-size: 12px; color: #666">Consulting and implementation services for ${invoice.customer_name}</div>
                </td>
                <td style="text-align: right; vertical-align: top">$${Number(invoice.amount).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <div class="total-section">
            <div class="total-box">
              <div class="total-row">
                <span>Subtotal</span>
                <span>$${Number(invoice.amount).toLocaleString()}</span>
              </div>
              <div class="total-row">
                <span>Tax (0%)</span>
                <span>$0.00</span>
              </div>
              <div class="total-row grand-total">
                <span>Total Amount</span>
                <span>$${Number(invoice.amount).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <div style="font-weight: bold; margin-bottom: 4px">Payment Instructions</div>
            <div>Please include the invoice number in your payment reference.</div>
            <div style="margin-top: 20px">Thank you for your business!</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              // window.close();
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounting/banks", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...newBank,
          balance: parseFloat(newBank.balance) || 0
        }),
      });
      if (res.ok) {
        const addedBank = await res.json();
        setBanks(prev => [addedBank, ...prev]);
        setIsNewBankOpen(false);
        setNewBank({
          bankName: "",
          accountName: "",
          accountNumber: "",
          balance: ""
        });
      }
    } catch (error) {
      console.error("Failed to add bank:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/accounting/banks/${selectedBank.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          bankName: selectedBank.bank_name,
          accountName: selectedBank.account_name,
          accountNumber: selectedBank.account_number,
          balance: parseFloat(selectedBank.balance.toString()) || 0
        }),
      });
      if (res.ok) {
        const updatedBank = await res.json();
        setBanks(prev => prev.map(b => b.id === updatedBank.id ? updatedBank : b));
        setIsEditBankOpen(false);
        setSelectedBank(null);
      }
    } catch (error) {
      console.error("Failed to update bank:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBank = async (bankId: string) => {
    try {
      setBanks(prev => prev.filter(b => b.id !== bankId));
      const res = await fetch(`/api/accounting/banks/${bankId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        fetchBanks();
        console.error("Failed to delete bank");
      }
    } catch (error) {
      console.error("Failed to delete bank:", error);
      fetchBanks();
    }
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounting/invoices", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...newInvoice,
          amount: parseFloat(newInvoice.amount) || 0
        }),
      });
      if (res.ok) {
        const addedInvoice = await res.json();
        setInvoices(prev => [...prev, addedInvoice]);
        setIsNewInvoiceOpen(false);
        setNewInvoice({
          customerName: "",
          amount: "",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "draft"
        });
      }
    } catch (error) {
      console.error("Failed to add invoice:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/accounting/invoices/${selectedInvoice.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          customerName: selectedInvoice.customer_name,
          amount: parseFloat(selectedInvoice.amount.toString()) || 0,
          dueDate: selectedInvoice.due_date,
          status: selectedInvoice.status
        }),
      });
      if (res.ok) {
        const updatedInvoice = await res.json();
        setInvoices(prev => prev.map(i => i.id === updatedInvoice.id ? updatedInvoice : i));
        setIsEditInvoiceOpen(false);
        setSelectedInvoice(null);
      }
    } catch (error) {
      console.error("Failed to update invoice:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      // Optimistic update
      setInvoices(prev => prev.filter(i => i.id !== invoiceId));

      const res = await fetch(`/api/accounting/invoices/${invoiceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        // Revert if failed
        fetchInvoices();
        console.error("Failed to delete invoice");
      }
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      fetchInvoices();
    }
  };

  const openEditDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditInvoiceOpen(true);
  };

  const statusColors: Record<string, string> = {
    draft: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    sent: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    overdue: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Accounting</h1>
          <p className="text-muted-foreground font-medium">Manage invoices, expenses, and financial health.</p>
        </div>
        <div className="flex items-center gap-3">
          <BulkImportButton 
            endpoint="/api/accounting/invoices/bulk"
            onSuccess={fetchInvoices}
            mapping={{
              "Customer": "customerName",
              "Amount": "amount",
              "Status": "status",
              "Due Date": "dueDate"
            }}
          />
          <Button variant="outline" className="rounded-xl border-border bg-card font-bold">
            <PieChart className="w-4 h-4 mr-2" />
            Financial Reports
          </Button>
          
          <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
            <DialogTrigger render={
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 font-bold">
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            } />
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] bg-card border-border p-0 overflow-hidden shadow-2xl">
              <div className="bg-primary/5 p-8 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-foreground">Create New Invoice</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">Generate a professional invoice for your client.</p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleAddInvoice} className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Customer Name</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input 
                      id="customerName" 
                      placeholder="Acme Corp" 
                      value={newInvoice.customerName}
                      onChange={e => setNewInvoice({...newInvoice, customerName: e.target.value})}
                      required
                      className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Invoice Amount ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input 
                      id="amount" 
                      type="number" 
                      placeholder="5000" 
                      value={newInvoice.amount}
                      onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})}
                      required
                      className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Initial Status</Label>
                    <Select 
                      value={newInvoice.status} 
                      onValueChange={v => setNewInvoice({...newInvoice, status: v})}
                    >
                      <SelectTrigger className="rounded-xl border-border bg-muted/30 h-12">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-xl">
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Due Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input 
                        id="dueDate" 
                        type="date" 
                        value={newInvoice.dueDate}
                        onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                        required
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
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate Invoice"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditInvoiceOpen} onOpenChange={setIsEditInvoiceOpen}>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] bg-card border-border p-0 overflow-hidden shadow-2xl">
              <div className="bg-primary/5 p-8 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-foreground">Edit Invoice</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">Update invoice details and status.</p>
                  </div>
                </div>
              </div>
              {selectedInvoice && (
                <form onSubmit={handleEditInvoice} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-customerName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Customer Name</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input 
                        id="edit-customerName" 
                        value={selectedInvoice.customer_name}
                        onChange={e => setSelectedInvoice({...selectedInvoice, customer_name: e.target.value})}
                        required
                        className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-amount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Invoice Amount ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input 
                        id="edit-amount" 
                        type="number" 
                        value={selectedInvoice.amount ?? 0}
                        onChange={e => setSelectedInvoice({...selectedInvoice, amount: parseFloat(e.target.value) || 0})}
                        required
                        className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</Label>
                      <Select 
                        value={selectedInvoice.status ?? "draft"} 
                        onValueChange={v => setSelectedInvoice({...selectedInvoice, status: v})}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-muted/30 h-12">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border rounded-xl">
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-dueDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Due Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input 
                          id="edit-dueDate" 
                          type="date" 
                          value={selectedInvoice.due_date?.split('T')[0] ?? ""}
                          onChange={e => setSelectedInvoice({...selectedInvoice, due_date: e.target.value})}
                          required
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
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border shadow-sm rounded-2xl bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Receivables</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              ${stats.totalReceivables.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across {invoices.filter(i => i.status !== 'paid').length} unpaid invoices</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm rounded-2xl bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Expenses (MTD)</span>
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">${stats.monthlyExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Current month spending</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm rounded-2xl bg-slate-900 dark:bg-slate-800 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">Net Profit</span>
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold">${stats.netProfit.toLocaleString()}</div>
            <p className="text-xs text-slate-400 mt-1">Receivables minus Expenses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl mb-6">
          <TabsTrigger value="invoices" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Invoices
          </TabsTrigger>
          <TabsTrigger value="expenses" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Expenses
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Payments
          </TabsTrigger>
          <TabsTrigger value="banks" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Bank Accounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
            <CardHeader className="border-b border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search invoices, customers..." 
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
              ) : invoices.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">No invoices found</h3>
                  <p className="text-muted-foreground mb-6">Create your first invoice to get started.</p>
                  <Button onClick={() => setIsNewInvoiceOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">Create Invoice</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Due Date</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground/60">
                                <FileText className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-bold text-foreground">{invoice.customer_name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-bold text-foreground">${Number(invoice.amount).toLocaleString()}</span>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[invoice.status]}`}>
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(invoice.due_date).toLocaleDateString()}
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
                                  onClick={() => handlePrintInvoice(invoice)}
                                  className="flex items-center gap-2 cursor-pointer focus:bg-muted"
                                >
                                  <Download className="w-4 h-4 text-emerald-500" />
                                  <span>Generate & Print</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => openEditDialog(invoice)}
                                  className="flex items-center gap-2 cursor-pointer focus:bg-muted"
                                >
                                  <Edit2 className="w-4 h-4 text-blue-500" />
                                  <span>Edit Invoice</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="flex items-center gap-2 cursor-pointer focus:bg-red-500/10 text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete Invoice</span>
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
        </TabsContent>

        <TabsContent value="expenses">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isNewExpenseOpen} onOpenChange={setIsNewExpenseOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-3xl bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Record Expense</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddExpense} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="expDesc">Description</Label>
                      <Input 
                        id="expDesc" 
                        placeholder="Office Supplies" 
                        value={newExpense.description}
                        onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                        required
                        className="rounded-xl border-border bg-muted/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expAmount">Amount ($)</Label>
                        <Input 
                          id="expAmount" 
                          type="number" 
                          placeholder="150" 
                          value={newExpense.amount}
                          onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                          required
                          className="rounded-xl border-border bg-muted/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expCategory">Category</Label>
                        <Select value={newExpense.category} onValueChange={v => setNewExpense({...newExpense, category: v})}>
                          <SelectTrigger className="rounded-xl border-border bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Office">Office</SelectItem>
                            <SelectItem value="Travel">Travel</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Software">Software</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expDate">Date</Label>
                      <Input 
                        id="expDate" 
                        type="date" 
                        value={newExpense.date}
                        onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                        required
                        className="rounded-xl border-border bg-muted/50"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting} className="w-full bg-primary rounded-xl font-bold">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record Expense"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 text-sm font-bold text-foreground">{exp.description}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="rounded-lg bg-muted/50 text-muted-foreground border-none">
                              {exp.category}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm font-bold text-red-500">-${Number(exp.amount).toLocaleString()}</td>
                          <td className="p-4 text-sm text-muted-foreground">{new Date(exp.date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isNewPaymentOpen} onOpenChange={setIsNewPaymentOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-3xl bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Record Payment</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddPayment} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="payInvoice">Invoice</Label>
                      <Select value={newPayment.invoiceId} onValueChange={v => setNewPayment({...newPayment, invoiceId: v})}>
                        <SelectTrigger className="rounded-xl border-border bg-muted/50">
                          <SelectValue placeholder="Select Invoice" />
                        </SelectTrigger>
                        <SelectContent>
                          {invoices.filter(i => i.status !== 'paid').map(inv => (
                            <SelectItem key={inv.id} value={inv.id}>
                              {inv.customer_name} - ${Number(inv.amount).toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="payAmount">Amount ($)</Label>
                        <Input 
                          id="payAmount" 
                          type="number" 
                          placeholder="1000" 
                          value={newPayment.amount}
                          onChange={e => setNewPayment({...newPayment, amount: e.target.value})}
                          required
                          className="rounded-xl border-border bg-muted/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payMethod">Method</Label>
                        <Select value={newPayment.paymentMethod} onValueChange={v => setNewPayment({...newPayment, paymentMethod: v})}>
                          <SelectTrigger className="rounded-xl border-border bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Credit Card">Credit Card</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Check">Check</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payDate">Date</Label>
                      <Input 
                        id="payDate" 
                        type="date" 
                        value={newPayment.paymentDate}
                        onChange={e => setNewPayment({...newPayment, paymentDate: e.target.value})}
                        required
                        className="rounded-xl border-border bg-muted/50"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting} className="w-full bg-primary rounded-xl font-bold">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record Payment"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Method</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {payments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 text-sm font-bold text-foreground">{pay.customer_name || "Direct Payment"}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="rounded-lg bg-emerald-500/10 text-emerald-500 border-none">
                              {pay.payment_method}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm font-bold text-emerald-500">+${Number(pay.amount).toLocaleString()}</td>
                          <td className="p-4 text-sm text-muted-foreground">{new Date(pay.payment_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="banks">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isNewBankOpen} onOpenChange={setIsNewBankOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Bank Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-3xl bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Add Bank Account</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddBank} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input 
                        id="bankName" 
                        placeholder="Chase Bank" 
                        value={newBank.bankName}
                        onChange={e => setNewBank({...newBank, bankName: e.target.value})}
                        required
                        className="rounded-xl border-border bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountName">Account Name</Label>
                      <Input 
                        id="accountName" 
                        placeholder="Business Checking" 
                        value={newBank.accountName}
                        onChange={e => setNewBank({...newBank, accountName: e.target.value})}
                        required
                        className="rounded-xl border-border bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input 
                        id="accountNumber" 
                        placeholder="**** 1234" 
                        value={newBank.accountNumber}
                        onChange={e => setNewBank({...newBank, accountNumber: e.target.value})}
                        required
                        className="rounded-xl border-border bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankBalance">Initial Balance ($)</Label>
                      <Input 
                        id="bankBalance" 
                        type="number" 
                        placeholder="25000" 
                        value={newBank.balance}
                        onChange={e => setNewBank({...newBank, balance: e.target.value})}
                        required
                        className="rounded-xl border-border bg-muted/50"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting} className="w-full bg-primary rounded-xl font-bold">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Account"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Bank / Account</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Account Number</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Balance</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {banks.map((bank) => (
                        <tr key={bank.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Building className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-foreground">{bank.bank_name}</span>
                                <span className="text-xs text-muted-foreground">{bank.account_name}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Hash className="w-4 h-4 opacity-50" />
                              {bank.account_number}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-bold text-foreground">${Number(bank.balance).toLocaleString()}</span>
                          </td>
                          <td className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-lg">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border rounded-xl shadow-xl">
                                <DropdownMenuItem onClick={() => { setSelectedBank(bank); setIsEditBankOpen(true); }} className="flex items-center gap-2 cursor-pointer">
                                  <Edit2 className="w-4 h-4 text-blue-500" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteBank(bank.id)} className="flex items-center gap-2 cursor-pointer text-red-500">
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
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
          </div>

          <Dialog open={isEditBankOpen} onOpenChange={setIsEditBankOpen}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Edit Bank Account</DialogTitle>
              </DialogHeader>
              {selectedBank && (
                <form onSubmit={handleEditBank} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-bankName">Bank Name</Label>
                    <Input 
                      id="edit-bankName" 
                      value={selectedBank.bank_name}
                      onChange={e => setSelectedBank({...selectedBank, bank_name: e.target.value})}
                      required
                      className="rounded-xl border-border bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-accountName">Account Name</Label>
                    <Input 
                      id="edit-accountName" 
                      value={selectedBank.account_name}
                      onChange={e => setSelectedBank({...selectedBank, account_name: e.target.value})}
                      required
                      className="rounded-xl border-border bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-accountNumber">Account Number</Label>
                    <Input 
                      id="edit-accountNumber" 
                      value={selectedBank.account_number}
                      onChange={e => setSelectedBank({...selectedBank, account_number: e.target.value})}
                      required
                      className="rounded-xl border-border bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-bankBalance">Balance ($)</Label>
                    <Input 
                      id="edit-bankBalance" 
                      type="number" 
                      value={selectedBank.balance}
                      onChange={e => setSelectedBank({...selectedBank, balance: parseFloat(e.target.value) || 0})}
                      required
                      className="rounded-xl border-border bg-muted/50"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={submitting} className="w-full bg-primary rounded-xl font-bold">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
