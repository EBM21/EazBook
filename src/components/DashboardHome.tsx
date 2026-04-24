import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Zap,
  Clock,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/src/lib/auth";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from "@/components/ui/dialog";

export default function DashboardHome() {
  const { user, tenant, token } = useAuth();
  const [statsData, setStatsData] = useState({
    revenue: 0,
    leads: 0,
    products: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isAllActivityOpen, setIsAllActivityOpen] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchActivities();
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch("/api/dashboard/recommendations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/activity-logs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.slice(0, 10));
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    }
  };

  const scrollToActivity = () => {
    const element = document.getElementById("recent-activity");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  };

  const stats = [
    { title: "Total Revenue", value: `$${statsData.revenue.toLocaleString()}`, change: "+12.5%", trend: "up", icon: <DollarSign className="w-5 h-5 text-emerald-600" /> },
    { title: "Active Leads", value: statsData.leads.toLocaleString(), change: "+5.2%", trend: "up", icon: <Users className="w-5 h-5 text-indigo-600" /> },
    { title: "Inventory Items", value: statsData.products.toLocaleString(), change: "-2.4%", trend: "down", icon: <Package className="w-5 h-5 text-amber-600" /> },
    { title: "Conversion Rate", value: `${statsData.conversionRate}%`, change: "+3.1%", trend: "up", icon: <TrendingUp className="w-5 h-5 text-purple-600" /> },
  ];

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-0">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {(user?.full_name || user?.fullName)?.split(" ")[0]}!
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm md:text-base text-muted-foreground font-medium">Here's what's happening with {tenant?.name} today.</p>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase">
              {user?.role} • {user?.department}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button 
            variant="outline" 
            onClick={scrollToActivity}
            className="rounded-xl border-border bg-card shadow-sm font-bold flex-1 md:flex-none text-xs md:text-sm"
          >
            <Clock className="w-4 h-4 mr-2" />
            Activity Log
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 font-bold flex-1 md:flex-none text-xs md:text-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Insights
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="border-border shadow-sm rounded-2xl h-32 animate-pulse bg-muted/50"></Card>
          ))
        ) : stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-border shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className="p-2 bg-muted rounded-lg">{stat.icon}</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className={`flex items-center mt-1 text-xs font-bold ${stat.trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
                  {stat.trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {stat.change}
                  <span className="text-muted-foreground ml-1 font-normal">vs last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Recommendations */}
        <Card className="lg:col-span-2 border-border shadow-sm rounded-2xl overflow-hidden bg-card">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>Intelligent actions based on your business data</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary font-bold">View All</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recommendations.map((rec, i) => (
                <div key={i} className="p-6 hover:bg-muted/30 transition-colors flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-foreground">{rec.title}</h4>
                      <Badge variant="outline" className={`text-[10px] ${
                        rec.priority === "Critical" ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                        rec.priority === "High" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                        "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      }`}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{rec.desc}</p>
                    <div className="flex items-center gap-4">
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 rounded-lg text-xs">Execute Action</Button>
                      <span className="text-xs text-muted-foreground font-medium">{rec.type} Module</span>
                    </div>
                  </div>
                </div>
              ))}
              {recommendations.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">No recommendations at this time.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card id="recent-activity" className="border-border shadow-sm rounded-2xl overflow-hidden bg-card scroll-mt-24">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
            <CardDescription>Latest updates from your team</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {activities.length > 0 ? activities.map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {activity.user_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground leading-tight">
                      <span className="font-bold text-foreground">{activity.user_name}</span> {activity.action} <span className="font-bold text-primary">{activity.target}</span>
                    </p>
                    <span className="text-[10px] text-muted-foreground font-medium">{formatTime(activity.created_at)}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsAllActivityOpen(true)}
              className="w-full mt-6 rounded-xl border-border text-muted-foreground font-bold text-sm"
            >
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* All Activity Dialog */}
      <Dialog open={isAllActivityOpen} onOpenChange={setIsAllActivityOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col rounded-3xl bg-card border-border">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-xl font-bold">Activity Log</DialogTitle>
            <DialogDescription>Complete history of actions within your organization.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activities.map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                  {activity.user_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground leading-tight">
                    <span className="font-bold text-foreground">{activity.user_name}</span> {activity.action} <span className="font-bold text-primary">{activity.target}</span>
                  </p>
                  <span className="text-xs text-muted-foreground font-medium mt-1 block">{formatTime(activity.created_at)} • {new Date(activity.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
