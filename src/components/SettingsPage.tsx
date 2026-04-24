import React, { useState } from "react";
import { 
  Settings, 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Globe, 
  Mail, 
  Lock, 
  Save, 
  Plus, 
  Trash2,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/src/lib/auth";

export default function SettingsPage() {
  const { user, tenant, token, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.full_name || user?.fullName || "",
    bio: ""
  });
  const [companyData, setCompanyData] = useState({
    name: tenant?.name || "",
    subdomain: tenant?.subdomain || ""
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ fullName: profileData.fullName })
      });
      if (res.ok) {
        await refreshUser();
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(companyData)
      });
      if (res.ok) {
        await refreshUser();
      }
    } catch (error) {
      console.error("Failed to save company settings:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground font-medium">Manage your account, company profile, and team members.</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl mb-8">
          <TabsTrigger value="profile" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm text-muted-foreground data-[state=active]:text-foreground">
            Profile
          </TabsTrigger>
          <TabsTrigger value="company" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm text-muted-foreground data-[state=active]:text-foreground">
            Company
          </TabsTrigger>
          <TabsTrigger value="team" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm text-muted-foreground data-[state=active]:text-foreground">
            Team
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm text-muted-foreground data-[state=active]:text-foreground">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
            <CardHeader className="border-b border-border bg-muted/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">Personal Information</CardTitle>
                  <CardDescription className="text-muted-foreground">Update your personal details and how others see you.</CardDescription>
                </div>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Profile
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Full Name</label>
                  <Input 
                    value={profileData.fullName} 
                    onChange={e => setProfileData({...profileData, fullName: e.target.value})}
                    className="rounded-xl border-border h-11 bg-muted/50 focus:bg-background" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Email Address</label>
                  <Input defaultValue={user?.email} disabled className="rounded-xl border-border h-11 bg-muted text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Bio</label>
                <textarea 
                  value={profileData.bio}
                  onChange={e => setProfileData({...profileData, bio: e.target.value})}
                  className="w-full min-h-[100px] rounded-xl border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-muted/50 text-foreground placeholder:text-muted-foreground"
                  placeholder="Tell us a bit about yourself..."
                ></textarea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
            <CardHeader className="border-b border-border bg-muted/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">Company Profile</CardTitle>
                  <CardDescription className="text-muted-foreground">Manage your organization's public information and branding.</CardDescription>
                </div>
                {user?.role === "Admin" && (
                  <Button 
                    onClick={handleSaveCompany}
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Company
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Company Name</label>
                  <Input 
                    value={companyData.name} 
                    onChange={e => setCompanyData({...companyData, name: e.target.value})}
                    disabled={user?.role !== "Admin"}
                    className="rounded-xl border-border h-11 bg-muted/50 focus:bg-background" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Subdomain</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={companyData.subdomain} 
                      onChange={e => setCompanyData({...companyData, subdomain: e.target.value})}
                      disabled={user?.role !== "Admin"}
                      className="rounded-xl border-border h-11 bg-muted/50 focus:bg-background" 
                    />
                    <span className="text-muted-foreground font-bold">.eazbook.app</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
            <CardHeader className="border-b border-border bg-muted/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">Team Members</CardTitle>
                  <CardDescription className="text-muted-foreground">Invite and manage your team's access levels.</CardDescription>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Member</th>
                      <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                      <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {user?.full_name?.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">{user?.full_name}</span>
                            <span className="text-xs text-muted-foreground">{user?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="rounded-lg bg-primary/10 text-primary border-primary/20 font-bold uppercase text-[10px]">
                          Admin
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="rounded-lg bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold uppercase text-[10px]">
                          Active
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
