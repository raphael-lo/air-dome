
import React, { useState, useEffect } from 'react';
import { AppContextProvider } from './context/AppContext';
import { AuthContextProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Alerts } from './components/Alerts';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Users } from './components/Users';
import { Metrics } from './components/Metrics';
import { AlertSetting } from './components/AlertSetting';
import type { View, FanSet, LightingState } from './backend/src/types';
import { useAppContext } from './context/AppContext';
import { FanControlCard } from './components/FanControlCard';
import { LightingControlCard } from './components/LightingControl';
import { BulbIcon, ShutdownIcon, ExclamationTriangleIcon, CheckCircleIcon, SpinnerIcon } from './components/icons/MetricIcons';
import { fetchFanSets, updateFanSet, fetchLightingState, updateLightingState } from './services/geminiService';
import { LoginPage } from './components/LoginPage';


// --- Components for separated control views ---

const Ventilation: React.FC = () => {
    const { t } = useAppContext();
    const { authenticatedFetch } = useAuth();
    const [fanSets, setFanSets] = useState<FanSet[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDemoVisible, setIsDemoVisible] = useState(false);

    useEffect(() => {
        const loadFanSets = async () => {
            setIsLoading(true);
            const data = await fetchFanSets({ authenticatedFetch });
            setFanSets(data);
            setIsLoading(false);
        };
        loadFanSets();
    }, [authenticatedFetch]);

    const handleFanUpdate = async (id: string, updates: Partial<Omit<FanSet, 'id' | 'name'>>) => {
        setFanSets(prevFanSets => {
            if (!prevFanSets) return null;
            return prevFanSets.map(fanSet =>
                fanSet.id === id ? { ...fanSet, ...updates } : fanSet
            )
        });
        
        try {
            await updateFanSet(id, updates, { authenticatedFetch });
        } catch (error) {
            console.error("Failed to update fan set:", error);
            const data = await fetchFanSets({ authenticatedFetch });
            setFanSets(data);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><SpinnerIcon className="h-10 w-10 text-brand-accent animate-spin" /></div>;
    }

    if (!isDemoVisible) {
        return (
            <div className="text-center p-8 bg-white dark:bg-brand-dark-light rounded-lg shadow-lg">
                <h3 className="text-lg font-medium text-gray-900 dark:text-brand-text">{t('no_devices_detected_demo')}</h3>
                <button 
                    onClick={() => setIsDemoVisible(true)}
                    className="mt-4 px-4 py-2 bg-brand-accent text-white font-semibold rounded-lg shadow-md hover:bg-brand-accent-light transition-colors"
                >
                    {t('view_demo_button')}
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-300" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-200">
                            {t('controls_demo_warning')}
                        </p>
                    </div>
                </div>
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-brand-text mb-4 border-b border-gray-200 dark:border-brand-dark-lightest pb-2">
                    {t('fan_set_control')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {fanSets?.map(fs => (
                        <FanControlCard key={fs.id} fanSet={fs} onUpdate={handleFanUpdate} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const Lighting: React.FC = () => {
    const { t } = useAppContext();
    const { authenticatedFetch } = useAuth();
    const [lightingState, setLightingState] = useState<LightingState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDemoVisible, setIsDemoVisible] = useState(false);

    useEffect(() => {
        const loadState = async () => {
            setIsLoading(true);
            const data = await fetchLightingState({ authenticatedFetch });
            setLightingState(data);
            setIsLoading(false);
        };
        loadState();
    }, [authenticatedFetch]);

    const handleUpdate = async (updates: Partial<LightingState>) => {
        if (!lightingState) return;
        
        const newState = { ...lightingState, ...updates };
        setLightingState(newState);

        try {
            await updateLightingState(updates, { authenticatedFetch });
        } catch (error) {
            console.error("Failed to update lighting:", error);
            const data = await fetchLightingState({ authenticatedFetch });
            setLightingState(data);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><SpinnerIcon className="h-10 w-10 text-brand-accent animate-spin" /></div>;
    }

    if (!isDemoVisible) {
        return (
            <div className="text-center p-8 bg-white dark:bg-brand-dark-light rounded-lg shadow-lg">
                <h3 className="text-lg font-medium text-gray-900 dark:text-brand-text">{t('no_devices_detected_demo')}</h3>
                <button 
                    onClick={() => setIsDemoVisible(true)}
                    className="mt-4 px-4 py-2 bg-brand-accent text-white font-semibold rounded-lg shadow-md hover:bg-brand-accent-light transition-colors"
                >
                    {t('view_demo_button')}
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-300" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-200">
                            {t('controls_demo_warning')}
                        </p>
                    </div>
                </div>
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-brand-text mb-4 border-b border-gray-200 dark:border-brand-dark-lightest pb-2">
                    {t('lighting_control')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   {lightingState && <LightingControlCard 
                        lightsOn={lightingState.lights_on}
                        onPowerToggle={() => handleUpdate({ lights_on: !lightingState.lights_on })}
                        brightness={lightingState.brightness}
                        onBrightnessChange={(val) => handleUpdate({ brightness: val })}
                   />}
                </div>
            </div>
        </div>
    );
};

const Emergency: React.FC = () => {
    const { t } = useAppContext();
    const [shutdownStatus, setShutdownStatus] = useState<'idle' | 'confirming' | 'shuttingDown' | 'shutdownComplete'>('idle');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    
    const shutdownSteps = [
        { messageKey: 'shutdown_step_1', duration: 1500 },
        { messageKey: 'shutdown_step_2', duration: 1500 },
        { messageKey: 'shutdown_step_3', duration: 2000 },
        { messageKey: 'shutdown_step_4', duration: 1000 },
    ];

    useEffect(() => {
        let progressInterval: number;
        if (shutdownStatus === 'shuttingDown') {
            // Simulate progress bar filling over the total duration
            const totalDuration = shutdownSteps.reduce((acc, step) => acc + step.duration, 0);
            progressInterval = window.setInterval(() => {
                setProgress(prev => Math.min(prev + 1, 100));
            }, totalDuration / 100);

            // Process steps sequentially
            let delay = 0;
            shutdownSteps.forEach(step => {
                setTimeout(() => {
                    setMessage(t(step.messageKey));
                }, delay);
                delay += step.duration;
            });

            // Set to complete
            setTimeout(() => {
                setShutdownStatus('shutdownComplete');
                setProgress(100);
            }, delay);
        }
        return () => {
            clearInterval(progressInterval);
        };
    }, [shutdownStatus, t]);


    const handleReset = () => {
        setShutdownStatus('idle');
        setProgress(0);
        setMessage('');
    };

    return (
        <div className="flex items-center justify-center h-full p-4">
            <div className="w-full max-w-2xl mx-auto">
                {shutdownStatus === 'idle' && (
                    <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-2xl p-8 text-center">
                        <ExclamationTriangleIcon className="h-16 w-16 text-status-danger mx-auto" />
                        <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-brand-text">{t('emergency_shutdown_title')}</h2>
                        <p className="mt-4 text-gray-600 dark:text-brand-text-dim max-w-lg mx-auto">{t('shutdown_warning')}</p>
                        <button
                            onClick={() => setShutdownStatus('confirming')}
                            className="mt-8 w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-status-danger hover:bg-red-700 text-white font-bold rounded-lg transition-transform transform hover:scale-105"
                        >
                            <ShutdownIcon className="h-6 w-6 mr-3" />
                            {t('initiate_shutdown')}
                        </button>
                    </div>
                )}

                {shutdownStatus === 'confirming' && (
                    <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-2xl p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-text">{t('confirm_shutdown_title')}</h2>
                        <p className="mt-4 text-gray-600 dark:text-brand-text-dim">{t('confirm_shutdown_message')}</p>
                        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                            <button
                                onClick={() => setShutdownStatus('shuttingDown')}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-status-danger hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                            >
                                {t('confirm_shutdown_button')}
                            </button>
                            <button
                                onClick={() => setShutdownStatus('idle')}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-brand-dark-lightest dark:hover:bg-gray-600 text-gray-800 dark:text-brand-text font-bold rounded-lg transition-colors"
                            >
                                {t('cancel_shutdown_button')}
                            </button>
                        </div>
                    </div>
                )}
                
                {(shutdownStatus === 'shuttingDown' || shutdownStatus === 'shutdownComplete') && (
                    <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-2xl p-8 text-center">
                        {shutdownStatus === 'shuttingDown' ? (
                            <>
                                <h2 className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">{t('shutdown_in_progress')}</h2>
                                <div className="mt-6 w-full bg-gray-200 dark:bg-brand-dark-lightest rounded-full h-4 overflow-hidden">
                                    <div className="bg-yellow-500 h-4 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="mt-4 text-gray-600 dark:text-brand-text-dim h-6 animate-pulse">{message}</p>
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="h-16 w-16 text-status-ok mx-auto"/>
                                <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-brand-text">{t('shutdown_complete_title')}</h2>
                                <p className="mt-4 text-gray-600 dark:text-brand-text-dim">{t('shutdown_complete_message')}</p>
                                <button
                                    onClick={handleReset}
                                    className="mt-8 w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent-light text-white font-bold rounded-lg transition-transform transform hover:scale-105"
                                >
                                    {t('reset_simulation')}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

import { config } from './config';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useAppContext(); // Add this line
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Log API and WebSocket URLs to console for debugging
//   useEffect(() => {
//     console.log('API Base URL:', config.apiBaseUrl);
//     console.log('WebSocket URL:', config.wsUrl);
//   }, []);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderView = (currentUser: typeof user) => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'alerts':
        return <Alerts />;
      case 'ventilation':
        return <Ventilation />;
      case 'lighting':
        return <Lighting />;
      case 'emergency':
        return <Emergency />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'users':
        return <Users />;
      case 'metrics':
        return <Metrics />;
      case 'alert_settings':
        if (currentUser?.role !== 'Admin') {
          return (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-brand-text-dim">
              <h2 className="text-2xl font-bold mb-4">{t('access_denied')}</h2>
              <p>{t('no_permission_user_management')}</p>
            </div>
          );
        }
        return <AlertSetting />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-brand-dark font-sans text-gray-900 dark:text-brand-text">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentView={currentView} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-brand-dark-light p-4 sm:p-6 lg:p-8">
          {renderView(user)}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthContextProvider>
      <AppContextProvider>
        <AppContent />
      </AppContextProvider>
    </AuthContextProvider>
  );
};

export default App;
