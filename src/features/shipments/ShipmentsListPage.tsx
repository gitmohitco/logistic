import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Search, 
  ArrowUpDown, 
  ChevronRight, 
  Clock, 
  RefreshCw,
  Truck,
  AlertCircle,
  Thermometer,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '../../types';
import { mendixClient } from '../../services/api/mendixClient';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ROLE_CONFIGS } from '../../config/roles';

function formatEta(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export const ShipmentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role, checkPermission } = useAuth();
  const roleConfig = ROLE_CONFIGS[role];

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortField, setSortField] = useState<keyof Shipment>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);

  const fetchShipments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await mendixClient.getShipments(
        {
          status: statusFilter,
          search: searchQuery,
          page,
          limit: 10,
        },
        user
      );
      setShipments(response.data);
      setTotalCount(response.pagination.total);
    } catch (err) {
      console.error('Failed to retrieve shipments from Mendix API', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery, page, user]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleSort = (field: keyof Shipment) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedShipments = useMemo(() => {
    return [...shipments].sort((a, b) => {
      const valA = (a as any)[sortField] ?? '';
      const valB = (b as any)[sortField] ?? '';
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [shipments, sortField, sortAsc]);

  // Compute status counts for badges
  const statusCounts = useMemo(() => {
    return {
      ALL: shipments.length,
      ON_ROUTE: shipments.filter((s) => s.status === 'ON_ROUTE').length,
      DELAYED: shipments.filter((s) => s.status === 'DELAYED').length,
      LOADING: shipments.filter((s) => s.status === 'LOADING').length,
      DELIVERED: shipments.filter((s) => s.status === 'DELIVERED').length,
    };
  }, [shipments]);

  const getStatusBadge = (status: ShipmentStatus, delayMinutes: number = 0) => {
    switch (status) {
      case 'ON_ROUTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#18217E]/10 text-[#18217E] border border-[#18217E]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#18217E] animate-pulse" />
            <span>In Transit</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivered</span>
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Delayed</span>
            {delayMinutes > 0 && <span className="text-[10px] font-mono opacity-80">(+{delayMinutes}m)</span>}
          </span>
        );
      case 'LOADING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Loading</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const statusFilters = [
    { key: 'ALL', label: 'All Shipments', count: statusCounts.ALL },
    { key: 'ON_ROUTE', label: 'In Transit', count: statusCounts.ON_ROUTE },
    { key: 'DELAYED', label: 'Delayed', count: statusCounts.DELAYED },
    { key: 'LOADING', label: 'Loading', count: statusCounts.LOADING },
    { key: 'DELIVERED', label: 'Delivered', count: statusCounts.DELIVERED },
  ] as const;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Unified Enterprise Header & Filter Control Card */}
      <div className="bg-white rounded-2xl border border-[#D0D9DE] shadow-card p-5">
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#D0D9DE]/70">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#18217E]/10 border border-[#18217E]/20 flex items-center justify-center text-[#18217E] flex-shrink-0 mt-0.5">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base font-bold text-[#09104D] tracking-tight">
                  Active Manifest Network
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#18217E]/10 text-[#18217E] border border-[#18217E]/20">
                  {totalCount} Verified Consignments
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Mendix Governed</span>
                </span>
              </div>
              <p className="text-xs text-[#393A50] mt-1">
                Authorized for <strong className="text-[#18217E]">{roleConfig.label}</strong> ({user.name}) · Enterprise real-time supply chain telematics
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            {checkPermission('canBulkTrack') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/bulk-track')}
                className="text-xs font-semibold whitespace-nowrap"
              >
                Bulk Track CSV / Text
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={fetchShipments}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              className="text-xs font-semibold whitespace-nowrap"
            >
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Bottom Search & Status Filter Row */}
        <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8A9995] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search tracking ID, carrier, route, or cargo..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-xl text-[#070724] placeholder-[#8A9995] focus:outline-none focus:border-[#18217E] focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#8A9995] hover:text-[#09104D] rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Status Tabs with Badges */}
          <div className="flex items-center bg-[#E5EBEE] p-1 rounded-xl gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {statusFilters.map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.key as any);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#18217E] shadow-xs font-bold'
                      : 'text-[#393A50] hover:text-[#09104D] hover:bg-white/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-normal transition-colors ${
                      isActive
                        ? 'bg-[#18217E]/10 text-[#18217E]'
                        : 'bg-[#D0D9DE]/80 text-[#393A50]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shipments Table Card */}
      <div className="bg-white rounded-2xl border border-[#D0D9DE] shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : sortedShipments.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No Matching Shipments Found"
              description="No shipment manifests match the active search query or status filter in your authorized scope."
              actionLabel="Reset Search & Filters"
              onAction={() => {
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F4F7F9] border-b border-[#D0D9DE] text-[#09104D] font-bold uppercase tracking-wider text-[11px] select-none">
                <tr>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:bg-[#E5EBEE] transition-colors"
                    onClick={() => handleSort('trackingId')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Tracking ID</span>
                      <ArrowUpDown className="w-3 h-3 text-[#424989]" />
                    </div>
                  </th>

                  <th className="py-3.5 px-4">Status & SLA</th>

                  <th
                    className="py-3.5 px-4 cursor-pointer hover:bg-[#E5EBEE] transition-colors"
                    onClick={() => handleSort('carrierName')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Carrier & Asset</span>
                      <ArrowUpDown className="w-3 h-3 text-[#424989]" />
                    </div>
                  </th>

                  <th className="py-3.5 px-4">Corridor (Origin → Destination)</th>

                  <th
                    className="py-3.5 px-4 cursor-pointer hover:bg-[#E5EBEE] transition-colors"
                    onClick={() => handleSort('estimatedArrival')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Estimated Arrival</span>
                      <ArrowUpDown className="w-3 h-3 text-[#424989]" />
                    </div>
                  </th>

                  <th className="py-3.5 px-4">Cargo & Telematics</th>

                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E5EBEE]">
                {sortedShipments.map((shp) => {
                  const isDelayed = shp.status === 'DELAYED' || shp.delayMinutes > 0;
                  return (
                    <tr
                      key={shp.id}
                      onClick={() => navigate(`/shipments/${shp.id}`)}
                      className="hover:bg-[#F8FAFC] transition-colors group cursor-pointer"
                    >
                      {/* 1. Tracking ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-[#18217E] group-hover:text-[#09104D] flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#424989] flex-shrink-0" />
                          <span>{shp.trackingId}</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#8A9995] mt-0.5 pl-6">
                          Ref: {shp.id}
                        </div>
                      </td>

                      {/* 2. Status & SLA */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          {getStatusBadge(shp.status, shp.delayMinutes)}
                          {shp.isSlaAtRisk && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                              SLA Breach Risk
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Carrier & Asset */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-[#09104D]">
                          <Truck className="w-3.5 h-3.5 text-[#424989] flex-shrink-0" />
                          <span>{shp.carrierName}</span>
                        </div>
                        {shp.vehicleCode && (
                          <div className="mt-0.5 pl-5">
                            <span className="inline-block font-mono text-[10px] text-[#424989] bg-[#E5EBEE]/80 px-1.5 py-0.2 rounded border border-[#D0D9DE]/60">
                              {shp.vehicleCode}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 4. Corridor */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#09104D] font-medium">
                          <span className="font-semibold">{shp.originHubName}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#8A9995] flex-shrink-0" />
                          <span className="font-bold text-[#18217E]">{shp.destinationHubName}</span>
                        </div>
                        <div className="text-[10px] text-[#8A9995] mt-0.5">
                          Direct Intermodal Corridor
                        </div>
                      </td>

                      {/* 5. Estimated Arrival */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#09104D]">
                          <Clock className="w-3.5 h-3.5 text-[#424989] flex-shrink-0" />
                          <span>{formatEta(shp.estimatedArrival)}</span>
                        </div>
                        {isDelayed && (
                          <div className="text-[10px] font-bold text-rose-600 mt-0.5 pl-5">
                            +{shp.delayMinutes || 15}m Behind Schedule
                          </div>
                        )}
                      </td>

                      {/* 6. Cargo & Telematics */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-[#070724] line-clamp-1 max-w-[220px]" title={shp.cargoType}>
                          {shp.cargoType}
                        </div>
                        {shp.temperatureCelsius !== undefined && shp.temperatureCelsius !== null ? (
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                shp.temperatureCelsius > 6.0
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : 'bg-sky-50 text-sky-700 border-sky-200'
                              }`}
                            >
                              <Thermometer className="w-3 h-3" />
                              <span>{shp.temperatureCelsius > 0 ? `+${shp.temperatureCelsius}` : shp.temperatureCelsius}°C</span>
                              {shp.temperatureCelsius > 6.0 && <span className="text-[9px] uppercase font-black">(Alert)</span>}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-[#8A9995] mt-0.5">Ambient Dry Freight</div>
                        )}
                      </td>

                      {/* 7. Action Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/shipments/${shp.id}`);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#18217E] bg-[#18217E]/5 group-hover:bg-[#18217E] group-hover:text-white transition-all inline-flex items-center gap-1 cursor-pointer border border-[#18217E]/10 group-hover:border-[#18217E]"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Record Metrics */}
        {!isLoading && sortedShipments.length > 0 && (
          <div className="px-5 py-3 border-t border-[#D0D9DE] bg-[#F4F7F9] flex flex-col sm:flex-row items-center justify-between text-xs text-[#393A50] gap-2">
            <span>
              Displaying <strong>{sortedShipments.length}</strong> of <strong>{totalCount}</strong> active freight records
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8A9995]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-time GPS telematics synchronized</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
