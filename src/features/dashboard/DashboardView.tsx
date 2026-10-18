import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardPage } from '../../components/dashboard/DashboardPage';
import { 
  Shipment, 
  Vehicle, 
  HubCapacity, 
  ExceptionItem, 
  DashboardSummary 
} from '../../types';
import { mendixClient } from '../../services/api/mendixClient';
import { useAuth } from '../auth/AuthContext';
import { ShipmentDetailModal } from '../../components/shipments/ShipmentDetailModal';
import { ExceptionCenterModal } from '../../components/exceptions/ExceptionCenterModal';
import { ProposeEtaModal } from '../../components/carrier/ProposeEtaModal';

import { fleetSimulationService, TelematicsFleetStats } from '../../services/telematics/fleetSimulationService';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary | undefined>(undefined);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [hubs, setHubs] = useState<HubCapacity[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 500+ Fleet Simulation State
  const [isEnterpriseFleet, setIsEnterpriseFleet] = useState<boolean>(true); // Active by default to showcase 500+ live fleet
  const [telematicsStats, setTelematicsStats] = useState<TelematicsFleetStats | undefined>(undefined);
  const [isSimPaused, setIsSimPaused] = useState<boolean>(false);

  // Modals state
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [activeShipmentDossier, setActiveShipmentDossier] = useState<Shipment | null>(null);
  const [activeExceptionDossier, setActiveExceptionDossier] = useState<ExceptionItem | null>(null);
  const [activeCarrierProposeShipment, setActiveCarrierProposeShipment] = useState<Shipment | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, shpRes, excRes] = await Promise.all([
        mendixClient.getSummary(user),
        mendixClient.getShipments({ limit: 15 }, user),
        mendixClient.getExceptions(user),
      ]);

      setSummary(sumRes);
      setShipments(shpRes.data);
      setExceptions(excRes);
      if (!isEnterpriseFleet) {
        setVehicles(mendixClient.getVehicles());
      }
      setHubs(mendixClient.getHubs());
    } catch (err) {
      console.error('Failed to load dashboard data from Mendix client', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, isEnterpriseFleet]);

  // Subscribe to live 500+ fleet simulation
  useEffect(() => {
    if (isEnterpriseFleet) {
      fleetSimulationService.start(1500);
      const unsubscribe = fleetSimulationService.subscribe((fleet, stats) => {
        setVehicles(fleet);
        setTelematicsStats(stats);
      });
      return () => {
        unsubscribe();
        fleetSimulationService.stop();
      };
    } else {
      fleetSimulationService.stop();
      setVehicles(mendixClient.getVehicles());
    }
  }, [isEnterpriseFleet]);

  const handleToggleEnterpriseFleet = () => {
    setIsEnterpriseFleet((prev) => !prev);
  };

  const handleToggleSimPause = () => {
    setIsSimPaused((prev) => {
      const next = !prev;
      if (next) fleetSimulationService.stop();
      else fleetSimulationService.start(1500);
      return next;
    });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000); // 20s polling
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleResolveException = async (exceptionId: string, action: string, notes: string) => {
    await mendixClient.resolveException({ exceptionId, action, notes }, user);
    await fetchData();
  };

  const handleSubmitProposedEta = async (shipmentId: string, proposedEta: string, reason: string) => {
    await mendixClient.proposeEta({ shipmentId, proposedEta, reason }, user);
    await fetchData();
  };

  const effectiveSummary = useMemo(() => {
    if (!isEnterpriseFleet || !summary) return summary;
    return {
      ...summary,
      kpi: {
        ...summary.kpi,
        totalShipments: {
          ...summary.kpi.totalShipments,
          value: telematicsStats ? telematicsStats.totalCount : 520,
        },
        activeDeliveries: {
          value: telematicsStats ? telematicsStats.activeMoving : 468,
          prevMonth: 420,
          percentChange: 11.4,
          trend: [400, 420, 450, 468],
          isPositiveGood: true,
        },
        delayedShipments: {
          value: telematicsStats ? telematicsStats.delayedOrAtRisk : 34,
          prevMonth: 42,
          percentChange: -19.0,
          trend: [48, 42, 38, 34],
          isPositiveGood: false,
        },
        slaAtRiskShipments: {
          value: telematicsStats ? telematicsStats.delayedOrAtRisk : 34,
          prevMonth: 40,
          percentChange: -15.0,
          trend: [45, 40, 37, 34],
          isPositiveGood: false,
        },
      },
    };
  }, [
    isEnterpriseFleet, 
    summary, 
    telematicsStats?.totalCount, 
    telematicsStats?.activeMoving, 
    telematicsStats?.delayedOrAtRisk
  ]);

  return (
    <div className="space-y-6">
      <DashboardPage
        summary={effectiveSummary}
        shipments={shipments}
        vehicles={vehicles}
        hubs={hubs}
        exceptions={exceptions}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={setSelectedVehicleId}
        onSelectShipment={(shp) => setActiveShipmentDossier(shp)}
        onOpenShipmentDetail={(id) => navigate(`/shipments/${id}`)}
        onReviewAiException={(id) => {
          const exc = exceptions.find((e) => e.id === id);
          if (exc) setActiveExceptionDossier(exc);
          else navigate('/exceptions');
        }}
        onOpenWarRoom={() => navigate('/exceptions')}
        isLoading={isLoading}
        currentUserRole={role as any}
        isEnterpriseFleet={isEnterpriseFleet}
        onToggleEnterpriseFleet={handleToggleEnterpriseFleet}
        telematicsStats={telematicsStats}
        isSimPaused={isSimPaused}
        onToggleSimPause={handleToggleSimPause}
      />

      {/* Detail Modals */}
      <ShipmentDetailModal
        shipment={activeShipmentDossier}
        isOpen={!!activeShipmentDossier}
        onClose={() => setActiveShipmentDossier(null)}
        onReviewAiException={(id) => {
          const exc = exceptions.find((e) => e.id === id);
          if (exc) setActiveExceptionDossier(exc);
        }}
        onProposeEta={(shp) => setActiveCarrierProposeShipment(shp)}
        isCarrierUser={role === 'CARRIER'}
      />

      <ExceptionCenterModal
        exception={activeExceptionDossier}
        isOpen={!!activeExceptionDossier}
        onClose={() => setActiveExceptionDossier(null)}
        currentUserRole={role as any}
        onResolveException={handleResolveException}
      />

      <ProposeEtaModal
        shipment={activeCarrierProposeShipment}
        isOpen={!!activeCarrierProposeShipment}
        onClose={() => setActiveCarrierProposeShipment(null)}
        onSubmitProposedEta={handleSubmitProposedEta}
      />
    </div>
  );
};
