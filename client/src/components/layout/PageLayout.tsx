import React, { useState } from 'react';
import { useLocation } from 'wouter';
import Sidebar from './Sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ChevronLeft, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  backUrl?: string;
  actions?: React.ReactNode;
}

// Mapping delle rotte ai nomi visualizzati nelle breadcrumbs
const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/automazione': 'Automazione Pulsanti',
  '/statistiche': 'Statistiche & Reports',
  '/ai': 'AI Analysis',
  '/impostazioni': 'Impostazioni',
};

export default function PageLayout({ 
  children, 
  title, 
  showBack = false,
  backUrl = '/',
  actions
}: PageLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  
  // Calcola le parti del percorso per le breadcrumbs
  const pathSegments = location === '/' ? [] : location.split('/').filter(Boolean);
  
  // Costruisce i percorsi completi per ogni segmento
  const pathsWithNames = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    return {
      path,
      name: routeNames[path] || segment.charAt(0).toUpperCase() + segment.slice(1)
    };
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      
      <div className="flex-1 min-h-screen flex flex-col relative">
        {/* Header with breadcrumbs */}
        <header className="sticky top-0 z-10 bg-background border-b border-border h-14 px-4 flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
          
          {showBack && (
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href={backUrl}>
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
          )}
          
          <Breadcrumb className="flex-1">
            {pathSegments.length > 0 && <BreadcrumbSeparator />}
            
            {pathsWithNames.map((item, index) => (
              <React.Fragment key={item.path}>
                <BreadcrumbItem 
                  href={item.path}
                  isCurrent={index === pathSegments.length - 1}
                >
                  {item.name}
                </BreadcrumbItem>
                {index < pathSegments.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </Breadcrumb>
          
          {actions && (
            <div className="flex items-center ml-auto space-x-2">
              {actions}
            </div>
          )}
        </header>
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}