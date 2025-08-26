import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useAirDomeData } from '../hooks/useAirDomeData';
import { MetricCard } from './MetricCard';
import { PairedMetricCard } from './PairedMetricCard';
import { StatusLevel, type Alert, type Site, type AirDomeData, type DomeSection, type Metric } from '../backend/src/types';
import * as Icons from './icons/MetricIcons';
import { AlertIcon } from './icons/NavIcons';
import { analyzeDomeDataStream, fetchAlerts } from '../services/geminiService';
import { SeverityBadge } from './SeverityBadge';
import { MetricChart } from './MetricChart';
import { MetricGroup } from './MetricGroup';
import { SpinnerIcon } from './icons/MetricIcons';
import { BrokerStatusCard } from './BrokerStatusCard'; // Add this line

// Helper function to create a unique key for a metric
const createMetricKey = (metric: { topic?: string | null; device_id?: string | null; mqtt_param: string }) => {
  return `${metric.topic || ''}:${metric.device_id || ''}:${metric.mqtt_param}`;
};

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
  const { authenticatedFetch, user } = useAuth(); // Add user here
  const { data, isLoading: isLoadingData, lastUpdated } = useAirDomeData(selectedSite, authenticatedFetch, (message) => {
    if (message.type === 'new_alert') {
      setActiveAlerts(prevAlerts => {
        const uniqueAlertsMap = new Map<string, Alert>();
        prevAlerts.forEach(alert => uniqueAlertsMap.set(alert.id, alert));
        uniqueAlertsMap.set(message.payload.id, message.payload);
        const updatedAlerts = Array.from(uniqueAlertsMap.values());
        return updatedAlerts
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 3);
      });
    } else if (message.type === 'alert_status_updated') {
      loadAlerts(); // Re-fetch all active alerts to reflect the change
    }
  });
  
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [chartModalContent, setChartModalContent] = useState<ChartModalContent | null>(null);
  const [domeMetricsStructure, setDomeMetricsStructure] = useState<DomeSection[]>([]);

  const formatMetricValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toFixed(1);
    }
    return 'N/A';
  };

  const loadAlerts = useCallback(async () => {
    const allAlerts = await fetchAlerts(selectedSite.id, { authenticatedFetch });
    const filteredActiveAlerts = allAlerts
      .filter(a => {
        return a.status === 'active';
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3);
    setActiveAlerts(filteredActiveAlerts);
  }, [selectedSite, authenticatedFetch]);

  useEffect(() => {
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
        const stream = analyzeDomeDataStream(data, language, { authenticatedFetch });
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
  
  const handleMetricClick = (title: string, metric: Metric, unit: string, label?: string) => {
    const field = createMetricKey(metric);
    setChartModalContent({ title, unit, internalField: field, internalLabel: label });
  };

  const handlePairedMetricClick = (
    title: string, 
    internalMetric: Metric, 
    externalMetric: Metric, 
    internalUnit: string, 
    externalUnit: string,
    internalLabel?: string,
    externalLabel?: string
  ) => {
      const internalField = createMetricKey(internalMetric);
      const externalField = createMetricKey(externalMetric);
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
              {activeAlerts.map(alert => (
                  <li key={alert.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 dark:bg-brand-dark rounded-lg gap-2">
                      <div className="flex items-center">
                          <SeverityBadge severity={alert.severity} />
                          <div className="ml-4">
                              <p className="font-semibold text-gray-800 dark:text-brand-text">{t(alert.parameter_key)}</p>
                              <p className="text-sm text-gray-600 dark:text-brand-text-dim">{t(alert.message_key, alert.message_params)}</p>
                          </div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-brand-text-dim sm:ml-4 flex-shrink-0">{new Date(alert.timestamp).toLocaleString(language)}</span>
                  </li>
              ))}
          </ul>
      </div>}

      {/* New Dome Metrics Section */}
      {domeMetricsStructure.length > 0 && (
        <div className="space-y-6 mt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-text">{t('new_dome_metrics')}</h2>
            {lastUpdated && (
            <p className="text-sm text-gray-500 dark:text-brand-text-dim">
              Last Updated: {new Date(lastUpdated).toLocaleString(language)}
            </p>
            ) }
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
                    const internalMetricKey = createMetricKey(item.metric1Data);
                    const externalMetricKey = createMetricKey(item.metric2Data);
                    const internalMetric = data?.[internalMetricKey];
                    const externalMetric = data?.[externalMetricKey];
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
                          value: formatMetricValue(internalMetric?.value),
                          status: internalMetric?.status ?? StatusLevel.Ok,
                        }}
                        externalData={{
                          value: formatMetricValue(externalMetric?.value),
                          status: externalMetric?.status ?? StatusLevel.Ok,
                        }}
                        internalLabel={internalLabel}
                        externalLabel={externalLabel}
                        onClick={() => handlePairedMetricClick(
                            groupTitle,
                            item.metric1Data, 
                            item.metric2Data, 
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
                          const metricKey = createMetricKey(metric);
                          return (
                            <MetricCard
                              key={metric.metric_id}
                              title={metricTitle}
                              value={formatMetricValue(data?.[metricKey]?.value)}
                              unit={metric.unit || metricUnits[metric.mqtt_param] || ''}
                              status={data?.[metricKey]?.status ?? StatusLevel.Ok}
                              icon={Icons[metric.icon as keyof typeof Icons] ? React.createElement(Icons[metric.icon as keyof typeof Icons]) : <Icons.PressureIcon />}
                              onClick={() => handleMetricClick(metricTitle, metric, metric.unit || '', metricTitle)}
                            />
                          );
                        })}
                      </MetricGroup>
                    );
                  }
                } else { // It's a direct Metric
                  const metric = item as Metric;
                  const unit = metric.unit || metricUnits[metric.mqtt_param] || '';
                  const metricTitle = language === 'zh' ? t(metric.display_name_tc || metric.display_name) : t(metric.display_name);
                  const metricKey = createMetricKey(metric);
                  return (
                    <MetricCard
                      key={itemKey}
                      title={metricTitle}
                      value={formatMetricValue(data?.[metricKey]?.value)}
                      unit={unit}
                      status={data?.[metricKey]?.status ?? StatusLevel.Ok}
                      icon={Icons[metric.icon as keyof typeof Icons] ? React.createElement(Icons[metric.icon as keyof typeof Icons]) : <Icons.PressureIcon />}
                      onClick={() => handleMetricClick(metricTitle, metric, unit, metricTitle)}
                    />
                  );
                }
              })}
            </MetricGroup>
            )
          })}
        </div>
      )}

      {user?.role === 'Admin' && <div className="pt-4"><BrokerStatusCard /></div>}

      <ChartModal 
        content={chartModalContent} 
        onClose={() => setChartModalContent(null)} 
        authenticatedFetch={authenticatedFetch}
        site={selectedSite}
        currentData={data}
      />
    </div>
  );
};