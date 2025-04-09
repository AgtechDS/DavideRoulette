import { useState, useEffect } from "react";
import { BotStatus } from "@/lib/types";
import { PlayCircle, X } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface StatusNotificationProps {
  botStatus: BotStatus;
  onClose: () => void;
}

export default function StatusNotification({ botStatus, onClose }: StatusNotificationProps) {
  const [visible, setVisible] = useState(true);
  const { botStatus: wsStatus, sendCommand } = useWebSocket();
  
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

  // Stop the bot
  const stopBot = () => {
    // Try both methods to stop the bot
    sendCommand('stop');
    handleClose();
  };

  if (!visible) return null;

  // Determine status from WebSocket if available
  const displayStatus = wsStatus && wsStatus.active ? wsStatus : botStatus;

  return (
    <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center transition-all duration-300 ease-in-out transform">
      <PlayCircle className="h-5 w-5 mr-2" />
      <div>
        <div className="font-medium">Bot Attivo</div>
        <div className="text-xs">
          {wsStatus && wsStatus.sessions && wsStatus.sessions.length > 0 
            ? `${wsStatus.sessions.length} ${wsStatus.sessions.length === 1 ? 'sessione attiva' : 'sessioni attive'}`
            : `Strategia: ${displayStatus.strategy?.type || 'sconosciuta'}`
          }
        </div>
      </div>
      <button 
        className="ml-4 text-white opacity-80 hover:opacity-100"
        onClick={stopBot}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
