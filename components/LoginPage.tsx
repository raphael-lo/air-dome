
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { DomeIcon } from './icons/NavIcons';
import { SpinnerIcon } from './icons/MetricIcons';

export const LoginPage: React.FC<{ onShowRegister: () => void }> = ({ onShowRegister }) => {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useAuth();
    const { t, theme } = useAppContext();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(username, password);
        } catch (err: any) {
             setError(t('invalid_credentials'));
        } finally {
            setIsLoading(false);
        }
    };
    
    // Ensure the dark class is on the html element for the login page
    React.useEffect(() => {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-brand-dark-light font-sans">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-brand-dark rounded-xl shadow-2xl">
                <div className="text-center">
                    <DomeIcon className="w-20 h-20 mx-auto text-brand-accent" />
                    <h1 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-brand-text">
                        {t('app_title')}
                    </h1>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="sr-only">{t('username')}</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-brand-dark-lightest placeholder-gray-500 text-gray-900 dark:text-brand-text bg-white dark:bg-brand-dark-light rounded-t-md focus:outline-none focus:ring-brand-accent focus:border-brand-accent focus:z-10 sm:text-sm"
                                placeholder={t('username')}
                            />
                        </div>
                        <div>
                            <label htmlFor="password-input" className="sr-only">{t('password')}</label>
                            <input
                                id="password-input"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-brand-dark-lightest placeholder-gray-500 text-gray-900 dark:text-brand-text bg-white dark:bg-brand-dark-light rounded-b-md focus:outline-none focus:ring-brand-accent focus:border-brand-accent focus:z-10 sm:text-sm"
                                placeholder={t('password')}
                            />
                        </div>
                    </div>

                    {error && (
                         <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                            <p className="text-sm text-center text-red-500 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-accent hover:bg-brand-accent-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent-light disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isLoading && <SpinnerIcon className="animate-spin h-5 w-5 mr-3" />}
                            {isLoading ? t('logging_in') : t('login')}
                        </button>
                    </div>
                </form>
                <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-brand-text-dim">
                        {t('dont_have_account')}{' '}
                        <button onClick={onShowRegister} className="font-medium text-brand-accent hover:text-brand-accent-light">
                            {t('register_now')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
