import React from 'react';
import { 
  Navigation, 
  Clock, 
  MapPin, 
  User, 
  Gauge, 
  AlertCircle, 
  ExternalLink,
  Bot
} from 'lucide-react';
import { Shipment, Vehicle } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export interface TrackingDetailCardProps {
  selectedVehicle?: Vehicle | null;
  selectedShipment?: Shipment | null;
  onOpenShipmentDetail?: (shipmentId: string) => void;
  onReviewAiException?: (exceptionId: string) => void;
  onClose?: () => void;
}

function safeCoord(val: any): string {
  const num = Number(val);
  return Number.isFinite(num) ? num.toFixed(4) : '0.0000';
}

function safeTimeString(val: any, options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }): string {
  if (!val) return 'Live';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'Live';
    return d.toLocaleTimeString([], options);
  } catch {
    return 'Live';
  }
}

const TrackingDetailCardComponent: React.FC<TrackingDetailCardProps> = ({
  selectedVehicle,
  selectedShipment,
  onOpenShipmentDetail,
  onReviewAiException,
  onClose,
}) => {
  if (!selectedVehicle && !selectedShipment) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-xl border border-[#D0D9DE] p-4 text-xs text-[#393A50] shadow-card">
        <p className="font-semibold text-[#09104D]">No Vehicle Selected</p>
        <p className="mt-1 text-[11px] text-[#8A9995]">
          Click any vehicle marker or route on the map to inspect live telematics and shipment details.
        </p>
      </div>
    );
  }

  // Calculate staleness defensively
  let isStale = false;
  let diffMinutes = 0;
  if (selectedVehicle?.lastLocationAt) {
    try {
      const lastUpdateDate = new Date(selectedVehicle.lastLocationAt);
      if (!isNaN(lastUpdateDate.getTime())) {
        diffMinutes = Math.round((Date.now() - lastUpdateDate.getTime()) / (1000 * 60));
        isStale = diffMinutes > 20;
      }
    } catch {
      isStale = false;
    }
  }

  const statusVariant = 
    selectedShipment?.status === 'ON_ROUTE' ? 'on_route' :
    selectedShipment?.status === 'DELAYED' ? 'delayed' :
    selectedShipment?.status === 'DELIVERED' ? 'delivered' : 'loading';

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-xl border border-[#D0D9DE] p-4 text-xs shadow-modal w-full max-w-sm transition-all animate-fadeIn">
      {/* Header with Vehicle and Status */}
      <div className="flex items-start justify-between pb-3 border-b border-[#D0D9DE]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#09104D] text-sm tracking-tight">
              {selectedVehicle?.vehicleCode || 'Unassigned Vehicle'}
            </span>
            <Badge variant={selectedVehicle?.status === 'ACTIVE' ? 'active' : 'maintenance'} size="sm">
              {selectedVehicle?.status || 'UNKNOWN'}
            </Badge>
          </div>
          <p className="text-[11px] text-[#393A50] mt-0.5">
            Transport Mode: <strong className="text-[#070724]">{selectedVehicle?.transportMode || 'GROUND'}</strong>
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#8A9995] hover:text-[#070724] text-sm p-1 rounded hover:bg-[#E5EBEE] transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Shipment & Route Overview */}
      {selectedShipment ? (
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#8A9995]">Tracking ID:</span>
            <span className="font-mono font-bold text-[#18217E]">{selectedShipment.trackingId}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#8A9995]">Status:</span>
            <Badge variant={statusVariant} size="sm">
              {selectedShipment.status ? selectedShipment.status.replace('_', ' ') : 'IN TRANSIT'}
            </Badge>
          </div>

          <div className="bg-[#F4F7F9] p-2.5 rounded-lg border border-[#D0D9DE]/60 space-y-1.5">
            <div className="flex items-center gap-2 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-[#18217E] flex-shrink-0" />
              <span className="truncate">
                From: <strong className="text-[#070724]">{selectedShipment.originHubName || 'Dispatch'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <Navigation className="w-3.5 h-3.5 text-[#424989] flex-shrink-0" />
              <span className="truncate">
                To: <strong className="text-[#070724]">{selectedShipment.destinationHubName || 'Destination'}</strong>
              </span>
            </div>
          </div>

          {/* Telematics Details */}
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="flex items-center gap-1.5 text-[#393A50]">
              <Gauge className="w-3.5 h-3.5 text-[#424989]" />
              <span>Speed: <strong>{Number(selectedVehicle?.currentSpeedKph ?? 0)} km/h</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-[#393A50]">
              <Clock className="w-3.5 h-3.5 text-[#424989]" />
              <span>ETA: <strong>{safeTimeString(selectedShipment.estimatedArrival)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-[#393A50]">
              <User className="w-3.5 h-3.5 text-[#424989]" />
              <span className="truncate">Driver: <strong>{selectedShipment.driverName || 'Dispatch Assigned'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-[#393A50]">
              <span className={`w-2 h-2 rounded-full ${isStale ? 'bg-[#EA341F]' : 'bg-[#107C41]'}`} />
              <span className="truncate">
                GPS: <strong>{isStale ? `${diffMinutes}m ago` : 'Live'}</strong>
              </span>
            </div>
          </div>

          {/* Delay warning if applicable */}
          {selectedShipment.delayMinutes > 0 && (
            <div className="mt-2 p-2 rounded-lg bg-[#EA341F]/10 border border-[#EA341F]/30 flex items-center justify-between text-xs text-[#EA341F]">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-bold">Delayed: +{selectedShipment.delayMinutes} mins</span>
              </div>
              {selectedShipment.activeExceptionId && onReviewAiException && (
                <Button
                  size="sm"
                  variant="danger"
                  className="text-[10px] py-1 px-2"
                  onClick={() => onReviewAiException(selectedShipment.activeExceptionId!)}
                  leftIcon={<Bot className="w-3 h-3" />}
                >
                  Mendix AI
                </Button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex gap-2">
            {onOpenShipmentDetail && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => onOpenShipmentDetail(selectedShipment.id)}
                rightIcon={<ExternalLink className="w-3 h-3" />}
              >
                View Full Dossier
              </Button>
            )}
          </div>
        </div>
      ) : selectedVehicle ? (
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#8A9995]">Carrier Partner:</span>
            <span className="font-bold text-[#18217E]">{selectedVehicle.carrierName || 'Independent Freight'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#8A9995]">Assigned Tracking:</span>
            <span className="font-mono font-bold text-[#09104D]">
              {selectedVehicle.assignedTrackingId || 'Consignment In-Transit'}
            </span>
          </div>

          <div className="bg-[#F4F7F9] p-2.5 rounded-lg border border-[#D0D9DE]/60 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[#8A9995]">GPS Coordinates:</span>
              <span className="font-mono font-semibold text-[#070724]">
                {safeCoord(selectedVehicle.currentLatitude)}, {safeCoord(selectedVehicle.currentLongitude)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8A9995]">Heading / Bearing:</span>
              <span className="font-semibold text-[#070724]">{Number(selectedVehicle.headingDeg || 0)}° NNE</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="flex items-center gap-1.5 text-[#393A50]">
              <Gauge className="w-3.5 h-3.5 text-[#424989]" />
              <span>Speed: <strong>{Number(selectedVehicle.currentSpeedKph || 0)} km/h</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-[#393A50]">
              <User className="w-3.5 h-3.5 text-[#424989]" />
              <span className="truncate">Driver: <strong>{selectedVehicle.driverName || 'Dispatch Assigned'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-[#393A50]">
              <span className={`w-2 h-2 rounded-full ${isStale ? 'bg-[#EA341F]' : 'bg-[#107C41]'}`} />
              <span className="truncate">
                Telemetry: <strong>{isStale ? 'Stale' : 'Streaming Live'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#393A50]">
              <Clock className="w-3.5 h-3.5 text-[#424989]" />
              <span>Ping: <strong>{safeTimeString(selectedVehicle.lastLocationAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong></span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const TrackingDetailCard: React.FC<TrackingDetailCardProps> = (props) => (
  <ErrorBoundary fallbackTitle="Vehicle Detail Protected">
    <TrackingDetailCardComponent {...props} />
  </ErrorBoundary>
);
