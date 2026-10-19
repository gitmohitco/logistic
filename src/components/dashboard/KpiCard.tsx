import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { KpiMetric } from '../../types';

export interface KpiCardProps {
  title: string;
  metric: KpiMetric;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  metric,
  unit = '',
  subtitle = 'vs last month',
  icon,
  className = '',
}) => {
  const { value, prevMonth, percentChange, trend = [], isPositiveGood = true } = metric;

  // Determine positive vs negative based on business impact
  const isIncrease = percentChange > 0;
  const isDecrease = percentChange < 0;

  let changeColor = 'text-[#393A50] bg-[#E5EBEE]';
  let Icon = Minus;

  if (isIncrease) {
    Icon = ArrowUpRight;
    changeColor = isPositiveGood
      ? 'text-[#107C41] bg-[#107C41]/10 border border-[#107C41]/20'
      : 'text-[#EA341F] bg-[#EA341F]/10 border border-[#EA341F]/20';
  } else if (isDecrease) {
    Icon = ArrowDownRight;
    changeColor = isPositiveGood
      ? 'text-[#EA341F] bg-[#EA341F]/10 border border-[#EA341F]/20'
      : 'text-[#107C41] bg-[#107C41]/10 border border-[#107C41]/20';
  }

  // Stroke color for sparkline
  const strokeColor = isPositiveGood
    ? (isIncrease ? '#107C41' : isDecrease ? '#EA341F' : '#18217E')
    : (isDecrease ? '#107C41' : isIncrease ? '#EA341F' : '#18217E');

  // Compute sparkline points with proper local normalization
  const svgWidth = 56;
  const svgHeight = 22;
  const padY = 3;
  const usableH = svgHeight - padY * 2;

  let polylinePoints = '';
  let areaPoints = '';

  if (trend.length > 1) {
    const minVal = Math.min(...trend);
    const maxVal = Math.max(...trend);
    const range = maxVal - minVal;

    const coords = trend.map((val, idx) => {
      const x = (idx / (trend.length - 1)) * svgWidth;
      const y = range === 0
        ? svgHeight / 2
        : svgHeight - padY - ((val - minVal) / range) * usableH;
      return [Number(x.toFixed(1)), Number(y.toFixed(1))];
    });

    polylinePoints = coords.map(([x, y]) => `${x},${y}`).join(' ');
    areaPoints = `0,${svgHeight} ` + coords.map(([x, y]) => `${x},${y}`).join(' ') + ` ${svgWidth},${svgHeight}`;
  }

  const gradientId = `spark-grad-${title.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className={`bg-white rounded-xl border border-[#D0D9DE] p-3.5 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between ${className}`}>
      {/* Top Header: Category Title + Optional Icon */}
      <div className="flex items-center justify-between gap-1.5 min-h-[28px]">
        <span className="text-[10px] font-bold text-[#475569] uppercase tracking-wider leading-tight" title={title}>
          {title}
        </span>
        {icon && (
          <span className="p-1 rounded-md bg-[#F4F7F9] flex-shrink-0">
            {icon}
          </span>
        )}
      </div>

      {/* Middle Row: Primary Value + Sparkline */}
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-black text-[#09104D] tracking-tight">
          {value.toLocaleString()}
          {unit && <span className="text-lg font-bold text-[#475569] ml-0.5">{unit}</span>}
        </span>

        {trend.length > 1 && (
          <div className="w-14 h-5 flex-shrink-0 self-center" title="Recent trend">
            <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-hidden">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <polygon fill={`url(#${gradientId})`} points={areaPoints} />
              <polyline
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Bottom Row: Delta Badge & Comparison Context */}
      <div className="mt-3 pt-2 border-t border-[#D0D9DE]/60 flex items-center justify-between gap-1.5 min-w-0">
        <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 whitespace-nowrap ${changeColor}`}>
          <Icon className="w-3 h-3 shrink-0" />
          <span>
            {percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`}
          </span>
        </div>
        <div
          className="text-[10px] text-[#8A9995] text-right truncate min-w-0 whitespace-nowrap"
          title={`Previous period: ${prevMonth.toLocaleString()}${unit}`}
        >
          <span className="font-semibold text-[#393A50]">{prevMonth.toLocaleString()}{unit}</span> prior
        </div>
      </div>
    </div>
  );
};
