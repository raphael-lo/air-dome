
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useAirDomeData } from '../hooks/useAirDomeData';
import { MetricCard } from './MetricCard';
import { PairedMetricCard } from './PairedMetricCard';
import { StatusLevel, type Alert } from '../types';
import * as Icons from './icons/MetricIcons';
import { AlertIcon } from './icons/NavIcons';
import { analyzeDomeDataStream, fetchAlerts } from '../services/geminiService';
import { SeverityBadge } from './SeverityBadge';
import { MetricChart } from './MetricChart';
import { MetricGroup } from './MetricGroup';
import { SpinnerIcon } from './icons/MetricIcons';

const AIAnalysisModal: React.FC<{ isOpen: boolean; onClose: () => void; analysisText: string; isLoading: boolean }> = ({ isOpen, onClose, analysisText, isLoading }) => {
  const { t } = useAppContext();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <h2 className="text-2xl font-bold text-brand-accent mb-4">{t('ai_analysis_title')}</h2>
        <div className="flex-grow overflow-y-auto pr-2 text-gray-700 dark:text-brand-text-dim prose dark:prose-invert">
          {isLoading && <p>{t('generating_analysis')}</p>}
          <div dangerouslySetInnerHTML={{ __html: analysisText.replace(/\n/g, '<br />') }} />
        </div>
        <button
          onClick={onClose}
          className="mt-6 bg-brand-accent hover:bg-brand-accent-light text-white font-bold py-2 px-4 rounded-lg transition-colors w-full sm:w-auto self-end"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
};

const ChartModal: React.FC<{ content: { titleKey: string; series: { nameKey: string; history: number[] }[]; unit: string } | null; onClose: () => void; }> = ({ content, onClose }) => {
    const { t } = useAppContext();
    if (!content) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-2xl p-6 w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-brand-accent mb-4">{t('historical_data')}: {t(content.titleKey)}</h2>
                <div className="flex justify-center">
                    <MetricChart series={content.series} unit={content.unit} />
                </div>
                 <button
                    onClick={onClose}
                    className="mt-6 bg-brand-accent hover:bg-brand-accent-light text-white font-bold py-2 px-4 rounded-lg transition-colors w-full sm:w-auto float-right"
                >
                    {t('close')}
                </button>
            </div>
        </div>
    );
};

export const Dashboard: React.FC = () => {
  const { selectedSite, t, language } = useAppContext();
  const { authenticatedFetch } = useAuth();
  const { data, isLoading: isLoadingData } = useAirDomeData(selectedSite, authenticatedFetch);
  
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [chartModalContent, setChartModalContent] = useState<{ titleKey: string; series: { nameKey: string; history: number[]}[]; unit: string } | null>(null);

  useEffect(() => {
    const loadAlerts = async () => {
      const allAlerts = await fetchAlerts(selectedSite.id, { authenticatedFetch });
      const filteredActiveAlerts = allAlerts
        .filter(a => a.status === 'active')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3);
      setActiveAlerts(filteredActiveAlerts);
    };
    loadAlerts();
  }, [selectedSite, authenticatedFetch]);

  const metricGroupTitles = {
      dome_integrity: t('dome_integrity'),
      environment: t('environment'),
      air_quality: t('air_quality'),
      systems_status: t('systems_status'),
      power: t('power'),
  };

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [metricGroupTitles.dome_integrity]: true,
    [metricGroupTitles.environment]: true,
    [metricGroupTitles.air_quality]: true,
    [metricGroupTitles.systems_status]: true,
    [metricGroupTitles.power]: true,
  });

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleAnalyze = async () => {
    if (!data) return;
    setIsModalOpen(true);
    setIsLoadingAnalysis(true);
    setAnalysis('');
    
    try {
        const stream = analyzeDomeDataStream(data, language);
        for await (const chunk of stream) {
            setAnalysis(prev => prev + chunk);
        }
    } catch (error) {
        console.error("Failed to get analysis", error);
        setAnalysis(t('error_generating_analysis'));
    } finally {
        setIsLoadingAnalysis(false);
    }
  };
  
  const handleMetricClick = (titleKey: string, history: number[] | undefined, unit: string) => {
    if (history && history.length > 1) {
      setChartModalContent({ titleKey, unit, series: [{ nameKey: titleKey, history }] });
    }
  };

  const handlePairedMetricClick = (titleKey: string, unit: string, internalHistory: number[], externalHistory: number[]) => {
      setChartModalContent({
        titleKey,
        unit,
        series: [
          { nameKey: 'internal', history: internalHistory },
          { nameKey: 'external', history: externalHistory },
        ],
      });
  };

  if (isLoadingData || !data) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="flex flex-col items-center gap-4">
            <SpinnerIcon className="h-12 w-12 text-brand-accent animate-spin" />
            <p className="text-lg text-gray-600 dark:text-brand-text-dim">Loading Dome Metrics...</p>
        </div>
      </div>
    );
  }

  // Ensure data and its nested properties are defined before rendering
  if (!data || !data.internalPressure || !data.externalPressure || !data.fanSpeed || !data.airExchangeRate || 
      !data.powerConsumption || !data.voltage || !data.current || !data.externalWindSpeed || 
      !data.internalPM25 || !data.externalPM25 || !data.internalCO2 || !data.externalCO2 || 
      !data.internalO2 || !data.externalO2 || !data.internalCO || !data.externalCO || 
      !data.internalTemp || !data.externalTemp || !data.internalHumidity || !data.externalHumidity || 
      !data.membraneHealth || !data.internalNoise || !data.externalNoise || !data.basePressure || 
      !data.internalLux || !data.lightingStatus || !data.airShutterStatus) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="flex flex-col items-center gap-4">
            <SpinnerIcon className="h-12 w-12 text-brand-accent animate-spin" />
            <p className="text-lg text-gray-600 dark:text-brand-text-dim">Waiting for data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeAlerts.length > 0 && <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex items-center mb-4">
              <AlertIcon className="h-6 w-6 text-brand-accent mr-3"/>
              <h2 className="text-xl font-bold text-gray-900 dark:text-brand-text">{t('active_alerts')}</h2>
          </div>
          {activeAlerts.length > 0 ? (
              <ul className="space-y-4">
                  {activeAlerts.map(alert => (
                      <li key={alert.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 dark:bg-brand-dark rounded-lg gap-2">
                          <div className="flex items-center">
                              <SeverityBadge severity={alert.severity} />
                              <div className="ml-4">
                                  <p className="font-semibold text-gray-800 dark:text-brand-text">{t(alert.parameter)}</p>
                                  <p className="text-sm text-gray-600 dark:text-brand-text-dim">{t(alert.message)}</p>
                              </div>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-brand-text-dim sm:ml-4 flex-shrink-0">{new Date(alert.timestamp).toLocaleString(language)}</span>
                      </li>
                  ))}
              </ul>
          ) : (
              <p className="text-center text-gray-500 dark:text-brand-text-dim py-4">{t('no_active_alerts')}</p>
          )}
      </div>}

      {/* <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-text">Dome Metrics</h2>
          
      </div> */}
      
      <div className="space-y-6">
        {activeAlerts.length > 0 && <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex items-center mb-4">
              <AlertIcon className="h-6 w-6 text-brand-accent mr-3"/>
              <h2 className="text-xl font-bold text-gray-900 dark:text-brand-text">{t('active_alerts')}</h2>
          </div>
          {activeAlerts.length > 0 ? (
              <ul className="space-y-4">
                  {activeAlerts.map(alert => (
                      <li key={alert.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 dark:bg-brand-dark rounded-lg gap-2">
                          <div className="flex items-center">
                              <SeverityBadge severity={alert.severity} />
                              <div className="ml-4">
                                  <p className="font-semibold text-gray-800 dark:text-brand-text">{t(alert.parameter)}</p>
                                  <p className="text-sm text-gray-600 dark:text-brand-text-dim">{t(alert.message)}</p>
                              </div>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-brand-text-dim sm:ml-4 flex-shrink-0">{new Date(alert.timestamp).toLocaleString(language)}</span>
                      </li>
                  ))}
              </ul>
          ) : (
              <p className="text-center text-gray-500 dark:text-brand-text-dim py-4">{t('no_active_alerts')}</p>
          )}
      </div>}

      <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-text">Dome Metrics</h2>
          
      </div>
      
      <div className="space-y-6">
        { (data.internalPressure.value !== 0 || data.externalPressure.value !== 0 || data.basePressure.value !== 0 || data.fanSpeed.value !== 0) && (
        <MetricGroup title={metricGroupTitles.dome_integrity} isOpen={openSections[metricGroupTitles.dome_integrity]} onToggle={() => toggleSection(metricGroupTitles.dome_integrity)}>
            <PairedMetricCard titleKey="pressure" icon={<Icons.PressureIcon />} unit="Pa"
                internalData={{ value: data.internalPressure.value.toFixed(1), status: data.internalPressure.status }}
                externalData={{ value: data.externalPressure.value.toFixed(1), status: data.externalPressure.status }}
                onClick={() => handlePairedMetricClick('pressure', 'Pa', data.internalPressure.history, data.externalPressure.history)}
            />
            {data.basePressure && <MetricCard title={t('base_corner_pressure')} value={data.basePressure.value.toFixed(1)} unit="kPa" status={data.basePressure.status} icon={<Icons.PressureIcon />} onClick={() => handleMetricClick('base_corner_pressure', data.basePressure.history, 'kPa')} />}
            <MetricCard title={t('membrane_health')} value={t(data.membraneHealth.status === StatusLevel.Ok ? 'normal' : 'defect_detected')} unit="" status={data.membraneHealth.status} icon={<Icons.MembraneIcon />} />
            <MetricCard title={t('fan_speed')} value={data.fanSpeed.value.toFixed(0)} unit="RPM" status={data.fanSpeed.status} icon={<Icons.FanIcon />} onClick={() => handleMetricClick('fan_speed', data.fanSpeed.history, 'RPM')} />
        </MetricGroup>)}

        { (data.internalTemp.value !== 0 || data.externalTemp.value !== 0 || data.internalHumidity.value !== 0 || data.externalHumidity.value !== 0 || data.externalWindSpeed.value !== 0) && (
        <MetricGroup title={metricGroupTitles.environment} isOpen={openSections[metricGroupTitles.environment]} onToggle={() => toggleSection(metricGroupTitles.environment)}>
            <PairedMetricCard titleKey="temperature" icon={<Icons.TempIcon />} unit="°C"
                internalData={{ value: data.internalTemp.value.toFixed(1), status: data.internalTemp.status }}
                externalData={{ value: data.externalTemp.value.toFixed(1), status: data.externalTemp.status }}
                onClick={() => handlePairedMetricClick('temperature', '°C', data.internalTemp.history, data.externalTemp.history)}
            />
            <PairedMetricCard titleKey="humidity" icon={<Icons.HumidityIcon />} unit="%RH"
                internalData={{ value: data.internalHumidity.value.toFixed(0), status: data.internalHumidity.status }}
                externalData={{ value: data.externalHumidity.value.toFixed(0), status: data.externalHumidity.status }}
                onClick={() => handlePairedMetricClick('humidity', '%RH', data.internalHumidity.history, data.externalHumidity.history)}
            />
            <MetricCard title={t('external_wind_speed')} value={data.externalWindSpeed.value.toFixed(1)} unit="m/s" status={data.externalWindSpeed.status} icon={<Icons.WindIcon />} onClick={() => handleMetricClick('external_wind_speed', data.externalWindSpeed.history, 'm/s')} />
        </MetricGroup>)}

        { (data.internalPM25.value !== 0 || data.externalPM25.value !== 0 || data.internalCO2.value !== 0 || data.externalCO2.value !== 0 || data.internalO2.value !== 0 || data.externalO2.value !== 0 || data.internalCO.value !== 0 || data.externalCO.value !== 0 || data.airExchangeRate.value !== 0) && (
        <MetricGroup title={metricGroupTitles.air_quality} isOpen={openSections[metricGroupTitles.air_quality]} onToggle={() => toggleSection(metricGroupTitles.air_quality)}>
            <PairedMetricCard titleKey="pm25" icon={<Icons.PM25Icon />} unit="µg/m³"
                internalData={{ value: data.internalPM25.value.toFixed(1), status: data.internalPM25.status }}
                externalData={{ value: data.externalPM25.value.toFixed(1), status: data.externalPM25.status }}
                onClick={() => handlePairedMetricClick('pm25', 'µg/m³', data.internalPM25.history, data.externalPM25.history)}
            />
            <PairedMetricCard titleKey="co2" icon={<Icons.CO2Icon />} unit="ppm"
                internalData={{ value: data.internalCO2.value.toFixed(0), status: data.internalCO2.status }}
                externalData={{ value: data.externalCO2.value.toFixed(0), status: data.externalCO2.status }}
                onClick={() => handlePairedMetricClick('co2', 'ppm', data.internalCO2.history, data.externalCO2.history)}
            />
            <PairedMetricCard titleKey="o2" icon={<Icons.O2Icon />} unit="%"
                internalData={{ value: data.internalO2.value.toFixed(1), status: data.internalO2.status }}
                externalData={{ value: data.externalO2.value.toFixed(1), status: data.externalO2.status }}
                onClick={() => handlePairedMetricClick('o2', '%', data.internalO2.history, data.externalO2.history)}
            />
             <PairedMetricCard titleKey="co" icon={<Icons.COIcon />} unit="ppm"
                internalData={{ value: data.internalCO.value.toFixed(1), status: data.internalCO.status }}
                externalData={{ value: data.externalCO.value.toFixed(1), status: data.externalCO.status }}
                onClick={() => handlePairedMetricClick('co', 'ppm', data.internalCO.history, data.externalCO.history)}
            />
            <MetricCard title={t('air_exchange_rate')} value={data.airExchangeRate.value.toFixed(0)} unit="m³/h" status={data.airExchangeRate.status} icon={<Icons.AirExchangeIcon />} onClick={() => handleMetricClick('air_exchange_rate', data.airExchangeRate.history, 'm³/h')} />
        </MetricGroup>)}
        
        { (data.internalNoise.value !== 0 || data.externalNoise.value !== 0 || data.internalLux.value !== 0) && (
        <MetricGroup title={metricGroupTitles.systems_status} isOpen={openSections[metricGroupTitles.systems_status]} onToggle={() => toggleSection(metricGroupTitles.systems_status)}>
            <PairedMetricCard titleKey="noise" icon={<Icons.NoiseIcon />} unit="dB"
                internalData={{ value: data.internalNoise.value.toFixed(1), status: data.internalNoise.status }}
                externalData={{ value: data.externalNoise.value.toFixed(1), status: data.externalNoise.status }}
                onClick={() => handlePairedMetricClick('noise', 'dB', data.internalNoise.history, data.externalNoise.history)}
            />
            <MetricCard title={t('internal_lux_level')} value={data.internalLux.value.toFixed(0)} unit="lux" status={data.internalLux.status} icon={<Icons.LuxIcon />} onClick={() => handleMetricClick('internal_lux_level', data.internalLux.history, 'lux')} />
            <MetricCard title={t('internal_lighting_status')} value={t(data.lightingStatus.value.toLowerCase())} unit="" status={data.lightingStatus.status} icon={<Icons.BulbIcon />} />
            <MetricCard title={t('air_shutter_status')} value={t(data.airShutterStatus.value.toLowerCase())} unit="" status={data.airShutterStatus.status} icon={<Icons.ShutterIcon />} />
        </MetricGroup>)}

        { (data.powerConsumption.value !== 0 || data.voltage.value !== 0 || data.current.value !== 0) && (
        <MetricGroup title={metricGroupTitles.power} isOpen={openSections[metricGroupTitles.power]} onToggle={() => toggleSection(metricGroupTitles.power)}>
            {data.powerConsumption.value !== 0 && <MetricCard title={t('power_consumption')} value={data.powerConsumption.value.toFixed(0)} unit="W" status={data.powerConsumption.status} icon={<Icons.PowerIcon />} onClick={() => handleMetricClick('power_consumption', data.powerConsumption.history, 'W')} />}
            {data.voltage.value !== 0 && <MetricCard title={t('voltage')} value={data.voltage.value.toFixed(0)} unit="V" status={data.voltage.status} icon={<Icons.PowerIcon />} onClick={() => handleMetricClick('voltage', data.voltage.history, 'V')} />}
            {data.current.value !== 0 && <MetricCard title={t('current')} value={data.current.value.toFixed(1)} unit="A" status={data.current.status} icon={<Icons.PowerIcon />} onClick={() => handleMetricClick('current', data.current.history, 'A')} />}
        </MetricGroup>)}
      </div>

        <AIAnalysisModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            analysisText={analysis}
            isLoading={isLoadingAnalysis}
        />
        <ChartModal 
            content={chartModalContent}
            onClose={() => setChartModalContent(null)}
        />
      </div>
    </div>
  );
};