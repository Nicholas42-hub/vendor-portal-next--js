import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { validateGraphQLConnection } from '@/utils/graphQL-api-Get';

// Define the type for accessToken - string or undefined
export function useConnectionCheck(accessToken: string | undefined) {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected' | 'unchecked'>('unchecked');
  
  // Use useCallback to memoize the function
  const checkConnection = useCallback(async () => {
    try {
      setConnectionStatus('checking');
      await validateGraphQLConnection(accessToken || "");
      setConnectionStatus('connected');
      return true; // Return true on success
    } catch (error) {
      setConnectionStatus('disconnected');
      alert("Please sign out and try again. If this issue occurs again, please log a ticket.");
      throw error; // Re-throw to allow caller to catch it
    }
  }, [accessToken]);
  
  // Set up the initial check and interval
  useEffect(() => {
    if (!accessToken) return;
    
    // Initial check when component mounts
    checkConnection().catch(() => {});
    
    // Set up interval check every 30 minutes
    const intervalId = setInterval(() => {
      checkConnection().catch(() => {});
    }, 30 * 60 * 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [accessToken, checkConnection]); // Only re-run if accessToken or checkConnection changes
  
  return { connectionStatus, checkConnection };
}