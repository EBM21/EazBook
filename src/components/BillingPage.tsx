import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Check, 
  Zap, 
  Shield, 
  Clock, 
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/src/lib/auth";

const plans = [
  {
    name: "Starter",
    price: "$49",
    description: "Perfect for small businesses starting their digital journey.",
    features: ["Up to 5 Users", "CRM & Inventory", "Basic Analytics", "Email Support"],
    priceId: "price_starter_mock",
    color: "bg-slate-50 text-slate-600 border-slate-100"
  },
  {
    name: "Professional",
    price: "$149",
    description: "Advanced features for growing companies needing AI insights.",
    features: ["Unlimited Users", "Full ERP Suite", "AI-Driven Analytics", "Priority Support", "Stripe Integration"],
    priceId: "price_pro_mock",
    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Tailored solutions for large-scale operations.",
    features: ["Custom AI Training", "Dedicated Account Manager", "SLA Guarantees", "On-premise Options"],
    priceId: "price_enterprise_mock",
    color: "bg-slate-900 text-white border-slate-800"
  }
];

export default function BillingPage() {
  const { tenant, token } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [billingInfo, setBillingInfo] = useState<any>(null);

  useEffect(() => {
    fetchBillingInfo();
    fetchTransactions();
  }, []);

  const fetchBillingInfo = async () => {
    try {
      const res = await fetch("/api/billing/info", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setBillingInfo(await res.json());
    } catch (error) {
      console.error("Failed to fetch billing info:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/billing/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setTransactions(await res.json());
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    setLoading(priceId);
    try {
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ priceId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Billing error:", error);
    } finally {
      setLoading(null);
    }
  };

  const trialDaysLeft = tenant ? Math.max(0, Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Subscription & Billing</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage your plan, billing details, and subscription status.
        </p>
      </div>

      {/* Trial Status Banner */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">You are on a Free Trial</h2>
              <p className="text-muted-foreground">Your trial ends in <span className="font-bold text-primary">{trialDaysLeft} days</span>. Upgrade now to keep all premium features.</p>
            </div>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20">
            Upgrade Now
          </Button>
        </CardContent>
      </Card>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={`relative border-border shadow-sm rounded-3xl flex flex-col overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 bg-card ${plan.popular || (billingInfo?.plan_name === plan.name) ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
          >
            {(plan.popular || billingInfo?.plan_name === plan.name) && (
              <div className="absolute top-0 right-0 p-4">
                <Badge className="bg-primary text-primary-foreground border-none px-3 py-1 rounded-full font-bold uppercase text-[10px]">
                  {billingInfo?.plan_name === plan.name ? 'Current Plan' : 'Most Popular'}
                </Badge>
              </div>
            )}
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-2xl font-bold text-foreground">{plan.name}</CardTitle>
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-muted-foreground font-medium">/mo</span>}
              </div>
              <CardDescription className="mt-4 text-muted-foreground leading-relaxed">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-8 flex-1">
              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-8 pt-0">
              <Button 
                onClick={() => handleUpgrade(plan.priceId)}
                disabled={!!loading || billingInfo?.plan_name === plan.name}
                className={`w-full h-12 rounded-xl font-bold transition-all ${
                  plan.name === "Enterprise" 
                    ? "bg-foreground text-background hover:bg-foreground/90" 
                    : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                }`}
              >
                {loading === plan.priceId ? <Loader2 className="w-4 h-4 animate-spin" /> : (billingInfo?.plan_name === plan.name ? "Current Plan" : "Select Plan")}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Transaction History */}
      <Card className="border-border shadow-sm rounded-3xl overflow-hidden bg-card">
        <CardHeader className="p-8 border-b border-border">
          <CardTitle className="text-xl font-bold">Transaction History</CardTitle>
          <CardDescription>Recent payments and invoices for your account.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-bold text-foreground">{tx.description}</td>
                    <td className="p-4 text-sm font-bold text-foreground">${Number(tx.amount).toLocaleString()}</td>
                    <td className="p-4">
                      <Badge variant="outline" className={`rounded-lg ${
                        tx.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">No transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-border">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Secure Payments</h4>
            <p className="text-xs text-muted-foreground">Processed by Stripe with 256-bit encryption.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl">
            <Zap className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Instant Activation</h4>
            <p className="text-xs text-muted-foreground">Get access to premium features immediately.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-2xl">
            <CheckCircle2 className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Cancel Anytime</h4>
            <p className="text-xs text-muted-foreground">No long-term contracts. Flexible monthly plans.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
