import React from 'react';
import { StatusLevel } from '../types';
import { useAppContext } from '../context/AppContext';

export const SeverityBadge: React.FC<{ severity: StatusLevel }> = ({ severity }) => {
    const {t} = useAppContext();
    const styles = {
        [StatusLevel.Danger]: 'bg-status-danger text-white',
        [StatusLevel.Warn]: 'bg-status-warn text-brand-dark',
        [StatusLevel.Ok]: 'bg-status-ok text-white',
    };
    const severityText = {
        [StatusLevel.Danger]: 'high',
        [StatusLevel.Warn]: 'medium',
        [StatusLevel.Ok]: 'low',
    }
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[severity]}`}>{t(severityText[severity] || severity)}</span>;
};
