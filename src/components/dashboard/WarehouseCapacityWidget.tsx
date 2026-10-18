import React from 'react';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { HubCapacity } from '../../types';
import { Warehouse, AlertTriangle } from 'lucide-react';

export interface WarehouseCapacityWidgetProps {
  hubs: HubCapacity[];
  className?: string;
}

const WarehouseCapacityWidgetComponent: React.FC<WarehouseCapacityWidgetProps> = ({
  hubs,
  className = '',
}) => {
  // Compute overall network capacity
  const totalNetworkCapacity = hubs.reduce((acc, h) => acc + h.totalCapacity, 0);
  const occupiedNetworkCapacity = hubs.reduce((acc, h) => acc + h.occupiedCapacity, 0);
  const avgUtilization = totalNetworkCapacity > 0
    ? Math.round((occupiedNetworkCapacity / totalNetworkCapacity) * 100)
    : 0;

  return (
    <Card
      compact
      noPadding
      title="Warehouse Capacity"
      subtitle={`Network Utilization: ${avgUtilization}% across ${hubs.length} regional hubs`}
      action={
        <div className="flex items-center gap-1 text-[11px] text-[#393A50] font-medium">
          <Warehouse className="w-3 h-3 text-[#18217E]" />
          <span>Real-time</span>
        </div>
      }
      className={`flex flex-col ${className}`}
      bodyClassName="flex-1 min-h-0 flex flex-col"
    >
      <div className="p-2.5 space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
        {hubs.map((hub) => {
          const remaining = Math.max(0, hub.totalCapacity - hub.occupiedCapacity);
          const utilization = hub.totalCapacity > 0
            ? Math.round((hub.occupiedCapacity / hub.totalCapacity) * 100)
            : 0;
          const isOverCapacity = hub.occupiedCapacity > hub.totalCapacity;
          const isWarning = utilization >= 85;

          return (
            <div
              key={hub.id}
              className="px-2.5 py-1.5 rounded-lg bg-[#F4F7F9] border border-[#D0D9DE]/70 hover:border-[#424989] transition-all"
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h4 className="text-xs font-bold text-[#09104D] flex items-center gap-1.5 leading-tight">
                    <span>{hub.hubName}</span>
                    <span className="text-[10px] font-mono text-[#8A9995] font-normal">
                      ({hub.hubCode})
                    </span>
                  </h4>
                  <div className="text-[10px] text-[#393A50] mt-0.5 leading-tight">
                    Remaining: <strong className="text-[#070724]">{remaining.toLocaleString()} {hub.capacityUnit}</strong>
                  </div>
                </div>

                <div className="text-right leading-tight">
                  <div className={`text-xs font-black ${
                    isOverCapacity || utilization >= 90 ? 'text-[#EA341F]' :
                    utilization >= 75 ? 'text-[#424989]' : 'text-[#18217E]'
                  }`}>
                    {utilization}%
                  </div>
                  <div className="text-[9px] text-[#8A9995]">
                    {hub.occupiedCapacity.toLocaleString()} / {hub.totalCapacity.toLocaleString()} {hub.capacityUnit}
                  </div>
                </div>
              </div>

              {/* Progress Bar with semantic color thresholds */}
              <ProgressBar
                value={hub.occupiedCapacity}
                max={hub.totalCapacity}
                showPercent={false}
                size="sm"
                variant="auto"
              />

              {/* Threshold warning note */}
              {isOverCapacity ? (
                <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-[#EA341F]">
                  <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
                  <span>CRITICAL: Hub exceeds safe storage volume limit!</span>
                </div>
              ) : isWarning ? (
                <div className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-[#424989]">
                  <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
                  <span>High occupancy warning: Approaching capacity ceiling</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const WarehouseCapacityWidget = React.memo(WarehouseCapacityWidgetComponent);

