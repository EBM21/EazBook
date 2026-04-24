import React, { useState } from "react";
import { 
  User, 
  Mail, 
  Shield, 
  Building2, 
  Lock, 
  Save, 
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/src/lib/auth";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { user, token, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || user?.fullName || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    setSubmitting(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ fullName, password }),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        setSuccess(true);
        setPassword("");
        setConfirmPassword("");
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Personal Profile</h1>
        <p className="text-muted-foreground font-medium">Manage your account details and security settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="md:col-span-1 border-border shadow-sm rounded-2xl overflow-hidden h-fit bg-card">
          <CardContent className="pt-8 text-center">
            <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg shadow-primary/20 mx-auto mb-4">
              {(user?.full_name || user?.fullName)?.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-foreground">{user?.full_name || user?.fullName}</h2>
            <p className="text-sm text-muted-foreground mb-6">{user?.email}</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                  <Shield className="w-3.5 h-3.5" />
                  Role
                </div>
                <Badge className="bg-primary text-primary-foreground border-none text-[10px] px-2 py-0.5">
                  {user?.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                  <Building2 className="w-3.5 h-3.5" />
                  Dept
                </div>
                <Badge variant="outline" className="text-foreground border-border text-[10px] px-2 py-0.5">
                  {user?.department}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2 border-border shadow-sm rounded-2xl overflow-hidden bg-card">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="text-lg font-bold text-foreground">Account Settings</CardTitle>
            <CardDescription className="text-muted-foreground">Update your personal information and password.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="fullName" 
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="pl-10 rounded-xl border-border bg-muted/50 focus:bg-background"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        value={user?.email}
                        disabled
                        className="pl-10 rounded-xl bg-muted text-muted-foreground cursor-not-allowed border-border"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border my-6"></div>
                
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Change Password
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Leave blank to keep current"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="rounded-xl border-border bg-muted/50 focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="Leave blank to keep current"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="rounded-xl border-border bg-muted/50 focus:bg-background"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                {success && (
                  <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Profile updated successfully!
                  </div>
                )}
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold px-8"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
