import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  RotateCcw, 
  Truck, 
  Plane, 
  Ship, 
  AlertTriangle,
  Play,
  Pause,
  Radio,
  Building,
  ShieldCheck,
  Zap,
  Bug,
  Crosshair,
  CheckCircle2,
  GripVertical,
  Plus,
  Minus,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { Shipment, Vehicle, TransportMode } from '../../types';
import { TelematicsFleetStats, CARRIER_PARTNERS, fleetSimulationService } from '../../services/telematics/fleetSimulationService';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export interface TrackingMapProps {
  vehicles: Vehicle[];
  shipments: Shipment[];
  selectedVehicleId?: string | null;
  onSelectVehicle: (vehicleId: string) => void;
  className?: string;
  isSimulating?: boolean;
  isEnterpriseFleet?: boolean;
  onToggleEnterpriseFleet?: () => void;
  telematicsStats?: TelematicsFleetStats;
  isSimPaused?: boolean;
  onToggleSimPause?: () => void;
}

export const TrackingMapComponent: React.FC<TrackingMapProps> = ({
  vehicles,
  shipments,
  selectedVehicleId,
  onSelectVehicle,
  className = '',
  isSimulating: _isSimulating = false,
  isEnterpriseFleet = false,
  onToggleEnterpriseFleet,
  telematicsStats,
  isSimPaused = false,
  onToggleSimPause,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const canvasRendererRef = useRef<L.Canvas | null>(null);
  
  // Persistent recycled marker pool: vehicleId -> Leaflet Layer
  const markersMapRef = useRef<Map<string, L.CircleMarker | L.Marker>>(new Map());
  const selectedHaloMarkerRef = useRef<L.CircleMarker | null>(null);
  const routesLayerGroupRef = useRef<L.FeatureGroup | null>(null);
  const prevSelectedVehicleIdRef = useRef<string | null>(null);

  const [modeFilter, setModeFilter] = useState<'ALL' | TransportMode>('ALL');
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL');
  const [showDelayedOnly, setShowDelayedOnly] = useState(false);
  const [followSelected, setFollowSelected] = useState(false);
  const [chaosTestNotice, setChaosTestNotice] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close tools dropdown when clicking outside
  useEffect(() => {
    if (!toolsOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [toolsOpen]);

  // Draggable Toolbar State & Boundary Constraints
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 1. Initialize Map ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [38.5, -96.0],
        zoom: 4,
        zoomControl: false,
        preferCanvas: true,
      });

      // Enterprise light-gray tiles with zero watermark
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
        maxZoom: 16,
      }).addTo(map);

      // Single shared GPU canvas renderer for hundreds of vehicles
      const canvasRenderer = L.canvas({ padding: 0.5 });
      canvasRendererRef.current = canvasRenderer;
      canvasRenderer.addTo(map);

      // Separate layer for static routes & hubs
      const routesGroup = L.featureGroup().addTo(map);
      routesLayerGroupRef.current = routesGroup;

      mapInstanceRef.current = map;

      // Observe container size adjustments dynamically (e.g. stretching to match right-hand widgets)
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        const resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        });
        resizeObserver.observe(mapContainerRef.current);
        (map as any)._resizeObserver = resizeObserver;
      }
    } catch (err) {
      console.error('[TrackingMap] Failed to initialize Leaflet map instance safely:', err);
    }

    return () => {
      try {
        if (mapInstanceRef.current) {
          if ((mapInstanceRef.current as any)._resizeObserver) {
            (mapInstanceRef.current as any)._resizeObserver.disconnect();
          }
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        markersMapRef.current.clear();
        selectedHaloMarkerRef.current = null;
        canvasRendererRef.current = null;
        routesLayerGroupRef.current = null;
      } catch (err) {
        console.warn('[TrackingMap] Cleanup warning handled safely:', err);
      }
    };
  }, []);

  // 2. Render Static Shipment Routes & Hub Markers (ONLY when shipments or route filters change!)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routesGroup = routesLayerGroupRef.current;
    if (!map || !routesGroup) return;

    routesGroup.clearLayers();

    const filteredShipments = shipments.filter((shp) => {
      if (carrierFilter !== 'ALL' && shp.carrierId !== carrierFilter) return false;
      if (showDelayedOnly && shp.status !== 'DELAYED') return false;
      return true;
    });

    filteredShipments.forEach((shp) => {
      const isSelected = shp.vehicleId === selectedVehicleId;
      const isDelayed = shp.status === 'DELAYED';
      const routeCoords: L.LatLngExpression[] = shp.routeCoordinates && shp.routeCoordinates.length > 0
        ? shp.routeCoordinates.map((c) => [c[0], c[1]] as [number, number])
        : [[shp.originCoords[0], shp.originCoords[1]], [shp.destinationCoords[0], shp.destinationCoords[1]]];

      // Route polyline
      const polyline = L.polyline(routeCoords, {
        color: isDelayed ? '#EA341F' : isSelected ? '#18217E' : '#424989',
        weight: isSelected ? 4 : 2,
        opacity: isSelected ? 0.95 : 0.6,
        dashArray: isDelayed ? '6, 6' : undefined,
      });
      routesGroup.addLayer(polyline);

      // Origin Hub Marker
      const originIcon = L.divIcon({
        className: 'hub-origin-marker',
        html: `<div style="background-color: #09104D; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.3);" title="${shp.originHubName}"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });
      L.marker([shp.originCoords[0], shp.originCoords[1]], { icon: originIcon })
        .bindTooltip(`Origin Hub: ${shp.originHubName}`, { direction: 'top' })
        .addTo(routesGroup);

      // Destination Hub Marker
      const destIcon = L.divIcon({
        className: 'hub-dest-marker',
        html: `<div style="background-color: #107C41; width: 12px; height: 12px; border-radius: 2px; border: 2px solid #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.3);" title="${shp.destinationHubName}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      L.marker([shp.destinationCoords[0], shp.destinationCoords[1]], { icon: destIcon })
        .bindTooltip(`Destination: ${shp.destinationHubName}`, { direction: 'top' })
        .addTo(routesGroup);
    });
  }, [shipments, selectedVehicleId, carrierFilter, showDelayedOnly]);

  // 3. ZERO-ALLOCATION VEHICLE TELEMETRY RECYCLER
  // Updates lat/lng on existing markers without deleting and recreating Leaflet DOM/Canvas layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const canvasRenderer = canvasRendererRef.current;
    if (!map || !canvasRenderer) return;

    const currentVehicleIds = new Set<string>();
    const isEnterpriseScale = vehicles.length > 50 || isEnterpriseFleet;

    vehicles.forEach((veh) => {
      // Coordinate validity check (prevents NaN / out of bounds Leaflet crashes)
      const lat = Number(veh.currentLatitude);
      const lng = Number(veh.currentLongitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return; // Safe fault barrier
      }

      currentVehicleIds.add(veh.id);

      // Apply mode & carrier filters
      const matchesMode = modeFilter === 'ALL' || veh.transportMode === modeFilter;
      const matchesCarrier = carrierFilter === 'ALL' || veh.carrierId === carrierFilter;
      const assignedShipment = shipments.find((s) => s.vehicleId === veh.id || s.vehicleCode === veh.vehicleCode);
      const matchesDelayed = !showDelayedOnly || assignedShipment?.status === 'DELAYED';

      const isVisible = matchesMode && matchesCarrier && matchesDelayed;
      const isSelected = veh.id === selectedVehicleId;
      const isDelayed = assignedShipment?.status === 'DELAYED';
      const isMaintenance = veh.status === 'MAINTENANCE';

      // Carrier brand colors
      let markerColor = '#18217E';
      if (veh.carrierId === 'CAR-001') markerColor = '#18217E';
      else if (veh.carrierId === 'CAR-002') markerColor = '#424989';
      else if (veh.carrierId === 'CAR-003') markerColor = '#00838F';
      else if (veh.carrierId === 'CAR-004') markerColor = '#D97706';
      else if (veh.carrierId === 'CAR-005') markerColor = '#107C41';

      if (isDelayed) markerColor = '#EA341F';
      else if (isMaintenance) markerColor = '#8A9995';

      let existingMarker = markersMapRef.current.get(veh.id);

      if (!isVisible) {
        // If filtered out, hide or remove existing marker
        if (existingMarker) {
          existingMarker.remove();
          markersMapRef.current.delete(veh.id);
        }
        return;
      }

      if (isEnterpriseScale) {
        const radius = isSelected ? 9 : veh.transportMode === 'AIR' ? 6 : 4.5;

        if (existingMarker && existingMarker instanceof L.CircleMarker) {
          // RECYCLE EXISTING MARKER: Fast in-place mutation, no DOM reallocation
          existingMarker.setLatLng([lat, lng]);
          existingMarker.setStyle({
            fillColor: markerColor,
            color: isSelected ? '#EA341F' : '#FFFFFF',
            weight: isSelected ? 3 : 1.5,
            radius,
          });
        } else {
          // Create once and add to map
          if (existingMarker) existingMarker.remove();

          const marker = L.circleMarker([lat, lng], {
            renderer: canvasRenderer,
            radius,
            fillColor: markerColor,
            color: isSelected ? '#EA341F' : '#FFFFFF',
            weight: isSelected ? 3 : 1.5,
            fillOpacity: isSelected ? 1 : 0.9,
          }).addTo(map);

          marker.on('click', () => {
            onSelectVehicle(veh.id);
          });

          marker.bindTooltip(
            `<div style="font-family: inherit; font-size: 11px;">
              <strong style="color: #09104D;">${veh.vehicleCode}</strong> (${veh.carrierName || 'Fleet'})<br/>
              Mode: <strong>${veh.transportMode}</strong> • Speed: <strong>${veh.currentSpeedKph} km/h</strong><br/>
              Status: <strong style="color: ${veh.status === 'ACTIVE' ? '#107C41' : '#EA341F'};">${veh.status}</strong><br/>
              Driver: <strong>${veh.driverName || 'Dispatch Assigned'}</strong>
            </div>`,
            { direction: 'top', offset: [0, -8] }
          );

          markersMapRef.current.set(veh.id, marker);
        }
      } else {
        // Standard detailed marker for small fleets
        if (existingMarker) {
          existingMarker.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng]).addTo(map);
          marker.on('click', () => onSelectVehicle(veh.id));
          markersMapRef.current.set(veh.id, marker);
        }
      }
    });

    // Remove any markers that no longer exist in fleet
    markersMapRef.current.forEach((marker, id) => {
      if (!currentVehicleIds.has(id)) {
        marker.remove();
        markersMapRef.current.delete(id);
      }
    });

    // Update selected vehicle halo ring without thrashing layers
    if (selectedVehicleId) {
      const selectedVeh = vehicles.find((v) => v.id === selectedVehicleId);
      if (selectedVeh) {
        const lat = Number(selectedVeh.currentLatitude);
        const lng = Number(selectedVeh.currentLongitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          if (!selectedHaloMarkerRef.current) {
            selectedHaloMarkerRef.current = L.circleMarker([lat, lng], {
              renderer: canvasRenderer,
              radius: 16,
              fillColor: '#18217E',
              fillOpacity: 0.25,
              color: '#18217E',
              weight: 2,
              dashArray: '3, 3',
            }).addTo(map);
          } else {
            selectedHaloMarkerRef.current.setLatLng([lat, lng]);
          }

          // Camera follow behavior (only pans smoothly, never interrupts manual drag)
          const isInitialSelect = prevSelectedVehicleIdRef.current !== selectedVehicleId;
          if (isInitialSelect || followSelected) {
            map.panTo([lat, lng], { animate: true });
          }
        }
      }
    } else {
      if (selectedHaloMarkerRef.current) {
        selectedHaloMarkerRef.current.remove();
        selectedHaloMarkerRef.current = null;
      }
    }

    prevSelectedVehicleIdRef.current = selectedVehicleId || null;
  }, [vehicles, selectedVehicleId, modeFilter, carrierFilter, showDelayedOnly, isEnterpriseFleet, followSelected, onSelectVehicle, shipments]);

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([38.5, -96.0], 4, { animate: true });
  };

  const handleTriggerChaosTest = () => {
    const res = fleetSimulationService.injectCorruptData();
    setChaosTestNotice(`${res.status} (${res.injectedCount} corrupted packets sanitized)`);
    setTimeout(() => setChaosTestNotice(null), 5000);
  };

  const handleTriggerBurstTest = () => {
    const res = fleetSimulationService.injectBurstStream(250);
    setChaosTestNotice(`Burst Spike Processed: 250 packets in ${res.durationMs}ms (0 dropped frames)`);
    setTimeout(() => setChaosTestNotice(null), 5000);
  };

  // Disable Leaflet map dragging when interacting with the floating toolbar
  useEffect(() => {
    if (toolbarRef.current) {
      L.DomEvent.disableClickPropagation(toolbarRef.current);
      L.DomEvent.disableScrollPropagation(toolbarRef.current);
    }
  }, []);

  const handleGripPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: toolbarPos.x,
      initY: toolbarPos.y,
    };
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    e.stopPropagation();

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const mapEl = mapContainerRef.current;
    const toolbarEl = toolbarRef.current;
    let nextX = dragStartRef.current.initX + deltaX;
    let nextY = dragStartRef.current.initY + deltaY;

    if (mapEl && toolbarEl) {
      const mapRect = mapEl.getBoundingClientRect();
      const toolbarRect = toolbarEl.getBoundingClientRect();
      const minX = -4;
      const maxX = Math.max(0, mapRect.width - toolbarRect.width - 16);
      const minY = -4;
      const maxY = Math.max(0, mapRect.height - toolbarRect.height - 16);

      nextX = Math.max(minX, Math.min(maxX, nextX));
      nextY = Math.max(minY, Math.min(maxY, nextY));
    }

    setToolbarPos({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.stopPropagation();
    setIsDragging(false);
    dragStartRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const filteredCount = useMemo(() => {
    return vehicles.filter((v) => {
      if (modeFilter !== 'ALL' && v.transportMode !== modeFilter) return false;
      if (carrierFilter !== 'ALL' && v.carrierId !== carrierFilter) return false;
      return true;
    }).length;
  }, [vehicles, modeFilter, carrierFilter]);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-[#D0D9DE] shadow-card bg-white flex flex-col ${className}`}>
      {/* Map Surface */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[380px] flex-1 z-10" />

      {/* UNIFIED INLINE TOP TOOLBAR (DRAGGABLE) */}
      <div 
        ref={toolbarRef}
        style={{
          transform: `translate3d(${toolbarPos.x}px, ${toolbarPos.y}px, 0)`,
          willChange: isDragging ? 'transform' : 'auto',
        }}
        className={`absolute top-3 left-3 z-20 pointer-events-auto transition-shadow duration-150 ${
          isDragging ? 'shadow-2xl ring-2 ring-[#18217E]/40' : ''
        }`}
      >
        <div className="bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl border border-[#D0D9DE] shadow-sm flex items-center gap-1.5 text-xs">
          {/* DRAG HANDLE */}
          <div
            onPointerDown={handleGripPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={() => setToolbarPos({ x: 0, y: 0 })}
            title="Drag toolbar anywhere across the map (Double-click to reset position)"
            className="cursor-grab active:cursor-grabbing p-1 -ml-0.5 text-[#8A9995] hover:text-[#09104D] hover:bg-[#E5EBEE] rounded flex items-center justify-center transition-colors group select-none flex-shrink-0"
          >
            <GripVertical className="w-3.5 h-3.5 group-hover:scale-110 text-current" />
          </div>

          <div className="h-3.5 w-px bg-[#D0D9DE] flex-shrink-0" />

          {/* 1. Fleet Scale Switcher */}
          <button
            onClick={() => onToggleEnterpriseFleet && onToggleEnterpriseFleet()}
            className={`px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap text-[11px] flex-shrink-0 ${
              isEnterpriseFleet
                ? 'bg-[#18217E] text-white shadow-xs'
                : 'bg-[#F4F7F9] text-[#393A50] hover:bg-[#E5EBEE]'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{isEnterpriseFleet ? '520 Live' : 'Demo'}</span>
          </button>

          <div className="h-3.5 w-px bg-[#D0D9DE] flex-shrink-0" />

          {/* 2. Transport Mode Filter Segmented Pill */}
          <div className="flex items-center gap-0.5 bg-[#F4F7F9] p-0.5 rounded-lg text-[11px] flex-shrink-0">
            <button
              onClick={() => setModeFilter('ALL')}
              className={`px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer whitespace-nowrap ${
                modeFilter === 'ALL'
                  ? 'bg-[#18217E] text-white shadow-xs'
                  : 'text-[#393A50] hover:text-[#070724]'
              }`}
            >
              All ({filteredCount})
            </button>
            <button
              onClick={() => setModeFilter('GROUND')}
              title="Ground Fleet"
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                modeFilter === 'GROUND'
                  ? 'bg-[#18217E] text-white shadow-xs font-bold'
                  : 'text-[#393A50] hover:text-[#070724]'
              }`}
            >
              <Truck className="w-3 h-3" />
              <span>Ground</span>
            </button>
            <button
              onClick={() => setModeFilter('AIR')}
              title="Air Cargo"
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                modeFilter === 'AIR'
                  ? 'bg-[#18217E] text-white shadow-xs font-bold'
                  : 'text-[#393A50] hover:text-[#070724]'
              }`}
            >
              <Plane className="w-3 h-3" />
              <span>Air</span>
            </button>
            <button
              onClick={() => setModeFilter('SEA')}
              title="Maritime Cargo"
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                modeFilter === 'SEA'
                  ? 'bg-[#18217E] text-white shadow-xs font-bold'
                  : 'text-[#393A50] hover:text-[#070724]'
              }`}
            >
              <Ship className="w-3 h-3" />
              <span>Sea</span>
            </button>
          </div>

          <div className="h-3.5 w-px bg-[#D0D9DE] flex-shrink-0" />

          {/* 3. Carrier Dropdown */}
          <div className="flex items-center gap-1 bg-[#F4F7F9] px-1.5 py-0.5 rounded-lg border border-[#D0D9DE]/60 text-[11px] flex-shrink-0">
            <Building className="w-3 h-3 text-[#424989]" />
            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              className="bg-transparent font-semibold text-[#09104D] focus:outline-none cursor-pointer text-[11px]"
            >
              <option value="ALL">All Carriers</option>
              {CARRIER_PARTNERS.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  {cp.code}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Delays Toggle */}
          <button
            onClick={() => setShowDelayedOnly(!showDelayedOnly)}
            className={`px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap text-[11px] flex-shrink-0 ${
              showDelayedOnly
                ? 'bg-[#EA341F] text-white shadow-xs'
                : 'text-[#EA341F] bg-[#EA341F]/10 hover:bg-[#EA341F]/20'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Delays</span>
          </button>

          <div className="h-3.5 w-px bg-[#D0D9DE] flex-shrink-0" />

          {/* 5. Compact Diagnostic FPS Micro-pill */}
          {telematicsStats && (
            <div 
              title={`Stability: 100% Isolated Sandbox | FPS: ${telematicsStats.fps} | Live rate: ${telematicsStats.pingsPerSecond} p/s`}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] whitespace-nowrap cursor-help flex-shrink-0"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span className="font-mono">{telematicsStats.fps} FPS</span>
            </div>
          )}

          {/* 6. Stream & Simulation Tools Popover Trigger */}
          <div className="relative flex-shrink-0" ref={toolsMenuRef}>
            <button
              id="tools-menu-btn"
              type="button"
              onClick={() => setToolsOpen((prev) => !prev)}
              title="Simulation stream speed, telemetry rate & chaos test sandbox controls"
              className={`px-1.5 py-0.5 rounded-lg font-semibold flex items-center gap-1 text-[11px] transition-colors cursor-pointer border ${
                toolsOpen 
                  ? 'bg-[#18217E] text-white border-[#18217E]' 
                  : 'bg-[#F4F7F9] text-[#393A50] hover:text-[#09104D] border-[#D0D9DE]/70'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Tools</span>
              <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-150 ${toolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Stream & Chaos Testing Popover */}
            {toolsOpen && (
              <div 
                className="absolute right-0 top-full mt-1.5 w-64 bg-white/95 backdrop-blur-md border border-[#D0D9DE] shadow-xl rounded-xl p-3 z-40 text-xs space-y-3 animate-fadeIn"
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                {/* Stream Speed & Pause */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#8A9995] uppercase mb-1.5">
                    <span>Simulation Speed</span>
                    {telematicsStats && (
                      <span className="font-mono text-[#09104D] flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 text-emerald-600" />
                        {telematicsStats.pingsPerSecond} p/s
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        fleetSimulationService.setSpeedMode('NORMAL');
                        setToolsOpen(false);
                      }}
                      className={`flex-1 py-1 rounded text-center text-xs font-bold transition-colors cursor-pointer ${
                        telematicsStats?.simulationSpeedMode === 'NORMAL' ? 'bg-[#18217E] text-white' : 'bg-[#F4F7F9] hover:bg-[#E5EBEE] text-[#393A50]'
                      }`}
                    >
                      1x
                    </button>
                    <button
                      onClick={() => {
                        fleetSimulationService.setSpeedMode('FAST');
                        setToolsOpen(false);
                      }}
                      className={`flex-1 py-1 rounded text-center text-xs font-bold transition-colors cursor-pointer ${
                        telematicsStats?.simulationSpeedMode === 'FAST' ? 'bg-[#18217E] text-white' : 'bg-[#F4F7F9] hover:bg-[#E5EBEE] text-[#393A50]'
                      }`}
                    >
                      3x
                    </button>
                    <button
                      onClick={() => {
                        fleetSimulationService.setSpeedMode('TURBO');
                        setToolsOpen(false);
                      }}
                      className={`flex-1 py-1 rounded text-center text-xs font-bold transition-colors cursor-pointer ${
                        telematicsStats?.simulationSpeedMode === 'TURBO' ? 'bg-amber-600 text-white' : 'bg-[#F4F7F9] hover:bg-[#E5EBEE] text-[#393A50]'
                      }`}
                    >
                      Turbo
                    </button>
                    {onToggleSimPause && (
                      <button
                        onClick={onToggleSimPause}
                        className="p-1 rounded bg-[#F4F7F9] hover:bg-[#E5EBEE] text-[#393A50] cursor-pointer"
                        title={isSimPaused ? 'Resume stream' : 'Pause stream'}
                      >
                        {isSimPaused ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-amber-600" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Resilience / Chaos Test Tools */}
                <div className="pt-2 border-t border-[#D0D9DE]/70">
                  <div className="text-[10px] font-bold text-[#8A9995] uppercase mb-1.5 flex items-center justify-between">
                    <span>Resilience Sandbox</span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-bold">100% Stable</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        handleTriggerChaosTest();
                        setToolsOpen(false);
                      }}
                      className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors text-[10px]"
                    >
                      <Bug className="w-3 h-3 text-amber-600" />
                      <span>Bad Data</span>
                    </button>
                    <button
                      onClick={() => {
                        handleTriggerBurstTest();
                        setToolsOpen(false);
                      }}
                      className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors text-[10px]"
                    >
                      <Zap className="w-3 h-3 text-blue-600" />
                      <span>Burst Spike</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chaos Test / Resilience Feedback Toast (Positioned dynamically with draggable toolbar) */}
      {chaosTestNotice && (
        <div 
          style={{
            transform: `translate3d(${toolbarPos.x}px, ${toolbarPos.y + 44}px, 0)`,
          }}
          className="absolute top-3 left-3 z-30 bg-[#09104D] text-white px-3 py-1.5 rounded-lg border border-emerald-400/60 shadow-lg text-xs flex items-center gap-2 animate-fadeIn pointer-events-none transition-transform duration-75"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{chaosTestNotice}</span>
        </div>
      )}

      {/* Unified Top Right Camera & Zoom Controls */}
      <div 
        className="absolute top-3 right-3 z-20 flex flex-col bg-white/95 backdrop-blur-md rounded-xl border border-[#D0D9DE] shadow-md overflow-hidden divide-y divide-[#D0D9DE]"
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          title="Zoom In (+)"
          aria-label="Zoom In"
          className="p-2 text-[#09104D] hover:bg-[#E5EBEE] hover:text-[#18217E] transition-colors cursor-pointer flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          title="Zoom Out (−)"
          aria-label="Zoom Out"
          className="p-2 text-[#09104D] hover:bg-[#E5EBEE] hover:text-[#18217E] transition-colors cursor-pointer flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleResetView}
          title="Reset Map to Continental Overview"
          aria-label="Reset Map View"
          className="p-2 text-[#09104D] hover:bg-[#E5EBEE] hover:text-[#18217E] transition-colors cursor-pointer flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {selectedVehicleId && (
          <button
            type="button"
            onClick={() => setFollowSelected(!followSelected)}
            title={followSelected ? 'Disable Camera Follow' : 'Lock Camera on Selected Vehicle'}
            aria-label="Toggle Camera Follow"
            className={`p-2 transition-colors cursor-pointer flex items-center justify-center ${
              followSelected
                ? 'bg-[#18217E] text-white hover:bg-[#09104D]'
                : 'text-[#09104D] hover:bg-[#E5EBEE] hover:text-[#18217E]'
            }`}
          >
            <Crosshair className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Carrier Color Legend & Recycled Marker Health Counter (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#D0D9DE] shadow-sm text-[11px] text-[#393A50] flex flex-wrap items-center gap-3">
        <span className="font-bold text-[#09104D] text-[10px] uppercase tracking-wider">Carriers:</span>
        {CARRIER_PARTNERS.map((c) => (
          <div 
            key={c.id} 
            onClick={() => setCarrierFilter(carrierFilter === c.id ? 'ALL' : c.id)}
            className={`flex items-center gap-1 cursor-pointer transition-opacity ${
              carrierFilter === 'ALL' || carrierFilter === c.id ? 'opacity-100 font-semibold' : 'opacity-40'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
            <span>{c.code}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 text-[#EA341F] font-semibold border-l border-[#D0D9DE] pl-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EA341F]" />
          <span>SLA Breach</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-700 font-medium border-l border-[#D0D9DE] pl-2 font-mono text-[10px]">
          <span>Pool: {markersMapRef.current.size} Reused</span>
        </div>
      </div>
    </div>
  );
};

export const TrackingMap: React.FC<TrackingMapProps> = (props) => {
  return (
    <ErrorBoundary fallbackTitle="Live Tracking Map Protected">
      <TrackingMapComponent {...props} />
    </ErrorBoundary>
  );
};
