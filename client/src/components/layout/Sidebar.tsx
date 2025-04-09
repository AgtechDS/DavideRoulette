import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Dice5, Settings, BarChart, Brain, 
  Activity, X, LayoutDashboard, 
  Sliders, Target
} from 'lucide-react';

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/strategie', label: 'Strategie', icon: <Target className="w-5 h-5" /> },
    { href: '/automazione', label: 'Automazione', icon: <Dice5 className="w-5 h-5" /> },
    { href: '/statistiche', label: 'Statistiche', icon: <BarChart className="w-5 h-5" /> },
    { href: '/ai', label: 'AI Analysis', icon: <Brain className="w-5 h-5" /> },
    { href: '/impostazioni', label: 'Impostazioni', icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen md:z-0 flex flex-col",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Activity className="w-6 h-6 text-primary mr-2" />
            <h1 className="text-xl font-bold">Davide Roulette</h1>
          </Link>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <Button
                    variant={location === item.href ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start text-left",
                      location === item.href ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="bg-card p-3 rounded-md">
            <div className="text-sm font-medium">Demo Version</div>
            <div className="text-xs text-muted-foreground mt-1">
              Connected to PlanetWin365
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}