import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/src/lib/ThemeContext";
import { 
  Rocket, 
  Users, 
  Package, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  CheckCircle2,
  Moon,
  Sun,
  Menu,
  X,
  Sparkles,
  Globe,
  Cpu,
  Layers,
  MessageSquare
} from "lucide-react";

const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
  <a 
    href={href} 
    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
  >
    {children}
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
  </a>
);

const FeatureCard = ({ icon: Icon, title, description, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -8, transition: { duration: 0.2 } }}
    className="relative group"
  >
    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-indigo-500/50 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
    <div className="relative bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all h-full flex flex-col">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed flex-grow">{description}</p>
    </div>
  </motion.div>
);

const PricingCard = ({ title, price, features, recommended, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`relative p-8 rounded-3xl border ${recommended ? 'border-primary shadow-2xl shadow-primary/10' : 'border-border'} bg-card flex flex-col h-full`}
  >
    {recommended && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
        Most Popular
      </div>
    )}
    <div className="mb-8">
      <h3 className="text-lg font-bold text-muted-foreground mb-2">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-foreground">${price}</span>
        <span className="text-muted-foreground">/mo</span>
      </div>
    </div>
    <ul className="space-y-4 mb-8 flex-grow">
      {features.map((feature: string, i: number) => (
        <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          {feature}
        </li>
      ))}
    </ul>
    <Button 
      variant={recommended ? "default" : "outline"} 
      className={`w-full rounded-xl py-6 font-bold ${recommended ? 'shadow-lg shadow-primary/20' : ''}`}
    >
      Get Started
    </Button>
  </motion.div>
);

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'py-3 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm' : 'py-6 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-300">
                <Rocket className="text-primary-foreground w-6 h-6" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-foreground">Eazbook</span>
            </div>

            <div className="hidden md:flex items-center gap-10">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#about">About</NavLink>
              <NavLink href="#pricing">Pricing</NavLink>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              
              <div className="hidden sm:flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" className="text-sm font-bold rounded-xl px-6">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
                    Start Free Trial
                  </Button>
                </Link>
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden rounded-xl"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background border-b border-border overflow-hidden"
            >
              <div className="px-4 py-8 space-y-6 flex flex-col">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold">Features</a>
                <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold">About</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold">Pricing</a>
                <div className="pt-4 flex flex-col gap-4">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-xl py-6 font-bold">Login</Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full rounded-xl py-6 font-bold">Start Free Trial</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-8 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>The Future of Business Intelligence</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-foreground mb-8 leading-[1.1]">
              The AI-Driven <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-purple-600 animate-gradient">Enterprise Engine</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
              Ditch the legacy bloat. Experience a deeply integrated ERP where AI doesn't just assist—it drives your entire operation from CRM to Accounting.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-8 text-xl rounded-2xl font-black shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                  Start 90-Day Free Trial <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </Link>
              <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-10 h-10 rounded-full border-4 border-background" alt="User" />
                  ))}
                </div>
                <span>Trusted by 2,500+ teams</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
            className="mt-24 relative max-w-6xl mx-auto"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-primary via-indigo-500 to-purple-600 rounded-[2.5rem] blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-card/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden aspect-[16/9] group">
              <img 
                src="https://picsum.photos/seed/ai-dashboard/1920/1080" 
                alt="Eazbook Dashboard" 
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                  <Zap className="w-10 h-10 text-white fill-white" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: "Automation Rate", value: "85%" },
              { label: "Cost Reduction", value: "40%" },
              { label: "User Satisfaction", value: "4.9/5" },
              { label: "Global Reach", value: "120+" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl font-black text-foreground mb-2">{stat.value}</div>
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black text-foreground mb-6"
            >
              Engineered for the <span className="text-primary">Modern Enterprise</span>
            </motion.h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-medium">
              We've rebuilt every module from the ground up with AI at the core. No plugins, no hacks—just pure intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Globe} 
              title="Global CRM" 
              description="Deep lead scoring and automated outreach across 40+ languages. Close deals while you sleep."
              delay={0.1}
            />
            <FeatureCard 
              icon={Cpu} 
              title="Predictive Inventory" 
              description="AI that anticipates supply chain disruptions and optimizes stock levels before you even know there's a problem."
              delay={0.2}
            />
            <FeatureCard 
              icon={Layers} 
              title="Neural Accounting" 
              description="Zero-touch bookkeeping. Transactions are categorized and reconciled instantly with 99.9% accuracy."
              delay={0.3}
            />
            <FeatureCard 
              icon={Users} 
              title="Talent Intelligence" 
              description="Identify top performers and predict churn. Build a high-performance culture with data-driven HR."
              delay={0.4}
            />
            <FeatureCard 
              icon={MessageSquare} 
              title="Conversational BI" 
              description="Ask your data anything. 'What's my burn rate if I hire 10 more engineers?' Get instant, visual answers."
              delay={0.5}
            />
            <FeatureCard 
              icon={ShieldCheck} 
              title="Military-Grade Security" 
              description="Isolated data environments with end-to-end encryption. Your enterprise data is your most valuable asset."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 bg-muted/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Badge className="bg-primary/10 text-primary border-none mb-6">Our Mission</Badge>
                <h2 className="text-4xl md:text-5xl font-black text-foreground mb-8 leading-tight">
                  We're making complex business <span className="text-primary">effortless.</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed font-medium">
                  Founded by a team of AI researchers and enterprise veterans, Eazbook was born out of frustration with legacy systems that were slow, disconnected, and dumb.
                </p>
                <div className="space-y-6">
                  {[
                    "Unified data architecture for all modules",
                    "Real-time AI processing on every transaction",
                    "Beautiful, high-performance user interface",
                    "API-first design for seamless integrations"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="font-bold text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
            <div className="lg:w-1/2 relative">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-3xl"></div>
                <div className="relative bg-card border border-border rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-center gap-4 mb-8">
                    <img src="https://i.pravatar.cc/100?img=32" className="w-16 h-16 rounded-2xl object-cover" alt="CEO" />
                    <div>
                      <div className="font-black text-xl">Sarah Chen</div>
                      <div className="text-sm text-muted-foreground font-bold uppercase tracking-widest">CEO & Founder</div>
                    </div>
                  </div>
                  <p className="text-xl font-medium italic text-foreground leading-relaxed">
                    "Eazbook isn't just another software tool. It's the central nervous system for your company. We've seen teams reclaim 20+ hours a week by letting our AI handle the operational heavy lifting."
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">Simple, Transparent <span className="text-primary">Pricing</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-medium">
              Choose the plan that fits your growth stage. All plans include our core AI engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard 
              title="Starter" 
              price="49" 
              features={[
                "Up to 5 users",
                "Basic AI Insights",
                "CRM & Inventory",
                "Email Support",
                "10GB Storage"
              ]}
              delay={0.1}
            />
            <PricingCard 
              title="Professional" 
              price="149" 
              recommended={true}
              features={[
                "Up to 25 users",
                "Advanced AI Forecasting",
                "All ERP Modules",
                "Priority 24/7 Support",
                "100GB Storage",
                "Custom Integrations"
              ]}
              delay={0.2}
            />
            <PricingCard 
              title="Enterprise" 
              price="499" 
              features={[
                "Unlimited users",
                "Custom AI Model Training",
                "Dedicated Account Manager",
                "On-premise Deployment Option",
                "Unlimited Storage",
                "SLA Guarantees"
              ]}
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-primary rounded-[3rem] p-12 md:p-24 text-center text-primary-foreground relative overflow-hidden shadow-2xl shadow-primary/40"
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-[100px]"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-300 rounded-full translate-x-1/2 translate-y-1/2 blur-[100px]"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tight leading-tight">
                Ready to build the <br />
                <span className="text-indigo-200">future of your business?</span>
              </h2>
              <p className="text-primary-foreground/90 text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-medium">
                Join the elite companies scaling with Eazbook. Your 90-day trial starts today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link to="/signup">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-12 py-10 text-2xl rounded-2xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95">
                    Get Started Now
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="ghost" className="text-white hover:bg-white/10 px-8 py-10 text-xl font-bold rounded-2xl">
                    Talk to Sales
                  </Button>
                </Link>
              </div>
              <div className="mt-12 flex items-center justify-center gap-8 opacity-60 grayscale brightness-200">
                <div className="font-black text-2xl">ACME</div>
                <div className="font-black text-2xl">GLOBEX</div>
                <div className="font-black text-2xl">STARK</div>
                <div className="font-black text-2xl">WAYNE</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-muted-foreground py-24 border-t border-border relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                  <Rocket className="text-primary-foreground w-5 h-5" />
                </div>
                <span className="text-foreground text-xl font-black tracking-tighter">Eazbook</span>
              </div>
              <p className="text-sm leading-relaxed font-medium">
                The central nervous system for modern enterprises. Powered by deep AI integration.
              </p>
            </div>
            <div>
              <h4 className="text-foreground font-black uppercase tracking-widest text-xs mb-6">Product</h4>
              <ul className="space-y-4 text-sm font-bold">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Enterprise</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Solutions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-black uppercase tracking-widest text-xs mb-6">Company</h4>
              <ul className="space-y-4 text-sm font-bold">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-black uppercase tracking-widest text-xs mb-6">Support</h4>
              <ul className="space-y-4 text-sm font-bold">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-sm font-medium">© 2026 Eazbook Inc. All rights reserved.</p>
            <div className="flex gap-8 text-sm font-bold">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
