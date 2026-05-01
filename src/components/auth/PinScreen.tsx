
"use client"

import React, { useState } from 'react';
import { Shield, Delete, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Role = 'Admin' | 'Supervisor' | 'Guard';

interface PinScreenProps {
  onAuthenticated: (role: Role) => void;
}

const PIN_CONFIG = {
  '1234': 'Admin' as Role,
  '5678': 'Supervisor' as Role,
  '0000': 'Guard' as Role,
};

export function PinScreen({ onAuthenticated }: PinScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (val: string) => {
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 4) {
        if (PIN_CONFIG[newPin as keyof typeof PIN_CONFIG]) {
          onAuthenticated(PIN_CONFIG[newPin as keyof typeof PIN_CONFIG]);
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm flex flex-col items-center space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-4 bg-primary/10 rounded-full border border-primary/20 mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-center">PACSA OPS CONSOLE</h1>
          <p className="text-muted-foreground text-sm">Enter access PIN to continue</p>
        </div>

        <div className="flex space-x-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > i 
                  ? 'bg-primary border-primary scale-110' 
                  : error ? 'border-destructive bg-destructive/20' : 'border-muted bg-muted/20'
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleKeyPress(n.toString())}
              className="pin-button"
            >
              {n}
            </button>
          ))}
          <div />
          <button onClick={() => handleKeyPress('0')} className="pin-button">0</button>
          <button onClick={handleBackspace} className="pin-button border-none bg-transparent hover:bg-transparent">
            <Delete className="h-6 w-6 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
