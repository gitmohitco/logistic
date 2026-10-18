import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Shipment } from '../../types';
import { 
  Truck, 
  Clock, 
  MapPin, 
  Check 
} from 'lucide-react';

export interface CarrierPortalViewProps {
  shipments: Shipment[];
  carrierName: string;
  onProposeEta: (shipment: Shipment) => void;
  onConfirmEta: (shipmentId: string, confirmed: boolean) => Promise<void>;
  isLoading?: boolean;
}

export const CarrierPortalView: React.FC<CarrierPortalViewProps> = ({
  shipments,
  carrierName,
  onProposeEta,
  onConfirmEta,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'DELAYED'>('ALL');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const filteredShipments = shipments.filter((s) => {
    if (filter === 'ACTIVE') return s.status === 'ON_ROUTE' || s.status === 'LOADING';
    if (filter === 'DELAYED') return s.status === 'DELAYED';
    return true;
  });

  const handleConfirm = async (shipmentId: string, confirmed: boolean) => {
    setActioningId(shipmentId);
    try {
      await onConfirmEta(shipmentId, confirmed);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Carrier Organization Header */}
      <div className="bg-white rounded-xl border border-[#D0D9DE] p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#18217E] text-white">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#09104D]">
                {carrierName} Carrier Portal
              </h2>
              <p className="text-xs text-[#393A50]">
                Isolated Partner Tenant Workspace • Assigned Shipments & Delivery SLA Management
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-[#F4F7F9] border border-[#D0D9DE] text-xs font-semibold text-[#070724]">
            Assigned Active: <span className="text-[#18217E]">{shipments.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'ALL'
              ? 'bg-[#18217E] text-white shadow-xs'
              : 'bg-white text-[#393A50] border border-[#D0D9DE] hover:bg-[#F4F7F9]'
          }`}
        >
          All Assigned ({shipments.length})
        </button>
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'ACTIVE'
              ? 'bg-[#18217E] text-white shadow-xs'
              : 'bg-white text-[#393A50] border border-[#D0D9DE] hover:bg-[#F4F7F9]'
          }`}
        >
          Active En Route
        </button>
        <button
          onClick={() => setFilter('DELAYED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'DELAYED'
              ? 'bg-[#EA341F] text-white shadow-xs'
              : 'bg-white text-[#EA341F] border border-[#EA341F]/30 hover:bg-[#EA341F]/10'
          }`}
        >
          Delayed ({shipments.filter((s) => s.status === 'DELAYED').length})
        </button>
      </div>

      {/* Shipments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredShipments.map((shp) => {
          const isDelayed = shp.status === 'DELAYED';
          return (
            <div
              key={shp.id}
              className={`p-5 rounded-xl border bg-white shadow-card transition-all ${
                isDelayed ? 'border-[#EA341F]/50 ring-1 ring-[#EA341F]/20' : 'border-[#D0D9DE]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono font-black text-sm text-[#18217E]">
                    {shp.trackingId}
                  </span>
                  <p className="text-[11px] text-[#8A9995] mt-0.5">
                    Vehicle: <strong className="text-[#070724]">{shp.vehicleCode || 'Unassigned'}</strong> • Driver: {shp.driverName || 'N/A'}
                  </p>
                </div>
                <Badge
                  variant={
                    shp.status === 'ON_ROUTE' ? 'on_route' :
                    shp.status === 'DELAYED' ? 'delayed' : 'loading'
                  }
                  size="sm"
                >
                  {shp.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Hub Route */}
              <div className="my-3 py-2 px-3 rounded-lg bg-[#F4F7F9] border border-[#D0D9DE]/60 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#18217E] flex-shrink-0" />
                  <span className="font-medium text-[#070724] truncate">{shp.originHubName}</span>
                </div>
                <span className="text-[#8A9995] px-2">➔</span>
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#107C41] flex-shrink-0" />
                  <span className="font-medium text-[#070724] truncate">{shp.destinationHubName}</span>
                </div>
              </div>

              {/* ETA & Telematics */}
              <div className="flex items-center justify-between text-xs text-[#393A50] mb-4">
                <div>
                  <span className="text-[10px] text-[#8A9995] uppercase block">Scheduled ETA</span>
                  <span className={`font-bold ${isDelayed ? 'text-[#EA341F]' : 'text-[#070724]'}`}>
                    {new Date(shp.estimatedArrival).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {isDelayed && (
                  <div className="text-right">
                    <span className="text-[10px] text-[#EA341F] uppercase font-bold block">Estimated Delay</span>
                    <span className="font-extrabold text-[#EA341F]">+{shp.delayMinutes} mins</span>
                  </div>
                )}
              </div>

              {/* Action Buttons for Carrier */}
              <div className="pt-3 border-t border-[#D0D9DE]/60 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onProposeEta(shp)}
                  leftIcon={<Clock className="w-3.5 h-3.5 text-[#18217E]" />}
                >
                  Propose Revised ETA
                </Button>

                {isDelayed && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="primary"
                      isLoading={actioningId === shp.id}
                      onClick={() => handleConfirm(shp.id, true)}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Confirm ETA
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
