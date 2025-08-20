
import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useAirDomeData } from '../hooks/useAirDomeData';
import { ReportsIcon } from './icons/NavIcons';
import { ExportIcon, SpinnerIcon } from './icons/MetricIcons';
import type { Metric } from '../backend/src/types';
import { fetchMetrics } from '../services/geminiService';
import { config } from '../config'; // <-- ADD THIS LINE

export const Reports: React.FC = () => {
    const { t, selectedSite, language } = useAppContext();
    const { authenticatedFetch } = useAuth();
    const { data: domeData, isLoading: isLoadingDomeData } = useAirDomeData(selectedSite, authenticatedFetch, () => {});

    const [allMetrics, setAllMetrics] = useState<Metric[]>([]);
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
    const [reportType, setReportType] = useState<string>('');
    const [timeRange, setTimeRange] = useState('daily');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const loadMetrics = async () => {
            setIsLoadingMetrics(true);
            try {
                const metricsData = await fetchMetrics({ authenticatedFetch });
                setAllMetrics(metricsData);
                if (metricsData.length > 0 && metricsData[0].mqtt_param) {
                    setReportType(metricsData[0].mqtt_param);
                }
            } catch (error) {
                console.error("Failed to fetch metrics for reports:", error);
            }
            setIsLoadingMetrics(false);
        };
        loadMetrics();
    }, [authenticatedFetch]);

    const generateReportData = (history: any[]) => {
        // This function now expects history to be in the format [{_time, _value}]
        return history.map(point => {
            const valueString = typeof point._value === 'number' ? point._value.toFixed(2) : 'N/A';
            return {
                timestamp: new Date(point._time).toLocaleString(language),
                value: valueString,
            };
        });
    };
    
    const handleExport = async (format: 'csv' | 'pdf') => {
        setIsExporting(true);
        
        const selectedMetric = allMetrics.find(opt => opt.mqtt_param === reportType);
        if (!selectedMetric) {
            console.error('Could not find selected metric for report.');
            setIsExporting(false);
            return;
        }

        try {
            // Fetch fresh data for the report to avoid using potentially large live data from the websocket hook.
            let range = '-24h';
            if (timeRange === 'weekly') {
                range = '-7d';
            } else if (timeRange === 'monthly') {
                range = '-30d';
            }

            const response = await authenticatedFetch(`${config.apiBaseUrl}/sensor-data/history?measurement=sensor_data&field=${selectedMetric.mqtt_param}&range=${range}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch report data: ${response.statusText}`);
            }

            const historyData = await response.json();
            if (!historyData || historyData.length === 0) {
                alert('No data available for the selected report.');
                setIsExporting(false);
                return;
            }

            const reportData = generateReportData(historyData);
            const unit = selectedMetric.unit || '';
            const headers = ['Timestamp', `Value (${unit})`];
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
                doc.text(`${t('report_type')}: ${selectedMetric.display_name}`, 14, 38);
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
        } catch (error) {
            console.error("Error generating report:", error);
            alert('Failed to generate report. Please check the console for details.');
        } finally {
            setIsExporting(false);
        }
    };

    const isLoading = isLoadingDomeData || isLoadingMetrics;

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
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full p-2 bg-gray-50 dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md text-gray-900 dark:text-brand-text focus:ring-2 focus:ring-brand-accent focus:outline-none"
                    >
                        {allMetrics.map(opt => (
                            <option key={opt.id} value={opt.mqtt_param}>{opt.display_name}</option>
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
