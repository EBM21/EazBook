import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  User,
  Package, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  Calendar,
  Rocket,
  ChevronRight,
  Menu,
  Sparkles,
  Briefcase,
  FileText,
  BarChart3,
  ListTodo,
  CreditCard,
  X,
  Sun,
  Moon,
  MessageSquare,
  ChevronLeft
} from "lucide-react";
import { useAuth } from "@/src/lib/auth";
import { useTheme } from "@/src/lib/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import NotificationCenter from "@/src/components/NotificationCenter";
import { motion, AnimatePresence } from "motion/react";

export default function ERPDashboardLayout() {
  const { user, tenant, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const menuItems = [
    { title: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, path: "/erp/dashboard" },
    { title: "CRM", icon: <Users className="w-5 h-5" />, path: "/erp/crm", badge: "AI", department: "Sales" },
    { title: "Messages", icon: <MessageSquare className="w-5 h-5" />, path: "/erp/messages" },
    { title: "HR", icon: <Briefcase className="w-5 h-5" />, path: "/erp/hr", department: "HR" },
    { title: "Inventory", icon: <Package className="w-5 h-5" />, path: "/erp/inventory", department: "IT" },
    { title: "Accounting", icon: <FileText className="w-5 h-5" />, path: "/erp/accounting", department: "Finance" },
    { title: "Projects", icon: <ListTodo className="w-5 h-5" />, path: "/erp/projects" },
    { title: "Analytics", icon: <BarChart3 className="w-5 h-5" />, path: "/erp/analytics", badge: "PRO" },
    { title: "Users", icon: <Users className="w-5 h-5" />, path: "/erp/users", role: "Admin" },
    { title: "Billing", icon: <CreditCard className="w-5 h-5" />, path: "/erp/billing", role: "Admin" },
    { title: "Profile", icon: <User className="w-5 h-5" />, path: "/erp/profile" },
    { title: "Settings", icon: <Settings className="w-5 h-5" />, path: "/erp/settings" },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (user?.role === "Admin") return true;
    if (item.role && item.role !== user?.role) return false;
    if (item.department && item.department !== user?.department) return false;
    return true;
  });

  const calculateTrialDays = () => {
    if (!tenant?.trial_ends_at) return 0;
    const end = new Date(tenant.trial_ends_at);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const trialDays = calculateTrialDays();

  const handleUpgrade = () => {
    window.location.href = "/erp/billing";
  };

  return (
    <SidebarProvider>
      <TooltipProvider delay={0}>
        <div className="flex min-h-screen w-full bg-background text-foreground transition-colors duration-300">
        {/* Desktop Sidebar */}
        <Sidebar collapsible="icon" className="border-r border-border bg-card transition-all duration-300">
          <SidebarHeader className="p-4 md:p-6 group-data-[state=collapsed]:p-2 transition-all duration-300">
            <div className="flex items-center gap-3 px-2 group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:justify-center overflow-hidden">
              <div className="w-10 h-10 group-data-[state=collapsed]:w-8 group-data-[state=collapsed]:h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 shrink-0 transition-all duration-300">
                <Rocket className="w-6 h-6 group-data-[state=collapsed]:w-5 group-data-[state=collapsed]:h-5" />
              </div>
              <div className="flex flex-col min-w-0 transition-opacity duration-300 group-data-[state=collapsed]:hidden">
                <span className="text-sm font-bold truncate">{tenant?.name}</span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Eazbook Enterprise</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 md:px-4 py-2">
            <SidebarMenu className="space-y-1">
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    render={<Link to={item.path} />}
                    isActive={location.pathname === item.path}
                    tooltip={item.title}
                    className={`rounded-xl px-4 py-6 transition-all duration-200 group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:justify-center ${
                      location.pathname === item.path 
                        ? "bg-primary/10 text-primary shadow-sm" 
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <div className={`shrink-0 ${location.pathname === item.path ? "text-primary" : "text-muted-foreground/60"}`}>
                      {item.icon}
                    </div>
                    <span className="font-bold text-sm flex-1 transition-opacity duration-300 group-data-[state=collapsed]:hidden">{item.title}</span>
                    {item.badge && (
                      <Badge className={`ml-auto text-[8px] font-bold px-1.5 py-0 border-none transition-opacity duration-300 group-data-[state=collapsed]:hidden ${
                        item.badge === "AI" ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white"
                      }`}>
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 md:p-6 mt-auto border-t border-border overflow-hidden">
            <div className="bg-muted rounded-2xl p-4 mb-6 relative overflow-hidden group border border-border transition-all duration-300 group-data-[state=collapsed]:p-2 group-data-[state=collapsed]:mb-2">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity group-data-[state=collapsed]:hidden">
                <Sparkles className="w-8 h-8 text-foreground" />
              </div>
              <div className="flex items-center justify-between mb-2 group-data-[state=collapsed]:hidden">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Trial Status</span>
                <Badge variant="outline" className="text-[8px] border-primary/30 text-primary bg-primary/10 px-1.5 py-0">{trialDays}d left</Badge>
              </div>
              <div className="w-full bg-background h-1.5 rounded-full overflow-hidden border border-border group-data-[state=collapsed]:hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${(trialDays / 90) * 100}%` }}
                ></div>
              </div>
              <Button 
                onClick={handleUpgrade}
                size="sm" 
                className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 rounded-lg font-bold group-data-[state=collapsed]:mt-0 group-data-[state=collapsed]:p-0 group-data-[state=collapsed]:h-8"
              >
                <span className="group-data-[state=collapsed]:hidden">Upgrade Now</span>
                <Rocket className="w-4 h-4 hidden group-data-[state=collapsed]:block" />
              </Button>
            </div>

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={logout}
                  className="rounded-xl px-4 py-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:justify-center"
                >
                  <LogOut className="w-5 h-5 mr-3 group-data-[state=collapsed]:mr-0" />
                  <span className="font-bold text-sm transition-opacity duration-300 group-data-[state=collapsed]:hidden">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-background">
          {/* Top Navbar */}
          <header className="h-16 md:h-20 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hidden md:flex text-muted-foreground hover:text-foreground" />
              <div className="md:hidden flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-md">
                  <Rocket className="w-5 h-5" />
                </div>
                <span className="font-bold truncate max-w-[120px]">{tenant?.name}</span>
              </div>
              <div className="hidden lg:flex relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search anything..." 
                  className="pl-10 h-10 rounded-xl border-border bg-muted/50 focus:bg-background transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-xl border border-primary/20">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">AI Active</span>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-xl text-muted-foreground hover:text-foreground"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              <NotificationCenter />
              
              <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block"></div>
              
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold leading-none">{user?.full_name || user?.fullName}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{user?.role}</span>
                </div>
                <Avatar className="h-9 w-9 md:h-10 md:w-10 rounded-xl border-2 border-background shadow-sm ring-1 ring-border">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {(user?.full_name || user?.fullName)?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 md:p-8 overflow-x-hidden relative">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>

            {/* Back to Top Button */}
            <AnimatePresence>
              {showBackToTop && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={scrollToTop}
                  className="fixed bottom-20 md:bottom-8 right-8 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center z-40 hover:scale-110 transition-transform"
                >
                  <ChevronLeft className="w-6 h-6 rotate-90" />
                </motion.button>
              )}
            </AnimatePresence>
          </main>
          
          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border px-6 flex items-center justify-between z-40">
            {filteredMenuItems.slice(0, 4).map((item) => (
              <Link 
                key={item.title} 
                to={item.path}
                className={`flex flex-col items-center gap-1 ${
                  location.pathname === item.path ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-bold">{item.title}</span>
              </Link>
            ))}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center gap-1 text-muted-foreground"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-bold">More</span>
            </button>
          </nav>
          
          {/* Mobile Full Menu Overlay */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="md:hidden fixed inset-0 bg-background z-50 p-6 flex flex-col"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                      <Rocket className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-xl">{tenant?.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl">
                    <X className="w-6 h-6" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto">
                  {filteredMenuItems.map((item) => (
                    <Link 
                      key={item.title} 
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
                        location.pathname === item.path 
                          ? "bg-primary/10 border-primary/20 text-primary" 
                          : "bg-muted/50 border-border text-muted-foreground"
                      }`}
                    >
                      <div className={`${location.pathname === item.path ? "text-primary" : "text-muted-foreground/60"}`}>
                        {item.icon}
                      </div>
                      <span className="font-bold text-sm">{item.title}</span>
                    </Link>
                  ))}
                </div>
                
                <div className="mt-8 pt-8 border-t border-border">
                  <Button 
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:bg-destructive/10 rounded-xl h-12 font-bold"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SidebarInset>
      </div>
    </TooltipProvider>
  </SidebarProvider>
  );
}
