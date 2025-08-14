import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Site } from '../types';
import { SpinnerIcon } from './icons/MetricIcons';

interface MetricChartProps {
  titleKey: string;
  unit: string;
  internalField?: string;
  externalField?: string;
  authenticatedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  site: Site;
}

const BASE_URL = 'http://localhost:3001/api';

export const MetricChart: React.FC<MetricChartProps> = ({ titleKey, unit, internalField, externalField, authenticatedFetch, site }) => {
  const { theme, t } = useAppContext();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('-24h');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [seriesData, setSeriesData] = useState<{ nameKey: string, history: { time: number, value: number }[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number; nameKey: string; } | null>(null);

  const timePeriods = [
    { label: t('3_minutes'), value: '-3m' },
    { label: t('30_minutes'), value: '-30m' },
    { label: t('1_hour'), value: '-1h' },
    { label: t('6_hours'), value: '-6h' },
    { label: t('12_hours'), value: '-12h' },
    { label: t('24_hours'), value: '-24h' },
  ];

  const getMaxPoints = (period: string): number => {
    switch (period) {
      case '-3m': return 36;
      case '-30m': return 60;
      case '-1h': return 60;
      case '-6h': return 120;
      case '-12h': return 120;
      case '-24h': return 240;
      default: return 240;
    }
  };

  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      const fetchedSeries: { nameKey: string, history: { time: number, value: number }[] }[] = [];

      const fetchHistory = async (field: string, nameKey: string) => {
        try {
          const maxPoints = getMaxPoints(selectedPeriod);
          const response = await authenticatedFetch(`${BASE_URL}/sensor-data/history?measurement=sensor_data&field=${field}&range=${selectedPeriod}&maxPoints=${maxPoints}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const history = await response.json();
          const formattedHistory = history.filter((p: any) => p && p._value !== null && p._time).map((p: any) => ({ time: new Date(p._time).getTime(), value: p._value }));
          fetchedSeries.push({ nameKey, history: formattedHistory });
        } catch (error) {
          console.error(`Error fetching historical data for ${field}:`, error);
          fetchedSeries.push({ nameKey, history: [] });
        }
      };

      if (internalField) {
        await fetchHistory(internalField, 'internal');
      }
      if (externalField) {
        await fetchHistory(externalField, 'external');
      }

      setSeriesData(fetchedSeries);
      setIsLoading(false);
    };

    fetchChartData();
  }, [selectedPeriod, internalField, externalField, authenticatedFetch, site]);

  const handleMouseEnter = (event: React.MouseEvent<SVGCircleElement>, value: number, nameKey: string) => {
    if (chartContainerRef.current) {
      const containerRect = chartContainerRef.current.getBoundingClientRect();
      const circleRect = event.currentTarget.getBoundingClientRect();
      const svgRect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();

      if (svgRect) {
        const x = (circleRect.left - svgRect.left) + (svgRect.left - containerRect.left);
        const y = (circleRect.top - svgRect.top) + (svgRect.top - containerRect.top);
        setHoveredPoint({ x, y, value, nameKey });
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const width = 500;
  const height = 280;
  const padding = 40;

  const allHistory = seriesData.flatMap(s => s.history).filter(point => point !== null);
  console.log('allHistory.length', allHistory.length);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full" style={{ height: `${height}px` }}>
        <SpinnerIcon className="h-12 w-12 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (!allHistory || allHistory.length < 2) {
    return <div className="text-center p-10">Not enough data to display chart.</div>;
  }

  const xMin = Math.min(...allHistory.map(p => p.time));
  const xMax = Math.max(...allHistory.map(p => p.time));
  const yMin = Math.min(...allHistory.map(p => p.value));
  const yMax = Math.max(...allHistory.map(p => p.value));
  const yRange = yMax - yMin === 0 ? 1 : yMax - yMin;

  const xToSvg = (x: number) => {
      if (xMax - xMin === 0) {
          return padding;
      }
      return padding + ((x - xMin) / (xMax - xMin)) * (width - padding * 2);
  }
  const yToSvg = (y: number) => height - padding - 30 - ((y - yMin) / yRange) * (height - padding * 2 - 30);

  const gridColor = theme === 'dark' ? '#4a5568' : '#e2e8f0';
  const textColor = theme === 'dark' ? '#a0aec0' : '#4a5568';
  const seriesColors = theme === 'dark' ? ['#4fd1c5', '#f6e05e'] : ['#38b2ac', '#d69e2e'];

  const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
    const value = yMin + (yRange / 4) * i;
    const yPos = yToSvg(value);
    return { value, yPos };
  });

  const xAxisLabels = Array.from({ length: 5 }, (_, i) => {
      const timestamp = xMin + ((xMax - xMin) / 4) * i;
      const date = new Date(timestamp);
      const label = date.toLocaleTimeString(t.language, { hour: '2-digit', minute: '2-digit' });
      const xPos = xToSvg(timestamp);
      return { label, xPos };
  });

  return (
    <div className="flex flex-col items-center relative" ref={chartContainerRef}>
      <div className="relative inline-block text-left mb-4">
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="block appearance-none w-full bg-white dark:bg-brand-dark-light border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-brand-text py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white dark:focus:bg-brand-dark-light focus:border-brand-accent"
        >
          {timePeriods.map((period) => (
            <option key={period.value} value={period.value}>
              {period.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-brand-text">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} aria-label={`Chart of historical data.`}>
        {yAxisLabels.map(({ value, yPos }, i) => (
          <g key={`y-axis-${i}`}>
            <line x1={padding} y1={yPos} x2={width - padding} y2={yPos} stroke={gridColor} strokeDasharray="2,2" />
            <text x={padding - 8} y={yPos + 4} fill={textColor} textAnchor="end" fontSize="10">
              {value.toFixed(yRange < 10 ? 1 : 0)}
            </text>
          </g>
        ))}
        {xAxisLabels.map(({ label, xPos }, i) => (
            <text key={`x-axis-${i}`} x={xPos} y={height - padding - 30 + 20} fill={textColor} textAnchor="middle" fontSize="10">
                {label}
            </text>
        ))}
        {seriesData.map((s, seriesIndex) => {
            const pathD = s.history
              .map((point, i) => {
                if (point === null) return '';
                const x = xToSvg(point.time);
                const y = yToSvg(point.value);
                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
              })
              .join(' ');
          
            const color = seriesColors[seriesIndex % seriesColors.length];

            return (
               <g key={s.nameKey}>
                  <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {s.history.map((point, i) => (
                      point !== null && (
                          <circle
                              key={`point-${seriesIndex}-${i}`}
                              cx={xToSvg(point.time)}
                              cy={yToSvg(point.value)}
                              r="1.5"
                              fill={color}
                              onMouseEnter={(e) => handleMouseEnter(e, point.value, s.nameKey)}
                              onMouseLeave={handleMouseLeave}
                          />
                      )
                  ))}
              </g>
            )
        })}
        <g transform={`translate(${padding}, ${height - 20})`}>
            {seriesData.map((s, i) => (
                <g key={`legend-${i}`} transform={`translate(${i * 100}, 0)`}>
                    <rect x="0" y="-8" width="12" height="12" fill={seriesColors[i % seriesColors.length]} rx="2" />
                    <text x="20" y="0" fill={textColor} fontSize="12">{t(s.nameKey)}</text>
                </g>
            ))}
        </g>
      </svg>
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            left: hoveredPoint.x,
            top: hoveredPoint.y,
            transform: 'translate(-50%, calc(-100% - 5px))',
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333',
            padding: '5px 10px',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 100,
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          }}
        >
          {t(hoveredPoint.nameKey)}: {hoveredPoint.value.toFixed(2)} {unit}
        </div>
      )}
    </div>
  );
};