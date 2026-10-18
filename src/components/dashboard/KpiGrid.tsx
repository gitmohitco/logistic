import React from 'react';
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`kpi-skel-${i}`} className="bg-white rounded-xl border border-[#D0D9DE] p-4 shadow-card">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      <KpiCard
        title="Total Authorized"
        metric={{ ...totalShipments, isPositiveGood: true }}
      />
      <KpiCard
        title="In-Transit"
        metric={{ ...(activeDeliveries || totalShipments), isPositiveGood: true }}
      />
      <KpiCard
        title="Delivered"
        metric={
          deliveredShipments
            ? { ...deliveredShipments, isPositiveGood: true }
            : { value: 1, prevMonth: 1, percentChange: 0, trend: [1, 1], isPositiveGood: true }
        }
      />
      <KpiCard
        title="Delayed"
        metric={
          delayedShipments
            ? { ...delayedShipments, isPositiveGood: false }
            : { value: 2, prevMonth: 3, percentChange: -33, trend: [3, 2], isPositiveGood: false }
        }
      />
      <KpiCard
        title="SLA Risk"
        metric={
          slaAtRiskShipments
            ? { ...slaAtRiskShipments, isPositiveGood: false }
            : { value: 2, prevMonth: 2, percentChange: 0, trend: [2, 2], isPositiveGood: false }
        }
      />
      <KpiCard
        title="On-Time Rate"
        unit="%"
        metric={{ ...onTimeDelivery, isPositiveGood: true }}
      />
    </div>
  );
};

export const KpiGrid = React.memo(KpiGridComponent);

