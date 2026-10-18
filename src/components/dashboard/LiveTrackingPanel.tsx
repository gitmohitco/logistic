import React from 'react';
import { TrackingMap } from './TrackingMap';
import { TrackingDetailCard } from './TrackingDetailCard';
import { Shipment, Vehicle } from '../../types';

import { TelematicsFleetStats } from '../../services/telematics/fleetSimulationService';

export interface LiveTrackingPanelProps {
  vehicles: Vehicle[];
  shipments: Shipment[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string) => void;
  onOpenShipmentDetail: (shipmentId: string) => void;
  onReviewAiException: (exceptionId: string) => void;
  isSimulating?: boolean;
  className?: string;
  isEnterpriseFleet?: boolean;
  onToggleEnterpriseFleet?: () => void;
  telematicsStats?: TelematicsFleetStats;
  isSimPaused?: boolean;
  onToggleSimPause?: () => void;
}

export const LiveTrackingPanel: React.FC<LiveTrackingPanelProps> = ({
  vehicles,
  shipments,
  selectedVehicleId,
  onSelectVehicle,
  onOpenShipmentDetail,
  onReviewAiException,
  isSimulating = false,
  className = '',
  isEnterpriseFleet = false,
  onToggleEnterpriseFleet,
  telematicsStats,
  isSimPaused = false,
  onToggleSimPause,
}) => {
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;
  const selectedShipment = shipments.find(
    (s) => s.vehicleId === selectedVehicleId || (selectedVehicle && s.vehicleCode === selectedVehicle.vehicleCode)
  ) || null;

  return (
    <div className={`relative h-full flex flex-col ${className}`}>
      {/* Interactive Map Canvas */}
      <TrackingMap
        vehicles={vehicles}
        shipments={shipments}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={onSelectVehicle}
        isSimulating={isSimulating}
        isEnterpriseFleet={isEnterpriseFleet}
        onToggleEnterpriseFleet={onToggleEnterpriseFleet}
        telematicsStats={telematicsStats}
        isSimPaused={isSimPaused}
        onToggleSimPause={onToggleSimPause}
        className="w-full h-full min-h-[380px] flex-1"
      />

      {/* Floating Detail Tracking Panel / Popover */}
      {selectedVehicle && (
        <div className="absolute bottom-4 right-4 z-20 max-w-sm w-full animate-fadeIn">
          <TrackingDetailCard
            selectedVehicle={selectedVehicle}
            selectedShipment={selectedShipment}
            onOpenShipmentDetail={onOpenShipmentDetail}
            onReviewAiException={onReviewAiException}
            onClose={() => onSelectVehicle('')}
          />
        </div>
      )}
    </div>
  );
};
