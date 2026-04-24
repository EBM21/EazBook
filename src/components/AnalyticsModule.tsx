import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  Calendar,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/src/lib/auth";

const COLORS = ["#4f46e5", "#8b5cf6", "#ec4899", "#f43f5e"];

export default function AnalyticsModule() {
  const [data, setData] = useState<{ revenueData: any[], leadSourceData: any[] }>({
    revenueData: [],
    leadSourceData: []
  });
  const [insights, setInsights] = useState({ insight: "", growth: "" });
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchAnalytics();
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await fetch("/api/analytics/insights", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setInsights(result);
      }
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics/data", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI-Driven Analytics</h1>
          <p className="text-muted-foreground font-medium">Predictive insights and real-time business intelligence.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-border bg-card font-bold">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 font-bold">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate AI Report
          </Button>
        </div>
      </div>

      {/* AI Insight Banner */}
      <div className="bg-primary rounded-3xl p-8 text-primary-foreground relative overflow-hidden shadow-2xl shadow-primary/20">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-32 h-32 text-current" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-primary-foreground/20 text-primary-foreground border-none px-2 py-0.5 text-[10px] font-bold uppercase">AI Prediction</Badge>
            <span className="text-xs font-medium opacity-80">Updated 2h ago</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Projected Revenue Growth: {insights.growth}</h2>
          <p className="opacity-90 text-lg max-w-3xl leading-relaxed">
            {insights.insight}
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue vs Expenses */}
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">Revenue vs Expenses</CardTitle>
                <CardDescription className="text-muted-foreground">Monthly financial performance</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Revenue</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-muted-foreground/30 rounded-full"></div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Expenses</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--muted-foreground)/0.3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="text-lg font-bold text-foreground">Lead Sources</CardTitle>
            <CardDescription className="text-muted-foreground">Distribution of incoming opportunities</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.leadSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.leadSourceData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "12px", border: "1px solid hsl(var(--border))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-4 ml-8">
                {data.leadSourceData.map((entry: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">{entry.name}</span>
                      <span className="text-[10px] text-muted-foreground">{entry.value} Leads</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Customer Lifetime Value", value: "$4,250", change: "+12%", trend: "up", icon: <Target className="w-5 h-5 text-primary" /> },
          { title: "Churn Rate Prediction", value: "2.4%", change: "-0.8%", trend: "down", icon: <TrendingDown className="w-5 h-5 text-red-500" /> },
          { title: "Operational Efficiency", value: "92%", change: "+5%", trend: "up", icon: <Zap className="w-5 h-5 text-amber-500" /> },
        ].map((metric, i) => (
          <Card key={i} className="border-border shadow-sm rounded-2xl bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-muted rounded-xl">{metric.icon}</div>
                <div className={`flex items-center text-xs font-bold ${metric.trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
                  {metric.trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {metric.change}
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">{metric.title}</h3>
              <div className="text-2xl font-bold text-foreground">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
