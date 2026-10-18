import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { VehicleStatusItem } from './VehicleStatusItem';
import { Vehicle, TransportMode } from '../../types';
import { Truck, Plane, Ship, Search, Building } from 'lucide-react';
import { CARRIER_PARTNERS } from '../../services/telematics/fleetSimulationService';

import { ErrorBoundary } from '../ui/ErrorBoundary';

export interface AllVehiclesWidgetProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string | null;
  onSelectVehicle: (vehicleId: string) => void;
  className?: string;
}

const AllVehiclesWidgetComponent: React.FC<AllVehiclesWidgetProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<TransportMode>('GROUND');
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('ALL');

  const groundVehicles = useMemo(() => vehicles.filter((v) => v.transportMode === 'GROUND'), [vehicles]);
  const airVehicles = useMemo(() => vehicles.filter((v) => v.transportMode === 'AIR'), [vehicles]);
  const seaVehicles = useMemo(() => vehicles.filter((v) => v.transportMode === 'SEA'), [vehicles]);

  const currentModeList = useMemo(() => {
    return activeTab === 'GROUND' ? groundVehicles :
           activeTab === 'AIR' ? airVehicles : seaVehicles;
  }, [activeTab, groundVehicles, airVehicles, seaVehicles]);

  const filteredList = useMemo(() => {
    return currentModeList.filter((v) => {
      if (carrierFilter !== 'ALL' && v.carrierId !== carrierFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          v.vehicleCode.toLowerCase().includes(q) ||
          (v.carrierName && v.carrierName.toLowerCase().includes(q)) ||
          (v.driverName && v.driverName.toLowerCase().includes(q)) ||
          (v.assignedTrackingId && v.assignedTrackingId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [currentModeList, carrierFilter, searchQuery]);

  // Display top 35 items to preserve 60 FPS DOM performance with 500+ items
  const displayedList = useMemo(() => filteredList.slice(0, 35), [filteredList]);

  const activeCount = currentModeList.filter((v) => v.status === 'ACTIVE').length;

  return (
    <Card
      compact
      noPadding
      title="All Vehicles & Fleets"
      subtitle={`${activeCount} active in ${activeTab.toLowerCase()} · ${vehicles.length} total`}
      action={
        <div className="flex items-center bg-[#E5EBEE] p-0.5 rounded-lg text-xs font-semibold flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('GROUND')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap text-xs ${
              activeTab === 'GROUND'
                ? 'bg-white text-[#18217E] shadow-xs font-bold'
                : 'text-[#393A50] hover:text-[#070724] font-medium'
            }`}
          >
            <Truck className="w-3 h-3 flex-shrink-0" />
            <span>Ground</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                activeTab === 'GROUND'
                  ? 'bg-[#18217E]/10 text-[#18217E]'
                  : 'bg-[#D0D9DE]/80 text-[#393A50]'
              }`}
            >
              {groundVehicles.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AIR')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap text-xs ${
              activeTab === 'AIR'
                ? 'bg-white text-[#18217E] shadow-xs font-bold'
                : 'text-[#393A50] hover:text-[#070724] font-medium'
            }`}
          >
            <Plane className="w-3 h-3 flex-shrink-0" />
            <span>Air</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                activeTab === 'AIR'
                  ? 'bg-[#18217E]/10 text-[#18217E]'
                  : 'bg-[#D0D9DE]/80 text-[#393A50]'
              }`}
            >
              {airVehicles.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SEA')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap text-xs ${
              activeTab === 'SEA'
                ? 'bg-white text-[#18217E] shadow-xs font-bold'
                : 'text-[#393A50] hover:text-[#070724] font-medium'
            }`}
          >
            <Ship className="w-3 h-3 flex-shrink-0" />
            <span>Sea</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                activeTab === 'SEA'
                  ? 'bg-[#18217E]/10 text-[#18217E]'
                  : 'bg-[#D0D9DE]/80 text-[#393A50]'
              }`}
            >
              {seaVehicles.length}
            </span>
          </button>
        </div>
      }
      className={`flex flex-col ${className}`}
      bodyClassName="flex-1 min-h-0 flex flex-col"
    >
      <div className="p-2.5 flex-1 min-h-0 flex flex-col">
        {/* Search & Carrier Filter Row for 500+ fleet navigation */}
        <div className="space-y-1 mb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#8A9995] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search code, carrier, driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-[#D0D9DE] bg-[#F4F7F9] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#18217E]"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#F4F7F9] border border-[#D0D9DE] rounded-lg px-2 py-1 text-xs text-[#09104D]">
              <Building className="w-3 h-3 text-[#424989]" />
              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Carriers</option>
                {CARRIER_PARTNERS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {vehicles.length > 50 && (
            <div className="flex items-center justify-between text-[10px] text-[#8A9995] px-0.5">
              <span>
                Showing {displayedList.length} of {filteredList.length} matching trucks
              </span>
              {carrierFilter !== 'ALL' && (
                <button
                  onClick={() => setCarrierFilter('ALL')}
                  className="text-[#18217E] hover:underline font-medium cursor-pointer"
                >
                  Clear Carrier Filter
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
          {displayedList.length === 0 ? (
            <p className="text-xs text-[#8A9995] text-center py-6">
              No vehicles match the selected filter.
            </p>
          ) : (
            displayedList.map((vehicle) => (
              <VehicleStatusItem
                key={vehicle.id}
                vehicle={vehicle}
                isSelected={vehicle.id === selectedVehicleId}
                onSelect={onSelectVehicle}
              />
            ))
          )}
        </div>
      </div>
    </Card>
  );
};

const MemoizedWidget = React.memo(AllVehiclesWidgetComponent);

export const AllVehiclesWidget: React.FC<AllVehiclesWidgetProps> = (props) => (
  <ErrorBoundary fallbackTitle="Vehicles Roster Shield Active">
    <MemoizedWidget {...props} />
  </ErrorBoundary>
);

