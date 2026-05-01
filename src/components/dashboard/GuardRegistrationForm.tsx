
"use client"

import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  code: string;
}

export function GuardRegistrationForm() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    projectId: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProjects() {
      const querySnapshot = await getDocs(collection(db, 'projects'));
      const projectList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        code: doc.data().code
      })) as Project[];
      setProjects(projectList);
    }
    fetchProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.projectId) {
      toast({
        title: "Missing Information",
        description: "Please fill in guard name and select a project.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'guards'), {
        ...formData,
        registeredAt: serverTimestamp(),
        status: 'Active'
      });
      
      toast({
        title: "Registration Successful",
        description: `${formData.name} has been registered successfully.`
      });
      
      setFormData({ name: '', phone: '', projectId: '' });
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not register guard. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-primary" />
        New Guard Registration
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input 
            id="name" 
            placeholder="John Doe" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="bg-muted/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input 
            id="phone" 
            placeholder="+1 (555) 000-0000" 
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="bg-muted/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project">Assigned Project</Label>
          <Select 
            value={formData.projectId} 
            onValueChange={(val) => setFormData({...formData, projectId: val})}
          >
            <SelectTrigger id="project" className="bg-muted/50">
              <SelectValue placeholder="Select active project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Register Guard"}
        </Button>
      </form>
    </div>
  );
}
