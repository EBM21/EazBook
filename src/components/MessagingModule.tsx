import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Search, 
  User, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Loader2,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/src/lib/auth";

export default function MessagingModule() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    fetchUsers();
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.filter((u: any) => u.id !== user?.id));
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Only update if data has changed to avoid unnecessary re-renders
        setMessages(prevMessages => {
          if (JSON.stringify(prevMessages) !== JSON.stringify(data)) {
            return data;
          }
          return prevMessages;
        });
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || sending) return;

    const content = newMessage;
    setNewMessage("");
    
    // Optimistic update
    const tempId = Date.now();
    const optimisticMessage = {
      id: tempId,
      sender_id: user?.id,
      receiver_id: selectedUser.id,
      content: content,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: content
        })
      });

      if (res.ok) {
        fetchMessages();
      } else {
        // Revert on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
        console.error("Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chatMessages = messages.filter(m => 
    (m.sender_id === user?.id && m.receiver_id === selectedUser?.id) ||
    (m.sender_id === selectedUser?.id && m.receiver_id === user?.id)
  );

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6">
      {/* Sidebar: User List */}
      <Card className="w-80 border-border shadow-sm rounded-2xl overflow-hidden flex flex-col bg-card">
        <CardHeader className="p-4 border-b border-border">
          <CardTitle className="text-lg font-bold">Messages</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search employees..." 
              className="pl-10 h-10 rounded-xl border-border bg-muted/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${
                    selectedUser?.id === u.id ? "bg-primary/5 border-l-4 border-primary" : ""
                  }`}
                >
                  <Avatar className="h-10 w-10 rounded-xl border border-border">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {u.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-sm truncate text-foreground">{u.full_name}</span>
                      <span className="text-[10px] text-muted-foreground">12:45 PM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">{u.department}</p>
                      <Badge variant="outline" className="text-[8px] bg-primary/10 text-primary border-primary/20">Online</Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No employees found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex-1 border-border shadow-sm rounded-2xl overflow-hidden flex flex-col bg-card">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-xl border border-border">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.email}`} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {selectedUser.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-foreground leading-none">{selectedUser.full_name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{selectedUser.department} • Active Now</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground"><Phone className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground"><Video className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground"><Info className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground"><MoreVertical className="w-4 h-4" /></Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/10">
              {chatMessages.length > 0 ? (
                chatMessages.map((msg, i) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] flex flex-col ${msg.sender_id === user?.id ? "items-end" : "items-start"}`}>
                      <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                        msg.sender_id === user?.id 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-background border border-border text-foreground rounded-tl-none"
                      }`}>
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sender_id === user?.id && <CheckCheck className="w-3 h-3 text-primary" />}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-bold text-foreground">No messages yet</h4>
                  <p className="text-sm text-muted-foreground max-w-[200px]">Start a conversation with {selectedUser.full_name}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-border bg-background">
              <form onSubmit={sendMessage} className="flex items-center gap-3">
                <Button type="button" variant="ghost" size="icon" className="rounded-xl text-muted-foreground"><Paperclip className="w-4 h-4" /></Button>
                <div className="relative flex-1">
                  <Input 
                    placeholder="Type a message..." 
                    className="h-12 rounded-xl border-border bg-muted/50 focus:bg-background pr-10"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg text-muted-foreground"><Smile className="w-4 h-4" /></Button>
                </div>
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || sending}
                  className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 p-0"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Select a conversation</h3>
            <p className="text-muted-foreground max-w-xs">Choose an employee from the sidebar to start messaging and collaborating in real-time.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
