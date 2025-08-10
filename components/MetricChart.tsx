import React from 'react';
import { useAppContext } from '../context/AppContext';

interface MetricChartProps {
  series: { nameKey: string, history: number[] }[];
  unit: string;
}

export const MetricChart: React.FC<MetricChartProps> = ({ series, unit }) => {
  const { theme, t } = useAppContext();
  const width = 500;
  const height = 280; // Increased height for legend
  const padding = 40;

  const allHistory = series.flatMap(s => s.history);
  if (!allHistory || allHistory.length < 2) {
    return <div className="text-center p-10">Not enough data to display chart.</div>;
  }
  
  const historyLength = series[0]?.history.length || 0;

  const yMin = Math.min(...allHistory);
  const yMax = Math.max(...allHistory);
  const yRange = yMax - yMin === 0 ? 1 : yMax - yMin;

  const xStep = (width - padding * 2) / (historyLength - 1);
  
  const yToSvg = (y: number) => height - padding - 30 - ((y - yMin) / yRange) * (height - padding * 2 - 30); // Adjust for legend space

  const gridColor = theme === 'dark' ? '#4a5568' : '#e2e8f0';
  const textColor = theme === 'dark' ? '#a0aec0' : '#4a5568';
  const seriesColors = theme === 'dark' ? ['#4fd1c5', '#f6e05e'] : ['#38b2ac', '#d69e2e'];


  const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
    const value = yMin + (yRange / 4) * i;
    const yPos = yToSvg(value);
    return { value, yPos };
  });

  const xAxisLabels: { label: string; xPos: number }[] = [];
  const numPoints = historyLength;
  if (numPoints > 1) {
      const labels = [
        { label: '-24h', index: 0 },
        { label: '-18h', index: Math.round(numPoints / 4) },
        { label: '-12h', index: Math.round(numPoints / 2) },
        { label: '-6h', index: Math.round(numPoints * 3 / 4) },
        { label: t('now_label'), index: numPoints - 1 }
      ];

      const addedIndices = new Set<number>();
      labels.forEach(({ label, index }) => {
          if (!addedIndices.has(index)) {
              const xPos = padding + index * xStep;
              xAxisLabels.push({ label, xPos });
              addedIndices.add(index);
          }
      });
  }

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} aria-label={`Chart of historical data.`}>
      {/* Y-axis grid lines and labels */}
      {yAxisLabels.map(({ value, yPos }, i) => (
        <g key={`y-axis-${i}`}>
          <line x1={padding} y1={yPos} x2={width - padding} y2={yPos} stroke={gridColor} strokeDasharray="2,2" />
          <text x={padding - 8} y={yPos + 4} fill={textColor} textAnchor="end" fontSize="10">
            {value.toFixed(yRange < 10 ? 1 : 0)}
          </text>
        </g>
      ))}

      {/* X-axis base line */}
      <line x1={padding} y1={height - padding - 30} x2={width - padding} y2={height - padding - 30} stroke={gridColor} />
      
      {/* X-axis labels */}
      {xAxisLabels.map(({ label, xPos }, i) => (
          <text key={`x-axis-${i}`} x={xPos} y={height - padding - 30 + 20} fill={textColor} textAnchor="middle" fontSize="10">
              {label}
          </text>
      ))}
      
      {/* Data lines and points */}
      {series.map((s, seriesIndex) => {
          const pathD = s.history
            .map((point, i) => {
              const x = padding + i * xStep;
              const y = yToSvg(point);
              return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
            })
            .join(' ');
        
          const color = seriesColors[seriesIndex % seriesColors.length];

          return (
             <g key={s.nameKey}>
                <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {s.history.map((point, i) => (
                    <circle key={`point-${seriesIndex}-${i}`} cx={padding + i * xStep} cy={yToSvg(point)} r="3" fill={color}>
                        <title>{`${t(s.nameKey)}: ${point.toFixed(2)} ${unit}`}</title>
                    </circle>
                ))}
            </g>
          )
      })}
      
      {/* Legend */}
      <g transform={`translate(${padding}, ${height - 20})`}>
          {series.map((s, i) => (
              <g key={`legend-${i}`} transform={`translate(${i * 100}, 0)`}>
                  <rect x="0" y="-8" width="12" height="12" fill={seriesColors[i % seriesColors.length]} rx="2" />
                  <text x="20" y="0" fill={textColor} fontSize="12">{t(s.nameKey)}</text>
              </g>
          ))}
      </g>
    </svg>
  );
};