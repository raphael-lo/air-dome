
import React, { useState, useEffect } from 'react';
import type { User } from '../backend/src/types';
import { useAppContext } from '../context/AppContext';
import { fetchUsers, createUser, updateUser, updateUserStatus } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { SpinnerIcon } from './icons/MetricIcons';
import { UsersIcon } from './icons/NavIcons';

const StatusToggle: React.FC<{
    user: User;
    onStatusChange: (userId: string, newStatus: 'active' | 'disabled') => void;
}> = ({ user, onStatusChange }) => {
    const { t } = useAppContext();
    const isEnabled = user.status === 'active';
    const isDisabled = user.username === 'admin';

    const title = isDisabled ? t('cannot_disable_admin') : `Click to ${isEnabled ? 'disable' : 'activate'}`;

    return (
        <button
            onClick={() => onStatusChange(user.id, isEnabled ? 'disabled' : 'active')}
            disabled={isDisabled}
            title={title}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark-light focus:ring-brand-accent ${isEnabled ? 'bg-status-ok' : 'bg-gray-400 dark:bg-brand-dark-lightest'} ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
};

const AddUserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onUserAdded: () => void;
}> = ({ isOpen, onClose, onUserAdded }) => {
    const { t } = useAppContext();
    const { authenticatedFetch } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'Admin' | 'Operator' | 'Viewer'>('Operator');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Username and password are required.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await createUser({ username, password, role }, { authenticatedFetch });
            onUserAdded();
            handleClose();
        } catch (err) {
            setError(t('error_creating_user'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setUsername('');
        setPassword('');
        setRole('Operator');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-brand-accent mb-4">{t('add_user')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">{t('username')}</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"
                            placeholder={t('username_placeholder')}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">{t('password')}</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"
                            placeholder={t('password_placeholder')}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">{t('role')}</label>
                        <select
                            id="role"
                            value={role}
                            onChange={e => setRole(e.target.value as 'Admin' | 'Operator' | 'Viewer')}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-brand-dark border-gray-300 dark:border-brand-dark-lightest focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm rounded-md"
                        >
                            <option value="Operator">{t('operator')}</option>
                            <option value="Admin">{t('admin')}</option>
                            <option value="Viewer">{t('viewer')}</option>
                        </select>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={handleClose} className="py-2 px-4 bg-gray-200 dark:bg-brand-dark-lightest text-gray-800 dark:text-brand-text font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            {t('cancel')}
                        </button>
                        <button type="submit" disabled={isLoading} className="py-2 px-4 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent-light transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait">
                            {isLoading && <SpinnerIcon className="h-5 w-5 animate-spin" />}
                            {isLoading ? t('creating_user') : t('create_user')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditUserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onUserUpdated: () => void;
    user: User | null;
}> = ({ isOpen, onClose, onUserUpdated, user }) => {
    const { t } = useAppContext();
    const { authenticatedFetch } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'Admin' | 'Operator' | 'Viewer'>('Operator');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setRole(user.role);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        setError('');
        try {
            const userData: { username?: string, password?: string, role?: 'Admin' | 'Operator' | 'Viewer' } = {};
            if (username !== user.username) {
                userData.username = username;
            }
            if (password) {
                userData.password = password;
            }
            if (role !== user.role) {
                userData.role = role;
            }

            await updateUser(user.id, userData, { authenticatedFetch });
            onUserUpdated();
            handleClose();
        } catch (err) {
            setError(t('error_updating_user'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setUsername('');
        setPassword('');
        setRole('Operator');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-brand-accent mb-4">{t('edit_user')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">{t('username')}</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"
                            placeholder={t('username_placeholder')}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">{t('password')} ({t('leave_blank_to_keep_same')})</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"
                            placeholder={t('password_placeholder')}
                        />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">{t('role')}</label>
                        <select
                            id="role"
                            value={role}
                            onChange={e => setRole(e.target.value as 'Admin' | 'Operator' | 'Viewer')}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-brand-dark border-gray-300 dark:border-brand-dark-lightest focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm rounded-md"
                        >
                            <option value="Operator">{t('operator')}</option>
                            <option value="Admin">{t('admin')}</option>
                            <option value="Viewer">{t('viewer')}</option>
                        </select>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={handleClose} className="py-2 px-4 bg-gray-200 dark:bg-brand-dark-lightest text-gray-800 dark:text-brand-text font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            {t('cancel')}
                        </button>
                        <button type="submit" disabled={isLoading} className="py-2 px-4 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent-light transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait">
                            {isLoading && <SpinnerIcon className="h-5 w-5 animate-spin" />}
                            {isLoading ? t('updating_user') : t('update_user')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};



export const Users: React.FC = () => {
    const { t } = useAppContext();
    const { authenticatedFetch, user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const fetchedUsers = await fetchUsers({ authenticatedFetch });
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [authenticatedFetch]);

    const handleStatusChange = async (userId: string, newStatus: 'active' | 'disabled') => {
        const originalUsers = [...users];
        // Optimistic update
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        
        try {
            await updateUserStatus(userId, newStatus, { authenticatedFetch });
        } catch (error) {
            console.error("Failed to update user status:", error);
            // Revert on failure
            setUsers(originalUsers);
            alert((error as Error).message);
        }
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full p-6 bg-white dark:bg-brand-dark-light rounded-lg shadow-lg">
                 <SpinnerIcon className="h-10 w-10 text-brand-accent animate-spin" />
            </div>
        );
    }

    if (user?.role !== 'Admin') {
        return (
            <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-text">{t('access_denied')}</h2>
                <p className="text-sm text-gray-500 dark:text-brand-text-dim">{t('no_permission_user_management')}</p>
            </div>
        );
    }
    
  return (
    <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-brand-accent mr-3"/>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-text">{t('user_management')}</h2>
              <p className="text-sm text-gray-500 dark:text-brand-text-dim">{t('user_management_description')}</p>
            </div>
        </div>
        {user?.role === 'Admin' && (
            <button onClick={() => setIsModalOpen(true)} className="bg-brand-accent hover:bg-brand-accent-light text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                <span>+</span> {t('add_user')}
            </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-brand-dark-lightest">
              <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">{t('username')}</th>
              <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">{t('role')}</th>
              <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">{t('created_at')}</th>
              <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">{t('status')}</th>
              <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim text-center">{t('action')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-200 dark:border-brand-dark-lightest hover:bg-gray-50 dark:hover:bg-brand-dark transition-colors">
                <td className="p-3 font-medium text-gray-800 dark:text-brand-text">{user.username}</td>
                <td className="p-3 text-gray-800 dark:text-brand-text">{t(user.role.toLowerCase())}</td>
                <td className="p-3 text-gray-500 dark:text-brand-text-dim">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.status === 'active' ? 'bg-status-ok text-white' : 'bg-gray-500 text-white'}`}>
                        {t(user.status)}
                    </span>
                </td>
                <td className="p-3 text-center">
                    <StatusToggle user={user} onStatusChange={handleStatusChange} />
                    {user.username !== 'admin' && (
                        <button onClick={() => handleEdit(user)} className="ml-2 py-1 px-2 bg-gray-200 dark:bg-brand-dark-lightest text-gray-800 dark:text-brand-text font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            {t('edit')}
                        </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUserAdded={loadUsers} />
      <EditUserModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUserUpdated={loadUsers} user={selectedUser} />
    </div>
  );
};
