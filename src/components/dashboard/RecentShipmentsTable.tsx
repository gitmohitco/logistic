import React, { useState, useMemo } from 'react';
import { DataTable, Column } from '../ui/DataTable';
import { Badge } from '../ui/Badge';
import { Shipment, ShipmentStatus } from '../../types';
import { 
  Search, 
  Filter, 
  Truck, 
  User, 
  Bot, 
  AlertCircle 
} from 'lucide-react';

export interface RecentShipmentsTableProps {
  shipments: Shipment[];
  isLoading?: boolean;
  onSelectShipment: (shipment: Shipment) => void;
  onReviewAiException?: (exceptionId: string) => void;
  className?: string;
}

const RecentShipmentsTableComponent: React.FC<RecentShipmentsTableProps> = ({
  shipments,
  isLoading = false,
  onSelectShipment,
  onReviewAiException,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ShipmentStatus>('ALL');
  const [sortField, setSortField] = useState<string>('estimatedArrival');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter & Sort Logic
  const filteredAndSortedShipments = useMemo(() => {
    let result = shipments.filter((shp) => {
      const matchSearch =
        shp.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shp.originHubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shp.destinationHubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shp.vehicleCode && shp.vehicleCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (shp.driverName && shp.driverName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || shp.status === statusFilter;

      return matchSearch && matchStatus;
    });

    result.sort((a, b) => {
      let valA: any = (a as any)[sortField];
      let valB: any = (b as any)[sortField];

      if (sortField === 'estimatedArrival') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [shipments, searchTerm, statusFilter, sortField, sortDirection]);

  // Pagination calculation
  const totalItems = filteredAndSortedShipments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedShipments.slice(start, start + pageSize);
  }, [filteredAndSortedShipments, currentPage, pageSize]);

  const handleSort = (fieldKey: string) => {
    if (sortField === fieldKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(fieldKey);
      setSortDirection('asc');
    }
  };

  // Define Columns
  const columns: Column<Shipment>[] = [
    {
      key: 'trackingId',
      header: 'Tracking ID',
      sortable: true,
      render: (shp) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-[#18217E]">{shp.trackingId}</span>
          {shp.activeExceptionId && (
            <span
              title="Active Logistics Anomaly"
              className="p-1 rounded bg-[#EA341F]/15 text-[#EA341F]"
            >
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'originHubName',
      header: 'Origin',
      sortable: true,
      render: (shp) => (
        <span className="font-medium text-[#070724]">{shp.originHubName}</span>
      ),
    },
    {
      key: 'destinationHubName',
      header: 'Destination',
      sortable: true,
      render: (shp) => (
        <span className="font-medium text-[#070724]">{shp.destinationHubName}</span>
      ),
    },
    {
      key: 'estimatedArrival',
      header: 'Estimated Arrival',
      sortable: true,
      render: (shp) => {
        const date = new Date(shp.estimatedArrival);
        const isDelayed = shp.status === 'DELAYED';
        return (
          <div className="flex flex-col">
            <span className={`font-semibold ${isDelayed ? 'text-[#EA341F]' : 'text-[#070724]'}`}>
              {date.toLocaleDateString([], { month: 'short', day: 'numeric' })},{' '}
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isDelayed && shp.delayMinutes > 0 && (
              <span className="text-[10px] text-[#EA341F] font-bold">
                +{shp.delayMinutes} min delay
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'vehicleCode',
      header: 'Vehicle ID',
      render: (shp) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-[#09104D]">
          <Truck className="w-3.5 h-3.5 text-[#424989]" />
          <span>{shp.vehicleCode || 'Unassigned'}</span>
        </div>
      ),
    },
    {
      key: 'driverName',
      header: 'Driver',
      render: (shp) => (
        <div className="flex items-center gap-1.5 text-xs text-[#393A50]">
          <User className="w-3.5 h-3.5 text-[#8A9995]" />
          <span>{shp.driverName || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (shp) => {
        const variant =
          shp.status === 'ON_ROUTE' ? 'on_route' :
          shp.status === 'DELAYED' ? 'delayed' :
          shp.status === 'DELIVERED' ? 'delivered' : 'loading';

        return (
          <div className="flex items-center gap-2">
            <Badge variant={variant} size="sm">
              {shp.status.replace('_', ' ')}
            </Badge>
            {shp.activeExceptionId && onReviewAiException && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReviewAiException(shp.activeExceptionId!);
                }}
                title="View Mendix AI Exception Analysis"
                className="p-1 rounded bg-[#18217E] text-white hover:bg-[#121860] transition-colors cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Table Action & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#D0D9DE] shadow-card">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#8A9995] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search tracking, hub, vehicle..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F4F7F9] border border-[#D0D9DE] rounded-lg text-[#070724] placeholder-[#8A9995] focus:outline-none focus:border-[#18217E] transition-all"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
          <span className="text-xs text-[#8A9995] font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#424989]" />
            Status:
          </span>
          {(['ALL', 'LOADING', 'ON_ROUTE', 'DELAYED', 'DELIVERED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#18217E] text-white shadow-xs'
                  : 'bg-[#E5EBEE] text-[#393A50] hover:bg-[#D0D9DE]'
              }`}
            >
              {st === 'ALL' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={paginatedShipments}
        keyField="id"
        isLoading={isLoading}
        emptyTitle="No shipments match your criteria"
        emptyDescription="Try adjusting your search terms or status filters."
        onRowClick={(shp) => onSelectShipment(shp)}
        sortColumn={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
};

export const RecentShipmentsTable = React.memo(RecentShipmentsTableComponent);

