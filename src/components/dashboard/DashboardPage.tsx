import React from 'react';
import { KpiGrid } from './KpiGrid';
import { LiveTrackingPanel } from './LiveTrackingPanel';
import { AllVehiclesWidget } from './AllVehiclesWidget';
import { WarehouseCapacityWidget } from './WarehouseCapacityWidget';
import { RecentShipmentsTable } from './RecentShipmentsTable';
import { 
  DashboardSummary, 
  Shipment, 
  Vehicle, 
  HubCapacity, 
  ExceptionItem,
  UserRole 
} from '../../types';
import { ShieldAlert, ArrowRight, Bot } from 'lucide-react';
import { TelematicsFleetStats } from '../../services/telematics/fleetSimulationService';

export interface DashboardPageProps {
  summary?: DashboardSummary;
  shipments: Shipment[];
  vehicles: Vehicle[];
  hubs: HubCapacity[];
  exceptions: ExceptionItem[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
  onSelectShipment: (shp: Shipment) => void;
  onOpenShipmentDetail: (id: string) => void;
  onReviewAiException: (id: string) => void;
  onOpenWarRoom: () => void;
  isLoading?: boolean;
  currentUserRole?: UserRole;
  isEnterpriseFleet?: boolean;
  onToggleEnterpriseFleet?: () => void;
  telematicsStats?: TelematicsFleetStats;
  isSimPaused?: boolean;
  onToggleSimPause?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  shipments,
  vehicles,
  hubs,
  exceptions,
  selectedVehicleId,
  onSelectVehicle,
  onSelectShipment,
  onOpenShipmentDetail,
  onReviewAiException,
  onOpenWarRoom,
  isLoading = false,
  currentUserRole: _currentUserRole,
  isEnterpriseFleet = false,
  onToggleEnterpriseFleet,
  telematicsStats,
  isSimPaused = false,
  onToggleSimPause,
}) => {
  // Check for critical exceptions requiring immediate war-room escalation
  const criticalException = exceptions.find((e) => e.severity === 'HIGH' && e.status !== 'RESOLVED');
  const mediumExceptionsCount = exceptions.filter((e) => e.severity === 'MEDIUM' && e.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* High-Severity Escalation Alert Banner */}
      {criticalException && (
        <div className="p-4 rounded-xl bg-[#8C2527] text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-[#EA341F]/40">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-white/10 flex-shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider !bg-white !text-[#8C2527] shadow-xs">
                  Critical War Room Active
                </span>
                <span className="font-mono text-xs font-bold opacity-90">
                  {criticalException.trackingId}
                </span>
              </div>
              <p className="text-xs font-medium text-white/95 mt-0.5">
                {criticalException.description} (SLA Impact: +{criticalException.slaImpactMinutes}m)
              </p>
            </div>
          </div>

          <button
            onClick={onOpenWarRoom}
            className="px-4 py-2 !bg-white !text-[#8C2527] hover:!bg-[#F8FAFC] rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer flex-shrink-0"
          >
            <span className="!text-[#8C2527]">Enter Escalation War Room</span>
            <ArrowRight className="w-4 h-4 !text-[#8C2527]" />
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <KpiGrid summary={summary} isLoading={isLoading} />

      {/* Central Tracking Workspace + Right Operational Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Main Central Map (8 cols on desktop) */}
        <div className="lg:col-span-8 flex flex-col h-[520px]">
          <LiveTrackingPanel
            vehicles={vehicles}
            shipments={shipments}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={onSelectVehicle}
            onOpenShipmentDetail={onOpenShipmentDetail}
            onReviewAiException={onReviewAiException}
            isSimulating={summary?.mode === 'DEMO'}
            isEnterpriseFleet={isEnterpriseFleet}
            onToggleEnterpriseFleet={onToggleEnterpriseFleet}
            telematicsStats={telematicsStats}
            isSimPaused={isSimPaused}
            onToggleSimPause={onToggleSimPause}
            className="h-full flex-1"
          />
        </div>

        {/* Right Stacked Operational Widgets (4 cols on desktop) */}
        <div className="lg:col-span-4 flex flex-col gap-3 h-[520px]">
          <AllVehiclesWidget
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={onSelectVehicle}
            className="flex-1 min-h-0"
          />

          <WarehouseCapacityWidget 
            hubs={hubs} 
            className="flex-1 min-h-0"
          />
        </div>
      </div>

      {/* Recent Shipments Table */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#09104D] uppercase tracking-wider">
              Recent Network Shipments
            </h3>
            <p className="text-xs text-[#393A50]">
              Operational manifest across ground, air, and marine freight corridors
            </p>
          </div>
          {mediumExceptionsCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#18217E]/10 border border-[#18217E]/30 text-xs text-[#18217E] font-semibold">
              <Bot className="w-4 h-4 text-[#18217E]" />
              <span>{mediumExceptionsCount} Pending Analyst Reviews</span>
            </div>
          )}
        </div>

        <RecentShipmentsTable
          shipments={shipments}
          isLoading={isLoading}
          onSelectShipment={onSelectShipment}
          onReviewAiException={onReviewAiException}
        />
      </div>
    </div>
  );
};
