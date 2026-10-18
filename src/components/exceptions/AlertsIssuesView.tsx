import React, { useState } from 'react';
import { ExceptionItem, UserRole } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Bot, 
  ChevronRight 
} from 'lucide-react';

export interface AlertsIssuesViewProps {
  exceptions: ExceptionItem[];
  currentUserRole?: UserRole;
  onReviewAiException: (id: string) => void;
  onOpenWarRoom: () => void;
}

export const AlertsIssuesView: React.FC<AlertsIssuesViewProps> = ({
  exceptions,
  onReviewAiException,
  onOpenWarRoom,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  const filtered = exceptions.filter((e) => {
    if (filterSeverity !== 'ALL' && e.severity !== filterSeverity) return false;
    if (statusFilter === 'OPEN' && e.status === 'RESOLVED') return false;
    if (statusFilter === 'RESOLVED' && e.status !== 'RESOLVED') return false;
    return true;
  });

  const highCount = exceptions.filter((e) => e.severity === 'HIGH' && e.status !== 'RESOLVED').length;
  const medCount = exceptions.filter((e) => e.severity === 'MEDIUM' && e.status !== 'RESOLVED').length;
  const lowCount = exceptions.filter((e) => e.severity === 'LOW' && e.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white p-6 rounded-xl border border-[#D0D9DE] shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#09104D] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#EA341F]" />
            <span>Operational Exceptions & AI Decision Queue</span>
          </h2>
          <p className="text-xs text-[#393A50] mt-1">
            Mendix 11.12.3 RAG orchestrated anomaly analysis, SLA impact scoring, and severity routing.
          </p>
        </div>

        {highCount > 0 && (
          <Button
            variant="danger"
            size="md"
            onClick={onOpenWarRoom}
            className="bg-[#8C2527] hover:bg-[#6b1c1e] text-white"
            leftIcon={<ShieldAlert className="w-4 h-4" />}
          >
            Launch Incident War Room ({highCount})
          </Button>
        )}
      </div>

      {/* Severity Counters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFilterSeverity('HIGH')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterSeverity === 'HIGH'
              ? 'bg-[#8C2527]/10 border-[#8C2527] shadow-xs'
              : 'bg-white border-[#D0D9DE] hover:border-[#8C2527]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C2527] uppercase tracking-wider">
              High Severity (War Room)
            </span>
            <Badge variant="critical" size="sm" pulse={highCount > 0}>
              {highCount} Active
            </Badge>
          </div>
          <p className="text-2xl font-black text-[#8C2527] mt-2">{highCount}</p>
        </div>

        <div
          onClick={() => setFilterSeverity('MEDIUM')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterSeverity === 'MEDIUM'
              ? 'bg-[#18217E]/10 border-[#18217E] shadow-xs'
              : 'bg-white border-[#D0D9DE] hover:border-[#18217E]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#18217E] uppercase tracking-wider">
              Medium (Analyst Review)
            </span>
            <Badge variant="severity_medium" size="sm">
              {medCount} Active
            </Badge>
          </div>
          <p className="text-2xl font-black text-[#18217E] mt-2">{medCount}</p>
        </div>

        <div
          onClick={() => setFilterSeverity('LOW')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterSeverity === 'LOW'
              ? 'bg-[#424989]/10 border-[#424989] shadow-xs'
              : 'bg-white border-[#D0D9DE] hover:border-[#424989]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#424989] uppercase tracking-wider">
              Low (Auto-Resolved)
            </span>
            <Badge variant="severity_low" size="sm">
              {lowCount} Active
            </Badge>
          </div>
          <p className="text-2xl font-black text-[#424989] mt-2">{lowCount}</p>
        </div>
      </div>

      {/* Exception Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#D0D9DE]">
          <span className="text-xs font-semibold text-[#09104D]">
            Showing {filtered.length} exceptions
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-[#18217E] text-white' : 'text-[#393A50] hover:bg-[#E5EBEE]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('OPEN')}
              className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer ${
                statusFilter === 'OPEN' ? 'bg-[#18217E] text-white' : 'text-[#393A50] hover:bg-[#E5EBEE]'
              }`}
            >
              Open Cases
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer ${
                statusFilter === 'RESOLVED' ? 'bg-[#18217E] text-white' : 'text-[#393A50] hover:bg-[#E5EBEE]'
              }`}
            >
              Resolved
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-[#D0D9DE] text-center text-[#8A9995] text-xs">
            No exceptions found matching selected criteria.
          </div>
        ) : (
          filtered.map((item) => {
            const isCritical = item.severity === 'HIGH';
            const isResolved = item.status === 'RESOLVED';

            return (
              <div
                key={item.id}
                onClick={() => onReviewAiException(item.id)}
                className={`p-4 rounded-xl border bg-white shadow-card hover:shadow-card-hover transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isCritical && !isResolved ? 'border-[#8C2527]/50 ring-1 ring-[#8C2527]/20' : 'border-[#D0D9DE]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    isCritical ? 'bg-[#8C2527] text-white' : 'bg-[#18217E] text-white'
                  }`}>
                    {isCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#09104D]">
                        {item.trackingId}
                      </span>
                      <Badge
                        variant={item.severity === 'HIGH' ? 'critical' : item.severity === 'MEDIUM' ? 'severity_medium' : 'severity_low'}
                        size="sm"
                      >
                        {item.severity}
                      </Badge>
                      <Badge variant={isResolved ? 'delivered' : 'on_route'} size="sm">
                        {item.status}
                      </Badge>
                    </div>

                    <p className="text-xs font-semibold text-[#070724] mt-1">{item.description}</p>
                    <div className="text-[11px] text-[#8A9995] mt-0.5 flex items-center gap-3">
                      <span>Detected: {new Date(item.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>SLA Impact: <strong className="text-[#EA341F]">+{item.slaImpactMinutes}m</strong></span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation Summary Pill */}
                <div className="flex items-center gap-3 self-end md:self-auto">
                  {item.aiRecommendation && (
                    <div className="bg-[#F4F7F9] px-3 py-1.5 rounded-lg border border-[#D0D9DE] text-right">
                      <div className="text-[10px] text-[#8A9995] uppercase font-bold flex items-center justify-end gap-1">
                        <Bot className="w-3 h-3 text-[#18217E]" />
                        <span>Mendix Recommendation</span>
                      </div>
                      <div className="text-xs font-bold text-[#18217E]">
                        {item.aiRecommendation.recommendedAction}
                      </div>
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant={isCritical && !isResolved ? 'danger' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReviewAiException(item.id);
                    }}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    Review Dossier
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
