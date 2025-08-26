import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchBrokerStats } from '../services/geminiService';
import { useAppContext } from '../context/AppContext';
import { UsersIcon } from './icons/NavIcons'; // Re-using an existing icon

export const BrokerStatusCard: React.FC = () => {
  const { authenticatedFetch } = useAuth();
  const { t } = useAppContext();
  const [connectedClients, setConnectedClients] = useState<number | null>(null);

  useEffect(() => {
    const getStats = async () => {
      try {
        const stats = await fetchBrokerStats({ authenticatedFetch });
        setConnectedClients(stats.connectedClients);
      } catch (error) {
        console.error("Failed to fetch broker stats:", error);
        setConnectedClients(null); // Set to null on error
      }
    };

    getStats(); // Fetch immediately on mount
    const interval = setInterval(getStats, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [authenticatedFetch]);

  return (
    <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-lg p-4">
      <div className="flex items-center">
        <div className="bg-brand-accent/10 p-3 rounded-full">
            <UsersIcon className="h-6 w-6 text-brand-accent" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 dark:text-brand-text-dim">{t('mqtt_connected_clients')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-brand-text">
            {connectedClients !== null ? connectedClients : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};