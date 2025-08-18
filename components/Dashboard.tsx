import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useAirDomeData } from '../hooks/useAirDomeData';
import { MetricCard } from './MetricCard';
import { PairedMetricCard } from './PairedMetricCard';
import { StatusLevel, type Alert, type Site, type AirDomeData, type DomeSection } from '../backend/src/types';
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
        <div className="flex-grow overflow-y-auto pr-2 text-gray-700 dark:text-brand-text prose dark:prose-invert">
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

interface ChartModalContent {
    title: string;
    unit?: string;
    internalField?: string;
    externalField?: string;
    internalLabel?: string;
    externalLabel?: string;
    internalUnit?: string;
    externalUnit?: string;
}

const ChartModal: React.FC<{ content: ChartModalContent | null; onClose: () => void; authenticatedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>; site: Site; currentData: AirDomeData }> = ({ content, onClose, authenticatedFetch, site, currentData }) => {
    const { t } = useAppContext();
    if (!content) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-2xl p-6 w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-brand-accent mb-4">{t('historical_data')}: {content.title}</h2>
                <div className="flex justify-center">
                    <MetricChart
                        unit={content.unit}
                        internalField={content.internalField}
                        externalField={content.externalField}
                        internalLabel={content.internalLabel}
                        externalLabel={content.externalLabel}
                        internalUnit={content.internalUnit}
                        externalUnit={content.externalUnit}
                        authenticatedFetch={authenticatedFetch}
                        site={site}
                        currentData={currentData}
                    />
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
  const { data, isLoading: isLoadingData, lastUpdated } = useAirDomeData(selectedSite, authenticatedFetch, (newAlert) => {
    console.log('[Dashboard] Received new alert in callback:', newAlert);
    setActiveAlerts(prevAlerts => {
      const updatedAlerts = [newAlert, ...prevAlerts];
      return updatedAlerts
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3);
    });
    console.log('[Dashboard] activeAlerts state updated.');
  });
  
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [chartModalContent, setChartModalContent] = useState<ChartModalContent | null>(null);
  const [domeMetricsStructure, setDomeMetricsStructure] = useState<DomeSection[]>([]);

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

    const fetchDomeMetricsStructure = async () => {
      try {
        const response = await authenticatedFetch('/api/dome-metrics-structure');
        if (response.ok) {
          const data = await response.json();
          setDomeMetricsStructure(data);
        } else {
          console.error('Failed to fetch dome metrics structure', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching dome metrics structure:', error);
      }
    };
    fetchDomeMetricsStructure();
  }, [selectedSite, authenticatedFetch]);

  const metricGroupTitles = {
      dome_integrity: t('dome_integrity'),
      environment: t('environment'),
      air_quality: t('air_quality'),
      systems_status: t('systems_status'),
      power: t('power'),
  };

  const metricUnits: { [key: string]: string } = {
    internalPressure: 'Pa',
    externalPressure: 'Pa',
    basePressure: 'kPa',
    fanSpeed: 'RPM',
    internalTemperature: '°C',
    externalTemperature: '°C',
    internalHumidity: '%RH',
    externalHumidity: '%RH',
    externalWindSpeed: 'm/s',
    internalPM25: 'µg/m³',
    externalPM25: 'µg/m³',
    internalCO2: 'ppm',
    externalCO2: 'ppm',
    internalO2: '%',
    externalO2: '%',
    internalCO: 'ppm',
    externalCO: 'ppm',
    airExchangeRate: 'm³/h',
    internalNoise: 'dB',
    externalNoise: 'dB',
    internalLux: 'lux',
    powerConsumption: 'W',
    voltage: 'V',
    current: 'A',
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
  
  const handleMetricClick = (title: string, field: string, unit: string, label?: string) => {
    setChartModalContent({ title, unit, internalField: field, internalLabel: label });
  };

  const handlePairedMetricClick = (
    title: string, 
    internalField: string, 
    externalField: string, 
    internalUnit: string, 
    externalUnit: string,
    internalLabel?: string,
    externalLabel?: string
  ) => {
      setChartModalContent({
        title,
        internalField,
        externalField,
        internalUnit,
        externalUnit,
        internalLabel,
        externalLabel,
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

  return (
    <div className="space-y-6">
      {activeAlerts.length > 0 && <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex items-center mb-4">
              <AlertIcon className="h-6 w-6 text-brand-accent mr-3"/>
              <h2 className="text-xl font-bold text-gray-900 dark:text-brand-text">{t('active_alerts')}</h2>
          </div>
          <ul className="space-y-4">
              {[...new Map(activeAlerts.map(item => [item.id, item])).values()].map(alert => (
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
      </div>}

      <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-text">Dome Metrics</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-500 dark:text-brand-text-dim">
              Last Updated: {new Date(lastUpdated).toLocaleString(language)}
            </p>
          )}
      </div>
      
      <div className="space-y-6">
        { (data.internalPressure.value !== 0 || data.externalPressure.value !== 0 || data.basePressure.value !== 0 || data.fanSpeed.value !== 0) && (
        <MetricGroup title={metricGroupTitles.dome_integrity} isOpen={openSections[metricGroupTitles.dome_integrity]} onToggle={() => toggleSection(metricGroupTitles.dome_integrity)}>
            <PairedMetricCard title={`${t('pressure')}`} icon={<Icons.PressureIcon />} 
                internalUnit="hPa" 
                externalUnit="hPa" 
                internalData={{ value: data.internalPressure.value?.toFixed(1) ?? 'N/A', status: data.internalPressure.status }}
                externalData={{ value: data.externalPressure.value?.toFixed(1) ?? 'N/A', status: data.externalPressure.status }}
                internalLabel={t('internal')}
                externalLabel={t('external')}
                onClick={() => handlePairedMetricClick(`${t('pressure')}`, 'internalPressure', 'externalPressure', 'hPa', 'hPa', t('internal'), t('external'))}
            />
            {data.basePressure && <MetricCard title={t('base_corner_pressure')} value={data.basePressure.value?.toFixed(1) ?? 'N/A'} unit="kPa" status={data.basePressure.status} icon={<Icons.PressureIcon />} onClick={() => handleMetricClick(`${t('base_corner_pressure')}`, 'basePressure', 'kPa', t('base_corner_pressure'))} />}
            <MetricCard title={t('membrane_health')} value={t(data.membraneHealth.status === StatusLevel.Ok ? 'normal' : 'defect_detected')} unit="" status={data.membraneHealth.status} icon={<Icons.MembraneIcon />} />
            <MetricCard title={t('fan_speed')} value={data.fanSpeed.value?.toFixed(0) ?? 'N/A'} unit="RPM" status={data.fanSpeed.status} icon={<Icons.FanIcon />} onClick={() => handleMetricClick(`${t('fan_speed')}`, 'fanSpeed', 'RPM', t('fan_speed'))} />
        </MetricGroup>)}

        { (data.internalTemperature.value !== 0 || data.externalTemperature.value !== 0 || data.internalHumidity.value !== 0 || data.externalHumidity.value !== 0 || data.externalWindSpeed.value !== 0) && (
        <MetricGroup title={metricGroupTitles.environment} isOpen={openSections[metricGroupTitles.environment]} onToggle={() => toggleSection(metricGroupTitles.environment)}>
            <PairedMetricCard title={`${t('temperature')}`} icon={<Icons.TempIcon />} 
                internalUnit="°C"
                externalUnit="°C"
                internalData={{ value: data.internalTemperature.value?.toFixed(1) ?? 'N/A', status: data.internalTemperature.status }}
                externalData={{ value: data.externalTemperature.value?.toFixed(1) ?? 'N/A', status: data.externalTemperature.status }}
                internalLabel={t('internal')}
                externalLabel={t('external')}
                onClick={() => handlePairedMetricClick(`${t('temperature')}`, 'internalTemperature', 'externalTemperature', '°C', '°C', t('internal'), t('external'))}
            />
            <PairedMetricCard title={`${t('humidity')}`} icon={<Icons.HumidityIcon />} 
                internalUnit="%RH"
                externalUnit="%RH"
                internalData={{ value: data.internalHumidity.value?.toFixed(0) ?? 'N/A', status: data.internalHumidity.status }}
                externalData={{ value: data.externalHumidity.value?.toFixed(0) ?? 'N/A', status: data.externalHumidity.status }}
                internalLabel={t('internal')}
                externalLabel={t('external')}
                onClick={() => handlePairedMetricClick(`${t('humidity')}`, 'internalHumidity', 'externalHumidity', '%RH', '%RH', t('internal'), t('external'))}
            />
            <MetricCard title={t('external_wind_speed')} value={data.externalWindSpeed.value?.toFixed(1) ?? 'N/A'} unit="m/s" status={data.externalWindSpeed.status} icon={<Icons.WindIcon />} onClick={() => handleMetricClick(`${t('external_wind_speed')}`, 'externalWindSpeed', 'm/s', t('external_wind_speed'))} />
        </MetricGroup>)}

        { (data.internalPM25.value !== 0 || data.externalPM25.value !== 0 || data.internalCO2.value !== 0 || data.externalCO2.value !== 0 || data.internalO2.value !== 0 || data.externalO2.value !== 0 || data.internalCO.value !== 0 || data.externalCO.value !== 0 || data.airExchangeRate.value !== 0) && (
        <MetricGroup title={metricGroupTitles.air_quality} isOpen={openSections[metricGroupTitles.air_quality]} onToggle={() => toggleSection(metricGroupTitles.air_quality)}>
            <PairedMetricCard title={`${t('pm25')}`} icon={<Icons.PM25Icon />} 
                internalUnit="µg/m³"
                externalUnit="µg/m³"
                internalData={{ value: data.internalPM25.value?.toFixed(1) ?? 'N/A', status: data.internalPM25.status }}
                externalData={{ value: data.externalPM25.value?.toFixed(1) ?? 'N/A', status: data.externalPM25.status }}
                internalLabel={t('internal')}
                externalLabel={t('external')}
                onClick={() => handlePairedMetricClick(`${t('pm25')}`, 'internalPM25', 'externalPM25', 'µg/m³', 'µg/m³', t('internal'), t('external'))}
            />
            <PairedMetricCard title={`${t('co2')}`} icon={<Icons.CO2Icon />} 
                internalUnit="ppm"
                externalUnit="ppm"
                internalData={{ value: data.internalCO2.value?.toFixed(0) ?? 'N/A', status: data.internalCO2.status }}
                externalData={{ value: data.externalCO2.value?.toFixed(0) ?? 'N/A', status: data.externalCO2.status }}
                internalLabel={t('internal')}
                externalLabel={t('external')}
                onClick={() => handlePairedMetricClick(`${t('co2')}`, 'internalCO2', 'externalCO2', 'ppm', 'ppm', t('internal'), t('external'))}
            />
            <PairedMetricCard title={`${t('o2')}`} icon={<Icons.O2Icon />} 
                internalUnit="%"
                externalUnit="%"
                internalData={{ value: data.internalO2.value?.toFixed(1) ?? 'N/A', status: data.internalO2.status }}
                externalData={{ value: data.externalO2.value?.toFixed(1) ?? 'N/A', status: data.externalO2.status }}
                internalLabel={t('internal')}
                externalLabel={t('external')}
                onClick={() => handlePairedMetricClick(`${t('o2')}`, 'internalO2', 'externalO2', '%', '%', t('internal'), t('external'))}
            />
             <PairedMetricCard title={`${t('co')}`} icon={<Icons.COIcon />} 
                internalUnit="ppm"
                externalUnit="ppm"
                internalData={{ value: data.internalCO.value?.toFixed(1) ?? 'N/A', status: data.internalCO.status }}
                externalData={{ value: data.externalCO.value?.toFixed(1) ?? 'N/A', status: data.externalCO.status }}
                internalLabel={t('internal')}
                externalLabel={t('external')}
                onClick={() => handlePairedMetricClick(`${t('co')}`, 'internalCO', 'externalCO', 'ppm', 'ppm', t('internal'), t('external'))}
            />
            <MetricCard title={t('air_exchange_rate')} value={data.airExchangeRate.value?.toFixed(0) ?? 'N/A'} unit="m³/h" status={data.airExchangeRate.status} icon={<Icons.AirExchangeIcon />} onClick={() => handleMetricClick(`${t('air_exchange_rate')} ${t('air_exchange_rate_tc') ? `(${t('air_exchange_rate_tc')})` : ''}`, 'airExchangeRate', 'm³/h', t('air_exchange_rate'))} />
        </MetricGroup>)}
        
        { (data.internalNoise.value !== 0 || data.externalNoise.value !== 0 || data.internalLux.value !== 0) && (
        <MetricGroup title={metricGroupTitles.systems_status} isOpen={openSections[metricGroupTitles.systems_status]} onToggle={() => toggleSection(metricGroupTitles.systems_status)}>
            <PairedMetricCard title={`${t('noise')}`} icon={<Icons.NoiseIcon />} 
                internalUnit="dB"
                externalUnit="dB"
                internalData={{ value: data.internalNoise.value?.toFixed(1) ?? 'N/A', status: data.internalNoise.status }}
                externalData={{ value: data.externalNoise.value?.toFixed(1) ?? 'N/A', status: data.externalNoise.status }}
                internalLabel={t('internal')}
                externalLabel={t('external')}
                onClick={() => handlePairedMetricClick(`${t('noise')}`, 'internalNoise', 'externalNoise', 'dB', 'dB', t('internal'), t('external'))}
            />
            <MetricCard title={t('internal_lux_level')} value={data.internalLux.value?.toFixed(0) ?? 'N/A'} unit="lux" status={data.internalLux.status} icon={<Icons.LuxIcon />} onClick={() => handleMetricClick(`${t('internal_lux_level')} ${t('internal_lux_level_tc') ? `(${t('internal_lux_level_tc')})` : ''}`, 'internalLux', 'lux', t('internal_lux_level'))} />
            <MetricCard title={t('internal_lighting_status')} value={t(data.lightingStatus.value.toLowerCase())} unit="" status={data.lightingStatus.status} icon={<Icons.BulbIcon />} />
            <MetricCard title={t('air_shutter_status')} value={t(data.airShutterStatus.value.toLowerCase())} unit="" status={data.airShutterStatus.status} icon={<Icons.ShutterIcon />} />
        </MetricGroup>)}

        { (data.powerConsumption.value !== 0 || data.voltage.value !== 0 || data.current.value !== 0) && (
        <MetricGroup title={metricGroupTitles.power} isOpen={openSections[metricGroupTitles.power]} onToggle={() => toggleSection(metricGroupTitles.power)}>
            {data.powerConsumption.value !== 0 && <MetricCard title={t('power_consumption')} value={data.powerConsumption.value?.toFixed(0) ?? 'N/A'} unit="W" status={data.powerConsumption.status} icon={<Icons.PowerIcon />} onClick={() => handleMetricClick(`${t('power_consumption')} ${t('power_consumption_tc') ? `(${t('power_consumption_tc')})` : ''}`, 'powerConsumption', 'W', t('power_consumption'))} />}
            {data.voltage.value !== 0 && <MetricCard title={t('voltage')} value={data.voltage.value?.toFixed(0) ?? 'N/A'} unit="V" status={data.voltage.status} icon={<Icons.PowerIcon />} onClick={() => handleMetricClick(`${t('voltage')} ${t('voltage_tc') ? `(${t('voltage_tc')})` : ''}`, 'voltage', 'V', t('voltage'))} />}
            {data.current.value !== 0 && <MetricCard title={t('current')} value={data.current.value?.toFixed(1) ?? 'N/A'} unit="A" status={data.current.status} icon={<Icons.PowerIcon />} onClick={() => handleMetricClick(`${t('current')} ${t('current_tc') ? `(${t('current_tc')})` : ''}`, 'current', 'A', t('current'))} />}
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
            authenticatedFetch={authenticatedFetch}
            site={selectedSite}
            currentData={data}
        />

      {/* New Dome Metrics Section */}
      {domeMetricsStructure.length > 0 && (
        <div className="space-y-6 mt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-text">{t('new_dome_metrics')}</h2>
          </div>
          {domeMetricsStructure.map(section => {
            const title = language === 'zh' ? t(section.section_name_tc || section.section_name) : t(section.section_name);
            return (
            <MetricGroup
              key={section.section_id}
              title={title}
              isOpen={openSections[title] !== false} // Default to open
              onToggle={() => toggleSection(title)} // Use the toggle function
            >
              {section.items.map(item => {
                const itemKey = `${item.item_type}-${item.section_item_id}`; // Composite key using section_item_id
                if ('metrics' in item) { // It's a MetricGroup
                  if (item.metric1Data && item.metric2Data) {
                    // Render PairedMetricCard if both metric1Data and metric2Data are found
                    const internalMetric = data?.[item.metric1Data.mqtt_param || ''];
                    const externalMetric = data?.[item.metric2Data.mqtt_param || ''];
                    const internalLabel = language === 'zh' ? item.metric1_display_name_tc || item.metric1_display_name : item.metric1_display_name;
                    const externalLabel = language === 'zh' ? item.metric2_display_name_tc || item.metric2_display_name : item.metric2_display_name;
                    const internalUnit = item.metric1Data.unit || metricUnits[item.metric1Data.mqtt_param] || '';
                    const externalUnit = item.metric2Data.unit || metricUnits[item.metric2Data.mqtt_param] || '';
                    const groupTitle = language === 'zh' ? item.metric_group_name_tc || item.metric_group_name : item.metric_group_name;
                    return (
                      <PairedMetricCard
                        key={itemKey}
                        title={groupTitle}
                        icon={Icons[item.metric_group_icon as keyof typeof Icons] ? React.createElement(Icons[item.metric_group_icon as keyof typeof Icons]) : <Icons.PressureIcon />} // Use metric_group_icon
                        internalUnit={internalUnit}
                        externalUnit={externalUnit}
                        internalData={{
                          value: internalMetric?.value?.toFixed(1) ?? 'N/A',
                          status: internalMetric?.status ?? StatusLevel.Ok,
                        }}
                        externalData={{
                          value: externalMetric?.value?.toFixed(1) ?? 'N/A',
                          status: externalMetric?.status ?? StatusLevel.Ok,
                        }}
                        internalLabel={internalLabel}
                        externalLabel={externalLabel}
                        onClick={() => handlePairedMetricClick(
                            groupTitle,
                            item.metric1Data.mqtt_param, 
                            item.metric2Data.mqtt_param, 
                            internalUnit, 
                            externalUnit,
                            internalLabel,
                            externalLabel
                        )}
                      />
                    );
                  } else {
                    // Fallback to rendering individual MetricCards if not a paired group or data is missing
                    return (
                      <MetricGroup
                        key={itemKey}
                        title={language === 'zh' ? t(item.metric_group_name_tc || item.metric_group_name) : t(item.metric_group_name)}
                        isOpen={true}
                        onToggle={() => {}}
                      >
                        {item.metrics.map(metric => {
                          const metricTitle = language === 'zh' ? t(metric.display_name_tc || metric.display_name) : t(metric.display_name);
                          return (
                            <MetricCard
                              key={metric.metric_id}
                              title={metricTitle}
                              value={data?.[metric.mqtt_param]?.value?.toFixed(1) ?? 'N/A'}
                              unit={metric.unit || metricUnits[metric.mqtt_param] || ''}
                              status={data?.[metric.mqtt_param]?.status ?? StatusLevel.Ok}
                              icon={Icons[metric.icon as keyof typeof Icons] ? React.createElement(Icons[metric.icon as keyof typeof Icons]) : <Icons.PressureIcon />}
                              onClick={() => handleMetricClick(metricTitle, metric.mqtt_param, metric.unit || '', metricTitle)}
                            />
                          );
                        })}
                      </MetricGroup>
                    );
                  }
                } else { // It's a direct Metric
                  const metric = item;
                  const unit = metric.unit || metricUnits[metric.mqtt_param] || '';
                  const metricTitle = language === 'zh' ? t(metric.display_name_tc || metric.display_name) : t(metric.display_name);
                  return (
                    <MetricCard
                      key={itemKey}
                      title={metricTitle}
                      value={data?.[metric.mqtt_param]?.value?.toFixed(1) ?? 'N/A'}
                      unit={unit}
                      status={data?.[metric.mqtt_param]?.status ?? StatusLevel.Ok}
                      icon={Icons[metric.icon as keyof typeof Icons] ? React.createElement(Icons[metric.icon as keyof typeof Icons]) : <Icons.PressureIcon />}
                      onClick={() => handleMetricClick(metricTitle, metric.mqtt_param, unit, metricTitle)}
                    />
                  );
                }
              })}
            </MetricGroup>
            )
          })}
        </div>
      )}
    </div>
  );
};