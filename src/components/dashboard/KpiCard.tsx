import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { KpiMetric } from '../../types';

export interface KpiCardProps {
  title: string;
  metric: KpiMetric;
  unit?: string;
  subtitle?: string;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  metric,
  unit = '',
  subtitle = 'vs last month',
  className = '',
}) => {
  const { value, prevMonth, percentChange, trend = [], isPositiveGood = true } = metric;

  // Determine positive vs negative based on business impact
  const isIncrease = percentChange > 0;
  const isDecrease = percentChange < 0;

  // If higher is good: increase = green (#107C41), decrease = red (#EA341F)
  // If higher is bad: increase = red (#EA341F), decrease = green (#107C41)
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

  // Generate SVG path for sparkline trend
  const minVal = Math.min(...trend, 0);
  const maxVal = Math.max(...trend, 100);
  const range = maxVal - minVal || 1;
  const width = 80;
  const height = 28;

  const points = trend.map((val, idx) => {
    const x = (idx / (trend.length - 1 || 1)) * width;
    const y = height - ((val - minVal) / range) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={`bg-white rounded-xl border border-[#D0D9DE] p-5 shadow-card hover:shadow-card-hover transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#393A50] uppercase tracking-wider">
          {title}
        </span>
        {/* Micro sparkline */}
        {trend.length > 1 && (
          <div className="w-20 h-7 overflow-hidden">
            <svg width={width} height={height} className="overflow-visible">
              <polyline
                fill="none"
                stroke={isPositiveGood && isIncrease ? '#107C41' : isDecrease ? '#EA341F' : '#18217E'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-2xl font-black text-[#09104D] tracking-tight">
          {value.toLocaleString()}
          {unit}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-[#D0D9DE]/60">
        <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold ${changeColor}`}>
          <Icon className="w-3.5 h-3.5" />
          <span>
            {percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`}
          </span>
        </div>
        <div className="text-[11px] text-[#8A9995]">
          <span className="font-semibold text-[#393A50]">{prevMonth.toLocaleString()}{unit}</span> {subtitle}
        </div>
      </div>
    </div>
  );
};
