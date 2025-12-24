import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionError: string | null;
  isConnecting?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  connectionError, 
  isConnecting = false 
}) => {
  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
        <Loader2 size={16} className="animate-spin text-yellow-400" />
        <span className="text-yellow-400 text-sm">Ulanmoqda...</span>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
        <WifiOff size={16} className="text-red-400" />
        <span className="text-red-400 text-sm">Ulanish xatosi</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      isConnected 
        ? 'bg-green-500/20 border border-green-500/30' 
        : 'bg-red-500/20 border border-red-500/30'
    }`}>
      {isConnected ? (
        <>
          <Wifi size={16} className="text-green-400" />
          <span className="text-green-400 text-sm">Ulangan</span>
        </>
      ) : (
        <>
          <WifiOff size={16} className="text-red-400" />
          <span className="text-red-400 text-sm">Ulanmagan</span>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;