import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  ShieldAlert, 
  Thermometer, 
  Gauge, 
  FileText, 
  Lock, 
  Calendar,
  Building
} from 'lucide-react';
import { Shipment, TrackingEvent } from '../../types';
import { mendixClient } from '../../services/api/mendixClient';
import { useAuth } from '../auth/AuthContext';
import { TrackingTimeline } from '../../components/shipment/TrackingTimeline';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';

export const ShipmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role, checkPermission } = useAuth();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrier Propose Revised ETA modal state
  const [isEtaModalOpen, setIsEtaModalOpen] = useState(false);
  const [proposedEta, setProposedEta] = useState('');
  const [etaReason, setEtaReason] = useState('');
  const [isSubmittingEta, setIsSubmittingEta] = useState(false);

  // Warehouse Update modal state
  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [whStatus, setWhStatus] = useState<'ARRIVED' | 'STAGED' | 'DEPARTED' | 'DELAYED'>('STAGED');
  const [whNotes, setWhNotes] = useState('');
  const [isSubmittingWh, setIsSubmittingWh] = useState(false);

  const loadShipmentData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const shp = await mendixClient.getShipmentById(id, user);
      if (!shp) {
        setError('Shipment not found or unauthorized');
      } else {
        setShipment(shp);
        const evts = await mendixClient.getTrackingEvents(shp.id, user);
        setEvents(evts);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve shipment record');
    } finally {
      setIsLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadShipmentData();
  }, [loadShipmentData]);

  const handleProposeEtaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipment || !proposedEta) return;
    setIsSubmittingEta(true);
    try {
      await mendixClient.proposeEta(
        {
          shipmentId: shipment.id,
          proposedEta: new Date(proposedEta).toISOString(),
          reason: etaReason,
        },
        user
      );
      setIsEtaModalOpen(false);
      await loadShipmentData();
    } catch (err) {
      alert('Failed to submit revised ETA');
    } finally {
      setIsSubmittingEta(false);
    }
  };

  const handleWarehouseUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipment) return;
    setIsSubmittingWh(true);
    try {
      await mendixClient.warehouseUpdate(
        {
          shipmentId: shipment.id,
          warehouseId: user.warehouseId || shipment.originHubId,
          status: whStatus,
          notes: whNotes,
        },
        user
      );
      setIsWhModalOpen(false);
      await loadShipmentData();
    } catch (err) {
      alert('Failed to submit warehouse status update');
    } finally {
      setIsSubmittingWh(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-[#D0D9DE] text-center max-w-lg mx-auto mt-10">
        <ShieldAlert className="w-12 h-12 text-[#EA341F] mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#09104D]">Shipment Record Inaccessible</h3>
        <p className="text-xs text-[#393A50] mt-1 mb-5">{error}</p>
        <Button variant="primary" onClick={() => navigate('/shipments')}>
          Back to Shipments List
        </Button>
      </div>
    );
  }

  const isCustomerRole = role === 'CUSTOMER';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Breadcrumb & Nav */}
      <button
        onClick={() => navigate('/shipments')}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#18217E] hover:text-[#09104D] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Shipments Directory</span>
      </button>

      {/* Main Header Banner */}
      <div className="bg-[#09104D] text-white p-6 rounded-2xl shadow-card border border-[#18217E] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-extrabold font-mono tracking-wide">
              {shipment.trackingId}
            </h2>
            <Badge
              variant={
                shipment.status === 'DELIVERED'
                  ? 'delivered'
                  : shipment.status === 'DELAYED'
                  ? 'delayed'
                  : shipment.status === 'LOADING'
                  ? 'loading'
                  : 'on_route'
              }
              pulse={shipment.status === 'ON_ROUTE'}
              className="font-bold tracking-wider shadow-sm"
            >
              {shipment.status.replace('_', ' ')}
            </Badge>
            {shipment.isSlaAtRisk && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EA341F] text-white uppercase tracking-wider">
                SLA At Risk (+{shipment.delayMinutes}m)
              </span>
            )}
          </div>
          <p className="text-xs text-[#8A9995] mt-1 flex items-center gap-2">
            <span>Cargo: {shipment.cargoType}</span>
            <span>•</span>
            <span>Weight: {shipment.weightKg.toLocaleString()} kg</span>
            {!isCustomerRole && (
              <>
                <span>•</span>
                <span>Carrier: {shipment.carrierName}</span>
              </>
            )}
          </p>
        </div>

        {/* Action Buttons for Authorized Roles */}
        <div className="flex flex-wrap items-center gap-2">
          {checkPermission('canProposeEta') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEtaModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Propose Revised ETA
            </Button>
          )}

          {checkPermission('canSubmitWarehouseUpdates') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWhModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              <Building className="w-3.5 h-3.5 mr-1" />
              Warehouse Staging
            </Button>
          )}

          {shipment.activeExceptionId && checkPermission('canResolveExceptions') && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => navigate('/exceptions')}
              className="text-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
              Open Exception War Room
            </Button>
          )}
        </div>
      </div>

      {/* Grid: 3 Column Operational Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Route & Transit Schedule */}
        <div className="bg-white p-5 rounded-2xl border border-[#D0D9DE] shadow-card space-y-4">
          <h3 className="text-xs font-bold text-[#09104D] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#D0D9DE] pb-2">
            <MapPin className="w-4 h-4 text-[#18217E]" />
            Route Corridor & Schedule
          </h3>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-[#8A9995] uppercase font-bold block">
                Origin Logistics Hub
              </span>
              <p className="text-xs font-bold text-[#070724]">
                {shipment.originHubName}
              </p>
            </div>

            <div className="pl-3 border-l-2 border-[#18217E]/30 space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-[#8A9995] uppercase font-medium">
                  Original Scheduled ETA
                </span>
                <p className="font-mono text-[#393A50]">
                  {new Date(shipment.originalEta).toLocaleString()}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-[#8A9995] uppercase font-medium">
                  Current Estimated Arrival
                </span>
                <p
                  className={`font-mono font-bold ${
                    shipment.delayMinutes > 0 ? 'text-[#EA341F]' : 'text-[#107C41]'
                  }`}
                >
                  {new Date(shipment.estimatedArrival).toLocaleString()}
                </p>
              </div>

              {shipment.slaDeadline && (
                <div>
                  <span className="text-[10px] text-[#8A9995] uppercase font-medium">
                    Strict SLA Deadline
                  </span>
                  <p className="font-mono text-[#09104D]">
                    {new Date(shipment.slaDeadline).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] text-[#8A9995] uppercase font-bold block">
                Destination Logistics Gateway
              </span>
              <p className="text-xs font-bold text-[#070724]">
                {shipment.destinationHubName}
              </p>
            </div>
          </div>
        </div>

        {/* Col 2: Telematics & Equipment */}
        <div className="bg-white p-5 rounded-2xl border border-[#D0D9DE] shadow-card space-y-4">
          <h3 className="text-xs font-bold text-[#09104D] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#D0D9DE] pb-2">
            <Truck className="w-4 h-4 text-[#18217E]" />
            Telematics & Equipment
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#F4F7F9] p-3 rounded-xl border border-[#D0D9DE]">
              <span className="text-[10px] text-[#8A9995] uppercase block flex items-center gap-1">
                <Gauge className="w-3 h-3 text-[#424989]" />
                Speed Telemetry
              </span>
              <p className="text-base font-extrabold text-[#09104D] mt-1">
                {shipment.currentSpeedKph || 0} <span className="text-xs font-normal text-[#8A9995]">km/h</span>
              </p>
            </div>

            <div className="bg-[#F4F7F9] p-3 rounded-xl border border-[#D0D9DE]">
              <span className="text-[10px] text-[#8A9995] uppercase block flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-[#424989]" />
                Cargo Temp
              </span>
              <p
                className={`text-base font-extrabold mt-1 ${
                  (shipment.temperatureCelsius ?? 0) > 6.0
                    ? 'text-[#EA341F]'
                    : 'text-[#18217E]'
                }`}
              >
                {shipment.temperatureCelsius !== undefined && shipment.temperatureCelsius !== null
                  ? `${shipment.temperatureCelsius > 0 ? '+' : ''}${shipment.temperatureCelsius}°C`
                  : 'Amb.'}
              </p>
            </div>
          </div>

          <div className="text-xs space-y-2 pt-1">
            {!isCustomerRole && (
              <>
                <div className="flex justify-between py-1 border-b border-[#D0D9DE]/60">
                  <span className="text-[#8A9995]">Assigned Carrier:</span>
                  <span className="font-semibold text-[#070724]">{shipment.carrierName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#D0D9DE]/60">
                  <span className="text-[#8A9995]">Vehicle Identifier:</span>
                  <span className="font-mono text-[#070724]">{shipment.vehicleCode || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#D0D9DE]/60">
                  <span className="text-[#8A9995]">Primary Driver:</span>
                  <span className="text-[#070724]">{shipment.driverName || 'Dispatch Assigned'}</span>
                </div>
              </>
            )}
            <div className="flex justify-between py-1">
              <span className="text-[#8A9995]">Customer Account:</span>
              <span className="font-semibold text-[#09104D]">
                {shipment.customerName || 'BioMedics Global Logistics'}
              </span>
            </div>
          </div>
        </div>

        {/* Col 3: Internal Notes & Security Policy */}
        <div className="bg-white p-5 rounded-2xl border border-[#D0D9DE] shadow-card space-y-4">
          <h3 className="text-xs font-bold text-[#09104D] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#D0D9DE] pb-2">
            <FileText className="w-4 h-4 text-[#18217E]" />
            Operational Governance & Notes
          </h3>

          {checkPermission('canViewInternalNotes') ? (
            <div className="bg-[#F4F7F9] p-4 rounded-xl border border-[#D0D9DE] text-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#09104D] mb-1.5">
                <Lock className="w-3.5 h-3.5 text-[#18217E]" />
                Internal Operational Annotations:
              </div>
              <p className="text-[#393A50] leading-relaxed italic">
                "{shipment.internalNotes || 'Standard handling SOP. No special dispatch notes recorded.'}"
              </p>
              <p className="text-[10px] text-[#8A9995] mt-3 pt-2 border-t border-[#D0D9DE]">
                * Restricted note: Never exposed over Customer-facing API endpoints.
              </p>
            </div>
          ) : (
            <div className="bg-[#F4F7F9] p-4 rounded-xl border border-[#D0D9DE] text-xs text-center text-[#8A9995]">
              <Lock className="w-5 h-5 mx-auto mb-1.5 text-[#8A9995]" />
              Internal operational notes and carrier credentials are restricted from customer view.
            </div>
          )}

          <div className="bg-[#18217E]/5 p-3 rounded-xl border border-[#18217E]/20 text-[11px] text-[#18217E] space-y-1">
            <span className="font-bold block">Mendix Backend Synchronization:</span>
            <span className="text-[#393A50] block">
              Event feed verified via Mendix Published REST Service /shipments/{shipment.id}.
            </span>
          </div>
        </div>
      </div>

      {/* Tracking Timeline Section */}
      <div className="bg-white p-6 rounded-2xl border border-[#D0D9DE] shadow-card">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#D0D9DE]">
          <div>
            <h3 className="text-sm font-extrabold text-[#09104D] uppercase tracking-wider">
              Shipment Tracking Timeline
            </h3>
            <p className="text-xs text-[#393A50]">
              Chronological audit log of IoT sensor triggers, weigh stations, and milestone scans
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#18217E] px-2.5 py-1 bg-[#18217E]/10 rounded-lg">
            {events.length} Milestones Recorded
          </span>
        </div>

        <TrackingTimeline events={events} />
      </div>

      {/* Modal: Carrier Propose Revised ETA */}
      <Modal
        isOpen={isEtaModalOpen}
        onClose={() => setIsEtaModalOpen(false)}
        title="Propose Revised Delivery ETA"
        maxWidth="md"
      >
        <form onSubmit={handleProposeEtaSubmit} className="space-y-4 p-1">
          <p className="text-xs text-[#393A50]">
            Submit an updated estimated time of arrival for shipment <strong className="font-mono text-[#18217E]">{shipment.trackingId}</strong> to Mendix Control Tower.
          </p>

          <div>
            <label className="block text-xs font-bold text-[#09104D] mb-1">
              New Proposed Arrival Timestamp:
            </label>
            <input
              type="datetime-local"
              required
              value={proposedEta}
              onChange={(e) => setProposedEta(e.target.value)}
              className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg focus:outline-none focus:border-[#18217E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#09104D] mb-1">
              Operational Delay Justification:
            </label>
            <textarea
              required
              rows={3}
              value={etaReason}
              onChange={(e) => setEtaReason(e.target.value)}
              placeholder="e.g. Interstate highway detour, customs queue, weather delay..."
              className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg focus:outline-none focus:border-[#18217E]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsEtaModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmittingEta}>
              {isSubmittingEta ? 'Transmitting to Mendix...' : 'Submit Proposed ETA'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Warehouse Supervisor Staging Update */}
      <Modal
        isOpen={isWhModalOpen}
        onClose={() => setIsWhModalOpen(false)}
        title="Warehouse Staging & Dock Update"
        maxWidth="md"
      >
        <form onSubmit={handleWarehouseUpdateSubmit} className="space-y-4 p-1">
          <div>
            <label className="block text-xs font-bold text-[#09104D] mb-1">
              Warehouse Milestone Status:
            </label>
            <select
              value={whStatus}
              onChange={(e) => setWhStatus(e.target.value as any)}
              className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg bg-white focus:outline-none focus:border-[#18217E]"
            >
              <option value="STAGED">STAGED (Bay Allocated)</option>
              <option value="ARRIVED">ARRIVED (Offloading Complete)</option>
              <option value="DEPARTED">DEPARTED (Outbound Gate Cleared)</option>
              <option value="DELAYED">DELAYED (Staging Congestion)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#09104D] mb-1">
              Supervisor Notes & Dock Bay:
            </label>
            <input
              type="text"
              value={whNotes}
              onChange={(e) => setWhNotes(e.target.value)}
              placeholder="e.g. Inbound Dock 14, pallet seal verified..."
              className="w-full p-2 text-xs border border-[#D0D9DE] rounded-lg focus:outline-none focus:border-[#18217E]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsWhModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmittingWh}>
              {isSubmittingWh ? 'Recording...' : 'Update Warehouse Status'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
