
"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardList, LogIn, LogOut, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function GuardView() {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500 max-w-2xl mx-auto">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Duty Management
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button size="lg" className="h-24 flex flex-col gap-2 text-lg">
            <LogIn className="h-6 w-6" />
            Clock In
          </Button>
          <Button size="lg" variant="outline" className="h-24 flex flex-col gap-2 text-lg border-destructive text-destructive hover:bg-destructive/10">
            <LogOut className="h-6 w-6" />
            Clock Out
          </Button>
          <Button size="lg" variant="secondary" className="h-24 flex flex-col gap-2 text-lg sm:col-span-2">
            <Camera className="h-6 w-6" />
            Incident Report
          </Button>
        </CardContent>
      </Card>

      <div className="dashboard-card text-center">
        <p className="text-sm text-muted-foreground mb-1 font-medium uppercase tracking-wider">Current Post</p>
        <h2 className="text-2xl font-bold text-primary">North Sector Entrance</h2>
        <p className="text-xs text-muted-foreground mt-2 font-mono">CODE: PRJ-NSE-001</p>
      </div>
    </div>
  );
}
