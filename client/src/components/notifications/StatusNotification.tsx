import { useState, useEffect } from "react";
import { BotStatus } from "@/lib/types";

interface StatusNotificationProps {
  botStatus: BotStatus;
  onClose: () => void;
}

export default function StatusNotification({ botStatus, onClose }: StatusNotificationProps) {
  const [visible, setVisible] = useState(true);
  
  // Add exit animation
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match transition duration
  };

  // Auto-hide after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-success text-success-foreground bg-opacity-90 px-4 py-3 rounded-lg shadow-lg flex items-center transition-all duration-300 ease-in-out transform">
      <span className="material-icons mr-2">smart_toy</span>
      <div>
        <div className="font-medium">Bot Active</div>
        <div className="text-xs">
          Running {botStatus.strategy?.type || 'unknown'} strategy
        </div>
      </div>
      <button 
        className="ml-4 text-success-foreground opacity-80 hover:opacity-100"
        onClick={handleClose}
      >
        <span className="material-icons">close</span>
      </button>
    </div>
  );
}
