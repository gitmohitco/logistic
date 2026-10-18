import React from 'react';
import { Modal } from '../ui/Modal';
import { Shipment } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Package, 
  MapPin, 
  Navigation, 
  Bot 
} from 'lucide-react';

export interface ShipmentDetailModalProps {
  shipment: Shipment | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewAiException?: (exceptionId: string) => void;
  onProposeEta?: (shipment: Shipment) => void;
  isCarrierUser?: boolean;
}

export const ShipmentDetailModal: React.FC<ShipmentDetailModalProps> = ({
  shipment,
  isOpen,
  onClose,
  onReviewAiException,
  onProposeEta,
  isCarrierUser = false,
}) => {
  if (!shipment) return null;

  const statusVariant =
    shipment.status === 'ON_ROUTE' ? 'on_route' :
    shipment.status === 'DELAYED' ? 'delayed' :
    shipment.status === 'DELIVERED' ? 'delivered' : 'loading';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-[#18217E]" />
          <span>Shipment Dossier: {shipment.trackingId}</span>
        </div>
      }
      subtitle={`Carrier Partner: ${shipment.carrierName} • Cargo: ${shipment.cargoType}`}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {shipment.activeExceptionId && onReviewAiException && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  onClose();
                  onReviewAiException(shipment.activeExceptionId!);
                }}
                leftIcon={<Bot className="w-4 h-4" />}
              >
                Inspect Mendix AI Exception
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCarrierUser && onProposeEta && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onProposeEta(shipment);
                }}
              >
                Propose Revised ETA
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-xs">
        {/* Status Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F4F7F9] border border-[#D0D9DE]">
          <div>
            <span className="text-[11px] font-medium text-[#8A9995] uppercase tracking-wider block">
              Current Shipment State
            </span>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={statusVariant} size="md">
                {shipment.status.replace('_', ' ')}
              </Badge>
              {shipment.delayMinutes > 0 && (
                <span className="text-[#EA341F] font-bold text-xs">
                  (Estimated Delay: +{shipment.delayMinutes} minutes)
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium text-[#8A9995] uppercase tracking-wider block">
              Estimated Arrival
            </span>
            <span className="text-sm font-extrabold text-[#09104D]">
              {new Date(shipment.estimatedArrival).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Route Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl border border-[#D0D9DE] bg-white">
            <div className="flex items-center gap-2 text-[#18217E] font-bold mb-2">
              <MapPin className="w-4 h-4" />
              <span>Origin Hub</span>
            </div>
            <p className="text-sm font-semibold text-[#070724]">{shipment.originHubName}</p>
            <p className="text-[11px] text-[#8A9995] mt-0.5">
              Coords: {shipment.originCoords[0].toFixed(4)}, {shipment.originCoords[1].toFixed(4)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#D0D9DE] bg-white">
            <div className="flex items-center gap-2 text-[#107C41] font-bold mb-2">
              <Navigation className="w-4 h-4" />
              <span>Destination Hub</span>
            </div>
            <p className="text-sm font-semibold text-[#070724]">{shipment.destinationHubName}</p>
            <p className="text-[11px] text-[#8A9995] mt-0.5">
              Coords: {shipment.destinationCoords[0].toFixed(4)}, {shipment.destinationCoords[1].toFixed(4)}
            </p>
          </div>
        </div>

        {/* Telematics & Equipment */}
        <div className="p-4 rounded-xl border border-[#D0D9DE] bg-[#F4F7F9] space-y-3">
          <h4 className="text-xs font-bold text-[#09104D] uppercase tracking-wider">
            Assigned Telematics & Cargo Specs
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-[#8A9995] uppercase block">Vehicle Code</span>
              <strong className="text-[#070724] font-mono">{shipment.vehicleCode || 'Unassigned'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-[#8A9995] uppercase block">Driver</span>
              <strong className="text-[#070724]">{shipment.driverName || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-[#8A9995] uppercase block">Cargo Weight</span>
              <strong className="text-[#070724]">{shipment.weightKg.toLocaleString()} kg</strong>
            </div>
            <div>
              <span className="text-[10px] text-[#8A9995] uppercase block">Original ETA</span>
              <strong className="text-[#070724]">
                {new Date(shipment.originalEta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </div>
          </div>
        </div>

        {/* Milestone Timeline */}
        <div>
          <h4 className="text-xs font-bold text-[#09104D] uppercase tracking-wider mb-3">
            Operational Milestone Progression
          </h4>
          <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D0D9DE]">
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-[#18217E] ring-4 ring-white" />
              <div className="flex justify-between">
                <span className="font-semibold text-[#070724]">Dispatched from {shipment.originHubName}</span>
                <span className="text-[11px] text-[#8A9995]">
                  {new Date(shipment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11px] text-[#393A50] mt-0.5">Manifest verified, sealed and telematics sensor active.</p>
            </div>

            <div className="relative">
              <span className={`absolute -left-6 top-0.5 w-3 h-3 rounded-full ring-4 ring-white ${
                shipment.status === 'DELAYED' ? 'bg-[#EA341F]' : 'bg-[#18217E]'
              }`} />
              <div className="flex justify-between">
                <span className="font-semibold text-[#070724]">En Route Transit Corridor</span>
                <span className="text-[11px] text-[#8A9995]">Telemetry Synchronized</span>
              </div>
              <p className="text-[11px] text-[#393A50] mt-0.5">
                Current telemetry reports velocity of {shipment.currentSpeedKph ?? 45} km/h.
                {shipment.delayMinutes > 0 && ` Route deviation / congestion detected (+${shipment.delayMinutes}m).`}
              </p>
            </div>

            <div className="relative opacity-60">
              <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-[#D0D9DE] ring-4 ring-white" />
              <div className="flex justify-between">
                <span className="font-semibold text-[#070724]">Final Arrival & Hub Offloading</span>
                <span className="text-[11px] text-[#8A9995]">
                  {new Date(shipment.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11px] text-[#393A50] mt-0.5">Expected arrival at {shipment.destinationHubName}.</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
