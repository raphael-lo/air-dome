
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useAirDomeData } from '../hooks/useAirDomeData';
import { ReportsIcon } from './icons/NavIcons';
import { ExportIcon, SpinnerIcon } from './icons/MetricIcons';
import type { AirDomeData } from '../backend/src/types';

type ReportableMetric = keyof Pick<AirDomeData, 'internalPressure' | 'powerConsumption' | 'internalCO2' | 'externalWindSpeed' | 'fanSpeed'>;

const reportOptions: { value: ReportableMetric; labelKey: string; unit: string }[] = [
    { value: 'internalPressure', labelKey: 'internal_pressure', unit: 'Pa' },
    { value: 'powerConsumption', labelKey: 'power_consumption', unit: 'W' },
    { value: 'internalCO2', labelKey: 'internal_air_quality_co2', unit: 'ppm' },
    { value: 'externalWindSpeed', labelKey: 'external_wind_speed', unit: 'm/s' },
    { value: 'fanSpeed', labelKey: 'fan_speed', unit: 'RPM' },
];

export const Reports: React.FC = () => {
    const { t, selectedSite } = useAppContext();
    const { authenticatedFetch } = useAuth();
    const { data: domeData, isLoading } = useAirDomeData(selectedSite, authenticatedFetch);

    const [reportType, setReportType] = useState<ReportableMetric>(reportOptions[0].value);
    const [timeRange, setTimeRange] = useState('daily');
    const [isExporting, setIsExporting] = useState(false);

    const generateReportData = (history: number[]) => {
        const formatMinutesAgo = (minutes: number): string => {
            if (minutes < 1) return t('now_label');
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            let result = '';
            if (h > 0) result += `${h}h `;
            if (m > 0) result += `${m}m `;
            return result.trim() + ' ago';
        };

        return history.map((value, i) => {
            const minutesAgo = (history.length - 1 - i) * 15;
            return {
                timestamp: formatMinutesAgo(minutesAgo),
                value: value.toFixed(2),
            };
        }).reverse();
    };
    
    const handleExport = async (format: 'csv' | 'pdf') => {
        if (!domeData) return;
        setIsExporting(true);
        
        const selectedOption = reportOptions.find(opt => opt.value === reportType);
        if (!selectedOption) {
            setIsExporting(false);
            return;
        }

        const history = domeData[reportType].history;
        if (!history) {
             setIsExporting(false);
            return;
        }

        const reportData = generateReportData(history);
        const headers = ['Timestamp', `Value (${selectedOption.unit})`];
        const body = reportData.map(d => [d.timestamp, d.value]);
        const reportName = `${selectedSite.id}_${reportType}_${new Date().toISOString().split('T')[0]}`;


        if (format === 'csv') {
            let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + body.map(e => e.join(",")).join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${reportName}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        if (format === 'pdf') {
            const doc = new jsPDF();
            
            doc.setFontSize(18);
            doc.text(`${t('app_title')}`, 14, 22);
            doc.setFontSize(11);
            doc.text(`${t('site')}: ${t(selectedSite.nameKey)}`, 14, 32);
            doc.text(`${t('report_type')}: ${t(selectedOption.labelKey)}`, 14, 38);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 44);

            autoTable(doc, {
                head: [headers],
                body: body,
                startY: 50,
                theme: 'striped',
                headStyles: { fillColor: [45, 55, 72] }
            });
            doc.save(`${reportName}.pdf`);
        }

        // Simulate generation time for user feedback
        setTimeout(() => setIsExporting(false), 1000);
    };

    if (isLoading || !domeData) {
        return (
          <div className="flex justify-center items-center h-full p-6 bg-white dark:bg-brand-dark-light rounded-lg shadow-lg">
            <div className="flex flex-col items-center gap-4">
                <SpinnerIcon className="h-12 w-12 text-brand-accent animate-spin" />
                <p className="text-lg text-gray-600 dark:text-brand-text-dim">Loading Report Data...</p>
            </div>
          </div>
        );
    }

    return (
        <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center mb-6">
                <ReportsIcon className="h-8 w-8 text-brand-accent mr-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-text">{t('reports')}</h2>
            </div>

            <div className="space-y-6">
                <div>
                    <label htmlFor="reportType" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim mb-2">{t('report_type')}</label>
                    <select 
                        id="reportType" 
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value as ReportableMetric)}
                        className="w-full p-2 bg-gray-50 dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md text-gray-900 dark:text-brand-text focus:ring-2 focus:ring-brand-accent focus:outline-none"
                    >
                        {reportOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="timeRange" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim mb-2">{t('time_range')}</label>
                    <select 
                        id="timeRange" 
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="w-full p-2 bg-gray-50 dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md text-gray-900 dark:text-brand-text focus:ring-2 focus:ring-brand-accent focus:outline-none"
                    >
                        <option value="daily">{t('daily')}</option>
                        <option value="weekly">{t('weekly')}</option>
                        <option value="monthly">{t('monthly')}</option>
                    </select>
                     <p className="text-xs text-gray-500 dark:text-brand-text-dim mt-2">Note: Weekly and monthly reports are simulated using 24h data for this demo.</p>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4">
                     <button
                        onClick={() => handleExport('csv')}
                        disabled={isExporting} 
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isExporting ? <SpinnerIcon className="h-5 w-5 animate-spin"/> : <ExportIcon className="h-5 w-5" />}
                        {t('export_csv')}
                    </button>
                    <button 
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting} 
                        className="bg-brand-accent hover:bg-brand-accent-light text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isExporting ? <SpinnerIcon className="h-5 w-5 animate-spin"/> : <ExportIcon className="h-5 w-5" />}
                        {t('export_pdf')}
                    </button>
                </div>
            </div>
        </div>
    );
};
