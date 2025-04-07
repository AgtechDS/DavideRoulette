import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
}

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const [location] = useLocation();
  
  const navItems = [
    { href: "/", label: "Dashboard", icon: "dashboard" },
    { href: "/automazione", label: "Automazione Pulsanti", icon: "touch_app" },
    { href: "/statistiche", label: "Statistiche & Reports", icon: "bar_chart" },
    { href: "/ai", label: "AI Analysis", icon: "psychology" },
    { href: "/impostazioni", label: "Impostazioni", icon: "settings" },
  ];
  
  const savedStrategies = [
    { id: "martingala", name: "Martingala Basic" },
    { id: "fibonacci", name: "Fibonacci Sequence" },
    { id: "custom1", name: "Custom Strategy #1" },
  ];

  return (
    <>
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar border-r border-sidebar-border w-64 flex flex-col fixed inset-y-0 z-50 md:relative transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 flex items-center border-b border-sidebar-border">
          <div className="bg-primary rounded-full w-10 h-10 flex items-center justify-center mr-3">
            <span className="material-icons text-primary-foreground">casino</span>
          </div>
          <h1 className="text-lg font-medium text-sidebar-foreground">Davide Roulette</h1>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 text-sidebar-foreground hover:text-sidebar-foreground transition-colors",
                      location === item.href 
                        ? "text-sidebar-primary" 
                        : "text-sidebar-foreground/70"
                    )}
                  >
                    <span className="material-icons mr-3">{item.icon}</span>
                    {item.label}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
          
          {/* Strategy Presets Section */}
          <div className="px-4 pt-6 pb-2">
            <h2 className="text-xs uppercase tracking-wide text-sidebar-foreground/50 font-medium">
              Saved Strategies
            </h2>
          </div>
          <ul>
            {savedStrategies.map((strategy) => (
              <li key={strategy.id}>
                <a 
                  href="#"
                  className="flex items-center px-4 py-2 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    // Would load strategy in a real app
                  }}
                >
                  <span className="material-icons text-sm mr-3">bookmark</span>
                  {strategy.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User Profile Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center mr-2">
              <span className="material-icons text-sm text-sidebar-accent-foreground">person</span>
            </div>
            <div className="text-sidebar-foreground">Davide</div>
            <button className="ml-auto text-sidebar-foreground/50 hover:text-sidebar-foreground">
              <span className="material-icons text-sm">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
