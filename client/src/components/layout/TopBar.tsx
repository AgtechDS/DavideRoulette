import { BotStatus } from "@/lib/types";

interface TopBarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
  botStatus: BotStatus;
}

export default function TopBar({ mobileMenuOpen, setMobileMenuOpen, botStatus }: TopBarProps) {
  return (
    <header className="bg-card border-b border-border py-3 px-4 flex items-center justify-between">
      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden text-muted-foreground hover:text-foreground"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <span className="material-icons">menu</span>
      </button>
      
      {/* Page Title */}
      <h1 className="text-lg font-medium md:ml-0 ml-4">Dashboard</h1>
      
      {/* Action Buttons */}
      <div className="flex items-center space-x-4">
        {/* Bot Status Indicator */}
        {botStatus.active && (
          <div className="hidden md:flex items-center bg-card px-3 py-1.5 rounded-lg">
            <div className="h-2 w-2 rounded-full bg-success mr-2"></div>
            <span className="text-sm">Bot Active</span>
          </div>
        )}
        
        {/* Settings & Notifications */}
        <button className="text-muted-foreground hover:text-foreground relative">
          <span className="material-icons">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        
        {/* Theme Toggle */}
        <button 
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            document.documentElement.classList.toggle('dark');
            // Would persist this preference in a real app
          }}
        >
          <span className="material-icons">dark_mode</span>
        </button>
      </div>
    </header>
  );
}
