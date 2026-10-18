import React from 'react';
import { Truck, Plane, Ship, Navigation } from 'lucide-react';
import { Vehicle } from '../../types';
import { Badge } from '../ui/Badge';

export interface VehicleStatusItemProps {
  vehicle: Vehicle;
  isSelected?: boolean;
  onSelect: (vehicleId: string) => void;
}

const VehicleStatusItemComponent: React.FC<VehicleStatusItemProps> = ({
  vehicle,
  isSelected = false,
  onSelect,
}) => {
  const ModeIcon = 
    vehicle.transportMode === 'AIR' ? Plane :
    vehicle.transportMode === 'SEA' ? Ship : Truck;

  const isMaintenance = vehicle.status === 'MAINTENANCE';
  const isInactive = vehicle.status === 'INACTIVE';

  return (
    <div
      onClick={() => onSelect(vehicle.id)}
      className={`px-3 py-2 rounded-lg border transition-all cursor-pointer select-none ${
        isSelected
          ? 'bg-[#18217E]/10 border-[#18217E] shadow-xs ring-1 ring-[#18217E]/30'
          : 'bg-[#F4F7F9] hover:bg-white border-[#D0D9DE]/70 hover:border-[#424989]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white flex-shrink-0 ${
            isMaintenance || isInactive ? 'bg-[#8A9995]' : 'bg-[#18217E]'
          }`}>
            <ModeIcon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="text-xs font-bold text-[#09104D] truncate">{vehicle.vehicleCode}</span>
              {vehicle.carrierName && (
                <span className="text-[10px] text-[#8A9995] font-normal truncate hidden sm:inline">
                  • {vehicle.carrierName}
                </span>
              )}
            </div>
            <div className="text-[10px] text-[#393A50] flex items-center gap-2 mt-0.5 leading-tight">
              <span>Speed: <strong className="font-semibold text-[#070724]">{vehicle.currentSpeedKph} km/h</strong></span>
              {vehicle.assignedTrackingId && (
                <span className="font-mono text-[#18217E] font-semibold flex items-center gap-0.5 truncate">
                  <Navigation className="w-2.5 h-2.5 text-[#424989] flex-shrink-0" />
                  {vehicle.assignedTrackingId}
                </span>
              )}
            </div>
          </div>
        </div>

        <Badge
          variant={
            vehicle.status === 'ACTIVE' ? 'active' :
            vehicle.status === 'MAINTENANCE' ? 'maintenance' : 'inactive'
          }
          size="sm"
          className="text-[9px] px-1.5 py-0.2 font-bold flex-shrink-0"
        >
          {vehicle.status}
        </Badge>
      </div>
    </div>
  );
};

export const VehicleStatusItem = React.memo(
  VehicleStatusItemComponent,
  (prev, next) => {
    return (
      prev.isSelected === next.isSelected &&
      prev.vehicle.id === next.vehicle.id &&
      prev.vehicle.status === next.vehicle.status &&
      prev.vehicle.currentSpeedKph === next.vehicle.currentSpeedKph &&
      prev.vehicle.assignedTrackingId === next.vehicle.assignedTrackingId
    );
  }
);
