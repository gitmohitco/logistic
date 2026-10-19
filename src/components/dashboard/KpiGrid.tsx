import React from 'react';
import { Package, Truck, CheckCircle2, Clock, ShieldAlert, TrendingUp } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { DashboardSummary } from '../../types';
import { Skeleton } from '../ui/Skeleton';

export interface KpiGridProps {
  summary?: DashboardSummary;
  isLoading?: boolean;
}

const KpiGridComponent: React.FC<KpiGridProps> = ({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`kpi-skel-${i}`} className="bg-white rounded-xl border border-[#D0D9DE] p-3.5 shadow-card">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-7 w-14 mb-3" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const {
    totalShipments,
    activeDeliveries,
    deliveredShipments,
    delayedShipments,
    slaAtRiskShipments,
    onTimeDelivery,
  } = summary.kpi;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">
      <KpiCard
        title="Total Authorized"
        metric={{ ...totalShipments, isPositiveGood: true }}
        icon={<Package className="w-3.5 h-3.5 text-[#18217E]" />}
      />
      <KpiCard
        title="In-Transit"
        metric={{ ...(activeDeliveries || totalShipments), isPositiveGood: true }}
        icon={<Truck className="w-3.5 h-3.5 text-[#18217E]" />}
      />
      <KpiCard
        title="Delivered"
        metric={
          deliveredShipments
            ? { ...deliveredShipments, isPositiveGood: true }
            : { value: 1, prevMonth: 1, percentChange: 0, trend: [1, 1], isPositiveGood: true }
        }
        icon={<CheckCircle2 className="w-3.5 h-3.5 text-[#107C41]" />}
      />
      <KpiCard
        title="Delayed"
        metric={
          delayedShipments
            ? { ...delayedShipments, isPositiveGood: false }
            : { value: 2, prevMonth: 3, percentChange: -33, trend: [3, 2], isPositiveGood: false }
        }
        icon={<Clock className="w-3.5 h-3.5 text-[#EA341F]" />}
      />
      <KpiCard
        title="SLA Risk"
        metric={
          slaAtRiskShipments
            ? { ...slaAtRiskShipments, isPositiveGood: false }
            : { value: 2, prevMonth: 2, percentChange: 0, trend: [2, 2], isPositiveGood: false }
        }
        icon={<ShieldAlert className="w-3.5 h-3.5 text-[#8C2527]" />}
      />
      <KpiCard
        title="On-Time Rate"
        unit="%"
        metric={{ ...onTimeDelivery, isPositiveGood: true }}
        icon={<TrendingUp className="w-3.5 h-3.5 text-[#107C41]" />}
      />
    </div>
  );
};

export const KpiGrid = React.memo(KpiGridComponent);

